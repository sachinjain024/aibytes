# Task list: AIB-77u

Plan: `docs/plans/AIB-77u-plan.md`. The AIB-77u checklist mirrors these tasks.
**One task, one PR:** each task merges to `main` before the next branches from it.

**Definition of done for every task:**
- The task's own verification passes.
- `AIBYTES_SKIP_LIVE=1 python3 -m unittest discover -s tests -v` passes.
- `npm test -w @aibytes/web` passes.
- Nothing under `content/` changes.

---

## Phase 1: edition-rank (spec: `docs/specs/AIB-77u-edition-rank.md`)

## Task 1: Contract: `rank` in the schema, validator, and `feed.d.ts` (done)

**Description:** Add an optional integer `rank` (minimum 1) to the edition item
in all three faces of the contract, plus the edition-level invariant that ranks
are all-or-none and exactly `1..N` over every item, hidden ones included.
`schema_version` stays 1.

**Acceptance criteria:**
- [x] An edition with no ranks, or with full ranks `1..N`, validates. A partial
      set, a repeat, a gap, `0`, a negative, a float, `true`, or a string fails,
      with messages in the existing form.
- [x] `edition.schema.json` declares `rank` (integer, minimum 1, not required);
      the validator's optional item keys include it; `feed.d.ts` has
      `rank?: number` with a doc comment. A parity test fails on a one-sided edit.
- [x] Hiding an item with `hide.py` leaves a ranked edition valid.

**Verification:**
- [x] `AIBYTES_SKIP_LIVE=1 python3 -m unittest tests.test_feed_schema tests.test_hide -v`
- [x] `python3 packages/feed-schema/validate.py` (the published tree is still valid)

**Dependencies:** None

**Files likely touched:**
- `packages/feed-schema/edition.schema.json`
- `packages/feed-schema/validate.py`
- `packages/feed-schema/feed.d.ts`
- `packages/feed-schema/README.md`
- `tests/test_feed_schema.py`

**Estimated scope:** M

## Task 2: Curate writes `rank` at build (done)

**Description:** New `packages/curate/aibytes_curate/rank.py`.

- `assign(drafts)` returns a `{id: rank}` map.
- Standing is an item's position within its own source divided by that
  source's count. Items are sorted by `(standing, TIE_ORDER, id)`, where
  `TIE_ORDER = ("github", "hackernews", "techcrunch", "producthunt")`.
- `cmd_build` sets `item["rank"]` after the merge, as each item's last key.
- `adapters.ORDER`, and so the file's reading order, is unchanged.

**Acceptance criteria:**
- [x] `RankTests` pass:
  - each source's leader is ranked 1-4 in `TIE_ORDER` order;
  - the spec's 2026-10-09 worked table reproduces exactly;
  - Show HN and HN threads are one group;
  - TechCrunch with no signals follows fetch order;
  - the output is deterministic and independent of input order;
  - `TIE_ORDER` is a permutation of `registry.names()`.
- [x] A build writes `rank` `1..N` on every item, including hidden ones; a re-run
      is byte-identical apart from `generated_at`; the item order in the file is
      unchanged.
- [x] The `packages/curate` README and the item example in product spec §3
      document `rank`. (The item example is in §5,
      "Edition JSON schema", not §3.)

**Verification:**
- [x] `AIBYTES_SKIP_LIVE=1 python3 -m unittest tests.test_curate_edition -v`
- [x] Manual: build 2026-10-09 from its saved `summaries.json` into a **temp
      copy** of `content/`; every item has a rank and `validate.py` passes on the copy

**Dependencies:** Task 1

**Files likely touched:**
- `packages/curate/aibytes_curate/rank.py` (new)
- `packages/curate/aibytes_curate/cli.py`
- `packages/curate/README.md`
- `tests/test_curate_edition.py`
- `docs/aibytes-app-product-spec.md`

**Estimated scope:** M

## Checkpoint 1: after Tasks 1-2
- [ ] Full Python suite and `validate.py` green
- [ ] `git status` shows no change under `content/`
- [ ] T1 PR (from `aib-77u-home-side-nav`, with the spec, ticket, and plan
      commits) and T2 PR merged
- [ ] AIB-79t unblocked: list the editions published before the merge

---

## Phase 2: app-side-nav (spec: `docs/specs/AIB-77u-app-side-nav.md`)

## Task 3: Ledger `SideNav`: ARIA, footer overlap, landmark name (done)

**Description:** Three package fixes, as their own commit, with no visual change:

