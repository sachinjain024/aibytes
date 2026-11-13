# Task list: AIB-145y

Plan: `docs/plans/AIB-145y-plan.md`. Spec: `docs/specs/AIB-145y-gists.md`.
Design: `docs/decisions/product/AIB-145y-gists-design.md`.

T1-T29 on `aib-145y-gists` in PR #65, squash-merged at Checkpoint E; T30-T37
in a second PR. One commit per task. Every task passes
the plan's verification checkpoint before its commit. Sizes: S is 1-2 files
of logic, M is 3-5. A module's spec task may reshape the tasks after it; the
plan, this list and the ticket change together when it does.

## Module 1: `gist-design`, done

- [x] Prototype with numbered options: `docs/ux/prototypes/AIB-145y-gists/`
- [x] Picks recorded: `docs/decisions/product/AIB-145y-gists-design.md`
  (A1 resizable, B2, C2, D2, E2, F2)

## Module 2: `gist-analytics`

### T1: analytics spec and tool shortlist

**Description:** `docs/specs/AIB-145y-gist-analytics.md`. Compare free,
cookieless tools that run on a static GitHub Pages site and report page views
per path, referrers, UTM campaigns, and one custom event ("panel opened").
Name one, say what it collects, and fix the link convention for the
newsletter and social posts (`utm_source`, `utm_medium`, `utm_campaign`).

**Acceptance criteria:**
- [x] Each candidate is checked against its current docs for: price at our
      traffic, cookies, custom events, UTM reporting, and a public script URL.
- [x] One recommendation, plus what `/privacy` must now say.
- [x] The publisher picks (P1): Umami Cloud, 12 Nov 2026. Search Console
      for search (P8, after T25); no Google Analytics.

**Verification:** the publisher approves the spec. **Dependencies:** none.
**Size:** S. **Files:** `docs/specs/AIB-145y-gist-analytics.md`.

### T2: the script on every page, and the panel event

**Description:** Load the chosen tool on every built page (the shell and
every page the build writes from it), skipped on `localhost`. Add a small
`analytics.js` with `track(event, props)` that does nothing when the script
is absent or blocked. Nothing calls `track` yet; T29 adds the panel event.

**Acceptance criteria:**
- [x] `dist/index.html`, an edition page and `/privacy` all carry the tag; the
      site id is public by design and noted as such.
- [x] `analytics.test.js`: `track` is a no-op without the global, and never
      throws.
- [ ] No cookie or storage write by the tool in a browser check.
      *(Owed: `data-domains="aibytes.io"` stops the tracker everywhere else, so
      this is checked on the live site at Checkpoint A.)*

**Verification:** `npm run build:web`; `grep` the built pages; DevTools in
`npm run dev:web` with the tag forced on. **Dependencies:** T1, P1.
**Size:** S. **Files:** `apps/web/index.html` or `vite.config.js`,
`apps/web/src/analytics.js`, `analytics.test.js`.

### T3: the privacy page

**Description:** `/privacy` stops saying "no analytics" and says what the
tool collects, that it sets no cookies, and links to its policy.

**Acceptance criteria:**
- [x] The copy matches T1's spec, its fields checked against Umami's own
      pages. Publisher approval (P2) gates the merge to `main`.
- [x] The product spec's analytics line is updated to match.

**Verification:** the page in the dev server, both themes.
**Dependencies:** T2. **Size:** S. **Files:** `apps/web/src/App.jsx` (the
privacy view), `docs/aibytes-app-product-spec.md`.

### Checkpoint A: analytics live

- [ ] Merged views for aibytes.io appear in the tool's dashboard (after the
      PR reaches `main`, or from a preview deploy if the tool allows one).

## Module 3: `gist-contract`

### T4: contract spec

**Description:** `docs/specs/AIB-145y-gist-contract.md`. Fix the gist file
(fields, section keys and caps, `depth`, `stats`, `stats_as_of`,
`references`, `appearances`), `content/gists/index.json`, the item fields
`gist` and `front_page`, the slug rules, and what `validate.py` checks across
files. Starts from the spec's illustrative JSON.

