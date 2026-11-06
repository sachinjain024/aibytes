---
format: longclaw.ticket/v1
id: 1a875705-e01f-4039-b9f5-0fb78714d291
key: AIB-105j
title: Publish the weekly issue on aibytes.io/weekly
status: todo
priority: p2
type: feature
created_at: 2026-10-18T04:50:25.960Z
updated_at: 2026-11-06T07:10:28.693Z
---

Publish each weekly aiBytes_ issue on our own site at `aibytes.io/weekly/<slug>`, before the Substack send.

- Substack sends the email from `newsletter.aibytes.io` (custom domain on the Substack publication; AIB-134j).
- The issue's live page on `aibytes.io/weekly/...` is the issue's home on the app domain: the newsletter and social posts use it as `ISSUE_URL`.
- Search engines index `aibytes.io` as well as the Substack archive, so the weekly content builds SEO on both surfaces.
- We control what the page shows on our domain: layout, extra context, related daily editions, without Substack's editor limits.

The web app is `apps/web/` (Vite + React, static build for GitHub Pages). Open questions for the spec: the slug format (`issue-14-claude-ecdsa-meta-muse`? `2026-10-19`?), whether the page renders the issue HTML as-is or from structured data, and whether a `/weekly` index lists past issues.

Depends on / coordinates with:
- **AIB-134j** (Beehiiv → Substack migration): subscribe links and publication setup already point at Substack; the Substack checklist item for a custom subscribe button on generated weekly pages lands here once `/weekly` exists.
- **AIB-135b** (remove Beehiiv tooling): keep `/weekly` wording Substack-native so that cleanup does not have to rework this ticket.

## Checklist

- [ ] Write the spec in docs/specs/ (slug format, page source, /weekly index, canonical URL) <!-- longclaw:item=ck_7c583b73 -->
- [ ] Build the /weekly/<slug> page in apps/web from the issue output <!-- longclaw:item=ck_3400f914 -->
- [ ] Add a 'publish on aibytes.io' step to generate-newsletter-content, before the Substack send <!-- longclaw:item=ck_03f49c6f -->
- [ ] Use the aibytes.io/weekly URL as ISSUE_URL in the newsletter and social posts (Substack post URL stays secondary) <!-- longclaw:item=ck_4ed5c676 -->
- [ ] Back-fill past issues under /weekly <!-- longclaw:item=ck_e685259b -->
- [ ] Tests pass; commit and open a PR <!-- longclaw:item=ck_4d755e79 -->
- [ ] Add a Substack subscribe CTA on /weekly pages (covers AIB-134j custom-subscribe-button item) <!-- longclaw:item=ck_55165593 -->

## Activity

<!-- longclaw:event
id: evt_1a72b882
kind: create
occurred_at: 2026-10-18T04:50:25.960Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
-->
### Claude Code created this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_2dc34f2e
kind: update
occurred_at: 2026-11-06T07:10:28.495Z
actor:
  type: agent
  id: grok
changes:
  - field: description
-->
### grok updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_9225d131
kind: update
occurred_at: 2026-11-06T07:10:28.568Z
actor:
  type: agent
  id: grok
changes:
  - field: checklist.ck_03f49c6f.text
    from: Add a 'publish on aibytes.io' step to generate-newsletter-content, before the Beehiiv send
    to: Add a 'publish on aibytes.io' step to generate-newsletter-content, before the Substack send
-->
### grok updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_5c7c9096
kind: update
occurred_at: 2026-11-06T07:10:28.628Z
actor:
  type: agent
  id: grok
changes:
  - field: checklist.ck_4ed5c676.text
    from: Use the aibytes.io URL as ISSUE_URL in the newsletter and social posts
    to: Use the aibytes.io/weekly URL as ISSUE_URL in the newsletter and social posts (Substack post URL stays secondary)
-->
### grok updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_437faddd
kind: update
occurred_at: 2026-11-06T07:10:28.693Z
actor:
  type: agent
  id: grok
changes:
  - field: checklist.ck_55165593.added
    to: Add a Substack subscribe CTA on /weekly pages (covers AIB-134j custom-subscribe-button item)
-->
### grok updated this ticket

Rewrote for the Substack migration (AIB-134j): Beehiiv send/archive framing replaced with Substack email + dual archive on aibytes.io/weekly. Own-site weekly publish stays in scope.
<!-- /longclaw:event -->
