---
format: longclaw.ticket/v1
id: 1a875705-e01f-4039-b9f5-0fb78714d291
key: AIB-105j
title: Publish the weekly issue on aibytes.io/weekly
status: in_review
priority: p2
type: feature
created_at: 2026-10-18T04:50:25.960Z
updated_at: 2026-11-06T10:28:11.396Z
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

- [x] Write the spec in docs/specs/ (slug format, page source, /weekly index, canonical URL) <!-- longclaw:item=ck_7c583b73 -->
- [x] Build the /weekly/<slug> page in apps/web from the issue output <!-- longclaw:item=ck_3400f914 -->
- [x] Add a 'publish on aibytes.io' step to generate-newsletter-content, before the Substack send <!-- longclaw:item=ck_03f49c6f -->
- [x] Use the aibytes.io/weekly URL as ISSUE_URL in the newsletter and social posts (Substack post URL stays secondary) <!-- longclaw:item=ck_4ed5c676 -->
- [x] Back-fill past issues under /weekly <!-- longclaw:item=ck_e685259b -->
- [x] Tests pass; commit and open a PR <!-- longclaw:item=ck_4d755e79 -->
- [x] Add a Substack subscribe CTA on /weekly pages (covers AIB-134j custom-subscribe-button item) <!-- longclaw:item=ck_55165593 -->

## Ticket References

<!-- longclaw:reference
id: ref_a105j001
path: docs/specs/AIB-105j-weekly-publish.md
added_at: 2026-11-06T08:40:00.000Z
added_by:
  type: agent
  id: grok
  name: Grok
-->
[AIB-105j-weekly-publish.md](docs/specs/AIB-105j-weekly-publish.md)
<!-- /longclaw:reference -->

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

<!-- longclaw:event
id: evt_f78cfd98
kind: update
occurred_at: 2026-11-06T07:18:58.854Z
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
id: evt_65219f01
kind: update
occurred_at: 2026-11-06T08:37:22.041Z
actor:
  type: agent
  id: grok
  name: Grok
changes:
  - field: checklist.ck_7c583b73.checked
    from: "false"
    to: "true"
-->
### Grok updated this ticket

Spec drafted at docs/specs/AIB-105j-weekly-publish.md. Locked: slug issue-{N}, page source = aiBytes-issue-N.html as static pages, /weekly index in Ledger, canonical aibytes.io/weekly/issue-N. Starting route + index + vite publish scaffolding.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_fd8ed295
kind: update
occurred_at: 2026-11-06T08:41:45.245Z
actor:
  type: agent
  id: grok
  name: Grok
changes:
  - field: checklist.ck_3400f914.checked
    from: "false"
    to: "true"
  - field: checklist.ck_03f49c6f.checked
    from: "false"
    to: "true"
  - field: checklist.ck_4ed5c676.checked
    from: "false"
    to: "true"
  - field: checklist.ck_e685259b.checked
    from: "false"
    to: "true"
  - field: checklist.ck_55165593.checked
    from: "false"
    to: "true"
-->
### Grok updated this ticket

Implemented /weekly in worktree aibytes-aib-105j-weekly-publish (branch aib-105j-weekly-publish). Spec, content/weekly/index.json back-fill (issues 1-16), routes, Vite static publish with canonical + Substack CTA, Ledger /weekly archive, skill steps for ISSUE_URL and publish-before-Substack. Verified in browser on localhost:5174. Remaining: final PR checklist (tests already green locally).
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_74816b1d
kind: comment
occurred_at: 2026-11-06T10:17:03.772Z
actor:
  type: agent
  id: grok
  name: Grok
-->
### Grok commented

Follow-up for the in-page Substack iframe embed (archive, daily app, and weekly issue pages): AIB-134n. AIB-105j keeps the Subscribe link CTA; AIB-134n owns the embed.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_dae7d950
kind: update
occurred_at: 2026-11-06T10:28:11.396Z
actor:
  type: agent
  id: grok
  name: Grok
changes:
  - field: status
    from: in_progress
    to: in_review
  - field: checklist.ck_4d755e79.checked
    from: "false"
    to: "true"
-->
### Grok updated this ticket

Tests green (web 50/50, validate.py, pages workflow). Committing and opening the PR for AIB-105j; AIB-134n ticket included as the Substack iframe follow-up.
<!-- /longclaw:event -->
