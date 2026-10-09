---
format: longclaw.ticket/v1
id: 5fc80045-d463-4c4e-bd2a-394f856db385
key: AIB-81i
title: App fallback order ranks Show HN above every HN thread
status: backlog
priority: p3
labels:
  - app
type: bug
created_at: 2026-10-09T14:18:45.846Z
updated_at: 2026-10-09T14:18:45.846Z
---

The app's fallback order for editions without `rank` places Show HN posts above every Hacker News thread, whatever their points. Found during AIB-79t T2 (PR #33).

## The bug

In `apps/web/src/order.js`, `fallbackOrder` mirrors `rank.py`, except that it uses an item's position in the file as its standing within its source, standing in for the fetcher's rank. That only holds when a source's items sit in fetch order in the file. They don't:
- The file is grouped by category.
- A Show HN item is `source: hackernews` but `category: launches`, so it comes before every HN thread.
- The fallback therefore ranks Show HN first in the Hacker News group.

On 2026-10-08, before the backfill, this put two Show HN posts (57 and 55 points) above threads with 841 and 603, and moved 10 of 31 items compared with curate's ranks. 2026-10-09 had no Show HN and matched 28/28, which is why the earlier parity check missed it.

## Impact

Low today: since AIB-79t every published edition carries `rank`, and the fallback runs only for an edition without it. That would be one curated on old code, or a third-party copy of the data.

## Fix to decide

1. **Sort each source group by its signal** before taking positions: HN by `points`, PH by `upvotes`, GitHub by `stars_gained`. For TechCrunch, which has no signals, keep file position, which is fetch order within `news`. This reproduces `rank.py` from the published fields.
2. **Keep file position, but within source and category order:** simpler, but still wrong across categories.

## Done when

- `rankedItems` on a rank-less copy of `2026-10-08` and `2026-10-09` equals the order from their written ranks (31/31, 28/28).
- An `order.test.js` case with a Show HN post that has fewer points than an HN thread.
- The `TIE_ORDER` drift guard still passes.

## Checklist

- [ ] Choose the fix: sort by signal, or position within source <!-- longclaw:item=ck_4c5e998d -->
- [ ] Fix fallbackOrder and add the Show HN test <!-- longclaw:item=ck_4c008ec4 -->
- [ ] Check parity on rank-less copies of 2026-10-08 and 2026-10-09 <!-- longclaw:item=ck_3abc41d2 -->

## Activity

<!-- longclaw:event
id: evt_975b57fc
kind: create
occurred_at: 2026-10-09T14:18:45.846Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
-->
### Claude Code created this ticket
<!-- /longclaw:event -->
