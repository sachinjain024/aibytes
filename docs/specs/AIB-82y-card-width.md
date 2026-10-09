# Spec: grid card width beside the rail (AIB-82y)

Status: **reviewed 2026-10-09; open question resolved (match the prototype).**
Ticket: `.longclaw/tickets/AIB-82y/ticket.md`. Amends the grid decision in
`docs/specs/AIB-77u-app-side-nav.md` (Open questions, resolved 2026-10-09).

## Objective

Make the grid cards beside the SideNav rail as wide as in the home-screen
prototype, `docs/ux/prototypes/aiBytes_app_home.html`. That is the screen
AIB-77u was built against.

- **Who sees it:** readers of aibytes.io at ≥900px, where the rail is shown.
- **Why:** at 1440px the app has four columns of ~274px cards, and the
  prototype has three of 370px. Wider cards give the title and summary their
  two lines at a comfortable measure. That was the prototype's intent, and
  272px traded it away to fit more columns.
- **What is already right:** the card's internal layout matches the prototype.
  That layout is image and upvotes on the left, then source, title and
  summary, with tags and ⋮ on the bottom row and the star top-right. The rail
  (241px rendered), the main padding (20px 28px), and the narrow layout are
  the same too. Only the grid minimum beside the rail differs.

### What changes

One CSS value, in `apps/web/src/app.css`:

```css
/* before */
.app-cols .app-grid{grid-template-columns:repeat(auto-fill,minmax(272px,1fr))}
/* after: the prototype's and the UI kit's minimum */
.app-cols .app-grid{grid-template-columns:repeat(auto-fill,minmax(360px,1fr))}
```

Beside the rail, the grid gets the viewport less 297px. That is the 241px rail
plus 56px of main padding. The gap is 16px. A column needs 360 + 16:

| Viewport | Grid width | Columns, 272px (today) | Columns, 360px (this spec) | Card width at 360px |
|---|---|---|---|---|
| 900 | 603 | 2 | **1** | 603 |
| 1024 | 727 | 2 | **1** | 727 |
| 1033 | 736 | 2 | 2 | 360 |
| 1280 | 983 | 3 | 2 | ~484 |
| 1440 | 1143 | 4 | 3 | ~370 (measured in the prototype) |
| 1920 | 1623 | 5 | 4 | ~394 |

A second column appears at 1033px: 297 + 2×360 + 16. A third at 1409px, a
fourth at 1785px.

### The trade-off this accepts

From 900px to 1032px the feed is **one column**, up to 735px wide, beside the
rail. AIB-77u chose 272px to avoid exactly this. The prototype behaves the same
way, and this spec follows the prototype. If a single wide card at 900–1032px
proves wrong in the browser, see Open questions.

### Out of scope

- The card's internals: tags, the ⋮ menu, and upvote placement are AIB-80n,
  which is parked.
- The narrow layout below 900px: it stays `minmax(min(300px,100%),1fr)`. The
  prototype's bare `300px` would overflow at 375px.
- A maximum card width, or any change to the rail, padding, or breakpoint.
- The Ledger `Card` component and the design-system bundle. The UI kit already
  uses 360px (`packages/design-system/ui_kits/aibytes-app/app.css:22`).

## Tech stack

`apps/web`: Vite + React 18, plain CSS in `apps/web/src/app.css`, and Ledger
tokens from `@aibytes/design-system`. No new dependencies.

## Commands

```bash
npm run dev:web                 # http://localhost:5173/
npm run build:web               # must build clean
npm test -w @aibytes/web        # node --test: must stay green (no CSS under test)
```

## Project structure: files touched

```
apps/web/src/app.css                  360px minimum; the comment above .app-shell--full rewritten
docs/specs/AIB-77u-app-side-nav.md    dated amendment: the grid row, success criterion 1, Open questions
docs/aibytes-app-product-spec.md      §6 Grid bullet: 360px, one column until 1033px
```

`docs/plans/AIB-77u-plan.md` and `-todo.md` are the record of finished work.
They keep their 272px text.

## Code style

`app.css` is one rule per line, with a comment that explains the arithmetic
behind any number. Keep that habit. The replacement comment should read
something like:

```css
/* At >=900px the SideNav rail replaces the chips and the edition bar: a
   full-bleed shell, the rail pinned left, the feed beside it. From the UI kit's
   side-nav layout, grid minimum included: 360px, as in the home prototype
   (AIB-82y). The rail is 241px wide (216 + padding + border, content-box), so
   the grid gets the viewport less 297px: one column until 1033px, two from
   there, three from 1409px (370px cards at 1440px). */
```

Spec amendments are dated and point here, not silent rewrites. For example:
*"Amended 2026-10-09 by AIB-82y: 360px, matching the prototype; see
`docs/specs/AIB-82y-card-width.md`."*

## Testing strategy

There is no automated CSS test in `apps/web`, and this change does not add one.
Verification is in the browser, measured with `getComputedStyle(grid).gridTemplateColumns`
on the dev server:

| Viewport | Expected columns | Expected card width |
|---|---|---|
| 900 | 1 | 603px |
| 1032 | 1 | 735px |
| 1033 | 2 | 360px |
| 1280 | 2 | ~484px |
| 1440 | 3 | ~370px, matching the prototype at the same width |
| 1920 | 4 | ~394px |
| 375 | 1 (narrow layout, unchanged) | no horizontal scroll |

Also check light and dark at 1440 and 375 (a layout change, so the themes should
match), and that `npm test -w @aibytes/web` and `npm run build:web` pass.

## Boundaries

- **Always:** keep the narrow `min(300px,100%)` guard and `.app-grid>*{min-width:0}`.
  Amend the AIB-77u spec and the product spec in the same PR as the CSS.
  Ship it as one PR to `main` from its own branch (`aib-82y-card-width`).
- **Ask first:** any extra rule to soften the 900–1032px single column, such as
  a different minimum, a max card width, or a breakpoint. Also any change
  outside `app.css` and the two docs.
- **Never:** touch the Ledger `Card` or `components.css`, or hand-edit the
  design-system bundle. Never restyle a component from `app.css`. Never fold
  AIB-80n work into this PR.

## Success criteria

1. At ≥900px, `.app-cols .app-grid` computes to `repeat(auto-fill, minmax(360px, 1fr))`.
2. At 1440×900 the app shows three columns of ~370px cards, the same as the
   prototype at the same size.
3. Columns at 900, 1032, 1033, 1280 and 1920 match the table above.
4. Below 900px nothing changes. At 375px there is no horizontal scroll.
5. The two docs no longer say 272px is current. Each carries a dated amendment
   pointing to this spec.
6. `npm run build:web` and `npm test -w @aibytes/web` pass.

## Assumptions

1. "Match the prototype" means the prototype's 360px minimum as written. That
   includes the single column from 900px to 1032px.
2. The prototype's main padding (20px 28px) already matches. The app's extra
   60px bottom padding comes from moving the footer margin, and it stays.
3. No max card width: the prototype has none. At one column, a card can reach
   735px.

## Open questions

None. Resolved 2026-10-09: a single column at 900–1032px is acceptable. Match
the prototype as it is, with no media query to keep 272px in that range.