1. The date list drops `role="listbox"` and keeps `aria-label="Editions"` (as
   `role="group"`: a name on a role-less div is not announced); the
   current edition is `aria-current="date"`.
2. `.ldg-sidenav` height subtracts an optional `--ldg-footer-h` (default `0px`).
3. The `aside` is labelled "Edition and categories".

**Acceptance criteria:**
- [x] `SideNav.jsx` has no `role="listbox"`; the current date row carries
      `aria-current="date"`; the `aside` label reads "Edition and categories".
- [x] With `--ldg-footer-h` set, the rail's bottom edge meets the footer's top.
      Unset, the rail behaves exactly as before.
- [x] `SideNav.d.ts` and `SideNav.prompt.md` are updated in step; `_ds_*` files
      and the card markers are untouched.

**Verification:**
- [x] `AIBYTES_SKIP_LIVE=1 python3 -m unittest tests.test_design_system -v`
- [x] Manual: `npm run preview:design-system`; `sidenav.card.html` and the UI kit
      render as before (they load `_ds_bundle.js`, which keeps the
      old SideNav until Claude Design regenerates it)

**Dependencies:** None (sequenced after T2 under one-task-one-PR)

**Files likely touched:**
- `packages/design-system/components/navigation/SideNav.jsx`
- `packages/design-system/components/navigation/SideNav.d.ts`
- `packages/design-system/components/navigation/SideNav.prompt.md`
- `packages/design-system/components/components.css`
- `tests/test_design_system.py`

**Estimated scope:** M

## Task 4: `rail.js`: calendar-true date labels (done)

**Description:** A pure `railDate(ref, editions, today)` that returns
`dateMain`, `dateNote`, `dateSub`, `prevLabel`, and `nextLabel` per the spec's
date-block table, plus a `daysBetween` helper. `today` is the reader's local
`YYYY-MM-DD`, passed in. Also `localDate(now)`, which
T5 uses to compute `today`.

**Acceptance criteria:**
- [x] Every row of the spec's table is a `node --test` case:
  - latest dated today, with prev yesterday or older;
  - latest not dated today;
  - an older edition (`Latest` next);
  - the oldest (no prev);
  - a future-dated edition reads as `Today`.
- [x] "Yesterday" appears only when the older edition is the reader's yesterday;
      `1 day ago` vs `2 days ago`; month and year boundaries.

**Verification:**
- [x] `npm test -w @aibytes/web`

**Dependencies:** None

**Files likely touched:**
- `apps/web/src/rail.js` (new)
- `apps/web/src/rail.test.js` (new)

**Estimated scope:** S

## Task 5: The rail in the app at ≥900px, plus the §6 amendment (done)

**Description:**
- `useMedia("(min-width: 900px)")` drives one switch. At ≥900px: render
  `SideNav` with the `railDate` labels and categories with visible counts
  (All included), plus `showCategories={false}`, no `EditionBar`, and the
  `app-shell--full` / `app-cols` layout with a `minmax(272px,1fr)` grid and
  20px/28px padding.
- Below 900px: exactly today's layout.
- A visually hidden h1 at ≥900px.
- `--ldg-header-h` and `--ldg-footer-h` set from the measured heights.
- Category clicks are ignored until the edition and tags have loaded.
- Picking a date navigates with the query kept, closes the list, and returns
  focus to the toggle; Escape closes the list.
- Amend product spec §6 with a dated note.

**Acceptance criteria:**
- [x] 1440px: the rail, no chips, no edition bar, 4 columns, full-bleed;
      900px: 2 columns; 899px and 390px: identical to today. Never zero or two navs.
- [x] ← steps older, Latest → goes to `/`, and Pick a date lists every edition
      with counts. All three keep `?c=`/`?t=`/`?s=`. A `?t=` link survives a
      slow `tags.json`.
- [x] Exactly one h1 at every width; the rail never sits under the footer;
      clean console.

**Verification:**
- [x] `npm test -w @aibytes/web` and `npm run build:web`
- [x] Browser (Claude in Chrome, `localhost:5173`, prototype served locally):
      the spec's checks 1-9 at 1440 / 900 / 899 / 390px, light and dark.
      Widths ran as same-origin iframes, since resizing the window drops the
      extension. Tab order was read from the DOM, since synthetic Tab presses do
      not move focus there. The `?t=` guard was checked in code, not under a
      throttled network.

**Dependencies:** Tasks 3, 4

**Files likely touched:**
- `apps/web/src/App.jsx`
- `apps/web/src/app.css`
- `docs/aibytes-app-product-spec.md`

