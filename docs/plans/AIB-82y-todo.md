# Task list: AIB-82y

Plan: `docs/plans/AIB-82y-plan.md`. Spec: `docs/specs/AIB-82y-card-width.md`.

## T1: 360px grid minimum beside the rail

**Description:** Change `.app-cols .app-grid` in `apps/web/src/app.css` from
`minmax(272px,1fr)` to `minmax(360px,1fr)`, as in the home prototype, and
rewrite the comment above `.app-shell--full` with the new arithmetic. Amend
the AIB-77u side-nav spec and §6 of the product spec so neither still says
272px is current.

**Acceptance criteria:**
- [ ] At ≥900px the grid computes to `repeat(auto-fill, minmax(360px, 1fr))`.
- [ ] At 1440×900: three columns of ~370px cards, matching the prototype.
- [ ] Columns match the spec: 1 at 900 and 1032, 2 at 1033 and 1280, 4 at 1920.
- [ ] Below 900px nothing changes. At 375px there is no horizontal scroll.
- [ ] `docs/specs/AIB-77u-app-side-nav.md` (grid row, success criterion 1,
      Open questions) and `docs/aibytes-app-product-spec.md` §6 carry a dated
      amendment pointing to the AIB-82y spec.

**Verification:**
- [ ] `npm run build:web`
- [ ] `npm test -w @aibytes/web`
- [ ] `npm run dev:web`, then measure `gridTemplateColumns` at 900, 1032,
      1033, 1280, 1440, 1920 and 375. Check 1440 and 375 in light and dark.

**Dependencies:** None.

**Files likely touched:**
- `apps/web/src/app.css`
- `docs/specs/AIB-77u-app-side-nav.md`
- `docs/aibytes-app-product-spec.md`
- `docs/specs/AIB-82y-card-width.md`, `docs/plans/AIB-82y-plan.md`, `docs/plans/AIB-82y-todo.md` (new)

**Estimated scope:** Small. One CSS value and its comment, plus two dated doc
notes. The three new files are this ticket's own spec and plan.

## Checkpoint: before merge

- [ ] Every T1 acceptance box is ticked, with the measured columns noted in the PR.
- [ ] `npm run build:web` and `npm test -w @aibytes/web` pass.
- [ ] `git grep -n 'minmax(272' -- apps docs/specs docs/aibytes-app-product-spec.md`
      finds 272px only in dated, superseded text.
- [ ] Reviewed by you, then merged to `main`. The AIB-82y checklist is ticked
      and the ticket closed.
