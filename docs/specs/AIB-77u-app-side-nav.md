# Spec: app-side-nav (AIB-77u, module 2 of 3)

Status: **reviewed 2026-10-09; open questions resolved.** Map: `docs/specs/AIB-77u-capability-map.md`.
Ticket: `.longclaw/tickets/AIB-77u/ticket.md`. Prototype:
`docs/ux/prototypes/aiBytes_app_home.html` (tweak default "Side nav").

## Objective

At 900px and wider, the aibytes.io edition page uses the prototype's
**side-nav layout**. A left rail carries the edition's date, paging, the date
list, and the categories. The header loses its category chips, the edition bar
goes away, and the page goes full-bleed with a denser grid. Below 900px the
page is exactly what ships today: header chips plus the edition bar. A better
phone pattern is AIB-78z.

The reader is a developer opening the daily edition on a laptop or desktop.
Success means they can see which day they are on, step back, jump to the
latest, pick any date, and switch category from one fixed place, with more
cards above the fold than today.

**Out of scope:**
- Ranked/Grouped order and section headings (`app-feed-order`)
- `rank` (`edition-rank`)
- Saves, the star, My Starred, sign-in (AIB-75v)
- The TOP marker
- Phone-width redesign (AIB-78z)

Decided on 2026-10-09:
- side nav at ≥900px, with today's chips and bar below;
- calendar-true "Today"/"Yesterday";
- the item count and "updated ago" dropped from the rail, as in the prototype;
- "Latest →" as the forward link;
- Ledger's two SideNav flaws fixed in this module.

## Behaviour

### Breakpoint

`const wide = useMedia("(min-width: 900px)")`, in the same hook the phone
breakpoint uses. It is one switch, so every width has exactly one category
control and one date pager:

| | `< 900px` (unchanged) | `≥ 900px` |
|---|---|---|
| Header category chips | shown | hidden (`showCategories={false}`) |
| Edition bar + its calendar popover | shown | not rendered |
| `SideNav` rail | not rendered | rendered, left, 216px, sticky |
| Shell | centred, `--content-max` | full-bleed (`app-shell--full`) |
| Grid | `minmax(min(300px,100%),1fr)`, padding 20px | `minmax(360px,1fr)`, padding 20px 28px (272px until AIB-82y; see Open questions) |

The rail is not rendered below 900px, rather than relying on Ledger's
`display:none`, so a hidden rail never holds focusable controls.

### Rail date block

The words are calendar-true, compared with the **reader's local date**. An
edition date is a calendar day; `format.js` already formats it in UTC to stay on
that day.

| Situation | `dateMain` | `dateNote` | `dateSub` | `prevLabel` | `nextLabel` |
|---|---|---|---|---|---|
| Viewing the latest, dated today | `Today` | `(Fri, Oct 9)` | — | `Yesterday` if the older edition is the day before, else its short date (`Oct 7`) | — |
| Viewing the latest, not dated today (before 13:30 IST, or a missed day) | `Oct 8` | — | `Thu, Oct 8 · 1 day ago` | the older edition's short date, or `Yesterday` per the same rule relative to *today* | — |
| Viewing an older edition | `Oct 7` | — | `Wed, Oct 7 · 2 days ago` | the older edition's short date (`Yesterday` per the rule) | `Latest` |
| Oldest edition | as above | | | — | `Latest` |

- `N days ago` counts calendar days from the reader's today (`1 day ago`,
  `2 days ago`). An edition dated in the reader's future, which a time-zone
  edge can produce, reads as `Today`.
- **"Yesterday" is relative to the reader's today**, never to the edition being
  viewed. On an older edition, the back link uses the short date unless that
  older edition is literally yesterday.
- **← (prev)** steps to the next older edition (`olderEdition`). **Latest →**
  navigates to `/`. Both keep the current query string (filters travel with
  the edition, as the edition bar does today).
- **Pick a date ▾** toggles the inline list of every edition in `index.json`,
  newest first: label `midDate` (`Wed, Oct 7`), count `total`, the current one
  marked. Picking one navigates (query kept) and closes the list, and focus
  returns to the Pick a date toggle (the `useReturnFocus` pattern). Escape
  closes the list while focus is inside the rail. The list scrolls inside the
  rail (Ledger caps it at 240px).
- No item count or "updated N ago" in the rail.

### Rail categories

- **All** plus the four categories from `filters.js` `CATEGORIES`, with counts
  of **visible** items (hidden skipped). **All** shows the edition's visible
  total; today's All chip shows none.
- The active row is `filters.category`; clicking sets it through the URL
  (`?c=`), exactly as the chips do.
- **Until the edition and `tags.json` have settled**, the rows render without
  counts and clicks are ignored. This is the same guard as `filterable` today,
  so an early click can never rewrite the URL and drop its `t=` tags.
- No Library / My Starred section: `onSaved` is not passed and `savedCount` is
  0, so Ledger omits it. AIB-75v adds it.

### States

- **Index loading or failed, not-found route, or a date with no edition:** at
  ≥900px the rail still renders, with categories but no date block, so the
  layout does not jump when data arrives. The main column shows today's
  messages unchanged.
