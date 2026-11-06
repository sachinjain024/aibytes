---
format: longclaw.ticket/v1
id: abc5f550-9afd-4eea-b839-3a5cefeb7eb3
key: AIB-85v
title: Issue template supports a Beehiiv ad at the top
status: canceled
priority: p1
type: feature
created_at: 2026-10-10T23:38:45.208Z
updated_at: 2026-11-06T07:10:09.617Z
---

The issue layout looks broken when Beehiiv inserts an ad at the top of the email. The template should leave a clean slot for an ad above the content, so the masthead and intro still read as one piece whether or not an ad is there.

Files involved:
- `.claude/skills/generate-newsletter-content/assets/template.html`: the issue HTML
- `.claude/skills/generate-newsletter-content/assets/beehiiv-export-template.html`: the Part 1 / Part 2 paste export
- `.claude/skills/generate-newsletter-content/references/beehiiv-patterns.html`
- `.claude/skills/generate-newsletter-content/SKILL.md`: says where native Beehiiv blocks (subscribe form, ads, polls) go

What exactly breaks still needs pinning down. Reproduce it with a past issue in Beehiiv preview, then get a screenshot of the broken render from the publisher before changing anything.

This is a tooling change. If it lands while an issue is in progress, it ships on that issue's branch as its own commits.

## Checklist

- [ ] Reproduce the break: Beehiiv preview of a past issue with an ad at the top, plus a screenshot <!-- longclaw:item=ck_33e36f66 -->
- [ ] Propose layout variations for the ad slot as numbered options in an artifact <!-- longclaw:item=ck_2d3b61d0 -->
- [ ] Update template.html and beehiiv-export-template.html with the chosen layout <!-- longclaw:item=ck_b8fa1eb0 -->
- [ ] Update SKILL.md and beehiiv-patterns.html to say where the ad goes <!-- longclaw:item=ck_77d2d265 -->
- [ ] Record the decision in newsletter/artifacts/ <!-- longclaw:item=ck_d75f3c84 -->
- [ ] Verify in Beehiiv preview with and without an ad <!-- longclaw:item=ck_2924fe46 -->
- [ ] Test suite passes; commit and open a PR <!-- longclaw:item=ck_b283475f -->

## Activity

<!-- longclaw:event
id: evt_efef10ee
kind: create
occurred_at: 2026-10-10T23:38:45.208Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
-->
### Claude Code created this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_22b8682f
kind: update
occurred_at: 2026-11-06T07:10:09.617Z
actor:
  type: agent
  id: grok
changes:
  - field: status
    from: todo
    to: canceled
-->
### grok updated this ticket

Canceled: Beehiiv-only ad-slot issue. Newsletter has moved to Substack (AIB-134j), so this no longer applies.
<!-- /longclaw:event -->
