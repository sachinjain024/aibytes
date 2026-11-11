---
format: longclaw.ticket/v1
id: 65689d76-3a4e-4e2c-805f-480520818265
key: AIB-140p
title: Offer the weekly newsletter after a reader's first Google sign-in
status: in_progress
priority: p2
rank: a0
labels:
  - app
type: feature
created_at: 2026-11-07T18:34:46.510Z
updated_at: 2026-11-11T07:58:32.813Z
---

Fast follow-up to AIB-75v (app-accounts): after a reader signs in with Google for the first time, offer the weekly newsletter.

## Recommended approach (8 Nov 2026, to confirm at design)

- **After sign-in, not before.** A dialog in front of the Google popup adds a step between the click and what the reader asked for, and asks for an email before any trust; sign-in is about to provide it anyway.
- **New accounts only.** Firebase's sign-in result says whether the Google account is new (`additionalUserInfo.isNewUser`), so the prompt shows once per reader without storing a flag about them. Alternatives to weigh in the design: after every sign-in; before the popup.
- **Light:** "You're signed in. Get aiBytes_ every Monday?" with **Subscribe** and **Not now**. Subscribe opens the Substack subscribe page (`SUBSCRIBE_URL`, newsletter.aibytes.io/subscribe) in a new tab, with the Google email prefilled if Substack's subscribe link accepts one (verify). The reader confirms on Substack; nothing is sent without their click. Not now closes it.
- **After the merge line:** on `/saved` right after a merge, the "N saves were added" line comes first, then the prompt.

## Work

- Design pass with `/aibytes-design`: numbered options for the dialog (layout, copy, placement at 1280 and 390px, both themes), then a decision record in `docs/decisions/product/`.
- Ledger has no dialog component: add `Dialog` (focus trap, Escape, return focus, `aria-modal`), with `.d.ts`, `.prompt.md`, tests and a UI kit screen.
- Wire it in `apps/web` behind the new-account signal from `account.js`.
- The privacy page (`/privacy`, AIB-75v) already says signing in does not subscribe you; update it if the prompt changes what is shared with Substack.

Depends on AIB-75v module 4 (`app-accounts`) being merged.

## Checklist

- [x] Design options for the prompt (aibytes-design) and a decision record <!-- longclaw:item=ck_69e2182d -->
- [ ] Ledger Dialog component with tests and a UI kit screen <!-- longclaw:item=ck_2210eb45 -->
- [ ] Prompt wired to the new-account signal in apps/web <!-- longclaw:item=ck_2cc310fa -->
- [ ] Subscribe saves the reader's email to the database (storage, security rule, failure state) <!-- longclaw:item=ck_667f8257 -->
- [ ] A way to get saved subscriber emails into Substack <!-- longclaw:item=ck_bf023510 -->
- [ ] Privacy page updated: the app stores the subscription and passes the email to Substack <!-- longclaw:item=ck_051862d9 -->
- [ ] Spec approved (docs/specs/AIB-140p-newsletter-prompt.md) <!-- longclaw:item=ck_c92ab0af -->

## Ticket References

<!-- longclaw:reference
id: ref_ae2a5e4a
path: docs/specs/AIB-140p-newsletter-prompt.md
added_at: 2026-11-11T07:30:00.000Z
added_by:
  type: agent
  id: claude-code
  name: Claude Code
-->
[AIB-140p-newsletter-prompt.md](docs/specs/AIB-140p-newsletter-prompt.md)
<!-- /longclaw:reference -->

<!-- longclaw:reference
id: ref_7580a6d2
path: docs/decisions/product/AIB-140p-newsletter-prompt-design.md
added_at: 2026-11-11T07:30:00.000Z
added_by:
  type: agent
  id: claude-code
  name: Claude Code
-->
[AIB-140p-newsletter-prompt-design.md](docs/decisions/product/AIB-140p-newsletter-prompt-design.md)
<!-- /longclaw:reference -->

