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
updated_at: 2026-11-06T10:21:10.944Z
---

Move the aiBytes_ weekly newsletter from Beehiiv to Substack.

**Deadline: before Sunday 8 Nov 2026**, so Issue #17 (send Monday 9 Nov) goes out from Substack. The Beehiiv plan is already cancelled, so the subscriber export has to happen before Beehiiv access ends.

- Substack's editor does not accept raw HTML, so the issue layout has to be rebuilt from Substack's own blocks (headings, buttons, dividers, pull quotes, embeds, images). Working draft: `newsletter/artifacts/2026-Nov-03-Substack-issue-16.html`.
- Order matters: backfill old posts **before** importing subscribers, with "send email" off on each backfilled post, so nobody gets a pile of old issues in their inbox.
- Tooling that still assumes Beehiiv: the `generate-newsletter-content` skill (Beehiiv export template and patterns), the `generate-followup-thumbnail` skill, `x-fetch-items`, and the Beehiiv links in `apps/web` and `docs/`.

## Checklist

- [x] Cancel Beehiiv subscription plan <!-- longclaw:item=ck_a979463d -->
- [x] Export the subscriber list (CSV) and the post archive from Beehiiv before access ends <!-- longclaw:item=ck_bd7f67c7 -->
- [x] Figure out the right set of elements for how the newsletter should appear on Substack (no HTML support) - play around with Substack editor components <!-- longclaw:item=ck_363d4f0f -->
- [x] Update the generate-newsletter-content and thumbnail skills to produce Substack-ready output instead of the Beehiiv export <!-- longclaw:item=ck_16018973 -->
- [x] Embed the first Official Announcements post as an X embed on Substack, rest as text - AIB-138v <!-- longclaw:item=ck_ee25177a -->
- [x] Backfill previous posts (with email sending off) <!-- longclaw:item=ck_3227c899 -->
- [x] Add audience so they don't receive previous posts email <!-- longclaw:item=ck_7cd2b392 -->
- [x] Import the 2,632 active Beehiiv subscribers into Substack - submitted 3 Nov 2026, waiting on Substack's import review <!-- longclaw:item=ck_68860357 -->
- [x] Check the imported subscriber count against the Beehiiv export; leave out unsubscribed and bounced addresses <!-- longclaw:item=ck_bf067783 -->
- [x] Send a test email to Gmail and Outlook; check the inbox tab, images, links, and the mobile layout <!-- longclaw:item=ck_893b8330 -->
- [x] Point every subscribe link at Substack: aibytes.io app, docs, social bios <!-- longclaw:item=ck_bb1521c1 -->
- [x] Set up the Substack publication: name, sender name, and reply-to; turn paid subscriptions off <!-- longclaw:item=ck_ae1d81a7 -->
- [x] Finish the Substack publication settings (header and footer, welcome email, tags, About page, logo, Google Analytics) - AIB-139y <!-- longclaw:item=ck_b8497150 -->
- [x] Once the newsletter structure is finalized, figure out how to publish <!-- longclaw:item=ck_b6bf1aea -->
- [x] Turn off Beehiiv automations and the welcome email so nobody gets a double send <!-- longclaw:item=ck_cd8a7611 -->
- [x] Connect the custom domain newsletter.aibytes.io to the Substack publication (one-time $50; CNAME at the DNS provider) - CNAME added 6 Nov 2026 and DNS verified; waiting on Substack's domain verification (up to 36h), until then the domain redirects to substack.com <!-- longclaw:item=ck_94516fde -->
- [x] Remove the old Beehiiv DNS records from Cloudflare (2 bh1234 CNAMEs, 3 SendGrid em886/e95/e952 records) <!-- longclaw:item=ck_1911b836 -->
- [x] Create the email alias contact@aibytes.io, forwarding to the personal Gmail inbox; use it as the Substack reply-to and the public contact address <!-- longclaw:item=ck_cabf4949 -->
- [ ] Monitor the stats on the next issue (opens, clicks, unsubscribes vs. the Beehiiv baseline) <!-- longclaw:item=ck_d318a1de -->
- [ ] Record the migration decision in newsletter/artifacts/ <!-- longclaw:item=ck_6a5e6a1d -->
- [ ] Remove Beehiiv-specific tooling from the repo, keeping it recoverable - AIB-135b <!-- longclaw:item=ck_4ca0624d -->

