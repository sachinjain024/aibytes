---
format: longclaw.ticket/v1
id: f44fc719-84c5-46f9-a50b-fb008ccd83ef
key: AIB-137j
title: Finalise the image-generation provider for the issue banner
status: in_progress
priority: p1
labels:
  - marketing
type: chore
created_at: 2026-11-04T10:26:44.544Z
updated_at: 2026-11-06T07:10:15.130Z
---

Pick the tool that generates the issue banner image (the 16:9 illustration used as the Substack social image, like `newsletter/issues/2026/week-45-Issue-16/issue-16-banner.png`).

The style to match is in `docs/image-guide/`: the style guide PDF and the ChatGPT reference image (cream background, the orange-sweatshirt character on a winding road, rounded tool labels, confetti).

Try the same issue's prompt on each provider below, compare the results for style consistency, text rendering and effort per week, then record the choice and wire it into the thumbnail skill (AIB-134j item: update the generate-newsletter-content and thumbnail skills).

## Checklist

- [ ] OpenAI app <!-- longclaw:item=ck_1f0fea14 -->
- [ ] OpenAI CLI <!-- longclaw:item=ck_f9b9fe3c -->
- [ ] Claude CLI <!-- longclaw:item=ck_dc9fdc7d -->
- [ ] Grok CLI <!-- longclaw:item=ck_25035859 -->
- [ ] Gemini <!-- longclaw:item=ck_710de328 -->
- [ ] Record the chosen provider and update the thumbnail skill <!-- longclaw:item=ck_4c2f382b -->

## Activity

<!-- longclaw:event
id: evt_e8fcd2de
kind: create
occurred_at: 2026-11-04T10:26:44.544Z
actor:
  type: human
  id: local
-->
### You created this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_53d8e066
kind: update
occurred_at: 2026-11-06T07:10:06.688Z
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
id: evt_72a8ac83
kind: update
occurred_at: 2026-11-06T07:10:15.130Z
actor:
  type: human
  id: local
changes:
  - field: priority
    from: p2
    to: p1
-->
### You updated this ticket
<!-- /longclaw:event -->
