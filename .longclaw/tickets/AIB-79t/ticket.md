---
format: longclaw.ticket/v1
id: 5b903bdf-0d42-4d01-b230-ef24d05f1d81
key: AIB-79t
title: Backfill rank into editions published before edition-rank
status: in_progress
priority: p1
labels:
  - app
type: chore
created_at: 2026-10-09T09:50:40.557Z
updated_at: 2026-10-09T14:16:45.540Z
---

Add `rank` to the editions published before the edition-rank change (AIB-77u, module `edition-rank`) merged. Split out of the edition-rank spec on 2026-10-09.

## Why

`rank` is all-or-none per edition and optional in the contract, so older editions stay valid without it, and the app falls back to signals for them. Backfilling gives every edition the same Ranked order. Today that means `2026-10-08` and `2026-10-09`, plus any edition the daily runner publishes from `main` before the edition-rank PR merges.

Blocked by the edition-rank module: `docs/specs/AIB-77u-edition-rank.md`.

## The route to decide

1. **A `curate.py rank --date D` subcommand.** It re-derives the day's drafts from the saved snapshots and link cache with no network, and checks the ids equal the published file's. It then writes only `rank` and leaves every other byte, including `generated_at` and `index.json`. It is new code with tests, and is reusable if the score is ever tuned.
2. **Re-run `build`** with each day's saved `newsletter/data/YYYY/MM/days/D/summaries.json`. No new code, but it rewrites `generated_at` (the app shows "updated N ago") and `index.json`, and it relies on the snapshots still producing the same items.

## Done when

- Every published edition carries `rank` `1..N`, computed by `packages/curate/aibytes_curate/rank.py`.
- The diff of each edition touches only what the chosen route says it touches.
- `python3 packages/feed-schema/validate.py` passes.
- Content lands as its own commit, apart from any tooling commit.

## Checklist

- [x] Choose the route: rank subcommand or re-run build <!-- longclaw:item=ck_e87f213b -->
- [x] T1 curate.py rank: offline, identity-checked, writes only rank <!-- longclaw:item=ck_d69f993c -->
- [x] T2 Backfill 2026-10-08 and 2026-10-09 (content-only commit) <!-- longclaw:item=ck_e077dd50 -->
- [ ] T3 Runner syncs main (ff-only) before it fetches <!-- longclaw:item=ck_05556f17 -->

## Activity

<!-- longclaw:event
id: evt_f9afc1b9
kind: create
occurred_at: 2026-10-09T09:50:40.557Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
-->
### Claude Code created this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_6f4b8b38
kind: update
occurred_at: 2026-10-09T12:59:14.799Z
actor:
  type: human
  id: local
changes:
  - field: status
    from: backlog
    to: todo
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_d3ad6a35
kind: update
occurred_at: 2026-10-09T12:59:16.626Z
actor:
  type: human
  id: local
changes:
  - field: priority
    from: p3
    to: p1
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_68ba69c2
kind: comment
occurred_at: 2026-10-09T13:03:04.104Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
-->
### Claude Code commented

Spec drafted: `docs/specs/AIB-79t-rank-backfill.md`, on branch `aib-79t-rank-backfill`. It recommends route 1 (a `curate.py rank` subcommand). With links taken from the cache only, the saved snapshots reproduce the published ids for both days (31/31 and 28/28). The runner iMac doesn't pull before it curates, so 2026-10-10 will probably publish without rank as well. The backfill should run after that edition lands. Awaiting review.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_04afc2ee
kind: update
occurred_at: 2026-10-09T14:04:49.022Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_e87f213b.checked
    from: "false"
    to: "true"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_d961f667
kind: update
occurred_at: 2026-10-09T14:04:49.048Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_d69f993c.text
    from: List every edition published before the edition-rank merge
    to: "T1 curate.py rank: offline, identity-checked, writes only rank"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_d5128c6b
kind: update
occurred_at: 2026-10-09T14:04:49.069Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_e077dd50.text
    from: Backfill, validate, and commit the content separately
    to: T2 Backfill 2026-10-08 and 2026-10-09 (content-only commit)
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_63681611
kind: update
occurred_at: 2026-10-09T14:04:49.088Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_05556f17.added
    to: T3 Runner syncs main (ff-only) before it fetches
-->
### Claude Code updated this ticket

Route 1 chosen. Plan: `docs/plans/AIB-79t-plan.md`; tasks: `docs/plans/AIB-79t-todo.md`. The spec now records the decisions: backfill today; the runner gains a `sync` step in this ticket; keep `rank`.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_9a6a4809
kind: update
occurred_at: 2026-10-09T14:05:57.113Z
actor:
  type: human
  id: local
changes:
  - field: status
    from: todo
    to: in_progress
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_e0eda4e0
kind: update
occurred_at: 2026-10-09T14:08:54.666Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_d69f993c.checked
    from: "false"
    to: "true"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_66804696
kind: comment
occurred_at: 2026-10-09T14:09:16.653Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
-->
### Claude Code commented

T1 is in PR #32: https://github.com/sachinjain024/aibytes/pull/32
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_391f4e45
kind: update
occurred_at: 2026-10-09T14:16:45.540Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_e077dd50.checked
    from: "false"
    to: "true"
-->
### Claude Code updated this ticket

T2: 2026-10-08 and 2026-10-09 carry rank (content-only commit). Found along the way: the app's fallback order (apps/web/src/order.js) uses file position for an item's standing within its source. The file is grouped by category, so Show HN posts (launches) rank above every HN thread. That moved 10 of 31 items on 2026-10-08, and the written ranks follow points as rank.py does. It only affects rank-less editions; follow-up suggested.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_4bbb1920
kind: comment
occurred_at: 2026-10-09T14:18:52.663Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
-->
### Claude Code commented

Follow-up filed: AIB-81i (the app's fallback order ranks Show HN above every HN thread).
<!-- /longclaw:event -->