- **Filtered empty state, end card, list view, Tags/Sources popovers:**
  unchanged. The popovers anchor `right:20px` under `app-shell--full`, as in the
  UI kit.

### Page structure and accessibility

- **The h1.** Today the edition bar's date is the h1. With no edition bar at
  ≥900px, `main` gets a visually hidden h1 with the long date
  (`Fri, Oct 9, 2026`) so the outline stays h1 → h2 → h3. Below 900px the
  edition bar keeps it, so there is exactly one h1 at every width.
- The skip link still targets `#main`. The rail sits between the header and
  `main` in tab order.
- The rail is an `aside`. Ledger labels it "Categories", although it also holds
  the date. The Ledger fix (below) renames it "Edition and categories".
- Every control is a `button` or a link, with a visible 2px focus ring, as in Ledger.
- `--ldg-header-h` is set on the shell from the sticky cluster's measured
  height (a `ResizeObserver`, as the UI kit does), so the rail sticks exactly
  under the header.

### Ledger fixes (in `packages/design-system`, own commit)

1. **Date list ARIA.** `SideNav` renders the list as `role="listbox"` with
   `button` children, which is invalid. Make it a plain group: drop `role` and
   keep `aria-label="Editions"`. Mark the current edition `aria-current="date"`,
   not `true`. Update `SideNav.d.ts` and `SideNav.prompt.md` in step, per the
   design-system rule.
2. **Footer overlap.** `.ldg-sidenav` is `height:calc(100vh - var(--ldg-header-h))`,
   but the app's footer is sticky at the bottom, so it covers the rail's last
   ~57px. Subtract an optional `--ldg-footer-h` (default `0px`) in
   `components.css`; the app sets it from the footer's measured height, as it
   does for the header.
3. **Landmark name.** `aria-label="Edition and categories"` on the `aside`.

None of these changes the rail's look. The Claude Design round-trip files
(`_ds_bundle.js`, `_ds_manifest.json`, card markers) are not hand-edited.

## Where it lands

```
apps/web/src/App.jsx          wide switch; SideNav; hidden h1; --ldg-header-h / --ldg-footer-h
apps/web/src/rail.js          NEW pure function: rail labels from (ref, editions, today)
apps/web/src/rail.test.js     NEW node --test for every row of the date-block table
apps/web/src/app.css          side-nav layout rules from the UI kit (.app-shell--full, .app-cols)
packages/design-system/components/navigation/SideNav.jsx       ARIA + landmark fixes
packages/design-system/components/navigation/SideNav.d.ts      in step
packages/design-system/components/navigation/SideNav.prompt.md in step
packages/design-system/components/components.css               --ldg-footer-h
docs/aibytes-app-product-spec.md   §6 dated amendment: side nav ≥900px, chips + bar below
```

`app.css` takes its new rules from `packages/design-system/ui_kits/aibytes-app/app.css`,
with one deliberate difference: the grid minimum beside the rail is 272px, not
the UI kit's 360px. *Amended 2026-10-09 by AIB-82y: 360px, matching the UI kit
and the prototype, so there is no longer a difference.*
That keeps the file's own rule: screen layout only, never restyling a component.

## Commands

```bash
npm run dev:web                       # http://localhost:5173/
npm test -w @aibytes/web              # node --test, incl. rail.test.js
npm run build:web                     # static build still succeeds
npm run preview:design-system         # Ledger cards incl. sidenav.card.html still render
AIBYTES_SKIP_LIVE=1 python3 -m unittest tests.test_design_system -v
AIBYTES_SKIP_LIVE=1 python3 -m unittest discover -s tests -v   # full suite before commit
```

## Code style

React 18 function components, Ledger components imported by path, and pure
helpers in their own module so `node --test` covers them without a browser.
Comments say why. In the idiom of `route.js`/`format.js`:

```js
// The rail's date block (spec AIB-77u app-side-nav). "Today" and "Yesterday"
// are calendar-true for the reader: the latest edition is only Today once the
// day's run has published it. Pure, so node --test covers every row.
import { midDate, shortDate } from "./format.js";
import { olderEdition } from "./route.js";

export function railDate(ref, editions, today) {
  const latest = editions[0] && editions[0].date === ref.date;
  const older = olderEdition(editions, ref.date);
  const days = daysBetween(ref.date, today);
  return {
    dateMain: days <= 0 ? "Today" : shortDate(ref.date),
    dateNote: days <= 0 ? `(${midDate(ref.date)})` : undefined,
    dateSub: days > 0 ? `${midDate(ref.date)} · ${days} day${days === 1 ? "" : "s"} ago` : undefined,
    prevLabel: older && (daysBetween(older.date, today) === 1 ? "Yesterday" : shortDate(older.date)),
    nextLabel: latest ? undefined : "Latest",
  };
}
```

`today` is the reader's local date as `YYYY-MM-DD`, passed in rather than read
inside, so the tests pin it. `daysBetween(a, b)` is a small helper in the same
module: whole calendar days from `a` to `b`, both `YYYY-MM-DD`, computed in UTC.

