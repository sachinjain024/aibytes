---
format: longclaw.ticket/v1
id: 12e2e1b3-feb6-4eae-94a2-99a79d912c93
key: AIB-2
title: "Issue #4"
status: in_progress
priority: none
created_at: 2026-08-09T00:26:09.863Z
updated_at: 2026-08-09T00:26:09.863Z
---

- [x] Generate the Issue #4 Content

- [ ] Review the Intro section

- [x] Write a skill to generate 5 artifacts of LinkedIn post & X post

- [x] Organize them together in one directory

- [ ] Create an excel sheet to update the social links and their stats as well

- [ ] Store the Social Media posts as screenshots in the directory for direct consumption by Claude

- [ ] Update the last week’s social media posts in the excel

- [ ] Create this week’s social media posts

- [ ] Update the Links in the excel

## Activity

<!-- longclaw:event
id: evt_06ae81ba
kind: create
occurred_at: 2026-08-09T00:26:09.863Z
actor:
  type: human
  id: local
-->
### You created this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_f88b2d9a
kind: update
occurred_at: 2026-08-10T07:23:43Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
-->
### Added the generate-followup-social-content skill

Skill lives at `.claude/skills/generate-followup-social-content/`. First run
produced five LinkedIn variations and five X threads for issue #3 under
`newsletter/2026/week-32-Issue-3/social/`. Still open on this ticket: the
stats spreadsheet, the post screenshots, and the issue #4 content itself.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_276cf74f
kind: update
occurred_at: 2026-08-10T07:36:29Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
-->
### Generated issue #4

Fetched the week-33 snapshots for all four sources, then built
`newsletter/2026/week-33-Issue-4/` with the issue HTML and the Beehiiv export.
Intro still needs your review.
<!-- /longclaw:event -->