## Ticket References

<!-- longclaw:reference
id: ref_127b2c48
path: /Users/sachinjain/Library/CloudStorage/GoogleDrive-sachinjain024@gmail.com/My Drive/02_Work/Projects/aiBytes/aiBytes Basic Subscriber Export Nov 3 2026.csv
added_at: 2026-11-03T10:38:00.635Z
added_by:
  type: human
  id: local
-->
[aiBytes Basic Subscriber Export Nov 3 2026.csv](</Users/sachinjain/Library/CloudStorage/GoogleDrive-sachinjain024@gmail.com/My Drive/02_Work/Projects/aiBytes/aiBytes Basic Subscriber Export Nov 3 2026.csv>)
<!-- /longclaw:reference -->

<!-- longclaw:reference
id: ref_79e1a060
path: /Users/sachinjain/Library/CloudStorage/GoogleDrive-sachinjain024@gmail.com/My Drive/02_Work/Projects/aiBytes/aiBytes Posts Export Nov 3 2026.csv
added_at: 2026-11-03T10:38:07.097Z
added_by:
  type: human
  id: local
-->
[aiBytes Posts Export Nov 3 2026.csv](</Users/sachinjain/Library/CloudStorage/GoogleDrive-sachinjain024@gmail.com/My Drive/02_Work/Projects/aiBytes/aiBytes Posts Export Nov 3 2026.csv>)
<!-- /longclaw:reference -->

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

<!-- longclaw:event
id: evt_01a62485
kind: update
occurred_at: 2026-11-03T10:38:00.635Z
actor:
  type: human
  id: local
changes:
  - field: references.ref_127b2c48.added
    to: aiBytes Basic Subscriber Export Nov 3 2026.csv
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_098ef320
kind: update
occurred_at: 2026-11-03T10:38:07.097Z
actor:
  type: human
  id: local
changes:
  - field: references.ref_79e1a060.added
    to: aiBytes Posts Export Nov 3 2026.csv
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_81cab761
kind: update
occurred_at: 2026-11-03T10:42:42.281Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_bf067783.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_71c54dc1
kind: update
occurred_at: 2026-11-03T10:56:58.922Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_cabf4949.moved
    from: "4"
    to: "15"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_89db6315
kind: update
occurred_at: 2026-11-03T10:57:03.418Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_ae1d81a7.moved
    from: "3"
    to: "13"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_a5d2889d
kind: update
occurred_at: 2026-11-03T10:57:05.959Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_94516fde.moved
    from: "3"
    to: "14"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_b018b170
kind: update
occurred_at: 2026-11-03T10:57:10.303Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_b6bf1aea.moved
    from: "4"
    to: "12"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_74594ab6
kind: comment
occurred_at: 2026-11-03T12:36:37.360Z
actor:
  type: human
  id: local
-->
### You commented

Backfill tracked per issue in AIB-136r (checklist + live URLs).
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_e9cd3820
kind: update
occurred_at: 2026-11-03T12:53:20.047Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_3227c899.checked
    from: "false"
    to: "true"
-->
### You updated this ticket

Backfill done: Issues 1-16 published web-only and backdated, URLs on AIB-136r.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_ebb21dc9
kind: update
occurred_at: 2026-11-03T13:39:47.226Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_7cd2b392.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_a9abba5e
kind: update
occurred_at: 2026-11-03T13:39:58.275Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_b6bf1aea.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_e30def3a
kind: update
occurred_at: 2026-11-03T13:40:02.439Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_cd8a7611.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_13e6fcee
kind: update
occurred_at: 2026-11-03T13:42:12.859Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_68860357.added
    to: Import the 2,632 active Beehiiv subscribers into Substack - submitted 3 Nov 2026, waiting on Substack's import review
-->
### You updated this ticket

Subscriber import submitted on 3 Nov 2026: 2,632 active subscribers (313 inactive left out of the 2,945 in the Beehiiv export). Substack is reviewing the import; tick the import item once it's approved and the count shows in Substack.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_4baba577
kind: update
occurred_at: 2026-11-03T13:42:18.865Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_68860357.moved
    from: "19"
    to: "7"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_7d237560