**Acceptance criteria:**
- [ ] Every field has a type, a reason and a cap where it is text.
- [ ] The cross-file rules are listed one per line, as `validate.py` will
      check them.

**Verification:** the publisher approves. **Dependencies:** none.
**Size:** S. **Files:** `docs/specs/AIB-145y-gist-contract.md`.

### T5: the gist schema and validator

**Description:** Per `docs/specs/AIB-145y-gist-contract.md`.
`gist.schema.json`, the types in `feed.d.ts`, the source-key function, and
`validate.py` checking every `content/gists/<slug>.json` on its own: required
fields, section keys from the fixed list, caps, http links only, `depth`
values, and `noindex`-relevant fields.

**Acceptance criteria:**
- [x] Schema and validator kept in step, as for editions (in
      `tests/test_gist_contract.py`, beside `test_feed_schema.py`).
- [x] Bad fixtures are rejected with a clear message: no lede, empty
      links, an unknown section key, a non-http link, a section over its
      cap, and every other per-file rule in the contract spec.
- [x] `validate.py` passes on today's `content/` (no gists yet).

**Verification:** `python3 -m unittest tests.test_feed_schema -v`;
`python3 packages/feed-schema/validate.py`. **Dependencies:** T4.
**Size:** M. **Files:** `packages/feed-schema/gist.schema.json`,
`feed.d.ts`, `validate.py`, `tests/test_feed_schema.py`, fixtures.

### T6: the index and the item's `gist` field

**Description:** `content/gists/index.json` and its schema; the optional
`gist` field on edition and weekly items; the cross-file checks: every index
entry has a file, every item's `gist` names a file, every appearance names an
item that points back.

**Acceptance criteria:**
- [x] Fixtures for each broken link between the three are rejected.
- [x] Old editions with no `gist` field stay valid. The item's `front_page`
      field landed here too, since rules 16 and 17 need it; T8 only fills it.
- [x] `content/README.md` and `.claude/rules/feed-schema.md` describe the
      gist files.

**Verification:** as T5. **Dependencies:** T5. **Size:** M.
**Files:** `gists-index.schema.json`, `edition.schema.json`, `feed.d.ts`,
`validate.py`, `tests/test_feed_schema.py`.

### T7: hidden items withdraw their gist

