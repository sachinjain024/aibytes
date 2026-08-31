---
format: longclaw.ticket/v1
id: 3b37145c-c160-4f47-81ef-7c9123321a7e
key: AIB-8h
title: Repo Refactoring
status: in_progress
priority: urgent
labels:
  - app
created_at: 2026-08-31T09:43:43.709Z
updated_at: 2026-08-31T10:48:26Z
---

Make one repo hold all three aiBytes_ surfaces — the **newsletter**, the **web
app**, and the **Chrome extension** — sharing one fetch pipeline and one
published JSON feed, and safe to make public.

The newsletter keeps its own inline email design system. The app and the
extension both run on **Ledger**, the design system exported from Claude Design.
The app is a static site on GitHub Pages; its content is JSON generated on the
local iMac by the skills already in this repo and pushed to git.

## Decisions

Locked in, so later phases do not reopen them:

| Question | Decision |
|---|---|
| Ledger vs the existing design system | **Ledger replaces it.** `packages/design-system` is re-seeded from the Claude Design export; the Bitmark-era `aib-*` Web Components and the `tokens.json` → `build:tokens` pipeline are retired |
| Web app framework | **Vite + React, static build.** Uses Ledger's JSX as-is and shares components directly with the extension. Overrides the spec's Astro suggestion (§14.2) |
| Feed contract | **One contract.** `packages/feed-schema` keeps its name and role but its content becomes the edition JSON of product spec §5, plus `index.json` |
| Hosting | **GitHub Pages** (`sachinjain024.github.io/aibytes`). Overrides the spec's Cloudflare Pages suggestion (§10) |
| Repo visibility | **Public.** Answers spec §14.3. Edition JSON and the rejected-items log are public too |
| aiBytes-hub | **Out of scope entirely.** A separate project; not referenced anywhere in this repo unless explicitly called out |
| Licence | **None for now.** Default copyright applies; no reuse rights granted. The README says so plainly rather than implying "all rights reserved" was considered. Newsletter issues, social copy, thumbnails, and the brand/Ledger system would stay reserved under any licence that lands later |
| Tag vocabulary | **49 tags**, in `content/tags.json` grouped as spec §4. Near-synonyms merged, the subjective Format tags cut, four gaps added. Items carry display names; the file also carries each tag's URL slug so the app and the extension cannot disagree |
| Commit identity | **`The Infin8y <the.infin8y@gmail.com>`**, set as repo-local git config. Existing history keeps the personal address and is **not** rewritten, including when the repo goes public |

## Where things live

```
newsletter/          the whole weekly pipeline — issues, snapshots, mirrors, artifacts
docs/                app product spec + design-system brief (the source documents)
packages/
  fetchers/          shared, cadence-agnostic Python fetch machinery
  feed-schema/       the producer ↔ consumer JSON contract
  design-system/     Ledger — tokens, React components, marks, the nine screens
apps/
  web/               aibytes.io daily-edition app (Vite + React → GitHub Pages)
  extension/         Chrome new-tab extension, same edition JSON
content/             editions/YYYY-MM-DD.json, index.json, tags.json, hidden.json
.claude/skills/      fetch, curate, and generate skills
```

## Plan

**Phase 0 — Restructure and make the repo publishable.** Most of the move
already landed in PR #4 (`newsletter/`, `packages/fetchers`,
`packages/feed-schema`). What remains is Ledger replacing the old design system,
the specs coming into `docs/`, a secret sweep of the working tree and of git
history, a licence, and flipping the repo public. Nothing after this phase is
safe to start until the repo is genuinely clean.

**Phase 1 — The edition contract.** Rewrite `packages/feed-schema` as the
edition schema from product spec §5: `date`, `generated_at`, `counts`, and
`items[]` carrying `category`, `tags`, `image`, `signals`, `hidden`. Add
`index.json` (the list of available editions, which drives the edition bar and
the calendar popover) and `tags.json` (the fixed tag list, so it can grow
without a pipeline deploy). Everything downstream reads this, so it is worth
getting exactly right before anything consumes it.

