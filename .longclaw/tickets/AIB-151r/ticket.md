---
format: longclaw.ticket/v1
id: c5ca2eca-4954-4784-b79a-71e470d656e3
key: AIB-151r
title: "Newsletter: publish the weekly gists before the issue"
status: in_review
priority: p1
labels:
  - app
created_at: 2026-11-22T05:09:03.834Z
updated_at: 2026-11-22T05:13:58.079Z
---

Publish a weekly issue's gists to aibytes.io before the newsletter goes out.

Issue 19 went out on Substack while its 32 gist links still 404'd: the gists
rode in the issue PR, which merged after the send. Pages builds from main only,
so the gists have to reach main as soon as the issue's rows are chosen.

- New `generate-newsletter-content/scripts/publish_gists.py`: builds the issue's
  gists on a fresh origin/main in a temporary worktree, opens a gists-only PR,
  squash-merges it (the push deploys Pages), optionally waits for the pages,
  and syncs the issue branch.
- generate-newsletter-content step 3, CLAUDE.md git workflow and the gists rule
  updated for the gists-first order.

## Checklist

- [x] 1.1 publish_gists.py: build on fresh main, gists-only PR, squash-merge, wait, sync <!-- longclaw:item=ck_974853cc -->
- [x] 1.2 tests/test_publish_gists.py <!-- longclaw:item=ck_ca2634d6 -->
- [x] 1.3 generate-newsletter-content SKILL.md: gists-first step <!-- longclaw:item=ck_bbe8a219 -->
- [x] 1.4 CLAUDE.md git workflow + .claude/rules/gists.md <!-- longclaw:item=ck_9478676b -->
- [x] 1.5 Full suite passes; PR <!-- longclaw:item=ck_e8073a7d -->

## Activity

<!-- longclaw:event
id: evt_84cb634b
kind: create
occurred_at: 2026-11-22T05:09:03.834Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
-->
### Claude Code created this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_2d80ebc4
kind: update
occurred_at: 2026-11-22T05:13:58.079Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: status
    from: in_progress
    to: in_review
  - field: checklist.ck_974853cc.checked
    from: "false"
    to: "true"
  - field: checklist.ck_ca2634d6.checked
    from: "false"
    to: "true"
  - field: checklist.ck_bbe8a219.checked
    from: "false"
    to: "true"
  - field: checklist.ck_9478676b.checked
    from: "false"
    to: "true"
  - field: checklist.ck_e8073a7d.checked
    from: "false"
    to: "true"
-->
### Claude Code updated this ticket

publish_gists.py + 14 tests; dry run on Issue 19 against fresh main reports nothing to publish (its gists are live). Suite: 728 run, 2 known test_gists errors also on main (fixed 2026-11-11 clock vs real content/gists).
<!-- /longclaw:event -->
