# Implementation Plan: AIB-145y, gists

Status: **approved 12 Nov 2026**: two PRs, and the Design System Artifact synced in T22. Spec (approved 12 Nov 2026, design picks
added the same day): `docs/specs/AIB-145y-gists.md`. Design:
`docs/decisions/product/AIB-145y-gists-design.md`. Ticket:
`.longclaw/tickets/AIB-145y/ticket.md`. Task list:
`docs/plans/AIB-145y-todo.md`.

## Overview

Thirty-eight tasks, one commit per task (T38 added 12 Nov 2026). T1-T29 are on `aib-145y-gists` in
PR #65, which already holds the spec, the prototype and the design record;
T30-T37 go in a second PR on the same ticket.

The spec splits the work into nine modules and asks for a short spec per
module before it is built. So each module opens with a spec task, and the
tasks after it are this plan's best cut. A module spec can reshape the tasks
that follow it. When it does, this plan and the ticket checklist change in
the same commit.

| # | Module | Tasks | What it delivers |
|---|---|---|---|
| 1 | `gist-design` | done | The prototype and the design record |
| 2 | `gist-analytics` | T1-T3 | Visits per path and referrer on aibytes.io, from before launch |
| 3 | `gist-contract` | T4-T8 | `content/gists/`, its schema and validator, the `gist` and `front_page` item fields, `hide.py` |
| 4 | `gist-generate` | T9-T17 | The daily run writes a gist for every item, unattended |
| 5 | `ledger-gist-ui` | T18-T22 | The gist view, the resizable panel, reactions bar, front-page badge, new banner copy |
| 6 | `app-gist-pages` | T23-T26 | `/gists/<slug>` as a real page built for search, plus `sitemap.xml` and `robots.txt` |
| 7 | `app-gist-panel` | T27-T29 | A card's title opens the panel on daily and weekly pages |
| 8 | `app-reactions` | T30-T32 | The eight reactions, stored in Firestore |
| 9 | `newsletter-gist-links` | T33-T36 | Issue items get gists; the newsletter links to them |
| 10 | Wrap-up | T37 | Repo docs, ticket, by-hand checks |
| 11 | Outbound `ref` | T38 | Links to a source item's own page carry `ref=aiBytes_`; can ship to `main` on its own |

## Dependency graph

```
T1 analytics spec ─> T2 script + event ─> T3 privacy copy

T4 contract spec ─> T5 gist schema + validator ─> T6 index + item `gist` ─> T7 hide.py
                                                └─> T8 `front_page` field (fetcher → curate → contract)

T9 generate spec ─> T10 HN thread + article text fetchers ─┐
                 └> T11 GitHub repo fetchers ───────────────┤
                    T12 Product Hunt launch material ───────┤
T6 ───────────────────────────────────────────────────────> T13 gists draft ─> T14 write-gists skill
                                                            T15 gists build ─> T16 runner step + Slack
                                                                             └> T17 rehearsal (checkpoint)

T18 ledger spec ─> T19 GistView ─> T20 GistPanel (resizable) ─> T22 kit screens
                └> T21 ReactionBar, badge, banner copy ──────────┘

T5, T19 ─> T23 pages spec ─> T24 route + page head ─> T25 static gist pages, sitemap, robots ─> T26 gist page in the app
T26 ─> T27 panel spec ─> T28 card opens panel, URL state ─> T29 panel on weekly pages, panel event
T26 ─> T30 reactions spec ─> T31 rules + emulator tests ─> T32 reactions in the app
T16, T26 ─> T33 newsletter spec ─> T34 weekly pull writes gists ─> T35 template + skill links ─> T36 weekly issue pages resolve gist links
everything ─> T37 wrap-up
```

Order of work, with the riskiest parts first:

1. **Analytics (T1-T3) first.** It is independent and short, and gives
   baseline traffic before gists exist.
2. **Contract, then generation (T4-T17).** Whether gists are good enough to
   publish with nobody reading them is the feature's biggest unknown. The
   seven-edition rehearsal (T17) answers it before any UI is built on top. If
   it fails, we fix the generation step before building any pages.
3. **Ledger, pages, panel (T18-T29).** Launch is the first daily run after
   these are on `main`.
4. **Reactions, then the newsletter (T30-T36).**

## Architecture decisions