**Description:** Reshaped by the contract spec (D4): hiding is derived, not
stored. `gist_is_shown(gist, items_by_id)` in Python and JavaScript, from one
set of fixtures. `hide.py` is not edited. *(As built: no contract rule needs
it, so the validator does not call it; T25's build and the generator do.)*

**Acceptance criteria:**
- [x] Hiding the only appearance withdraws the gist; hiding one of two does
      not; unhiding brings it back (Python and JS, same fixtures:
      `packages/feed-schema/fixtures/gist-shown.json`).
- [x] `tests/test_hide.py` still passes unchanged; a test pins that `hide.py`
      never mentions gists.

**Verification:** `python3 -m unittest tests.test_feed_schema tests.test_hide -v`;
`npm test -w @aibytes/web`. **Dependencies:** T6. **Size:** S.
**Files:** `packages/feed-schema/validate.py` (or a `gists.py` beside it),
`apps/web/src/gistShown.js`, tests, shared fixtures.

### T8: HN front page on the item

**Description:** The HN fetcher keeps Algolia's `front_page` tag on every
story; curate copies it to the edition item as `front_page: true`; the
contract and `feed.d.ts` add the optional field.

**Acceptance criteria:**
- [x] A fixture hit tagged `front_page` gives an item with `front_page:
      true`; one without gives no field. Checked live against Algolia too.
- [x] `validate.py` accepts `true` only (the field itself landed in T6).
- [ ] The next daily run carries it (seen after merge).

**Verification:** `python3 -m unittest tests.test_fetchers
tests.test_curate_edition tests.test_feed_schema -v`. **Dependencies:** T4.
**Size:** M. **Files:** `packages/fetchers/aibytes_fetchers/sources/hackernews.py`,
`packages/curate/aibytes_curate/adapters.py`, `edition.schema.json`,
`feed.d.ts`, tests.

### Checkpoint B: contract

- [ ] All checks green; the publisher reviews the contract before generation
      writes into it.

## Module 3b: outbound links carry `ref=aiBytes_` (added 12 Nov 2026, moved up the same day)

### T38: outbound links tagged

**Description:** Every link from aibytes.io to a source item's own page (the
product, the article, the repo, the HN thread, the gist's closing buttons)
gets `ref=aiBytes_` appended when it is rendered, so the destination's own
analytics can see aiBytes_ traffic. Today's links carry
`rel="noopener noreferrer"`, which strips the Referer header, so without the
parameter a destination sees nothing. One function, `withRef(url)` in Ledger,
used by `FeedItem` (cards and list rows) and later the gist view. Content
files keep clean URLs.

**Acceptance criteria:**
- [x] `withRef` adds `ref=aiBytes_` with `?` or `&` as needed, keeps the
      fragment after it, leaves an existing `ref` alone, and leaves non-http
      links untouched (tests).
- [x] Card titles and source names link with the parameter; nothing under
      `content/` changes.
- [x] Whether HN and GitHub links get it too is settled: **no**. GitHub reads
      `?ref=` as a branch name (its page title becomes "… at aiBytes_"), and
      neither site shows owners query parameters. Found by comparing every
      link with and without the tag, 13 Nov 2026. PR #67.

**Verification:** `npm test -w @aibytes/design-system`; `npm test -w
@aibytes/web`; a card's links in the dev server. **Dependencies:** none.
**Size:** S. Next after Checkpoint B, before T9. Ships to `main` on its own
branch and PR, as analytics did, then lands back here when PR #65 syncs with main.
**Files:** `packages/design-system/components/content/withRef.js`,
`withRef.test.js`, `FeedItem.jsx`, its `.prompt.md`.

## Module 4: `gist-generate`

### T9: generation spec

**Description:** `docs/specs/AIB-145y-gist-generate.md`: what is fetched per
item type and with what limits, the `draft` file Claude reads, the output file
Claude writes, what `build` rejects as fatal versus warns, the runner step,
its timeout and Slack lines, and the weekly entry point T34 will use.

**Acceptance criteria:**
- [x] Per-type material and the `brief` fallback are explicit.
- [x] The timeout and run-time budget are stated against the workflow limit.

**Verification:** the publisher approves. **Dependencies:** T4. **Size:** S.

### T10: HN thread and article text fetchers

**Description:** In `packages/fetchers`: `hn_thread(id)` (Algolia `items`
API: points, comments, top-level comments ranked, trimmed) and
`article_text(url)` (readable text from a page with `html.parser`; title,
byline, paragraphs; a size cap; a clear "unreadable" result on paywalls or
bot checks).

**Acceptance criteria:**
- [x] Offline tests on saved fixtures, including a blocked page.
- [x] One live test each, skipped by `AIBYTES_SKIP_LIVE=1`.
- [x] Python 3.8 compatible, stdlib only.

**Verification:** `python3 -m unittest tests.test_fetchers -v`.
**Dependencies:** T9. **Size:** M. **Files:** `aibytes_fetchers/hn_thread.py`,
`article.py`, `tests/test_fetchers.py`, fixtures.

### T11: GitHub repo fetchers

**Description:** `repo_details(owner, name)`: created, stars, forks,
language, licence, contributors (count via the `Link` header), last release;
the README text, capped; the most-commented open issues (titles, labels,
comment counts). Uses `GITHUB_TOKEN` when set.

**Acceptance criteria:**
- [x] Offline tests on saved API fixtures; a 403 rate-limit result is
      reported, not raised.
- [x] One live test, skipped by `AIBYTES_SKIP_LIVE=1`.

**Verification:** as T10. **Dependencies:** T9. **Size:** M.
**Files:** `aibytes_fetchers/github_repo.py`, tests, fixtures.

### T12: Product Hunt launch material

**Description:** For a launch: the PH description and topics from the
snapshot; one PH GraphQL call for its comments (the launch comment, found by
time because the API redacts authors, and the top 8 by votes); plus
`article_text` on the product's own site when curate resolved one. `full`
when description and launch comment reach 120 words (spec Q1).

**Acceptance criteria:**
- [x] Offline test from a saved snapshot, API response and page.
- [x] Exactly one PH API call per new launch; none for a repeat. (One call
      per launch: T12. None for a repeat: T13's draft.)

**Verification:** as T10. **Dependencies:** T10. **Size:** S.

### T13: `gists draft`

**Description:** New `packages/gists`. `draft --date` reads the built
edition, normalises each item's `source_url`, looks it up in the index,
fetches material for new items only (T10-T12) and writes one draft file:
per item the type, the material, the slug, and what is already known
(title, summary, counts, `front_page`). Repeat items are listed for a stats
refresh only.

**Acceptance criteria:**
- [x] A repeat item is not fetched or rewritten; it resolves to its slug.
- [x] Slug: the id without its date; a clash gets `-2`.
- [x] An unreadable source is marked so Claude writes `brief`.

**Verification:** `python3 -m unittest tests.test_gists -v`.
**Dependencies:** T6, T10-T12. **Size:** M. **Files:** `packages/gists/gists.py`,
`aibytes_gists/draft.py`, `slugs.py`, `tests/test_gists.py`.

### T14: the `write-gists` skill

**Description:** `.claude/skills/write-gists/SKILL.md`: the structure per
type from the spec, "only what was read", no copying, the edition's voice
rules, the output file shape. It is what the runner's Claude step is told to
follow.

**Acceptance criteria:**
- [x] Every section key and cap comes from the contract, named, not
      restated as numbers that could drift (tested).
- [x] A worked example per type.

**Verification:** a hand run on one edition's draft gives a file that T15's
`build` accepts. Done 13 Nov: four gists written by hand from
the live 11 Nov draft (one per kind), all accepted, tree valid; two warned
for length (109 and 114 words). **Dependencies:** T13. **Size:** S.

### T15: `gists build`

**Description:** `build --date --gists <file>` validates Claude's output
against the contract, then writes everything at once: new gist files, index
entries, the new appearance and refreshed stats on repeat gists, and `gist`
on each edition item. A fatal problem in one gist drops that gist only; the
item ships without `gist`.

**Acceptance criteria:**
- [x] Nothing under `content/` changes if validation of the whole set fails.
- [x] One bad gist out of thirty leaves twenty-nine written and one warning.
- [x] `validate.py` passes on the result.

**Verification:** `tests/test_gists.py`. **Dependencies:** T13, T14.
**Size:** M. **Files:** `aibytes_gists/build.py`, `tests/test_gists.py`.

### T16: the runner's gists step

**Description:** `step_gists` after `build`, before `validate`: `draft`,
`claude -p` with the skill (Read, Write, Edit only), `build`. Any failure
reverts `content/gists/` and the edition's `gist` fields and becomes a
warning; the edition publishes. Slack reports gists written, reused, `brief`
and failed. `edition.yml` passes `GITHUB_TOKEN` to the run (P3) and sets
`timeout-minutes: 30` on the job (spec Q3).

**Acceptance criteria:**
- [x] `tests/test_runner.py`: Claude writing nothing, a timeout and a build
      rejection each still publish the edition, with a warning.
- [x] `--skip-gists` exists for re-runs.
- [x] `tests/test_pages_workflow.py` (or a new check) covers the token and timeout lines.

**Verification:** `python3 -m unittest tests.test_runner -v`;
`python3 packages/runner/run.py --skip-fetch --no-push` on a past date. Done 13 Nov
as `step_gists` on a copy of content/ for 11 Nov, with the real draft and
build and four hand-written gists in place of the Claude session: 3 written,
1 dropped (GitHub's anonymous limit was spent, so the repo was `brief`).
The whole run with a real Claude session is T17.
**Dependencies:** T15, P3. **Size:** M. **Files:**
`packages/runner/aibytes_runner/cli.py`, `notify.py`,
`.github/workflows/edition.yml`, `tests/test_runner.py`, `packages/runner/README.md`.

### T17: rehearsal on seven editions

**Description:** Run the gists step with `--no-push` on the last seven
editions' snapshots, and put the results in front of the publisher in one
review artifact. No commit of `content/`.

**Acceptance criteria:**
- [x] Time and the share of `brief` gists per run are recorded.
      Rehearsal 13 Nov 2026, editions 5 to 11 Nov, real Claude sessions, no
      commit: 149 new gists, 0 failed. Per run 129 to 387 s (average 237 s,
      about 4 minutes; the spec guessed 15). 13 of 149 brief (9%): 6 HTTP
      errors, 4 too short, 2 network. 13 warnings: 9 copied runs of 12 to 15
      words, 3 full gists at 117 or 118 words, 1 "10x". Cost about $1.36 per
      day of 20 new items. The first 11 Nov run hit the 5-hour usage limit
      mid-session and was correctly discarded; it was run again.
- [x] The publisher reads them and says they would link to them unedited (P4),
      or the skill and fetchers are fixed and the rehearsal repeats.

**Verification:** P4. **Dependencies:** T16. **Size:** S.

### Checkpoint C: generation proven

- [x] P4 given. No UI work starts before it.

## Module 5: `ledger-gist-ui`

### T18: Ledger spec

**Description:** `docs/specs/AIB-145y-ledger-gist-ui.md`, short: the
components and props taken from the design record and prototype.
Closing buttons are small and carry generic labels worked out from the link's
role and host, never the page's own title: "Source" for the destination, "HN
Discussion" for a Hacker News thread, "Product Hunt" for a launch page,
"Discussion" for any other host (publisher, 13 Nov 2026, from reviewing the
rehearsal page). Every gist with an image shows it just before the title, the
same one the feed card uses: a Product Hunt logo, a repo's owner avatar (a
circle), a TechCrunch thumbnail (cropped square). It is the gist's `image`,
which `build` already copies from the item, so no contract change. An image
that fails to load falls back as the feed card does. Hacker News gists have
none. Buttons carry the
top-right arrow that marks an external link.
Hacker News gists show the orange "Y" source mark in that slot, the same
fallback the feed card draws when an item has no image (`SourceMark` through
`ItemImage`).
Stats block (publisher, 13 Nov 2026): the heading and the time are one line,
"STATS (As of 6 Nov 2026)", the date only, in the viewer's own timezone. Counts
of 1,000 or more are short: 1.2k below 10k, 140k up to a million, 1.2M above,
except Hacker News points and comments, which stay whole. A repo's stats read stars, forks,
contributors, open issues, created, language, licence. "Stars gained" and
"Last release" are not shown (the contract still carries them).

**Verification:** the publisher approves (approved 13 Nov 2026). **Dependencies:** none (can run
any time after the design). **Size:** S.

### T19: `GistView`

**Description:** The shared content component: kicker with source mark,
date and badges; title; source button; lede; stats grid with the "As of"
caption (C2); sections; closing source buttons; "Appeared in"; an actions
slot at the end (D2). Server-renderable: no `window` during render.

**Acceptance criteria:**
- [x] `GistView.test.js` renders each type (news, HN, repo, launch, X
      preview, brief) from fixtures.
- [x] `renderToStaticMarkup` of it works under `node --test`.
- [x] `.d.ts`, `.prompt.md`; tokens only; both themes pass the contrast test.
      (Only existing tokens are used, all already in the contrast test.
      Preview added for the Design System Artifact build. 15 tests.)

**Verification:** `npm test -w @aibytes/design-system`.
**Dependencies:** T18, T5 (types). **Size:** M.

### T20: `GistPanel`, resizable

**Description:** The beside panel (A1): top bar with the page link and
close, scroll area, Escape, focus return, the drag and keyboard resize edge
(360px to feed-keeps-440px, double-click reset, `onWidthChange` for the app to
save). At 760px and under, a full-screen sheet with no resize edge.

**Acceptance criteria:**
- [x] Tests: separator role and values, arrow keys change width within
      bounds, Escape calls `onClose`. (8 tests; the rules are pure functions in
      `gistPanel.js` because there is no DOM library to drive the effects.)
- [ ] Browser check at 1440 and 390px, both themes.

**Verification:** design-system tests; the preview server.
**Dependencies:** T19. **Size:** M.

### T21: reactions bar, front-page badge, saved line, banner copy

**Description:** `ReactionBar` (eight emoji, counts, pressed state,
`onToggle`); a `front` flag on `Card` and `ListRow` for the "Front page"
label; the "Added to your Saved items. View here" line; `SaveBanner`'s new
copy everywhere it is quoted.

**Acceptance criteria:**
- [ ] Tests for each; `SaveBanner.test.js` and its `.d.ts`, `.prompt.md`, the
      brand-tone card and the product spec carry the new line.
- [ ] Existing card tests unchanged except for the new flag.

**Verification:** design-system tests. **Dependencies:** T18. **Size:** M.

### T22: UI kit screens

**Description:** Kit screens for the feed with the panel open and the gist
page, plus readme entries. Sync the new components to the Design System
Artifact in Claude (decided at approval).

**Acceptance criteria:**
- [ ] Screens listed in both readmes; a Python test pins them, as for
      earlier screens.

**Verification:** the preview server matches the design record.
**Dependencies:** T19-T21. **Size:** M.

### Checkpoint D: Ledger

- [ ] The publisher looks at the kit screens.

## Module 6: `app-gist-pages`

### T23: pages spec

**Description:** `docs/specs/AIB-145y-app-gist-pages.md`: the head per depth,
JSON-LD type, the server-render approach, sitemap and robots contents.

**Verification:** the publisher approves. **Dependencies:** T5, T19.
**Size:** S.

### T24: route and page head

**Description:** `/gists/<slug>` in `route.js`; `gistHead(gist)` in
`pageMeta.js`: title, description from the lede, canonical, Open Graph,
JSON-LD, `noindex` unless `depth` is `full`.

**Acceptance criteria:**
- [ ] `route.test.js` and `pageMeta.test.js` cover each depth and escaping.

**Verification:** `npm test -w @aibytes/web`. **Dependencies:** T23.
**Size:** S.

### T25: static gist pages, sitemap, robots

**Description:** The Vite plugin writes `dist/gists/<slug>/index.html` for
every gist not fully hidden, with `GistView`'s server markup inside the shell
and the head from T24; plus `sitemap.xml` (editions, issues, `full` gists)
and `robots.txt` (allow all, sitemap line).

**Acceptance criteria:**
- [ ] A build test on fixture content: the page contains the lede text; a
      `brief` gist's page has `noindex` and is absent from the sitemap; a
      hidden gist has no page.
- [ ] Build time with 1,000 fixture gists is recorded.

**Then P8 (publisher):** verify `aibytes.io` in Google Search Console as a
domain property by DNS TXT record and submit `https://aibytes.io/sitemap.xml`
once it is live. See the analytics spec.

**Verification:** `npm run build:web`; the test. **Dependencies:** T24, T7.
**Size:** M.

### T26: the gist page in the app

**Description:** The E2 reading page: header, back to the edition, `GistView`,
star with the saved line, reactions shown read-only until T32, "More from"
as list rows, the subscribe bar, the sticky banner when signed out with
saves. It takes over the server markup without a flash.

**Acceptance criteria:**
- [ ] With JavaScript off, the page reads in full (success criterion 2).
- [ ] Saving from the page shows on `/saved` and the card.
- [ ] Browser check at 1440 and 375px, both themes.

**Verification:** dev server and the built site served locally.
**Dependencies:** T25, T19, T21. **Size:** M.

## Module 7: `app-gist-panel`

### T27: panel spec

**Description:** `docs/specs/AIB-145y-app-gist-panel.md`: `?gist=` in the
URL, history behaviour, feed width with the panel, items with no gist.

**Verification:** the publisher approves. **Dependencies:** T26. **Size:** S.

### T28: a card's title opens the panel

**Description:** On daily pages, a plain click on a card title with a `gist`
opens `GistPanel` and pushes `?gist=<slug>`; Back closes it; reload keeps it;
modified clicks follow the `/gists/<slug>` link; the source name still opens
the source (B2); items with no `gist` behave as today. Width saved in
`prefs.js`.

**Acceptance criteria:**
- [ ] `route.test.js` parses `?gist=`; `prefs.test.js` covers the width.
- [ ] Browser check: click, Back, reload, new-tab click, a pre-launch card.

**Verification:** web tests; dev server. **Dependencies:** T27, T20.
**Size:** M.

### T29: weekly pages and the panel event

**Description:** The same on `/weekly/issue-N` for items with a `gist`;
`track("gist_panel_open", { slug })` from T2.

**Acceptance criteria:**
- [ ] Browser check on a weekly page; the event appears in the tool.

**Verification:** as T28. **Dependencies:** T28, T2. **Size:** S.

### Checkpoint E: launch-ready

- [ ] Success criteria 1-7 and 9-10 pass on a local build with rehearsed
      gists. PR #65 is squash-merged here and the next daily run is launch.

## Module 8: `app-reactions`

### T30: reactions spec

**Description:** `docs/specs/AIB-145y-app-reactions.md`: the document shape,
rules, how counts are read and what they cost, and whether a Cloud Function
is needed (ask first if so).

**Verification:** the publisher approves. **Dependencies:** T26. **Size:** S.

### T31: rules and emulator tests

**Description:** `firestore.rules` for reactions; emulator tests: signed out
cannot write, one reader cannot write another's, only the eight emoji,
counts readable by anyone.

**Acceptance criteria:**
- [ ] `npm run test:rules -w @aibytes/web` covers each rule.
- [ ] Rules deployed by the publisher (P5).

**Verification:** the rules tests. **Dependencies:** T30. **Size:** S.

### T32: reactions in the app

**Description:** A `reactions.js` store (read counts, toggle, optimistic
update, sign-in ask when signed out) wired into the page and the panel.

**Acceptance criteria:**
- [ ] `reactions.test.js` covers toggle, rollback on a refused write, and the
      signed-out path.
- [ ] Browser check after P5 (success criterion 8).

**Verification:** web tests; dev server against the real project.
**Dependencies:** T31. **Size:** M.

## Module 9: `newsletter-gist-links`

### T33: newsletter spec

**Description:** `docs/specs/AIB-145y-newsletter-gist-links.md`: how the
weekly pull finds items missing a gist, X and announcement previews, the
link and source link in the template within Substack's colour rules, UTM
tags, and how `build_weekly_issues.py` maps links back.

**Verification:** the publisher approves. **Dependencies:** T16, T26.
**Size:** S.

### T34: the weekly pull writes gists

**Description:** A `gists` entry point for an issue: items without a gist
get one (full, brief, or preview for X posts and announcements); issue items
carry `gist`.

**Acceptance criteria:**
- [ ] Tests on a fixture issue: missing gists written, existing ones reused,
      X posts as `preview`.

**Verification:** `tests/test_gists.py`. **Dependencies:** T33. **Size:** M.

### T35: the template and the skill

**Description:** `generate-newsletter-content`'s template and SKILL.md link
each item title to its gist with UTM tags and keep a small source link
beside it (F2).

**Acceptance criteria:**
- [ ] The skill's tests (or a new one) check every item link is a gist link
      with tags, and each has a source link.
- [ ] The first issue to use it is approved by the publisher (P6).

**Verification:** a test issue rendered from fixtures. **Dependencies:** T34.
**Size:** M.

### T36: weekly issue pages read gist links

**Description:** `build_weekly_issues.py` resolves gist links back to the
source and sets `gist` on issue items, so `/weekly/issue-N` cards keep their
source and gain the panel.

**Acceptance criteria:**
- [ ] `tests/test_build_weekly_issues.py`: an issue with gist links builds
      the same items as one with source links, plus `gist`.

**Verification:** that test; `validate.py`. **Dependencies:** T35.
**Size:** S.

### Checkpoint F: newsletter

- [ ] Success criterion 11 passes.

## Wrap-up

### T37: docs, ticket, by-hand checks

**Description:** `CLAUDE.md` commands and layout row for `packages/gists`;
package READMEs; `.claude/rules/` for gists; the ticket's checklist all
ticked; the publisher's browser checks on aibytes.io (P7).

**Acceptance criteria:**
- [ ] All twelve success criteria in the spec are checked off with how.

**Verification:** the full checkpoint list. **Dependencies:** everything.
**Size:** S.
