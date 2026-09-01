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
updated_at: 2026-09-01T04:45:00Z
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
| Daily runner | **A scheduled Claude job**, not a Python script that shells out to an LLM. `launchd` starts Claude Code, which runs `curate-edition`: `draft`, write the summaries, `build`. The scripts never call an LLM themselves, which is why they stay testable offline |
| Newsletter curation | **Unchanged.** `generate-newsletter-content` keeps curating the weekly issue from raw `data/`. It is *not* rewired onto edition JSON — the daily edition and the weekly issue stay independent readers of the same snapshots. The old phase 5 is cut, not deferred |
| Failure notification | **Slack incoming webhook**, and a watchdog. One `curl`-shaped POST, no OAuth and no SMTP; email and WhatsApp were weighed and dropped. The webhook URL is a bearer credential and lives only in the git-ignored `.env`. A failure notification cannot report a job that never ran, so a second agent checks an hour later that the edition is actually on disk |
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

**Phase 3 — The daily runner.** A `launchd` agent on the iMac at 13:30 IST runs
fetch → curate → build → validate → commit → push; GitHub Pages deploys on push.
Logging, a non-zero exit on failure, a Slack notification either way, and a
manual re-run with `--date`. A second agent at 14:30 checks that the edition
actually landed, because a failure notification cannot report a job that never
ran. A `workflow_dispatch`-only GitHub Actions workflow is the fallback for when
the iMac is off. This is the second sanctioned exception to the "content never
lands on main directly" rule — record it in CLAUDE.md.

**The script drives Claude, not the other way round.** `claude -p` exits 0
whenever the model finishes its turn, so if Claude orchestrated the run a
failure would look identical to a success. Instead Claude is one bounded step
inside a deterministic script — it reads `curation.json`, writes
`summaries.json`, and stops, with `Read` and `Write` and no Bash — and `build`
and `validate.py` are the gates that decide whether an edition is real.

**Phase 4 — The web app.** `apps/web` on Vite + React, static output, one route
per edition with `/` resolving to the latest. Ledger supplies every component.
Grid and list views, category and tag filters reflected in the URL, edition
navigation with the calendar popover, light/dark, per-source images with mark
fallbacks, anonymous saves in local storage with the save banner. No infinite
scroll — editions end with the end card.

**Phase 5 — Cut.** This was going to point `generate-newsletter-content` at the
last seven edition JSONs so one curation fed both surfaces. Dropped: the weekly
pipeline works as it is, and rewiring it buys shared curation at the cost of
coupling the newsletter to the daily runner. The two surfaces curate
independently from the same `newsletter/data/` snapshots. Phases 6 and 7 keep
their numbers so nothing else has to be renumbered.

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
- ~~**iMac availability at 13:30 IST**~~ — settled in phase 3. The machine is on
  mains power 24x7 with `sleep 0` and auto-login, so the LaunchAgent always has
  a session and an unlocked login keychain, which is what gives Claude Code its
  credentials. No `pmset` wake schedule needed. *(spec §14.5)*
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

- [x] Split curation out of `generate-newsletter-content` into a `curate-edition` skill
- [x] Dedup across sources, apply the relevance filter, assign one category per item
- [x] Tag from the fixed list in `tags.json` only, 1–4 tags per item
- [x] Write the one-line summary in Ledger's voice (plain, factual, no hype)
- [x] Resolve card images: PH logo, GitHub avatar, TechCrunch og:image, HN none
- [x] Log rejected items with reasons to `rejected.json`
- [x] Support `--date` and `--output-root`, per the skill-script convention
- [x] Cover it in `tests/test_curate_edition.py`

### Phase 3 — The daily runner

