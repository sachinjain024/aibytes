---
format: longclaw.ticket/v1
id: 5b903bdf-0d42-4d01-b230-ef24d05f1d81
key: AIB-79t
title: Backfill rank into editions published before edition-rank
status: todo
priority: p1
labels:
  - app
type: chore
created_at: 2026-10-09T09:50:40.557Z
updated_at: 2026-10-09T12:59:16.626Z
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

- [ ] Choose the route: rank subcommand or re-run build <!-- longclaw:item=ck_e87f213b -->
- [ ] List every edition published before the edition-rank merge <!-- longclaw:item=ck_d69f993c -->
- [ ] Backfill, validate, and commit the content separately <!-- longclaw:item=ck_e077dd50 -->

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
