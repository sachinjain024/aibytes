---
format: longclaw.ticket/v1
id: 8dad7707-e9b2-4e01-a7a0-6a5e3ba3267f
key: AIB-152a
title: Fix test_gists weekly build clock (fails on main)
status: in_progress
priority: p1
labels:
  - app
created_at: 2026-11-22T07:43:45.257Z
updated_at: 2026-11-22T07:43:45.257Z
---

tests/test_gists.py TestWeeklyBuild fails on main: WeeklyTree.build pins now=2026-11-16 but copies the real content/ tree, whose gists are created later (gh-app-store-compliance, 2026-11-19), so the build writes updated_at before created_at and validation rejects it. Every PR's unittest check fails.

Fix: default the weekly test clock to just after the newest timestamp in the copied tree.

## Checklist

- [ ] 1.1 WeeklyTree.build clock follows the copied content <!-- longclaw:item=ck_086ba899 -->
- [ ] 1.2 Full suite passes; PR merged <!-- longclaw:item=ck_b0d5fdbe -->

## Activity

<!-- longclaw:event
id: evt_ec19a49a
kind: create
occurred_at: 2026-11-22T07:43:45.257Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
-->
### Claude Code created this ticket
<!-- /longclaw:event -->
