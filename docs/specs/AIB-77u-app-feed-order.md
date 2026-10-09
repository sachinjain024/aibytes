# Spec: app-feed-order (AIB-77u, module 3 of 3)

Status: **reviewed 2026-10-09; open questions resolved.** Map: `docs/specs/AIB-77u-capability-map.md`.
Ticket: `.longclaw/tickets/AIB-77u/ticket.md`. Depends on `edition-rank`
(`docs/specs/AIB-77u-edition-rank.md`).

## Objective

Give the edition two orders, switched from the header:

- **Ranked** (the default): one grid, strongest first, using each item's
  curated `rank`.
- **Grouped**: one section per category (New Products, Trending Dev Projects,
  AI News, HN Threads), each under a heading with its count, as product spec §6
  describes.

Today the app does neither. It renders one heading-less grid in file order:
every Product Hunt launch, then the repos, then TechCrunch, then HN.

The reader's choice is remembered in local storage, like grid/list.

**Out of scope:**
- The TOP marker
- Writing `rank` (`edition-rank`) and backfilling it (AIB-79t)
- The rail (`app-side-nav`)
- Saves and the Saved view (AIB-75v)
- Making category chips scroll to a section (§6 mentions it; the chips filter
  today and keep doing so)

Decided on 2026-10-09: Ranked is the default and is remembered.

## Behaviour

### The control

- Ledger's `Header` already renders the segmented **Ranked | Grouped** control
  (`role="group"`, `aria-label="Feed order"`, `aria-pressed` per button) when it
  is given `mode` and `onMode`. The app passes both. **No Ledger change.**
- The choice is stored as `aibytes-order` (`ranked` | `grouped`) through
  `prefs.js`, validated like `THEME` and `VIEW`. With nothing stored, or an
  unknown value, it is `ranked`.
- It is **not** in the URL. It is a reading preference, like grid/list; the URL
  carries only what a shared link should reproduce (edition and filters).
- **Below 700px** (the compact header) the control is not shown (decided
  2026-10-09). The header has no room (see Open questions), and the reader gets their stored order. With
  nothing stored, that is Ranked. AIB-78z owns phone controls.

### Ranked

One section, one grid (or list), items sorted by `rank` ascending, after the
current filters are applied. Hidden items are never shown, and the gaps they
leave in the numbering are harmless.

**Fallback for editions without `rank`.** Until AIB-79t backfills them, and for
any old file the app meets, the app computes the same order `edition-rank`
does, client-side. Each item's standing is its position within its own
source, in file order, divided by that source's item count. Items are sorted by
`(standing, TIE_ORDER.index(source), id)` with
`TIE_ORDER = ["github", "hackernews", "techcrunch", "producthunt"]`. File order
within a source is the fetcher's own ranking (`relevance.apply`), so a backfill
changes almost nothing a reader sees. The only exception is Show HN posts
against HN threads, which file order splits by category.

A partially ranked edition is invalid by the contract, but if one arrives the
fallback is used for the whole edition rather than mixing the two.

The visually hidden `h2` stays (`{n} items`), so the outline is h1 → h2 → h3.

### Grouped

- One `<section>` per category, in `CATEGORIES` order, each headed by Ledger's
  `SectionHeading` (`<h2>`: name + `· count`, `id` = the category key). Each
  holds its own grid or `.app-rows` list.
- Within a section, items are in `rank` order (fallback: file order). The
  strongest launch leads its section, so the two modes never disagree about
  which item is best.
- The count is the number of items shown in that section after filters.
- A category with no items after filters is **omitted**, not shown empty.
- A single-category filter (`?c=repos`) shows that one section, with its heading.
- The visually hidden `h2` is not rendered; the section headings are the h2s.
- Sections sit `var(--section-gap)` apart (40px), as `.app-main` already spaces
  its children.

### Shared

- **Grid and list** work in both modes: four combinations.
- **Empty states** are unchanged. If filters leave nothing, the existing
  `EmptyState` logic runs, whatever the mode.
- **Filters** apply before ordering; ordering never changes which items show.
- **End card** after the last section, unchanged.
- Changing mode does not navigate and does not scroll.

## Where it lands

```
apps/web/src/order.js          NEW pure: rankedItems(edition items), groupedItems(ordered) -> [{category, items}]
apps/web/src/order.test.js     NEW node --test
apps/web/src/prefs.js          ORDER = { key: "aibytes-order", values: ["ranked", "grouped"] }
apps/web/src/prefs.test.js     ORDER read/write cases
apps/web/src/App.jsx           useChoice(ORDER, "ranked"); Header mode/onMode (not on compact);
                               body() renders Ranked or Grouped
tests/test_curate_edition.py   TIE_ORDER in order.js equals TIE_ORDER in rank.py (drift guard)
docs/aibytes-app-product-spec.md  §6 dated amendment: Ranked (default) and Grouped
```

`order.js` restates `TIE_ORDER` because it is JavaScript and `rank.py` is
Python, and neither can import the other. The Python test reads the JS line and
compares, so the two cannot drift silently.

## Commands

```bash
npm run dev:web                       # http://localhost:5173/
npm test -w @aibytes/web              # node --test: order, prefs, and the rest
npm run build:web
AIBYTES_SKIP_LIVE=1 python3 -m unittest tests.test_curate_edition -v   # drift guard
AIBYTES_SKIP_LIVE=1 python3 -m unittest discover -s tests -v           # before commit
```

## Code style

Pure ordering in its own module, covered by `node --test`; `App.jsx` only picks
which to render. In the idiom of `filters.js`:

```js
// The edition's two reading orders (spec AIB-77u app-feed-order). Ranked uses
// the curated `rank`; an edition written before rank existed gets the same
// order computed here, the way packages/curate/aibytes_curate/rank.py does.
import { CATEGORIES } from "./filters.js";

// Must equal TIE_ORDER in rank.py; tests/test_curate_edition.py checks it.
export const TIE_ORDER = ["github", "hackernews", "techcrunch", "producthunt"];

const ranked = (items) => items.length > 0 && items.every((item) => Number.isInteger(item.rank));

/** Items strongest first: by rank, or by the fallback when any is missing. */
export function rankedItems(items) {
  return ranked(items)
    ? [...items].sort((a, b) => a.rank - b.rank)
    : fallbackOrder(items);
}

/** [{ category, items }] in CATEGORIES order, empty categories left out.
 * `ordered` is already ranked and filtered; this only splits it. */
export function groupedItems(ordered) {
  return CATEGORIES
    .map((c) => ({ category: c, items: ordered.filter((item) => item.category === c.key) }))
    .filter((group) => group.items.length > 0);
}
```

In `App.jsx` the flow is: order the **whole** edition, then filter, then group:

```js
const ordered = rankedItems(edition.data.items)
  .filter((item) => !item.hidden && matches(item, filters));
const groups = mode === "grouped" ? groupedItems(ordered) : null;
```

One detail matters. The fallback's standing must be computed over the
**whole edition** (hidden items included, as `rank` is), and ordering applied
after filtering. Otherwise a filter would change an item's standing, and Ranked
would reshuffle under a filter in a way the curated `rank` never does.
`rankedItems` therefore takes the full edition, hidden items included, and
`App.jsx` filters the ordered list, as shown above.

## Testing strategy

**Unit (`node --test`, `order.test.js`):**
- A ranked edition sorts by `rank`.
- Ranks with gaps (a hidden item removed) still sort.
- An edition with no `rank` uses the fallback.
- The fallback reproduces the worked example in the edition-rank spec (GH, HN,
  TC, PH, HN 2nd, TC 2nd, …).
- A partly ranked edition uses the fallback for everything.
- The fallback's standing ignores filters: filtering after ordering equals
  ordering the filtered rows by their whole-edition position.
- Grouped yields `CATEGORIES` order, drops empty categories, orders by rank
  inside each section, and counts what it holds.
- The output is identical across runs and independent of input order.

**Prefs (`prefs.test.js`):**
- `ORDER` reads back `ranked` and `grouped`.
- An unknown value reads as no choice.
- A throwing storage behaves as empty.
- Writing an unknown value throws.

**Drift guard (`tests/test_curate_edition.py`):** `TIE_ORDER` parsed from
`apps/web/src/order.js` equals `rank.TIE_ORDER`.

**In a real browser** (Claude in Chrome, `localhost:5173`):

1. **Default:** with storage cleared, the page opens Ranked and sources
   interleave (not PH-first).
2. **Grouped:** four headed sections with correct counts. `?c=repos` shows one
   section. A tag filter that empties a category drops that section.
3. **Grid × list × both modes:** all four render.
4. **Memory:** switching to Grouped and reloading keeps Grouped. A filtered
   empty state still reads as today.
5. **Keyboard:** Tab reaches both buttons; `aria-pressed` follows the choice;
   the focus ring is visible.
6. **Widths:**
   - At 1440px with the rail: the control fits beside the tools.
   - At 700-899px: the control fits in the full header.
   - Below 700px: it is not shown, with no horizontal scroll at 375px.
7. **Structure:** the accessibility tree shows the hidden h2 in Ranked and one
   h2 per section in Grouped.
8. **Console:** zero errors and warnings from the app.

## Boundaries

- **Always:**
  - Ordering in `order.js`, pure and tested.
  - Filters before display.
  - Validated prefs through `prefs.js`.
  - Ledger's `Header` and `SectionHeading` as they are.
  - Run the web and Python suites and the browser checks before committing.
- **Ask first:**
  - Putting the order in the URL.
  - Showing the control below 700px.
  - Changing the fallback rule or `TIE_ORDER`, which must change `rank.py` too.
  - Any Ledger change.
- **Never:**
  - Edit `content/` or the feed contract.
  - Mix curated and computed ranks in one edition.
  - Let a filter change an item's ranked position.
  - Add a dependency.

## Success criteria

1. The header shows Ranked | Grouped at ≥700px. Ranked is the default, and the
   choice survives a reload.
2. Ranked orders by `rank`. Editions without it get the fallback, which matches
   `rank.py`'s order for the same items.
3. Grouped shows one headed section per non-empty category in `CATEGORIES`
   order, with correct counts, under any filter.
4. Grid and list work in both modes. Empty states and the end card are unchanged.
5. One h1, then h2s (hidden in Ranked, section headings in Grouped), then h3 cards.
6. `npm test -w @aibytes/web`, `npm run build:web`, and the full Python suite
   pass, including the `TIE_ORDER` drift guard. The browser checks pass with a
   clean console.
7. Product spec §6 carries a dated amendment describing both orders and the default.

## Open questions

None. Resolved 2026-10-09: **the control is hidden below 700px.** The compact
header puts the brand and the tools on one row. At 375-390px, adding
Ranked | Grouped (about 145px) to the wordmark (~105px), the view toggle (62px),
the theme button (32px), the gaps (~34px), and the 40px of padding comes to
about 418px, which overflows. Phone readers get their stored order, Ranked by
default. A phone home for the control belongs to AIB-78z. The browser check at
375px confirms there is no overflow.