## Testing strategy

**Unit (`node --test`, `apps/web/src/rail.test.js`):**
- Every row of the date-block table.
- Latest dated today, with the older edition yesterday → `Today (Fri, Oct 9)`,
  `← Yesterday`, no next.
- Latest dated today, older edition two days back → `← Oct 7`.
- Latest dated yesterday (before the run) → `Oct 8`, `Thu, Oct 8 · 1 day ago`, no next.
- An older edition → `Latest` next; the back link reads `Yesterday` only when
  that edition is the reader's yesterday.
- The oldest edition → no prev.
- An edition dated after the reader's today → `Today`.
- `1 day ago` vs `2 days ago`.
- A month boundary and a year boundary.

**Design system (`tests/test_design_system.py`):** the existing suite passes.
Add a check that `SideNav.jsx` no longer contains `role="listbox"`, if the
suite's pattern allows it.

**In a real browser** (Claude in Chrome; `localhost:5173`; the prototype served
locally for comparison). The checks:

1. **1440px:**
   - The rail, no chips, no edition bar.
   - 4 grid columns (2 at 900px); full-bleed header and footer.
   - The rail sticks under the header while scrolling; its last row is not
     under the footer.
2. **900px and 899px:**
   - It switches cleanly, with exactly one category control and one pager.
   - No horizontal scroll at either.
3. **390px:** identical to today's phone layout.
4. **Paging:** ← steps back; Latest → returns to `/`; Pick a date opens,
   picking navigates, and focus returns to the toggle; Escape closes it.
5. **Filters:** Rail category clicks set `?c=`. Filters survive paging. A
   `?t=` link is not rewritten before `tags.json` loads (throttle the network).
6. **Keyboard:** skip link, then header, then rail, then main; the focus ring
   is visible on every rail control.
7. **Structure:** the accessibility tree shows one h1 at 1440px and at 390px,
   and the `aside` is named "Edition and categories".
8. **Theme:** light and dark both match the prototype's palette.
9. **Console:** zero errors and warnings from the app.

## Boundaries

- **Always:**
  - Take layout values from the UI kit's `app.css` and Ledger tokens.
  - Fix Ledger gaps in the package, never by restyling it in `apps/web`.
  - Update `.jsx`, `.d.ts`, and `.prompt.md` together.
  - Keep filters in the URL.
  - Run `npm test -w @aibytes/web`, the Python suite, and the browser checks before committing.
- **Ask first:**
  - Any change to the 900px breakpoint.
  - Showing the rail below 900px.
  - New Ledger props or visual changes beyond the three fixes.
  - Touching `content/` or the feed contract.
- **Never:**
  - Hand-edit `_ds_bundle.js`, `_ds_manifest.json`, or the card markers.
  - Add saves or sign-in UI (AIB-75v).
  - Change the phone layout beyond keeping it working (AIB-78z).
  - Add a dependency.

## Success criteria

1. At ≥900px: the rail (date block per the table, categories with visible
   counts including All), no header chips, no edition bar, full-bleed shell, a
   `minmax(272px,1fr)` grid with 20px/28px padding: two columns at 900px, four at 1440px.
   *Superseded by AIB-82y: `minmax(360px,1fr)`, one column at 900px, three at 1440px.*
2. At <900px: pixel-for-pixel today's layout and behaviour.
3. "Today", "Yesterday", and "N days ago" are calendar-true for the reader, and
   `rail.test.js` covers every row of the table.
4. ← steps one edition older, Latest → goes to `/`, and Pick a date lists every
   edition with counts. All three keep the query string. Focus returns to the
   toggle after a pick.
5. Exactly one h1 at every width. The date list has valid ARIA. The rail is
   never covered by the footer.
6. `npm test -w @aibytes/web`, `npm run build:web`, and the full Python suite
   pass. The browser checks above pass with a clean console.
7. Product spec §6 carries a dated amendment describing the layout split.

## Open questions

None. Resolved 2026-10-09: the grid minimum beside the rail is **272px**, not
the prototype's 360px.

*Amended 2026-10-09 by AIB-82y: the minimum is now **360px**, matching the
prototype, with one column from 900px to 1032px accepted. The reasoning below is
kept as the record of the 272px choice. See `docs/specs/AIB-82y-card-width.md`.*

The rail renders **241px** wide: 216px plus 24px padding plus a 1px border,
because Ledger is content-box throughout. Main's padding is 56px, so the grid
gets the viewport less 297px, with a 16px gap.

- **900px:** 603px. Two columns need a minimum of at most (603 − 16) / 2 = 293px.
- **1440px:** 1143px. Four columns need at most (1143 − 48) / 4 = 273px.
- So **272px** gives both: two columns from 857px (always, beside the rail) and
  four from 1433px.

*Corrected during T5.* This section first chose 300px on arithmetic that
counted the rail as 217px and claimed 1167 ≥ 4×300 + 3×16 = 1248, which is
false. Measured in the browser, 300px gave one column at 900px and three at
1440px.