**Phase 2 — The curate step.** Split `generate-newsletter-content` in two: a new
`curate-edition` skill that turns raw `data/` into an edition JSON — dedup,
relevance filter, category, tags, one-line summary, image resolution — and the
existing render step, which keeps only the HTML. Rejected items and their
reasons go to `rejected.json` so the filter can be tuned. This is the piece both
the app and the newsletter end up sharing.

**Phase 3 — The daily runner.** A `launchd` job on the iMac at 13:30 IST runs
fetch → curate → commit → push; GitHub Pages deploys on push. Logging, a
non-zero exit on failure, a visible failure notification, and a manual re-run
with `--date`. A `workflow_dispatch`-only GitHub Actions workflow is the fallback
for when the iMac is off. This is the second sanctioned exception to the
"content never lands on main directly" rule — record it in CLAUDE.md.

**Phase 4 — The web app.** `apps/web` on Vite + React, static output, one route
per edition with `/` resolving to the latest. Ledger supplies every component.
Grid and list views, category and tag filters reflected in the URL, edition
navigation with the calendar popover, light/dark, per-source images with mark
fallbacks, anonymous saves in local storage with the save banner. No infinite
scroll — editions end with the end card.

**Phase 5 — Newsletter on edition JSON.** Point
`generate-newsletter-content` at the last seven edition JSONs instead of raw
`data/`, so one curation feeds both surfaces. It must honour `hidden.json`. The
weekly issue links back to the editions it drew from. Verify against a past
issue that the output is equivalent before switching over.

**Phase 6 — Accounts.** Firebase Auth (Google only) plus Firestore for saves,
client SDK only. Local saves merge into the account on first sign-in. The Saved
view renders from edition JSON, so no content database. Firebase config is
public by design, but the security rules are what actually protect data — review
them explicitly.

**Phase 7 — The extension.** Chrome new-tab page on the same edition JSON, no
extra backend. Shares Ledger with the app, which is why Ledger's two
injected-UI gaps (tokens on `:host`, dark mode without `[data-theme]`) get fixed
in the package rather than forked here.

## Risks and open questions

- **Ledger was authored for a page we own.** Its tokens land on `:root` only,
  and dark mode is defined only under `[data-theme="dark"]`. Both break inside a
  content script's shadow root. Fix in the package, not downstream.
- **The weekly snapshot path is load-bearing.** `newsletter/data/{yyyy}/{mm}/weeks/week-NN/`
  is what every committed snapshot and every newsletter skill uses. The daily
  app feed must not disturb it.
- **Newsletter URL** — `aibytes.io/newsletter` or `newsletter.aibytes.io`?
  Depends on what the Beehiiv plan supports for custom domains. Subdomain is the
  safe fallback. *(spec §14.1, unresolved)*
- **Edition retention** — keep every edition forever, or archive after 90 days?
  *(spec §14.6, unresolved)*
- **iMac availability at 13:30 IST** — if it is not reliably awake, the `pmset`
  wake schedule and the Actions fallback are needed from day one, not later.
  *(spec §14.5, unresolved)*
- ~~**Tag list**~~ — settled in phase 1. `content/tags.json` ships 49 tags: §4's
  list with the near-synonyms merged (Library→Framework, CLI→Dev Tool, SDK→API),
  the subjective Format tags cut (Opinion, Interview, Hot Take), and four gaps
  added (Reasoning, Multimodal, Robotics, Safety). *(spec §14.4)*

## Checklist

### Phase 0 — Restructure and publish safely