- **Gists get their own package and Claude step, after the edition is
  built.** `packages/gists` has `draft` (collect material per item, look up
  the index) and `build` (validate Claude's output, write files atomically,
  set each item's `gist`), mirroring `packages/curate`. The runner adds one
  step between `build` and `validate`. If anything in that step fails, it
  reverts what it wrote and records a warning, and the edition still
  publishes. Its `claude -p` call keeps today's tool limits: Read, Write and
  Edit, with no Bash and no web access.
- **Fetchers fetch, the gists package arranges.** New fetch functions in
  `packages/fetchers`: an HN thread with its top comments (Algolia `items`
  API), readable text from an article page, and a GitHub repo's details,
  README and most-discussed open issues (REST API). Standard library only,
  Python 3.8, as the runner runs it. HTML-to-text uses `html.parser`, with
  no new dependency.
- **GitHub calls need a token in Actions.** Unauthenticated, the API allows
  60 calls an hour; about 10 repos a day at 4 calls each fits, but a
  re-run would not. The workflow's built-in `GITHUB_TOKEN` gives 1,000 an
  hour and is not a new secret. Passing it to the run step is a change to
  the `edition` workflow, which is ask-first (T16).
- **The gist page is real HTML, rendered at build time.** The Vite plugin
  that writes one shell page per edition today also writes
  `dist/gists/<slug>/index.html`. It renders `GistView` with
  `react-dom/server`, which comes with `react-dom`, a dependency we already
  have, and puts that output inside the shell. The page reads fully with
  JavaScript off, and React takes it over on load. The page's `<head>` comes
  from `pageMeta.js`: title, description, canonical URL, Open Graph tags,
  JSON-LD, and `noindex` for `brief` and `preview` gists.
- **One view, two frames.** Ledger's `GistView` renders the content only. The
  page is a centred reading column (E2) and the panel sits beside the feed
  (A1), both around the same `GistView`. The panel's width is a per-browser
  preference in `prefs.js`, like the feed's layout and density.
- **The open panel lives in the URL as `?gist=<slug>`.** Back closes it, a
  reload keeps it, and filters keep working. The card title's `href` is
  still `/gists/<slug>`, so search engines and new-tab clicks go to the page.
- **`front_page` is an item field, set once, never cleared.** The HN fetcher
  keeps Algolia's `front_page` tag. Curate copies it onto the edition item as
  `front_page: true`, and a later appearance can set it but never unset it.
  The field is optional, which fits the append-only contract.
- **Reactions are documents a reader owns, with counts read from them.** The
  likely shape, to be fixed in T30, is
  `gist_reactions/{slug}/by/{uid}` holding the emoji that reader chose. The
  rules let a reader write only their own document and only the eight
  emoji. Counts come from Firestore `count()` queries. If the rules can't
  keep that honest or affordable, we would need a Cloud Function, which is
  ask-first.
- **Slugs come from item ids.** A slug is the item id without its date. Once
  the index has a slug, it never changes. A clash with a different source
  gets `-2`.

## What only the publisher can do

| Step | When | What |
|---|---|---|
| P1 | T1 | Pick the analytics tool (done: Umami Cloud); create the site at umami.is and share the website id |
| P2 | T3 | Approve the new `/privacy` wording |
| P3 | T16 | Approve passing `GITHUB_TOKEN` to the run step in `edition.yml` |
| P4 | T17 | Read seven rehearsed editions' gists and say whether you would link to them unedited |
| P8 | after T25 | Verify `aibytes.io` in Google Search Console as a domain property (DNS TXT) and submit `sitemap.xml` |
| P5 | T31 | `firebase deploy --only firestore:rules --project ai-bytes-b42d2` |
| P6 | T35 | Approve the first issue that links to gists instead of sources |
| P7 | T37 | The browser checks on aibytes.io after launch |

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Gists state something the source does not say, and nobody reads them first | High | "Only what was read" in the skill; fatal contract checks in `build`; the T17 rehearsal gates every UI task; `hide.py` pulls one fast. |
| Search engines treat short machine summaries as thin content | High | Only `full` gists are indexed; each adds what the source lacks (discussion, open issues, stats); analytics from T2 shows whether search traffic comes. |
| The run gets slower and costs more: a second Claude call of ~30 gists | Med | Separate step with its own timeout; repeat items reuse their gist; T17 measures time and the run's total stays inside the workflow's limit, or we come back to you before changing it. |
| Sites block fetches; GitHub rate limits | Med | `brief` gists; a per-source time limit; `GITHUB_TOKEN` (P3); Slack reports the count of `brief` gists. |
| A gist failure costs an edition | High | The gists step reverts on any error and only warns. `tests/test_runner.py` covers this explicitly. |
| Reaction counts can be gamed or are costly to read | Med | One document per reader, rules tested on the emulator, eight emoji only; Cloud Function only if needed, and only after asking you. |
| Rendering the page at build time drifts from the client render | Med | One `GistView`; a build test compares the server markup's text with the gist file. |
| The build grows by ~900 pages a month | Low | Watched in T25's check; fine for the first year per the spec. |
| `longclaw` CLI strips `.longclaw/AGENTS.md` on every write | Low | Restore from git after each write; never commit that change. |

## Verification checkpoint (every task)

Each commit passes all of these before it is made:

```bash
AIBYTES_SKIP_LIVE=1 python3 -m unittest discover -s tests -v
python3 packages/feed-schema/validate.py
npm test -w @aibytes/design-system
npm test -w @aibytes/web
npm run test:rules -w @aibytes/web          # when the Firebase CLI and Java are present
npm run build:web
git diff --check
```

A task adds its own check where it has one. Reviewer checkpoints come
after T3, T8, T17, T22, T29, T32 and T36.

## Decided at approval (12 Nov 2026)

1. **Two PRs.** PR #65 holds T1-T29 and is squash-merged at Checkpoint E;
   the next daily run is launch. T30-T37 follow in a second PR on the same
   ticket.
2. **The Design System Artifact in Claude** gets the gist components, as
   part of T22.

## Tracking

Every task, checkpoint and publisher step becomes a numbered checklist item
in the ticket once the plan is approved: `1` is the done design module,
`2.1` is T1, and so on. Items are ticked as their tasks land, together with
the matching boxes in `docs/plans/AIB-145y-todo.md`.