- [x] Single entry point that runs fetch → curate → build → validate → commit → push, with `--date`
- [x] Claude as one bounded step: `Read`/`Write` only, no Bash, no git, no network
- [x] `launchd` plist at `~/Library/LaunchAgents/io.aibytes.edition.plist`, 13:30 IST
- [x] Confirm the iMac's timezone — `Asia/Kolkata`, so 13:30 local *is* 13:30 IST
- [x] `pmset` wake schedule — not needed: `sleep 0`, mains power, auto-login, 24x7
- [x] Log to `logs/YYYY-MM-DD.log` (git-ignored); exit non-zero on failure
- [x] Slack notification on success and on failure, with the re-run command in it
- [x] Watchdog agent at 14:30, for the silent miss a failure notification cannot report
- [x] One bad source warns instead of costing the edition (`--keep-going`)
- [x] `workflow_dispatch`-only GitHub Actions fallback running the same script
- [x] A `tests` workflow, so the suite is re-verified on merge (there was no CI)
- [x] Record the daily push-to-main exception in CLAUDE.md
- [x] Cover it in `tests/test_runner.py`
- [ ] **Sachin: create the Slack incoming webhook** — see below
- [ ] Sachin: run `bash packages/runner/aibytes_runner/launchd/install.sh`
- [ ] Add `ANTHROPIC_API_KEY` and `PH_API_KEY` repo secrets, if the Actions fallback is wanted

#### The one manual step: the Slack webhook

The runner reports to a Slack incoming webhook, and only Sachin can create one.

1. In the aiBytes_ Slack, create an app (or open the existing one) at
   <https://api.slack.com/apps>.
2. **Incoming Webhooks** → activate → **Add New Webhook to Workspace** → pick
   the channel the daily job should report to.
3. Copy the `https://hooks.slack.com/services/...` URL into the git-ignored
   `.env` at the repo root:

   ```
   AIBYTES_SLACK_WEBHOOK=https://hooks.slack.com/services/...
   ```

4. Confirm it works: `python3 packages/runner/notify.py`

That URL is a bearer credential — anyone holding it can post into the workspace
— and this repo is public, so it never leaves `.env`. An unset webhook is
supported: the job still runs and still logs, it just reports to nobody.

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

### Phase 5 — Cut

Nothing to do. `generate-newsletter-content` stays on raw `data/`.

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

<!-- longclaw:event
id: evt_3d7e1a25
kind: update
occurred_at: 2026-08-31T14:20:00Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: description
  - field: checklist
-->
### Claude Code updated this ticket

