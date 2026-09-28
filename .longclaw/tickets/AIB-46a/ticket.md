---
format: longclaw.ticket/v1
id: d342e89b-9e26-450b-b42f-7be4526a1e67
key: AIB-46a
title: Merge X announcements and viral posts into one section
status: todo
priority: p2
type: feature
created_at: 2026-09-26T17:17:04.191Z
updated_at: 2026-09-26T17:17:04.191Z
---

The X data currently feeds two sections: Official Announcements (the company launch posts, as a card) and Loudest on X (the most-engaged posts). For Issue #11 (AIB-40i) we dropped the announcements card and renamed Loudest on X to "Viral on X". The next step is to combine both into one X section that carries the week's launches and the viral posts together.

Decide where the change goes:
- the Grok prompt (x-fetch-items), so it returns one ranked list mixing announcements and posts, or
- the curation step (the x-fetch-items shortlist and the newsletter skill), keeping two buckets in the data and merging them when rendering.

Also covers the Issue #11 changes once they're approved: the "Viral on X" name, an @handle in cobalt linking to the author's profile, and an emoji per row. They go into x_render.py, the newsletter template, beehiiv-patterns.html and the skill.

## Checklist

- [ ] Choose where the merge happens: Grok prompt or curation <!-- longclaw:item=ck_5415e7c8 -->
- [ ] Update the x_data contract and shortlist for one combined list <!-- longclaw:item=ck_c2eec9c0 -->
- [ ] Render one X section: rename to Viral on X, @handle in cobalt, emoji per row <!-- longclaw:item=ck_5157020e -->
- [ ] Update template.html, beehiiv-patterns.html and the newsletter skill <!-- longclaw:item=ck_94a88783 -->
- [ ] Update tests and x_items.py verify <!-- longclaw:item=ck_056eb7c3 -->

## Activity

<!-- longclaw:event
id: evt_42528018
kind: create
occurred_at: 2026-09-26T17:17:04.191Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
-->
### Claude Code created this ticket
<!-- /longclaw:event -->