**Estimated scope:** M

## Checkpoint 2: after Tasks 3-5
- [ ] Web tests, `build:web`, and the full Python suite green
- [ ] Browser checks pass at all four widths, in both themes
- [ ] T3, T4, and T5 PRs merged

---

## Phase 3: app-feed-order (spec: `docs/specs/AIB-77u-app-feed-order.md`)

## Task 7: `order.js` and the `TIE_ORDER` drift guard (done)

**Description:** Pure `rankedItems(editionItems)`, which sorts by `rank`, or for
any edition not fully ranked uses the fallback standing over the whole edition,
hidden included. Pure `groupedItems(ordered)`: `CATEGORIES` order, empty
categories omitted. Plus a Python test that parses `TIE_ORDER` from `order.js`
and compares it with `rank.TIE_ORDER`.

**Acceptance criteria:**
- [x] `node --test` cases:
  - a ranked edition sorts by rank, gaps included;
  - a rank-less edition gets the fallback and reproduces the edition-rank
    worked table;
  - a partly ranked edition falls back entirely;
  - filtering after ordering never changes relative order;
  - grouping order, omission, and in-section rank order.
- [x] The drift guard passes and fails if either `TIE_ORDER` changes alone.

**Verification:**
- [x] `npm test -w @aibytes/web`
- [x] `AIBYTES_SKIP_LIVE=1 python3 -m unittest tests.test_curate_edition -v`

**Dependencies:** Task 2 (`rank.py` must exist for the guard)

**Files likely touched:**
- `apps/web/src/order.js` (new)
- `apps/web/src/order.test.js` (new)
- `tests/test_curate_edition.py`

**Estimated scope:** S

## Task 8: Ranked: the order pref, the header control, ranked rendering (done)

**Description:**
- `prefs.js` gains `ORDER = { key: "aibytes-order", values: ["ranked", "grouped"] }`.
- `App.jsx` uses `useChoice(ORDER, "ranked")` and passes `mode`/`onMode` to
  `Header` only at ≥700px (not compact).
- The body orders the **whole** edition with `rankedItems`, then filters, then
  renders one grid or list.
- The hidden `{n} items` h2 stays.
- Until T9, Grouped shows the file's order (by category, today's feed) with
  no section headings.

**Acceptance criteria:**
- [x] With storage cleared, the page opens Ranked with sources interleaved; the
      control shows at ≥700px and not below; the choice survives a reload.
- [x] `ORDER` prefs cases pass: known values read back, unknown values read as
      none, a throwing storage behaves as empty, writing an unknown value throws.
- [x] Empty states, the end card, and list view are unchanged; no horizontal
      scroll at 375px.

**Verification:**
- [x] `npm test -w @aibytes/web` and `npm run build:web`
- [x] Browser: spec checks 1, 4, 5, 6, and 8

**Dependencies:** Tasks 5, 7

**Files likely touched:**
- `apps/web/src/prefs.js`
- `apps/web/src/prefs.test.js`
- `apps/web/src/App.jsx`

**Estimated scope:** S

## Task 9: Grouped: section rendering, plus the §6 amendment (done)

**Description:**
- In Grouped mode, render one `<section>` per `groupedItems` group, headed by
  Ledger's `SectionHeading` (h2, count, `id` = the category key), as a grid or
  an `.app-rows` list.
- No hidden h2.
- A `?c=` filter shows one section.
- Amend product spec §6 to describe both orders and the Ranked default.

**Acceptance criteria:**
- [x] Grouped shows four headed sections with correct post-filter counts; `?c=`
      shows one; a filter that empties a category drops its section.
- [x] Both modes × grid/list render. The accessibility tree shows one h1 and
      h2s per the spec (hidden in Ranked, section headings in Grouped).
- [x] Product spec §6 has the dated amendment.

**Verification:**
- [x] `npm test -w @aibytes/web` and `npm run build:web`
- [x] Browser: spec checks 2, 3, and 7, with a clean console

**Dependencies:** Task 8

**Files likely touched:**
- `apps/web/src/App.jsx`
- `docs/aibytes-app-product-spec.md`

**Estimated scope:** S

## Checkpoint 3: complete
- [ ] Every success criterion in the three specs met
- [ ] Full Python suite, web tests, and `build:web` green; browser checks for
      both modes × grid/list at 1440 / 900 / 375px
- [ ] T7, T8, and T9 PRs merged
- [ ] AIB-77u checklist all ticked; ticket moved to done
