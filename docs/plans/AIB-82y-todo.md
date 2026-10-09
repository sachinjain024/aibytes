# Task list: AIB-82y

Plan: `docs/plans/AIB-82y-plan.md`. Spec: `docs/specs/AIB-82y-card-width.md`.

## T1: 360px grid minimum beside the rail

**Description:** Change `.app-cols .app-grid` in `apps/web/src/app.css` from
`minmax(272px,1fr)` to `minmax(360px,1fr)`, as in the home prototype, and
rewrite the comment above `.app-shell--full` with the new arithmetic. Amend
the AIB-77u side-nav spec and §6 of the product spec so neither still says
272px is current.

**Acceptance criteria:**
- [x] At ≥900px the grid computes to `repeat(auto-fill, minmax(360px, 1fr))`.
- [x] At 1440×900: three columns of ~370px cards, matching the prototype.
- [x] Columns match the spec: 1 at 900 and 1032, 2 at 1033 and 1280, 4 at 1920.
- [x] Below 900px nothing changes. At 375px there is no horizontal scroll.
- [x] `docs/specs/AIB-77u-app-side-nav.md` (grid row, success criterion 1,
      Open questions) and `docs/aibytes-app-product-spec.md` §6 carry a dated
      amendment pointing to the AIB-82y spec.

**Verification:**
- [x] `npm run build:web`
- [x] `npm test -w @aibytes/web`
- [x] `npm run dev:web`, then measure `gridTemplateColumns` at 900, 1032,
      1033, 1280, 1440, 1920 and 375. Look at the grid in light and dark.
      (Done: 1440 light, 900 dark, and the narrow layout dark at ~500px, the
      smallest window Chrome allowed. 375 was measured in a 375px frame. The
      change sets no colour, so the theme cannot change the columns.)

**Dependencies:** None.

**Files likely touched:**
- `apps/web/src/app.css`
- `docs/specs/AIB-77u-app-side-nav.md`
- `docs/aibytes-app-product-spec.md`
- `docs/specs/AIB-82y-card-width.md`, `docs/plans/AIB-82y-plan.md`, `docs/plans/AIB-82y-todo.md` (new)

**Measured 2026-10-09** (dev server, `gridTemplateColumns` beside the rail):
1 × 603px at 900, 1 × 735px at 1032, 2 × 360px at 1033, 2 × 484px at 1280,
3 × 360px at 1409, 3 × 370px at 1440, 4 × 360px at 1785, 4 × 394px at 1920.
At 375: 1 × 335px with no horizontal scroll. Checked visually at 1440 (light),
and at 900 and narrow (dark).

**Estimated scope:** Small. One CSS value and its comment, plus two dated doc
notes. The three new files are this ticket's own spec and plan.

## Checkpoint: before merge

- [x] Every T1 acceptance box is ticked, with the measured columns noted in the PR.
- [x] `npm run build:web` and `npm test -w @aibytes/web` pass.
- [x] `git grep -n 'minmax(272' -- apps docs/specs docs/aibytes-app-product-spec.md`
      finds 272px only in dated, superseded text.
- [x] Reviewed by you, then merged to `main`. The AIB-82y checklist is ticked
      and the ticket closed.
