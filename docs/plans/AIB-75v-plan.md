# Implementation Plan: AIB-75v, module 1 `ledger-saves-ui`

Spec: `docs/specs/AIB-75v-ledger-saves-ui.md`. Map:
`docs/specs/AIB-75v-capability-map.md`. Ticket:
`.longclaw/tickets/AIB-75v/ticket.md`. Task list: `docs/plans/AIB-75v-todo.md`.

This plan covers the first module only. Modules 2 to 4 (`app-local-saves`,
`app-saved-view`, `app-accounts`) get their own spec and are added to this plan
and task list when their spec is approved.

## Overview

Five tasks on one branch, `aib-75v-ledger-saves-ui`, from an up-to-date
`main`: one commit per task, each passing the full check list, in one PR that
is squash-merged to `main` when the module is done:

1. **T1 `starPos`** on `FeedItem` / `Card` / `ListRow`
2. **T2 the Saved entry** in `Sidebar`
3. **T3 Sign in and the account menu** in `AppHeader`
4. **T4 the sticky `SaveBanner`** and the `--redesign-top` offset
5. **T5 the UI kit screens** and the readme

Every task adds optional props with today's output as the default, so each
commit leaves aibytes.io unchanged and is useful on its own: the option
exists, is typed, is documented, and is tested. Any commit is a clean point to
revert to inside the PR; the squash gives `main` one commit for the module.

## Dependency graph

```
T1 starPos ─────────┐
T2 Sidebar Saved ───┤
T3 AppHeader auth ──┼──> T5 UI kit screens 12-14, kit README, readme.md
T4 sticky banner ───┘
```

T1 to T4 touch separate components and could land in any order; they are
listed smallest and least risky first. T4 is the only one that changes a
shared layout rule (the top offset every sticky and fixed piece reads), so it
goes after the self-contained ones. T5 needs all four, because its screens
show them together.

## Architecture decisions (from the spec)

- **Off unless passed.** Each task's first test pins today's markup for the
  component with none of the new props, taken from `main` before the change.
- **The shell stays in Ledger.** `apps/web` is not touched by any task here;
  `tests/test_design_system.py` already fails if the app draws shell markup.
- **`--redesign-header` stays the masthead's height.** T4 adds
  `--redesign-banner` (set by the sticky banner on the root while mounted)
  and `--redesign-top`, their sum. Everything that clears the top bar moves to
  `--redesign-top`; `ToolbarTests` follow.
- **The account menu reuses `CardMenu`'s popover** classes and dismissal, so
  there is one popover pattern in Ledger.
- **No new colour token.** New pairs are added to `tokens/contrast.test.js`.
- **The avatar photo loads with `referrerpolicy="no-referrer"`** and falls
  back to the initial on error for the rest of the session.

## Risks

| Risk | Mitigation |
|---|---|
| T4's offset breaks the sticky toolbar, rail or drawer at some width | `--redesign-banner` defaults to `0px`, so with no banner every offset equals today's. Check 1280, 900 and 390px with and without the banner, and on dismissal, in both themes. |
| Two sticky siblings (masthead, banner) stack wrongly, or the banner slides under the rail | Python tests pin the z-index order masthead 40 > banner 38 > rail 35 > toolbar 30 and the banner's `top`. |
| `ResizeObserver` writes to the root on every resize and causes jank | Write only when the rounded height changes; remove the property on unmount. |
| The "unchanged markup" snapshot drifts with an unrelated change on `main` | Take the snapshot in each task's first commit, from that task's starting point, and keep it in the component's own test file. |
| Google's photo host refuses the image, leaving a broken avatar | `referrerpolicy="no-referrer"` plus `onError` swapping to the initial; checked in the preview with a bad URL. |
| `_ds_bundle.js` falls further behind the sources | Not edited, per the spec. The preview server compiles a fresh bundle, so the kit screens are checked through `npm run preview:design-system`. |

## Verification checkpoint (every task)

```bash
npm test -w @aibytes/design-system
npm test -w @aibytes/web
npm run build:web
python3 -m unittest discover -s tests -p test_design_system.py
git diff --check
```

plus the task's browser checks in `npm run preview:design-system`. Then the
task is committed, its boxes are ticked in the task list in the same commit,
and the branch is pushed. When T5 is committed the PR is ready for review;
once it is squash-merged, the ticket's `ledger-saves-ui … (PR merged)` item is
ticked and module 2's spec starts.
