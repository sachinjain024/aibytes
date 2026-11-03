---
format: longclaw.ticket/v1
id: b1bf0131-f498-4edf-a842-17efe3b12d93
key: AIB-134j
title: Migrate the newsletter from Beehiiv to Substack
status: in_progress
priority: urgent
labels:
  - marketing
type: chore
due: 2026-11-08
created_at: 2026-11-03T07:55:49.030Z
updated_at: 2026-11-03T10:10:32.107Z
---

Move the aiBytes_ weekly newsletter from Beehiiv to Substack.

**Deadline: before Sunday 8 Nov 2026**, so Issue #17 (send Monday 9 Nov) goes out from Substack. The Beehiiv plan is already cancelled, so the subscriber export has to happen before Beehiiv access ends.

- Substack's editor does not accept raw HTML, so the issue layout has to be rebuilt from Substack's own blocks (headings, buttons, dividers, pull quotes, embeds, images). Working draft: `newsletter/artifacts/2026-Nov-03-Substack-issue-16.html`.
- Order matters: backfill old posts **before** importing subscribers, with "send email" off on each backfilled post, so nobody gets a pile of old issues in their inbox.
- Tooling that still assumes Beehiiv: the `generate-newsletter-content` skill (Beehiiv export template and patterns), the `generate-followup-thumbnail` skill, `x-fetch-items`, and the Beehiiv links in `apps/web` and `docs/`.

## Checklist

- [x] Cancel Beehiiv subscription plan <!-- longclaw:item=ck_a979463d -->
- [x] Export the subscriber list (CSV) and the post archive from Beehiiv before access ends <!-- longclaw:item=ck_bd7f67c7 -->
- [ ] Set up the Substack publication: name, logo, about page, sender name, reply-to, welcome email; turn paid subscriptions off <!-- longclaw:item=ck_ae1d81a7 -->
- [ ] Create the email alias contact@aibytes.io, forwarding to the personal Gmail inbox; use it as the Substack reply-to and the public contact address <!-- longclaw:item=ck_cabf4949 -->
- [ ] Connect the custom domain newsletter.aibytes.io to the Substack publication (one-time $50; CNAME at the DNS provider) before backfilling, so old posts get their final URLs <!-- longclaw:item=ck_94516fde -->
- [x] Figure out the right set of elements for how the newsletter should appear on Substack (no HTML support) - play around with Substack editor components <!-- longclaw:item=ck_363d4f0f -->
- [ ] Once the newsletter structure is finalized, figure out how to publish <!-- longclaw:item=ck_b6bf1aea -->
- [ ] Update the generate-newsletter-content and thumbnail skills to produce Substack-ready output instead of the Beehiiv export <!-- longclaw:item=ck_16018973 -->
- [ ] Backfill previous posts (with email sending off) <!-- longclaw:item=ck_3227c899 -->
- [ ] Add audience so they don't receive previous posts email <!-- longclaw:item=ck_7cd2b392 -->
- [ ] Check the imported subscriber count against the Beehiiv export; leave out unsubscribed and bounced addresses <!-- longclaw:item=ck_bf067783 -->
- [ ] Send a test email to Gmail and Outlook; check the inbox tab, images, links, and the mobile layout <!-- longclaw:item=ck_893b8330 -->
- [ ] Send a confirmation email about the platform shift (ask readers to add the new sender address to their contacts) <!-- longclaw:item=ck_e2387144 -->
- [ ] Point every subscribe link at Substack: aibytes.io app, docs, social bios <!-- longclaw:item=ck_bb1521c1 -->
- [ ] Turn off Beehiiv automations and the welcome email so nobody gets a double send <!-- longclaw:item=ck_cd8a7611 -->
- [ ] Monitor the stats on the next issue (opens, clicks, unsubscribes vs. the Beehiiv baseline) <!-- longclaw:item=ck_d318a1de -->
- [ ] Record the migration decision in newsletter/artifacts/ <!-- longclaw:item=ck_6a5e6a1d -->
- [ ] Remove Beehiiv-specific tooling from the repo, keeping it recoverable - AIB-135b <!-- longclaw:item=ck_4ca0624d -->

## Activity

<!-- longclaw:event
id: evt_c6e61113
kind: create
occurred_at: 2026-11-03T07:55:49.030Z
actor:
  type: agent
  id: claude-code
-->
### claude-code created this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_e6150574
kind: update
occurred_at: 2026-11-03T07:56:00.582Z
actor:
  type: agent
  id: claude-code
changes:
  - field: status
    from: todo
    to: in_progress
  - field: checklist.ck_a979463d.checked
    from: "false"
    to: "true"
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_ce7dc0e3
kind: update
occurred_at: 2026-11-03T07:59:08.741Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_4ca0624d.added
    to: Remove Beehiiv-specific tooling from the repo, keeping it recoverable - AIB-135b
-->
### claude-code updated this ticket

Follow-up: AIB-135b removes the Beehiiv skills, templates, code, and docs after Issue #17 goes out from Substack. It tags beehiiv-final first so everything can be restored.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_a0b4df0f
kind: update
occurred_at: 2026-11-03T08:05:31.670Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_bd7f67c7.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_a741121b
kind: update
occurred_at: 2026-11-03T08:10:03.550Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_cabf4949.added
    to: Create the email alias contact@aibytes.io, forwarding to the personal Gmail inbox; use it as the Substack reply-to and the public contact address
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_b289c515
kind: update
occurred_at: 2026-11-03T08:10:03.620Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_cabf4949.moved
    from: "17"
    to: "4"
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_9a338acc
kind: update
occurred_at: 2026-11-03T08:48:46.048Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_94516fde.added
    to: Connect the custom domain newsletter.aibytes.io to the Substack publication (one-time $50; CNAME at the DNS provider) before backfilling, so old posts get their final URLs
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_df95a587
kind: update
occurred_at: 2026-11-03T08:48:46.185Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_94516fde.moved
    from: "18"
    to: "5"
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_c3019043
kind: update
occurred_at: 2026-11-03T10:10:32.107Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_363d4f0f.checked
    from: "false"
    to: "true"
-->
### claude-code updated this ticket

Item 4 done: tested in the Substack editor and email preview. Picked layout 4 (ranked lists) on the current website theme (#FFF7ED / #FF6719). Decision record: newsletter/artifacts/2026-Nov-03-Substack-design-taste.html. Pattern: .claude/skills/generate-newsletter-content/references/substack-layout.md. Found along the way: built-in Beehiiv post importer, a separate welcome email for imported subscribers, and a 'Forward reader emails to' setting for contact@aibytes.io.
<!-- /longclaw:event -->