<!-- longclaw:reference
id: ref_7942becc
path: docs/ux/prototypes/AIB-140p-newsletter-prompt/aib-140p-newsletter-prompt.html
added_at: 2026-11-11T07:30:00.000Z
added_by:
  type: agent
  id: claude-code
  name: Claude Code
-->
[aib-140p-newsletter-prompt.html](docs/ux/prototypes/AIB-140p-newsletter-prompt/aib-140p-newsletter-prompt.html)
<!-- /longclaw:reference -->

<!-- longclaw:reference
id: ref_afca68b3
path: docs/specs/AIB-75v-app-accounts.md
added_at: 2026-11-11T07:30:00.000Z
added_by:
  type: agent
  id: claude-code
  name: Claude Code
-->
[AIB-75v-app-accounts.md](docs/specs/AIB-75v-app-accounts.md)
<!-- /longclaw:reference -->

<!-- longclaw:reference
id: ref_4f3c9b4d
path: docs/decisions/product/AIB-75v-saves-and-sign-in-design.md
added_at: 2026-11-11T07:30:00.000Z
added_by:
  type: agent
  id: claude-code
  name: Claude Code
-->
[AIB-75v-saves-and-sign-in-design.md](docs/decisions/product/AIB-75v-saves-and-sign-in-design.md)
<!-- /longclaw:reference -->

## Activity

<!-- longclaw:event
id: evt_d81ceb35
kind: create
occurred_at: 2026-11-07T18:34:46.510Z
actor:
  type: human
  id: local
-->
### You created this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_fbca804c
kind: update
occurred_at: 2026-11-10T11:51:32.692Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_69e2182d.checked
    from: "false"
    to: "true"
-->
### claude-code updated this ticket

Design decided 10 Nov 2026: post-signup (A2), modal dialog (C1), full pitch with one Subscribe action (D2). Decision record: docs/decisions/product/AIB-140p-newsletter-prompt-design.md. Prototype: docs/ux/prototypes/AIB-140p-newsletter-prompt/.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_3740bee1
kind: update
occurred_at: 2026-11-10T11:54:05.346Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_f0ba29e7.removed
    from: Substack email prefill checked
  - field: checklist.ck_667f8257.added
    to: Subscribe saves the reader's email to the database (storage, security rule, failure state)
  - field: checklist.ck_bf023510.added
    to: A way to get saved subscriber emails into Substack
  - field: checklist.ck_051862d9.added
    to: "Privacy page updated: the app stores the subscription and passes the email to Substack"
-->
### claude-code updated this ticket

10 Nov 2026: Subscribe no longer opens Substack. It saves the email to our database, shows a thank-you with a green tick and closes after a 3-2-1 countdown. The Substack prefill item is dropped; storage, the Substack hand-off and the privacy page are added. See the decision record.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_fa14be86
kind: comment
occurred_at: 2026-11-11T07:12:28.688Z
actor:
  type: agent
  id: claude-code
-->
### claude-code commented

11 Nov 2026: dialog design finalised on the prototype after review (one heading with a green tick, lead line, six-point two-column list, Subscribe only, proof and built-by lines). The decision record is the source for the build.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_e3a2b76b
kind: update
occurred_at: 2026-11-11T07:21:57.704Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_c92ab0af.added
    to: Spec approved (docs/specs/AIB-140p-newsletter-prompt.md)
-->
### claude-code updated this ticket

11 Nov 2026: spec drafted at docs/specs/AIB-140p-newsletter-prompt.md, awaiting approval. Settled: subscribers stored in Firestore; the publisher transfers emails to Substack by hand weekly or monthly and marks them; a failed save alerts a Slack channel. Open in the spec: how the Slack alert is sent (the browser cannot hold the webhook) and which channel.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_001e602d
kind: update
occurred_at: 2026-11-11T07:58:32.813Z
actor:
  type: human
  id: local
changes:
  - field: status
    from: todo
    to: in_progress
  - field: rank
    to: a0
-->
### You updated this ticket
<!-- /longclaw:event -->
