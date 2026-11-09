---
format: longclaw.ticket/v1
id: 7ada940e-5fba-4d55-ae20-fc1b952eed16
key: AIB-141i
title: "List view: item descriptions wrap to at most two lines"
status: todo
priority: p2
labels:
  - app
type: feature
created_at: 2026-11-09T22:08:20.974Z
updated_at: 2026-11-09T22:10:06.338Z
---

In the List view, each item's description (summary) should wrap to at most two lines, then truncate with an ellipsis. Today it is cut to a single line.

## Now

- `packages/design-system/styles.css`: `.story-content .summary` is `white-space: nowrap; text-overflow: ellipsis; overflow: hidden`, so a list row's summary is always one line. The ≥560px container layout (`@container ldg-row`) puts it in grid row 2 beside the source and counts column.
- `components/components.css`: `.ldg-row__summary` is also nowrap plus ellipsis.
- `ListRow.prompt.md` defines the row as "two text lines: title over a one-line summary" and says "Both lines truncate with ellipsis".
- Grid cards already clamp to two lines (`.ldg-card__summary`, `-webkit-line-clamp: 2`), so the list would match them.

## Change

A Ledger change. The list-row summary wraps and clamps at two lines (`display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden`, plus the standard `line-clamp: 2`). The title stays one line. A short summary still takes one line, with no reserved empty second line.

Check that the counts column (≥560px) stays aligned to the summary's first line, and that the phone layout's third line (source and counts) sits under a two-line summary.

## Checklist

- [ ] Ledger: list-row summary clamps at 2 lines (.story-content .summary and .ldg-row__summary); title stays 1 line <!-- longclaw:item=ck_436d6dcc -->
- [ ] Test in tests/test_design_system.py: the list summary clamps at 2, the grid card summary is unchanged <!-- longclaw:item=ck_ab9dd1f8 -->
- [ ] ListRow.prompt.md, .d.ts if affected, and readme.md describe the two-line summary <!-- longclaw:item=ck_a7f53ded -->
- [ ] Checked in npm run dev:web at 1280 and 390px, both themes: long and short summaries, counts column aligned, no row jump on hover <!-- longclaw:item=ck_566379a2 -->
- [ ] UI kit list screens checked through npm run preview:design-system <!-- longclaw:item=ck_30b1b215 -->

## Activity

<!-- longclaw:event
id: evt_465eb90d
kind: create
occurred_at: 2026-11-09T22:08:20.974Z
actor:
  type: agent
  id: claude-code
-->
### claude-code created this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_fc822aea
kind: update
occurred_at: 2026-11-09T22:10:06.338Z
actor:
  type: agent
  id: claude-code
changes:
  - field: priority
    from: none
    to: p2
-->
### claude-code updated this ticket
<!-- /longclaw:event -->