Phase 2 is complete. `packages/curate` plus the `curate-edition` skill turn a
day's raw snapshots into one published edition, on branch
`aib-8h-phase-2-curate-edition` (PR #7).

The shape of the split was the decision that drove everything else. Claude is
the caller, not something the script invokes: the daily job runs the skill,
which runs `draft`, writes the copy, then runs `build`. So no Python here ever
calls an LLM, the whole pipeline stays testable offline, and the voice and
tagging rules live in SKILL.md where they can be edited rather than in a string
literal. Recorded in the decisions table, since phase 3 inherits it.

`build` re-derives its items from the snapshots rather than reading
curation.json, so the snapshots stay the single source of truth and a stale
draft cannot change what gets published.

What the work turned up:

- **The relevance filter should not be uniform.** Running one AI vocabulary
  over all four sources dropped two real TechCrunch stories - "Amazon just
  tripled its order of Nvidia chips", "Gamma acquires design startup Lica" -
  because their headlines do not use our words. TechCrunch is fetched from
  TechCrunch's own artificial-intelligence category, so the source has already
  made the call, and overruling it with a worse filter is not an improvement.
  Each source now runs its own fetcher's predicate, imported rather than
  restated. Product Hunt is the one source with no topic filter at fetch
  (`featured: true` only), and the one where the filter does real work.
- **A Product Hunt launch can link to the product after all.** The newsletter
  skill documents scraping the launch page because the `/r/` redirect "returns
  403 to curl". It does not - it answers 301 with the real URL, to our own user
  agent. One request per launch, no HTML parsing, and the cards now point at
  x1.new and akta.pro rather than back at Product Hunt.
- **A hide has to survive a re-curate.** Re-running a date rebuilds items from
  snapshots that know nothing about an editorial decision, so hidden.json is
  applied to the new items. If a logged hide names an item the run no longer
  produces, `build` refuses rather than publishing a tree where hidden.json
  describes an item that is not there.
- **Using the skill found a gap in its own instructions.** HN items carry only
  a title as source text, so "write from the source's facts" and "never restate
  the title" pull against each other. SKILL.md now says how to resolve that,
  and that a flat line beats a confident wrong one.

Verified end to end on the real week-36 snapshots with the summaries written by
hand against the skill's rules: 35 raw items in, one rejected as not-AI, 34
published across all four categories, the tree valid, hide/unhide round-tripping
with counts and the index total following it down and back, and a re-run
byte-identical apart from `generated_at`.

The suite is 214 tests, 65 new. They were mutation-checked rather than assumed:
filing Show HN as a thread, counting hidden items, dropping the hide
carry-forward, making dedup blind to a `www.` prefix, accepting a tag outside
tags.json, and keyword-filtering TechCrunch are each caught by a named test.

Two things deliberately not done. `generate-newsletter-content` is untouched:
its curation picks a week's shortlist from raw `data/`, and removing that before
phase 5 gives it edition JSON to read would break the weekly issue, so rewiring
it stays phase 5 as the checklist has it. And `content/editions/` stays empty -
committing a real edition is the daily runner's job in phase 3.

Phase 3 is next, and it is now a smaller job than it looked: the entry point
drives Claude Code through this skill rather than reimplementing curation.
Three open questions are unchanged - the newsletter URL, edition retention, and
whether the iMac is reliably awake at 13:30 IST, which phase 3 has to answer.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_5a91c7e3
kind: update
occurred_at: 2026-08-31T15:05:00Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: description
-->
### Claude Code updated this ticket

Reviewed the phase 2 branch and fixed eight findings. Three would have reached
published output, and one of those changes how the curate step is built.

**`clean_url` was rewriting URLs it had no business touching.** Every query was
round-tripped through parse_qsl/urlencode, so TechCrunch's real og:image shape
`?resize=1200,800` shipped as `?resize=1200%2C800` - ten of ten news items in
the verification edition - and a valueless `?flag` became `?flag=`, a different
query. These are contract strings read by an extension that cannot be hotfixed.
The lesson generalises: a normaliser should be a no-op when it has nothing to
normalise.

**Link resolution and dedup are entangled, and the fix is a cache.** `build`
was re-running the Product Hunt lookups over the network, and resolution ran
before dedup - so a timeout at build time could change which items were in the
edition, and the writer would get "no summary written" for an item they never
saw. The first fix, moving resolution after dedup, was wrong and the tests
caught it: a Show HN and the Product Hunt launch of the same product only
collide once the launch points at the product's own URL, so dedup-first
publishes the same product twice. Resolution still comes first; what makes it
deterministic is `links.json`, written by `draft` beside the snapshots and
reused by `build`. A build after a draft now makes no request at all. Recorded
in the rule file, because the obvious "fix" is the wrong one.

**A `null` summaries entry passed every check and then crashed the merge.** It
is present, so the missing-item scan did not see it, and a guard meant to skip
already-reported ids swallowed it - a traceback instead of the documented
"nothing was written" refusal.

The rest: an index entry with no `date` crashed the sort before the validator
could report it; `--date` was never checked against the contract's pattern, so
a malformed date exited with a traceback; `--cadence weekly` wrote every date
in a week to the same `curation.json`, silently clobbering the first; a source
missing from the relevance table was waved through instead of filtered; and the
TechCrunch docstring claimed a signal merge that does not exist and should not.

The suite is 229 tests, 80 on curate. All eleven behaviours were
mutation-checked individually, with bytecode caches purged between runs - the
first batch run reported failures that turned out to be stale `.pyc` files, and
the clean run found two genuine gaps: nothing pinned the resolve-then-dedup
order inside `prepare`, and nothing covered `--no-resolve-links`, which every
other CLI test relies on to stay offline.

Re-verified on the real week-36 snapshots with the network stubbed to raise
during `build`. The only diffs against the pre-review edition are the nine
un-re-encoded TechCrunch image URLs.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_8c2f4b17
kind: update
occurred_at: 2026-09-01T02:10:00Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: description
-->
### Claude Code updated this ticket

Second review pass, this time over the fixes themselves. The delegated reviewer
failed twice on this branch - an API error when the machine slept, then a stall -
so this was a hand review of the fix commit.

Three issues, and the first is worth remembering: **the fix commit reintroduced
the defect class it had just removed.** Round one fixed two crashes where a
clean refusal was intended (a dateless index entry, a malformed --date). The
link cache that round one added to fix a different finding validated that its
`resolved` key was a dict but not what was inside it - so a hand-edited value
became an item's `url` and dedup raised an AttributeError. New code written in a
hurry to fix old code does not inherit the old code's lessons; every new file
that reads something off disk needs the same "refuse, do not crash" pass.

The other two: `prepare`'s docstring still claimed "No writes" after it started
writing the cache, and the resolved-link count was computed and discarded.
`draft` now reports it, so the one network call the pipeline makes is visible in
the log rather than silent - which matters once phase 3 runs it unattended.

231 tests. Re-verified on the real week-36 snapshots with the network stubbed to
raise during build; the edition is byte-identical to the previously verified one.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_b640d9a2
kind: update
occurred_at: 2026-09-01T04:45:00Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: description
-->
### Claude Code updated this ticket

Phase 2 is merged to `main` as PR #7 (merge commit `adc5f90`). 231 tests pass on
`main` and the content tree validates.

Phase 3 is next, and two things found this round should shape it:

- **There is no CI in this repo** - no `.github/workflows` at all - so nothing
  re-verifies the suite on merge. That mattered here because the delegated
  reviewer failed twice and the second review pass was done by hand. A test
  workflow belongs early in phase 3, not late.
- **`test_thumbnail` drives real headless Chrome** and timed out once under
  load. It passes given time, but a scheduled job that runs the suite needs to
  account for it.

Phase 3 is also smaller than the original plan assumed: the entry point drives
Claude Code through the `curate-edition` skill rather than reimplementing
curation. The three open questions are unchanged - the newsletter URL, edition
retention, and whether the iMac is reliably awake at 13:30 IST.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_c1f0a37b
kind: update
occurred_at: 2026-09-01T05:30:00Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: description
-->
### Claude Code updated this ticket

**Phase 5 is cut.** Sachin does not want `generate-newsletter-content` rewired
onto the last seven edition JSONs; the weekly pipeline works as it is and stays
on raw `newsletter/data/`. Recorded as a decision so a later phase does not
reopen it, and the phase 5 checklist is emptied rather than deferred.

Consequences: the daily edition and the weekly issue are now two independent
readers of the same snapshots, `hidden.json` applies only to the app and the
extension, and phases 6 and 7 keep their numbers. The three forward references
that promised the rewire — `.claude/rules/feed-schema.md` and two lines in the
`curate-edition` skill — were corrected to match.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_9d24e6f1
kind: update
occurred_at: 2026-09-01T06:15:00Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: description
-->
### Claude Code updated this ticket

**Phase 3 is built** in `packages/runner`: `run.py` (the pipeline), `check.py`
(the watchdog), `notify.py` (a Slack test ping), two LaunchAgent templates with
an `install.sh` that renders them, and `tests/test_runner.py` — 53 tests, all
offline. Also two GitHub Actions workflows: `tests.yml`, because this repo had
no CI at all, and `edition.yml` as the `workflow_dispatch` fallback.

**The script drives Claude, not the other way round.** The original framing had
launchd start Claude Code, which would run the skill end to end. Inverted,
because `claude -p` exits 0 whenever the model finishes its turn — a failed run
would have looked exactly like a good one. Claude now gets `Read` and `Write`
and no Bash, reads `curation.json`, writes `summaries.json`, and stops; `build`
and `validate.py` are the gates, and they are plain Python that already refuses
what the contract rejects.

**Three findings while building.**

- **A failure notification cannot report a job that never ran.** If launchd
  never fires — the agent unloaded by an OS update, a typo in a plist, a reboot
  into a strange state — nothing fails, so nothing is sent, and silence looks
  identical to a clean run. Hence the second agent at 14:30.
- **`fetch.py` stops at the first bad source and exits non-zero**, which would
  have cost a whole edition that curate is explicitly happy to build from the
  rest. The runner passes `--keep-going` and carries a partial fetch into the
  Slack message as a warning instead.
- **The Actions fallback is not free.** A runner has no login keychain, so the
  summaries step there needs an `ANTHROPIC_API_KEY` secret and a Claude Code
  install. The workflow fails early and says so rather than half-publishing.

**Settled:** the iMac availability question. Mains power 24x7, `sleep 0`, and
auto-login, so the LaunchAgent always has a session and an unlocked login
keychain — no `pmset` wake schedule, and no API key needed locally. Commit
identity is now set as repo-local git config, per the decision table.

**Open, and waiting on Sachin:** the Slack incoming webhook (steps are in the
phase 3 checklist), running `install.sh`, and the repo secrets if the Actions
fallback is wanted. Nothing is scheduled until `install.sh` runs.

Phase 4 is next. Two open questions are unchanged — the newsletter URL and
edition retention.
<!-- /longclaw:event -->
