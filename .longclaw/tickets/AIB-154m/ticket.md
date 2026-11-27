---
format: longclaw.ticket/v1
id: 46d3ddbb-7ad8-4e2b-944d-44f9b042ea76
key: AIB-154m
title: "Issue #20: 29 Nov 2026"
status: in_progress
priority: urgent
type: newsletter
due: 2026-11-29
created_at: 2026-11-27T11:17:21.774Z
updated_at: 2026-11-27T13:45:38.469Z
---

Weekly aiBytes_ Issue #20.

- Send date: Monday 30 Nov 2026 (ISO week 49)
- Branch named for this ticket → PR against `main`
- Source data: `newsletter/data/2026/11/weeks/week-48/` (ProductHunt, HackerNews, TechCrunch, GitHub, X)
- Output: `newsletter/issues/2026/week-49-Issue-20/` (issue HTML, Substack export, thumbnails)
- This issue introduces the aiBytes_ Chrome extension (AIB-76n) to readers.
- First step: import last week's web-signup subscribers into the Substack list (`packages/subscribers/subscribers.py export` → Substack import → `mark-imported`).

Checklist copied from Issue #19 (AIB-150f), plus the extension intro and the subscriber import.

## Checklist

- [x] Import last week's web-signup subscribers to the newsletter <!-- longclaw:item=ck_dd16d3d1 -->
- [x] Fetch weekly sources (ProductHunt, HackerNews, TechCrunch, GitHub) <!-- longclaw:item=ck_a011f2c1 -->
- [x] Shortlist X posts for Viral on X <!-- longclaw:item=ck_7562b0c5 -->
- [x] Decide whether to include the Official Announcements section from X <!-- longclaw:item=ck_c60caae6 -->
- [ ] Publish the weekly gists to main <!-- longclaw:item=ck_c75a9303 -->
- [ ] Generate Weekly Content <!-- longclaw:item=ck_ca22a30e -->
- [ ] Introduce the aiBytes_ Chrome extension to readers <!-- longclaw:item=ck_c713b7b3 -->
- [ ] Update the Content <!-- longclaw:item=ck_2e7b3558 -->
- [ ] Finalize Title & Description <!-- longclaw:item=ck_8849da2e -->
- [ ] Update Intro Content <!-- longclaw:item=ck_7bcaa60d -->
- [ ] Generate Thumbnail <!-- longclaw:item=ck_e6101235 -->
- [ ] Create the Substack draft <!-- longclaw:item=ck_cde571f8 -->
- [ ] Send the newsletter <!-- longclaw:item=ck_f2e095f3 -->
- [ ] Create the LC Tickets for AI Learning Backlog <!-- longclaw:item=ck_b86c3dc2 -->
- [ ] Commit the issue output and open a PR against main <!-- longclaw:item=ck_eee8103b -->

## Activity

<!-- longclaw:event
id: evt_d50dbf66
kind: create
occurred_at: 2026-11-27T11:17:21.774Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
-->
### Claude Code created this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_235484ef
kind: update
occurred_at: 2026-11-27T11:21:58.058Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_dd16d3d1.moved
    from: "12"
    to: "1"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_a367dea0
kind: update
occurred_at: 2026-11-27T11:22:04.934Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_dd16d3d1.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_231ef65b
kind: comment
occurred_at: 2026-11-27T11:22:50.322Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
-->
### Claude Code commented

Web-signup subscribers imported manually by the publisher (manual export + Substack import for now).
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_a6c91945
kind: update
occurred_at: 2026-11-27T11:23:38.022Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_a011f2c1.checked
    from: "false"
    to: "true"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_fde77bc0
kind: update
occurred_at: 2026-11-27T13:45:38.469Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_7562b0c5.checked
    from: "false"
    to: "true"
  - field: checklist.ck_c60caae6.checked
    from: "false"
    to: "true"
-->
### Claude Code updated this ticket

X picks from x_review.md (fetched with Grok CLI /proj-fetch-from-x). Viral on X: @shneural, @superalesha, @hwchase17, @antoniosarosi, @Google. Official Announcements: in, 4 posts (@ClaudeDevs ×2, @_mohansolo, @finkd).
<!-- /longclaw:event -->