- [x] Move the newsletter pipeline under `newsletter/` *(PR #4)*
- [x] Extract shared fetch machinery into `packages/fetchers` *(PR #4)*
- [x] Land the product spec and design brief in `docs/`
- [x] Replace `packages/design-system` with the Ledger export from Claude Design
- [x] Retire the `aib-*` Web Components and the `tokens.json` → `build:tokens` pipeline
- [x] Add the `aibytes-design` skill pointing at Ledger
- [x] Rewrite `.claude/rules/design-system.md` for Ledger, recording the two injected-UI gaps
- [x] Strip every aiBytes-hub reference and record in CLAUDE.md that it is a separate project
- [x] Add the public-repo warning to CLAUDE.md
- [x] Update the root `package.json` workspaces and scripts for `apps/*`
- [x] Sweep the working tree for secrets, subscriber lists, and personal email addresses
- [x] Sweep git history for secrets in file contents (commit metadata is settled — history is not rewritten)
- [x] Confirm `.env` and `newsletter/apis/aibytes/environments/local.json` are git-ignored and were never committed
- [x] Rewrite the README for a public reader, stating the no-licence position
- [x] Decide the licence — none for now, revisit if anyone asks to reuse the pipeline
- [ ] Flip the repo to public *(Sachin does this in GitHub settings; the sweep found nothing blocking)*

### Phase 1 — The edition contract

- [x] Rewrite `packages/feed-schema` as the edition schema from product spec §5
- [x] Add `index.json` (available editions + counts) and `tags.json` (the fixed tag list)
- [x] Add `hidden.json` and the `hide.py <id>` admin script
- [x] Update `validate.py` and `feed.d.ts` to match
- [x] Point the schema `$id` at the real GitHub Pages URL
- [x] Update `tests/test_feed_schema.py` for the new contract

### Phase 2 — The curate step

- [ ] Split curation out of `generate-newsletter-content` into a `curate-edition` skill
- [ ] Dedup across sources, apply the relevance filter, assign one category per item
- [ ] Tag from the fixed list in `tags.json` only, 1–4 tags per item
- [ ] Write the one-line summary in Ledger's voice (plain, factual, no hype)
- [ ] Resolve card images: PH logo, GitHub avatar, TechCrunch og:image, HN none
- [ ] Log rejected items with reasons to `rejected.json`
- [ ] Support `--date` and `--output-root`, per the skill-script convention
- [ ] Cover it in `tests/test_curate_edition.py`

### Phase 3 — The daily runner

- [ ] Single entry point that runs fetch → curate → commit → push, with `--date`
- [ ] `launchd` plist at `~/Library/LaunchAgents/io.aibytes.edition.plist`, 13:30 IST
- [ ] Confirm the iMac's timezone and set the `pmset` wake schedule
- [ ] Log to `logs/YYYY-MM-DD.log`; exit non-zero on failure
- [ ] Failure notification, so a silent miss is noticed
- [ ] `workflow_dispatch`-only GitHub Actions fallback running the same script
- [ ] Record the daily push-to-main exception in CLAUDE.md

### Phase 4 — The web app

- [ ] Scaffold `apps/web` (Vite + React, static build, GitHub Pages base path)
- [ ] Wire Ledger in; fix the `prefers-color-scheme` gap in the package
- [ ] One route per edition; `/` resolves to the latest
- [ ] Header, the edition bar, and the calendar popover from `index.json`
- [ ] Grid and list views, preference in local storage
- [ ] Category, tag, and source filters reflected in the URL
- [ ] Per-source images with mark fallbacks, fixed dimensions, lazy-loaded
- [ ] Anonymous saves in local storage, plus the save banner
- [ ] Empty-filter state and the end-of-edition card
- [ ] Footer: newsletter subscribe, extension link, GitHub, X
- [ ] Pages deploy workflow on push
- [ ] Accessibility pass: AA contrast both themes, focus rings, keyboard nav

### Phase 5 — Newsletter on edition JSON

- [ ] Point `generate-newsletter-content` at the last seven edition JSONs
- [ ] Honour `hidden.json`
- [ ] Link each issue back to the editions it drew from
- [ ] Verify a past issue regenerates equivalently before switching over

### Phase 6 — Accounts

- [ ] Firebase Auth with the Google provider, client SDK only
- [ ] Firestore `users/{uid}/saves/{itemId}`, with security rules reviewed
- [ ] Merge local saves into the account on first sign-in, then clear local storage
- [ ] Saved view, grouped by edition date

### Phase 7 — The extension

- [ ] Scaffold `apps/extension`
- [ ] Emit Ledger tokens on `:host` as well as `:root`
- [ ] New-tab page rendering the latest edition from the same JSON
- [ ] Package and submit to the Chrome Web Store

## Activity

<!-- longclaw:event
id: evt_72bfe943
kind: create
occurred_at: 2026-08-31T09:43:43.709Z
actor:
  type: human
  id: local
-->
### You created this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_4b25c674
kind: update
occurred_at: 2026-08-31T09:48:44.567Z
actor:
  type: human
  id: local
changes:
  - field: description
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_2892ff19
kind: update
occurred_at: 2026-08-31T09:49:04.436Z
actor:
  type: human
  id: local
changes:
  - field: description
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_f7b2f225
kind: update
occurred_at: 2026-08-31T09:59:07Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: description
  - field: checklist
  - field: labels
-->
### Claude Code updated this ticket

Wrote the execution plan and a phased checklist, and landed Phase 0's file moves
on branch `aib-8h-repo-refactor`.

Three decisions were needed before the plan could be written, and the user
picked all three recommendations: Ledger replaces the existing design system;
the web app is Vite + React with a static build; `packages/feed-schema` is
rewritten as the single edition contract. They are recorded in the description
so later phases do not reopen them.

Landed: `docs/` with the product spec and design brief; `packages/design-system`
re-seeded from the Ledger export with the Bitmark-era Web Components and the
token build retired; the `aibytes-design` skill; a rewritten design-system rule;
every aiBytes-hub reference stripped; public-repo and aiBytes-hub notes in
CLAUDE.md. The 80-test suite passes.

Not done, and the gate on everything else: the secret sweep of the working tree
and git history, a licence, and flipping the repo public. Four questions from
the product spec are still open — newsletter URL, edition retention, iMac
availability at 13:30 IST, and a final pass on the tag list.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_87c1c51a
kind: update
occurred_at: 2026-08-31T10:48:26Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: description
  - field: checklist
-->
### Claude Code updated this ticket

Phase 0 is complete except the visibility flip, which is Sachin's to make.

The secret sweep found nothing blocking. Working tree: no tracked .env, key, or
credential file; no subscriber list; the single email address in tracked content
is `qa@snowflake.net`, quoted editorial from a published Wiz disclosure in issue
6's social copy, not our data. History: 357 blobs across all 44 commits scanned
for secret-shaped assignments, known key prefixes, private-key blocks, and URLs
with embedded credentials — zero hits, and no .env, .csv, .pem, or local.json
path was ever added. `.env`, `environments/local.json`, and
`.claude/settings.local.json` are each ignored by a named rule and were never
committed.

Licence: none for now, recorded in the decisions table. The README states the
position plainly instead of implying a considered "all rights reserved", and
notes that the editorial and brand work would stay reserved under any later
licence.

The README is rewritten for a public reader — what aiBytes_ is, the three
surfaces, and an honest note that this is a personal working repo whose
structure will move.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_c1d40f8a
kind: update
occurred_at: 2026-08-31T12:45:12Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: description
  - field: checklist
-->
### Claude Code updated this ticket

Phase 1 is complete. `packages/feed-schema` is now the contract for a new
top-level `content/` tree, on branch `aib-8h-phase-1-edition-contract`.

Four schemas replace the single unproduced `feed.schema.json`: `edition`,
`index`, `tags`, `hidden`. Keys are snake_case per spec §5. Every file carries
`schema_version`, since a shipped extension cannot be hotfixed.

The decisions worth recording, because later phases inherit them:

- **Item ids end with their edition's date** (`ph-chatcut-2026-08-27`), which is
  what makes a save (`item_id` + `edition_date`) resolvable and catches an item
  carried forward from yesterday. The validator enforces the suffix.
- **`counts` is the visible tally**, hidden excluded — so hiding an item must
  decrement it, and `hide.py` recomputes rather than adjusts.
- **The v1.1 categories are deliberately absent** from the enum. Adding one is a
  conscious edit to the schema, `counts`, and every consumer's chip list.
- **Tags are not enumerated in the schema.** `tags.json` is the single source, so
  the list can grow without a schema change; `validate.py` cross-checks
  membership when given the list.

`validate.py` grew from an index checker into a validator for all four
documents plus the cross-file invariants JSON Schema cannot express: an index
that has fallen behind the editions on disk, a stale total, a hide logged but
not applied. It is also a CLI — `python3 packages/feed-schema/validate.py`, or
`npm run validate:content`.

`hide.py <id>` moves the item flag, the edition's counts, the index's total, and
the hide log together, validating in memory before it writes anything. `--unhide`
reverses it.

The tag list question (spec §14.4) is closed: 49 tags, the tightened variant.
The tightening was Library→Framework, CLI→Dev Tool, SDK→API; Opinion, Interview
and Hot Take cut as not reliably assignable; Reasoning, Multimodal, Robotics and
Safety added. Safety is model behaviour and alignment, distinct from the infosec
Security tag.

Verified beyond the unit tests: the 35 real items in the week-30 snapshots map
into the edition shape and validate, and a hide/unhide round-trips on them. The
suite is 143 tests, all passing.

Three open questions remain, all for later phases: the newsletter URL, edition
retention, and iMac availability at 13:30 IST.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_9f2ab417
kind: update
occurred_at: 2026-08-31T13:25:20Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: description
-->
### Claude Code updated this ticket

Reviewed the phase 1 branch and fixed six findings before merging. One was a
real defect, and it is the kind phase 2 would have inherited:

**`index.json`'s `path` was never validated against the file it names.** Index
entries were matched to editions by `date` alone, so an entry whose `path`
pointed at the wrong edition — or at nothing — validated clean. `path` is the
field consumers actually dereference: the app resolves it against the index URL
and fetches it. So the one field that could 404 the app was the one field with
no check. Since phase 2's curate step generates `path`, this needed to be caught
before anything produced it.

Two schema descriptions contradicted the code, and in both cases the code was
right:

- `index.json`'s own `generated_at` claimed to be "the run that last rewrote
  this index", but `hide.py` rewrites the file to correct a total and
  deliberately leaves the timestamp alone — nothing was curated, and the edition
  bar's "updated 4h ago" must not reset because of a hide.
- `hidden.json` called itself an append-only record, but `--unhide` removes the
  entry, and has to: an entry whose item is no longer flagged hidden would make
  the tree contradict itself. It is a log of what is currently hidden, not a
  history.

Three gaps in what the suite checked:

- `meta: {}` was accepted while `signals: {}` was rejected, on identical
  "omit rather than emit empty" reasoning.
- The drift test compared the id, path, and slug patterns but not `httpUrl`
  against `URL_RE`, and never compared the three date patterns against
  `DATE_RE`.
- Nothing ever read the schema files *as schemas*, so a malformed one would have
  shipped silently. An optional test class now runs all four through a real
  JSON Schema engine and asserts the hand-written validator is never *laxer*
  than the contract of record, across 24 fixtures. `jsonschema` is not a
  dependency, so it skips when absent.

The suite is 149 tests. The 35 real week-30 items still map into the edition
shape and validate, and hide/unhide still round-trips on them.

Merged to `main` as PR #6. Phase 1 is done; phase 2 (the `curate-edition` skill)
is next, and it now has a contract that checks its output rather than trusting
it.
<!-- /longclaw:event -->