kind: update
occurred_at: 2026-11-04T10:21:37.006Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_e2387144.removed
    from: Send a confirmation email about the platform shift (ask readers to add the new sender address to their contacts)
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_2f093ad7
kind: update
occurred_at: 2026-11-04T10:22:03.101Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_68860357.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_307f2912
kind: comment
occurred_at: 2026-11-04T10:22:18.156Z
actor:
  type: human
  id: local
-->
### You commented

Imported all the subscribers. Reviewed and added by Substack team.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_afb17c8a
kind: comment
occurred_at: 2026-11-04T10:26:14.561Z
actor:
  type: human
  id: local
-->
### You commented

Substack approved the subscriber import (2,632 active subscribers).
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_4d26d127
kind: update
occurred_at: 2026-11-04T10:26:14.594Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_c1434142.added
    to: Finalise the image-generation provider for the issue banner (style guide and reference image in docs/image-guide/); try each option below
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_0d7353a4
kind: update
occurred_at: 2026-11-04T10:26:14.638Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_c1434142.moved
    from: "19"
    to: "5"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_4e89e05a
kind: update
occurred_at: 2026-11-04T10:26:14.665Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_4956aac8.added
    to: "Image provider option: OpenAI app"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_8636b54b
kind: update
occurred_at: 2026-11-04T10:26:14.698Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_4956aac8.moved
    from: "20"
    to: "6"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_65b9fdb1
kind: update
occurred_at: 2026-11-04T10:26:14.719Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_08e4696a.added
    to: "Image provider option: OpenAI CLI"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_940c04f9
kind: update
occurred_at: 2026-11-04T10:26:14.749Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_08e4696a.moved
    from: "21"
    to: "7"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_e3073c85
kind: update
occurred_at: 2026-11-04T10:26:14.771Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_87c6111c.added
    to: "Image provider option: Claude CLI"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_01afdbec
kind: update
occurred_at: 2026-11-04T10:26:14.802Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_87c6111c.moved
    from: "22"
    to: "8"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_7a0171ae
kind: update
occurred_at: 2026-11-04T10:26:14.820Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_18ef5f66.added
    to: "Image provider option: Grok CLI"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_1f5283a5
kind: update
occurred_at: 2026-11-04T10:26:14.851Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_18ef5f66.moved
    from: "23"
    to: "9"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_249a9eee
kind: update
occurred_at: 2026-11-04T10:26:14.870Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_fd60fbc6.added
    to: "Image provider option: Gemini"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_8d154b77
kind: update
occurred_at: 2026-11-04T10:26:14.908Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_fd60fbc6.moved
    from: "24"
    to: "10"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_505058f7
kind: update
occurred_at: 2026-11-04T10:26:26.069Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_fd60fbc6.removed
    from: "Image provider option: Gemini"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_01561506
kind: update
occurred_at: 2026-11-04T10:26:35.839Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_c1434142.removed
    from: Finalise the image-generation provider for the issue banner (style guide and reference image in docs/image-guide/); try each option below
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_155332c8
kind: update
occurred_at: 2026-11-04T10:26:35.864Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_4956aac8.removed
    from: "Image provider option: OpenAI app"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_f4a2d29f
kind: update
occurred_at: 2026-11-04T10:26:35.902Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_08e4696a.removed
    from: "Image provider option: OpenAI CLI"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_3818b70d
kind: update
occurred_at: 2026-11-04T10:26:35.922Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_87c6111c.removed
    from: "Image provider option: Claude CLI"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_3396620d
kind: update
occurred_at: 2026-11-04T10:26:35.951Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_18ef5f66.removed
    from: "Image provider option: Grok CLI"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_297c1a9c
kind: comment
occurred_at: 2026-11-04T10:26:50.965Z
actor:
  type: human
  id: local
-->
### You commented

