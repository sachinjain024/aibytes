# Implementation Plan: AIB-77u, home screen to prototype parity

Specs:
- `docs/specs/AIB-77u-capability-map.md`
- `docs/specs/AIB-77u-edition-rank.md`
- `docs/specs/AIB-77u-app-side-nav.md`
- `docs/specs/AIB-77u-app-feed-order.md`

Ticket: `.longclaw/tickets/AIB-77u/ticket.md`. Task list: `docs/plans/AIB-77u-todo.md`.
The AIB-77u checklist mirrors the tasks below, one item per task.

## Overview

Three modules, nine task PRs (one per task):

1. **`edition-rank`** writes an optional, all-or-none `rank` on every edition
   item at curation.
2. **`app-side-nav`** gives `apps/web` the prototype's left rail at 900px and up,
   keeping today's chips and edition bar below that.
3. **`app-feed-order`** adds the Ranked (default, remembered) and Grouped orders.

Nothing here changes a published file under `content/`; the backfill is AIB-79t.

## Dependency graph

```
T1 contract: rank in schema/validator/d.ts
 └─ T2 curate writes rank (rank.py, TIE_ORDER)
     └─ T7 order.js + drift guard ─┐
                                   ├─ T8 Ranked in the app ── T9 Grouped in the app
T3 Ledger SideNav fixes ─┐        │
T4 rail.js labels ───────┴─ T5 rail wired into App.jsx ──┘
```

- **T5 → T8 is a file dependency, not a logical one.** T5, T8, and T9 all edit
  `App.jsx`, so they run in that order to avoid three-way conflicts.
- **T3 and T4 are independent** of each other and of Phase 1, and can run in
  parallel with T1-T2.

## Architecture decisions (from the specs)

- **`rank` is optional in the schema but all-or-none per edition**, `1..N` over
  every item including hidden ones, so `hide.py` never renumbers. `schema_version`
  stays 1.
- **The score is mechanical** (`rank.py`): an item's standing within its own
  source, interleaved; ties break by `TIE_ORDER` (GitHub, HN, TechCrunch, PH).
  `TIE_ORDER` is separate from `adapters.ORDER`, which fixes the file's reading
  order and is left unchanged.
- **The app's fallback for rank-less editions is the same calculation** in
  `order.js`, applied to the whole edition before filtering. A Python test pins
  JS `TIE_ORDER` to the Python one.
- **One 900px switch:** the rail at ≥900px; chips and edition bar below. Never
  both, never neither.
- **Rail grid minimum is 272px** (not the UI kit's 360px): two columns at
  900px, four at 1440px. Corrected from 300px in T5; see the side-nav spec's
  Open questions.
- **Ledger gaps are fixed in the package** (date-list ARIA, footer overlap,
  landmark name), never restyled in `apps/web`.
- **Order preference** lives in local storage (`aibytes-order`), not the URL.
  The control is hidden below 700px.

## Task list

See `docs/plans/AIB-77u-todo.md` for acceptance criteria, verification, and files per task.

### Phase 1: edition-rank
- [x] T1 Contract: `rank` in the schema, validator, and `feed.d.ts`
- [x] T2 Curate writes `rank` at build

### Checkpoint 1
- [ ] Python suite and `validate.py` green
- [ ] A build into a temp content root writes ranks
- [ ] Published tree untouched
- [ ] T1 and T2 PRs merged

### Phase 2: app-side-nav
- [x] T3 Ledger `SideNav`: ARIA, footer overlap, landmark name
- [x] T4 `rail.js`: calendar-true date labels
- [x] T5 The rail in the app at ≥900px, plus the §6 amendment

### Checkpoint 2
- [ ] Web tests, the build, and the Python suite green
- [ ] Browser checks at 1440, 900, 899, and 390px
- [ ] T3-T5 PRs merged

### Phase 3: app-feed-order (needs T2 and T5 merged)
- [x] T7 `order.js` and the `TIE_ORDER` drift guard
- [ ] T8 Ranked: the order pref, the header control, ranked rendering
- [ ] T9 Grouped: section rendering, plus the §6 amendment

### Checkpoint 3: complete
- [ ] Every spec's success criteria met
- [ ] Browser checks for both modes × grid/list
- [ ] AIB-77u checklist all ticked
- [ ] T7-T9 PRs merged

(There is no T6. The side-nav browser pass lives in Checkpoint 2, so the
numbers keep their places in the ticket.)

## Branches and PRs

**One task, one PR** (decided 2026-10-09). Each task lands on `main` before the
next starts, so a checkpoint below spans several merged PRs rather than one.
Work happens in the normal checkout; there are no worktrees.

- **T1** ships from `aib-77u-home-side-nav`, together with the spec, ticket,
  and plan commits already on that branch.
- **Every later task** gets a fresh branch from an up-to-date `main`, named
  `aib-77u-t<N>-<slug>`.

The daily runner runs on a separate iMac, so the dev checkout's branch state
does not affect it.

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| A one-sided contract edit (schema vs `validate.py` vs `feed.d.ts`) | High | T1 changes all three in one commit; the parity tests in `test_feed_schema.py` fail otherwise |
| An edition published before the T2 PR merges has no `rank` | Low | Valid by contract; the app falls back to the same order; AIB-79t backfills |
| `App.jsx` conflicts across T5, T8, T9 | Low | One task per PR, each merged before the next branches from `main` |
| The 900px switch leaves zero or two navs during resize | Med | One `useMedia` boolean drives every branch; browser check at 899 and 900 |
| The header overflows at 375px | Med | The order control is not rendered below 700px; browser check at 375 |
| JS and Python tie orders drift | Low | Drift-guard test (T7) |
| Ledger edits break the Claude Design round-trip | Low | Edit only `.jsx`, `.d.ts`, `.prompt.md`, and `components.css`; never `_ds_*` or the card markers |

## Out of scope (tracked elsewhere)

- **AIB-79t:** backfill `rank` into the editions published before the T2 PR merges.
- **AIB-78z:** phone-width navigation, and a phone home for the order control.
- **AIB-75v:** saves, star, My Starred, sign-in.
- **The TOP-today marker:** deferred by decision.

## Open questions

None. The plan and the task list live in `docs/plans/` and ship with the T1 PR.
