---
format: longclaw.ticket/v1
id: 86123693-b1ec-4a17-a243-1fe5d2a34f66
key: AIB-134n
title: Embed Substack subscribe form on aibytes.io weekly surfaces
status: todo
priority: p2
labels:
  - marketing
  - app
type: feature
created_at: 2026-11-06T10:16:55.086Z
updated_at: 2026-11-06T10:16:55.086Z
---

Embed the Substack newsletter signup iframe on three surfaces so readers can subscribe without leaving aibytes.io.

**Embed (from Substack):**
```html
<iframe src="https://aibytesnewsletter.substack.com/embed?transparent=1&light=1" width="480" height="150" style="border: 0; background: transparent" frameborder="0" scrolling="no"></iframe>
```

**Where it goes:**
1. Weekly archive (`/weekly`)
2. Daily app home / edition pages (`aibytes.io` / `aibytes.io/YYYY-MM-DD`) — replace or augment the existing Subscribe link in the sidebar/footer
3. Individual weekly issue pages (`/weekly/issue-N`)

**Notes:**
- Coordinates with AIB-105j (own-site weekly publish) and AIB-134j (Beehiiv → Substack). The current Subscribe control points at `newsletter.aibytes.io/subscribe`; this ticket embeds Substack's form in-page.
- Respect light/dark theme if Substack supports it (`light=1` is in the snippet; check dark).
- Keep AA contrast and a visible focus path around the iframe; do not break the Ledger side nav or mobile drawer.
- Transparent background so it sits on Ledger paper/card surfaces.

## Checklist

- [ ] Add the Substack embed to the weekly archive (/weekly) <!-- longclaw:item=ck_8290d393 -->
- [ ] Add the Substack embed to the daily app shell (sidebar/footer or dedicated slot on aibytes.io) <!-- longclaw:item=ck_b56ae64d -->
- [ ] Add the Substack embed to individual weekly issue pages (/weekly/issue-N) <!-- longclaw:item=ck_ee887c15 -->
- [ ] Handle light/dark theme for the embed if Substack supports it <!-- longclaw:item=ck_bf1c58bc -->
- [ ] Verify desktop and mobile; side nav and drawer still work <!-- longclaw:item=ck_be50c24f -->
- [ ] Tests/build pass; commit and open a PR <!-- longclaw:item=ck_13634b73 -->

## Activity

<!-- longclaw:event
id: evt_514ce815
kind: create
occurred_at: 2026-11-06T10:16:55.086Z
actor:
  type: agent
  id: grok
  name: Grok
-->
### Grok created this ticket
<!-- /longclaw:event -->