Image-provider choice split out into AIB-137j.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_d7799eaf
kind: update
occurred_at: 2026-11-06T05:49:02.600Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_893b8330.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_269ec52a
kind: update
occurred_at: 2026-11-06T06:44:30.496Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_94516fde.text
    from: Connect the custom domain newsletter.aibytes.io to the Substack publication (one-time $50; CNAME at the DNS provider) before backfilling, so old posts get their final URLs
    to: Connect the custom domain newsletter.aibytes.io to the Substack publication (one-time $50; CNAME at the DNS provider) - CNAME added 6 Nov 2026 and DNS verified; waiting on Substack's domain verification (up to 36h), until then the domain redirects to substack.com
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_c459858f
kind: update
occurred_at: 2026-11-06T06:44:44.025Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_1911b836.added
    to: Remove the old Beehiiv DNS records from Cloudflare (2 bh1234 CNAMEs, 3 SendGrid em886/e95/e952 records)
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_eb31e4b5
kind: update
occurred_at: 2026-11-06T06:44:44.064Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_1911b836.moved
    from: "19"
    to: "15"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_33d37b48
kind: update
occurred_at: 2026-11-06T06:44:44.089Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_1911b836.checked
    from: "false"
    to: "true"
-->
### You updated this ticket

Removed the 5 old Beehiiv DNS records from Cloudflare on 6 Nov 2026. newsletter.aibytes.io CNAME -> target.substack-custom-domains.com (DNS only) is in place and Substack shows DNS verified; domain verification still pending, so the domain 302s to substack.com until it completes. Root domain redirects stay off: aibytes.io and www serve the GitHub Pages app.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_fb425c73
kind: update
occurred_at: 2026-11-06T06:46:48.836Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_94516fde.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_06d9cec9
kind: update
occurred_at: 2026-11-06T06:55:47.192Z
actor:
  type: agent
  id: grok
  name: Grok
changes:
  - field: checklist.ck_ae1d81a7.text
    from: "Set up the Substack publication: name, logo, about page, sender name, reply-to, welcome email; turn paid subscriptions off"
    to: "Set up the Substack publication: name, sender name, and reply-to; turn paid subscriptions off"
  - field: checklist.ck_437942e6.added
    to: Configure the email header and footer
  - field: checklist.ck_4a58c8f2.added
    to: Configure the welcome email
  - field: checklist.ck_7a7c5aee.added
    to: Create custom tags
  - field: checklist.ck_05ad5d11.added
    to: Edit the About page
  - field: checklist.ck_131f2e50.added
    to: Embed a custom subscribe button in the weekly pages to be generated
  - field: checklist.ck_8e43a26f.added
    to: Update the publication logo
  - field: checklist.ck_664a3c0e.added
    to: Configure the Google Analytics Measurement ID
-->
### Grok updated this ticket

Split the remaining Substack newsletter settings into their own checklist items: email header and footer, welcome email, custom tags, About page, subscribe button on generated weekly pages, publication logo, and Google Analytics Measurement ID.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_8b5be72b
kind: update
occurred_at: 2026-11-06T06:56:00.686Z
actor:
  type: agent
  id: grok
  name: Grok
changes:
  - field: checklist.ck_664a3c0e.moved
    from: "26"
    to: "12"
-->
### Grok updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_13394e5d
kind: update
occurred_at: 2026-11-06T06:56:00.705Z
actor:
  type: agent
  id: grok
  name: Grok
changes:
  - field: checklist.ck_8e43a26f.moved
    from: "26"
    to: "12"
-->
### Grok updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_7757325f
kind: update
occurred_at: 2026-11-06T06:56:00.722Z
actor:
  type: agent
  id: grok
  name: Grok
changes:
  - field: checklist.ck_131f2e50.moved
    from: "26"
    to: "12"
-->
### Grok updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_199fcdc0
kind: update
occurred_at: 2026-11-06T06:56:00.742Z
actor:
  type: agent
  id: grok
  name: Grok
changes:
  - field: checklist.ck_05ad5d11.moved
    from: "26"
    to: "12"
-->
### Grok updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_aa0455aa
kind: update
occurred_at: 2026-11-06T06:56:00.761Z
actor:
  type: agent
  id: grok
  name: Grok
changes:
  - field: checklist.ck_7a7c5aee.moved
    from: "26"
    to: "12"
-->
### Grok updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_484260cb
kind: update
occurred_at: 2026-11-06T06:56:00.780Z
actor:
  type: agent
  id: grok
  name: Grok
changes:
  - field: checklist.ck_4a58c8f2.moved
    from: "26"
    to: "12"
-->
### Grok updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_c9a4be4b
kind: update
occurred_at: 2026-11-06T06:56:00.804Z
actor:
  type: agent
  id: grok
  name: Grok
