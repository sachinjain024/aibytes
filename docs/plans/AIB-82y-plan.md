# Implementation Plan: AIB-82y, grid card width beside the rail

Spec: `docs/specs/AIB-82y-card-width.md`.
Ticket: `.longclaw/tickets/AIB-82y/ticket.md`. Task list: `docs/plans/AIB-82y-todo.md`.
The ticket's four checklist items are T1's steps.

## Overview

One task, one PR, on branch `aib-82y-card-width`:

1. **T1** sets the grid minimum beside the rail to 360px and amends the two
   docs that record 272px as current. The spec, this plan and the task list
   ship in the same PR.

The change is a single CSS value and two doc notes. Splitting it further would
leave the docs disagreeing with the code between PRs.

## Architecture decisions (from the spec)

- **Match the prototype exactly:** `minmax(360px,1fr)` beside the rail, with no
  media query for 900–1032px. One column there is accepted (resolved
  2026-10-09).
- **Only `.app-cols .app-grid` changes.** The narrow `min(300px,100%)` guard,
  the padding, the rail and the breakpoint stay.
- **Docs are amended with a date, not rewritten.** The finished AIB-77u plan
  and task list keep their 272px text.

## Risks

| Risk | Mitigation |
|---|---|
| A single 735px card at 900–1032px reads badly | Accepted in the spec. If it does, a follow-up ticket, not this PR. |
| The card's star or ⋮ sits oddly on a very wide card | Check the card at 900 and 1024px in the browser. Note anything wrong on AIB-80n, which owns the card internals. |
| The comment's arithmetic drifts from the CSS again (as in AIB-77u T5) | Measure every width in the spec's table in the browser before ticking. |

## Verification checkpoint

The browser table in the spec's Testing strategy, plus `npm run build:web` and
`npm test -w @aibytes/web`. Then the PR is reviewed and merged to `main`.
