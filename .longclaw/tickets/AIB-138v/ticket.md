---
format: longclaw.ticket/v1
id: 825e1dbb-2b74-48a9-802a-9ec8877a9db4
key: AIB-138v
title: Embed the first Official Announcements post as an X embed on Substack
status: in_progress
priority: p1
labels:
  - marketing
type: feature
created_at: 2026-11-06T10:08:40.335Z
updated_at: 2026-11-06T10:08:40.335Z
---

Show the first Official Announcements post as an X embed in the Substack issue, and keep the rest of the card as text. Picked up with Issue 17 (send Mon 9 Nov 2026).

Parent: **AIB-134j** (Migrate the newsletter from Beehiiv to Substack).

What we know (6 Nov 2026):
- Substack's editor has an X/Twitter embed block: paste the post URL on its own line, or use the `/` menu. Whether the email shows it as a static card is unconfirmed; X embeds on Substack broke for a while in 2023.
- The embed can't come through the body paste, which keeps only the editor's own blocks. The export would carry the first post's URL on its own line, and the embed is made by hand after the paste.
- The card already shows the author, date and text, so the embedded post drops its `<h3>` byline and blockquote; whether the `{domain} ↗` link stays is part of the taste round.
- `x_items.py verify --substack` would then check the first post by its URL line and the rest word for word.

Order: test first, then decide, then build. Layout: `.claude/skills/generate-newsletter-content/references/substack-layout.md`.

## Checklist

- [ ] In a Substack draft (never published), embed Issue 16's first announcement by pasting its bare URL and via the / menu; check the web preview <!-- longclaw:item=ck_5219275e -->
- [ ] Send a test email to yourself and check the embed card in Gmail and Outlook, desktop and mobile <!-- longclaw:item=ck_eef6b427 -->
- [ ] Taste round: numbered variants (byline kept or dropped, domain link kept or dropped) in an artifact; pick one <!-- longclaw:item=ck_696e4dd1 -->
- [ ] Update substack_export.py, substack-layout.md and the after-paste steps on the export page <!-- longclaw:item=ck_b1078b01 -->
- [ ] x_render substack format and verify: check the embedded post by its URL line, the rest word for word; tests pass <!-- longclaw:item=ck_2233d499 -->
- [ ] Decision record in newsletter/artifacts/ <!-- longclaw:item=ck_d35eed6a -->
- [ ] Ship it on Issue 17 <!-- longclaw:item=ck_20bb93c3 -->

## Activity

<!-- longclaw:event
id: evt_0a46e64b
kind: create
occurred_at: 2026-11-06T10:08:40.335Z
actor:
  type: agent
  id: claude-code
-->
### claude-code created this ticket
<!-- /longclaw:event -->