changes:
  - field: checklist.ck_437942e6.moved
    from: "26"
    to: "12"
-->
### Grok updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_7752b6a7
kind: update
occurred_at: 2026-11-06T07:04:17.700Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_bb1521c1.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_49554f4d
kind: update
occurred_at: 2026-11-06T07:04:21.807Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_ae1d81a7.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_1b2ead4d
kind: update
occurred_at: 2026-11-06T07:04:33.406Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_cabf4949.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_133fc2e9
kind: update
occurred_at: 2026-11-06T07:13:46.384Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_16018973.checked
    from: "false"
    to: "true"
-->
### claude-code updated this ticket

Skills now produce Substack-ready output (6 Nov 2026). generate-newsletter-content step 5 runs scripts/substack_export.py, which rebuilds the issue HTML into Substack blocks (references/substack-layout.md) and writes aiBytes-substack-export-issue-{num}.html with copy buttons for the title, subtitle and rich-HTML body. x_render gained a substack format, and x_items.py verify --substack checks the export's X rows word for word (checked on Issue 16's real snapshot). The thumbnail skill keeps the 1200x630 card, now uploaded as the Substack social image; the 16:9 banner waits on AIB-137j. The Beehiiv export is no longer built and stays in the repo until AIB-135b. Tests: tests/test_substack_export.py plus new substack cases in tests/test_x_fetch_items.py; full suite passes. First real run: Issue 17.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_8d9d1308
kind: update
occurred_at: 2026-11-06T10:03:49.936Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_ee25177a.added
    to: "Parked until Issue 17: embed the first Official Announcements post as an X embed on Substack, rest as text - test a draft embed and a test email first, then a taste round, then the export script, layout doc and x_render verify"
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_bab42f8a
kind: update
occurred_at: 2026-11-06T10:03:49.969Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_ee25177a.moved
    from: "27"
    to: "5"
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_e5651172
kind: update
occurred_at: 2026-11-06T10:07:46.967Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_ee25177a.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_e73ab8fe
kind: update
occurred_at: 2026-11-06T10:07:51.453Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_ee25177a.checked
    from: "true"
    to: "false"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_618009c4
kind: update
occurred_at: 2026-11-06T10:08:49.129Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_ee25177a.text
    from: "Parked until Issue 17: embed the first Official Announcements post as an X embed on Substack, rest as text - test a draft embed and a test email first, then a taste round, then the export script, layout doc and x_render verify"
    to: Embed the first Official Announcements post as an X embed on Substack, rest as text - AIB-138v
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_c34f0e4e
kind: update
occurred_at: 2026-11-06T10:12:52.877Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_ee25177a.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_dcdb9a2a
kind: update
occurred_at: 2026-11-06T10:19:35.145Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_437942e6.removed
    from: Configure the email header and footer
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_1429be00
kind: update
occurred_at: 2026-11-06T10:19:35.170Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_4a58c8f2.removed
    from: Configure the welcome email
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_c8e46172
kind: update
occurred_at: 2026-11-06T10:19:35.193Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_7a7c5aee.removed
    from: Create custom tags
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_b6d091cd
kind: update
occurred_at: 2026-11-06T10:19:35.215Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_05ad5d11.removed
    from: Edit the About page
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_8a874049
kind: update
occurred_at: 2026-11-06T10:19:35.237Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_8e43a26f.removed
    from: Update the publication logo
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_008df3e8
kind: update
occurred_at: 2026-11-06T10:19:35.257Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_664a3c0e.removed
    from: Configure the Google Analytics Measurement ID
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_280d511c
kind: update
occurred_at: 2026-11-06T10:19:35.280Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_b8497150.added
    to: Finish the Substack publication settings (header and footer, welcome email, tags, About page, logo, Google Analytics) - AIB-139y
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_f5bf7f16
kind: update
occurred_at: 2026-11-06T10:19:35.314Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_b8497150.moved
    from: "22"
    to: "13"
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_56a7f9bc
kind: update
occurred_at: 2026-11-06T10:21:07.185Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_b8497150.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_dd9422c3
kind: update
occurred_at: 2026-11-06T10:21:10.944Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_131f2e50.removed
    from: Embed a custom subscribe button in the weekly pages to be generated
-->
### You updated this ticket
<!-- /longclaw:event -->
