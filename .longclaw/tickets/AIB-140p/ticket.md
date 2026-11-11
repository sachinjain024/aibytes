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
updated_at: 2026-11-11T11:44:34.578Z
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

- [x] 1. Design options for the prompt (aibytes-design) and a decision record <!-- longclaw:item=ck_69e2182d -->
- [x] 2. Spec approved (docs/specs/AIB-140p-newsletter-prompt.md) <!-- longclaw:item=ck_c92ab0af -->
- [x] 3. Plan approved (docs/plans/AIB-140p-plan.md, docs/plans/AIB-140p-todo.md) <!-- longclaw:item=ck_2dce347a -->
- [ ] 4. ledger-dialog <!-- longclaw:item=ck_987e227c -->
- [x] 4.1 T1: the success colour token <!-- longclaw:item=ck_a4fa1bf1 -->
- [x] 4.2 T2: the Dialog component <!-- longclaw:item=ck_1b7db57f -->
- [x] 4.3 T3: the UI kit screen <!-- longclaw:item=ck_16bb5cb2 -->
- [x] 4.4 Checkpoint A: kit screen reviewed <!-- longclaw:item=ck_5fbcd63a -->
- [ ] 5. subscriber-store <!-- longclaw:item=ck_5182fbf9 -->
- [x] 5.1 T4: the subscriber document and its rules <!-- longclaw:item=ck_6da75777 -->
- [x] 5.2 T5: the client's write and read <!-- longclaw:item=ck_67dd3c88 -->
- [x] 5.3 P1 (publisher): Firestore rules deployed <!-- longclaw:item=ck_58969123 -->
- [ ] 6. signin-prompt <!-- longclaw:item=ck_0c3a870b -->
- [x] 6.1 T6: the new-account signal <!-- longclaw:item=ck_b8829929 -->
- [x] 6.2 T7: the prompt and its states <!-- longclaw:item=ck_e4791fdc -->
- [x] 6.3 T8: the prompt in the app <!-- longclaw:item=ck_f2019c5e -->
- [x] 6.4 T9: subscribed readers and the privacy page <!-- longclaw:item=ck_4646a5e5 -->
- [ ] 6.5 Checkpoint C: whole flow checked by hand with a new account (P4) <!-- longclaw:item=ck_e5f3a473 -->
- [ ] 7. failure-alert <!-- longclaw:item=ck_73bfaa7a -->
- [ ] 7.1 T10: the Cloud Function <!-- longclaw:item=ck_af74414b -->
- [ ] 7.2 T11: the app reports a failure <!-- longclaw:item=ck_4a1a70dc -->
- [ ] 7.3 P2 (publisher): Slack webhook secret set <!-- longclaw:item=ck_d690a95f -->
- [ ] 7.4 P3 (publisher): function deployed, other functions unchanged <!-- longclaw:item=ck_9d071603 -->
- [ ] 8. subscriber-export <!-- longclaw:item=ck_631102b3 -->
- [ ] 8.1 T12: the export package <!-- longclaw:item=ck_b49ce702 -->
- [ ] 8.2 T13: the export skill <!-- longclaw:item=ck_34cf4929 -->
- [ ] 8.3 P5 (publisher): gcloud login and a first status run <!-- longclaw:item=ck_154094be -->
- [ ] 9. Wrap-up <!-- longclaw:item=ck_38720bda -->
- [ ] 9.1 T14: repo docs, the ticket and the final checks <!-- longclaw:item=ck_81941b17 -->
- [ ] 9.2 T15: Dialog synced to the Design System Artifact <!-- longclaw:item=ck_3ce9eecc -->
- [ ] 10. PR #64 squash-merged <!-- longclaw:item=ck_c9cc0057 -->

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

<!-- longclaw:reference
id: ref_8fdff098
path: docs/plans/AIB-140p-plan.md
added_at: 2026-11-11T09:10:00.000Z
added_by:
  type: agent
  id: claude-code
  name: Claude Code
-->
[AIB-140p-plan.md](docs/plans/AIB-140p-plan.md)
<!-- /longclaw:reference -->

<!-- longclaw:reference
id: ref_802475df
path: docs/plans/AIB-140p-todo.md
added_at: 2026-11-11T09:10:00.000Z
added_by:
  type: agent
  id: claude-code
  name: Claude Code
-->
[AIB-140p-todo.md](docs/plans/AIB-140p-todo.md)
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

<!-- longclaw:event
id: evt_394d88f3
kind: update
occurred_at: 2026-11-11T08:08:48.483Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_c92ab0af.checked
    from: "false"
    to: "true"
-->
### claude-code updated this ticket

11 Nov 2026: spec approved (draft 2). Next: the implementation plan in docs/plans/.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_efa6720c
kind: update
occurred_at: 2026-11-11T08:18:19.504Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_2dce347a.added
    to: Plan approved (docs/plans/AIB-140p-plan.md, docs/plans/AIB-140p-todo.md)
-->
### claude-code updated this ticket

11 Nov 2026: plan and task list drafted, awaiting approval. 14 tasks in five modules on branch AIB-140p, PR #64. The spec's deploy command is amended to the documented codebase form.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_8aaa9d14
kind: update
occurred_at: 2026-11-11T08:26:13.365Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_69e2182d.text
    from: Design options for the prompt (aibytes-design) and a decision record
    to: 1. Design options for the prompt (aibytes-design) and a decision record
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_bd457663
kind: update
occurred_at: 2026-11-11T08:26:13.447Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_c92ab0af.text
    from: Spec approved (docs/specs/AIB-140p-newsletter-prompt.md)
    to: 2. Spec approved (docs/specs/AIB-140p-newsletter-prompt.md)
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_a6346157
kind: update
occurred_at: 2026-11-11T08:26:13.522Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_2dce347a.text
    from: Plan approved (docs/plans/AIB-140p-plan.md, docs/plans/AIB-140p-todo.md)
    to: 3. Plan approved (docs/plans/AIB-140p-plan.md, docs/plans/AIB-140p-todo.md)
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_8cc534c2
kind: update
occurred_at: 2026-11-11T08:26:13.602Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_2dce347a.checked
    from: "false"
    to: "true"
  - field: checklist.ck_987e227c.added
    to: 4. ledger-dialog
  - field: checklist.ck_a4fa1bf1.added
    to: "4.1 T1: the success colour token"
  - field: checklist.ck_1b7db57f.added
    to: "4.2 T2: the Dialog component"
  - field: checklist.ck_16bb5cb2.added
    to: "4.3 T3: the UI kit screen"
  - field: checklist.ck_5fbcd63a.added
    to: "4.4 Checkpoint A: kit screen reviewed"
  - field: checklist.ck_5182fbf9.added
    to: 5. subscriber-store
  - field: checklist.ck_6da75777.added
    to: "5.1 T4: the subscriber document and its rules"
  - field: checklist.ck_67dd3c88.added
    to: "5.2 T5: the client's write and read"
  - field: checklist.ck_58969123.added
    to: "5.3 P1 (publisher): Firestore rules deployed"
  - field: checklist.ck_0c3a870b.added
    to: 6. signin-prompt
  - field: checklist.ck_b8829929.added
    to: "6.1 T6: the new-account signal"
  - field: checklist.ck_e4791fdc.added
    to: "6.2 T7: the prompt and its states"
  - field: checklist.ck_f2019c5e.added
    to: "6.3 T8: the prompt in the app"
  - field: checklist.ck_4646a5e5.added
    to: "6.4 T9: subscribed readers and the privacy page"
  - field: checklist.ck_e5f3a473.added
    to: "6.5 Checkpoint C: whole flow checked by hand with a new account (P4)"
  - field: checklist.ck_73bfaa7a.added
    to: 7. failure-alert
  - field: checklist.ck_af74414b.added
    to: "7.1 T10: the Cloud Function"
  - field: checklist.ck_4a1a70dc.added
    to: "7.2 T11: the app reports a failure"
  - field: checklist.ck_d690a95f.added
    to: "7.3 P2 (publisher): Slack webhook secret set"
  - field: checklist.ck_9d071603.added
    to: "7.4 P3 (publisher): function deployed, other functions unchanged"
  - field: checklist.ck_631102b3.added
    to: 8. subscriber-export
  - field: checklist.ck_b49ce702.added
    to: "8.1 T12: the export package"
  - field: checklist.ck_34cf4929.added
    to: "8.2 T13: the export skill"
  - field: checklist.ck_154094be.added
    to: "8.3 P5 (publisher): gcloud login and a first status run"
  - field: checklist.ck_38720bda.added
    to: 9. Wrap-up
  - field: checklist.ck_81941b17.added
    to: "9.1 T14: repo docs, the ticket and the final checks"
  - field: checklist.ck_3ce9eecc.added
    to: "9.2 T15: Dialog synced to the Design System Artifact"
  - field: checklist.ck_c9cc0057.added
    to: "10. PR #64 squash-merged"
-->
### claude-code updated this ticket

11 Nov 2026: plan approved. T15 added: sync Dialog to the Design System Artifact. The CI step for the function's tests is agreed. Checklist rebuilt as numbered items, one per task, ticked as each lands; the five earlier unnumbered items are covered by 4-8.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_5ea8683b
kind: update
occurred_at: 2026-11-11T08:26:27.563Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_2210eb45.removed
    from: Ledger Dialog component with tests and a UI kit screen
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_feadfa68
kind: update
occurred_at: 2026-11-11T08:26:27.641Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_2cc310fa.removed
    from: Prompt wired to the new-account signal in apps/web
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_db9ac911
kind: update
occurred_at: 2026-11-11T08:26:27.721Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_667f8257.removed
    from: Subscribe saves the reader's email to the database (storage, security rule, failure state)
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_fe4707a6
kind: update
occurred_at: 2026-11-11T08:26:27.800Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_bf023510.removed
    from: A way to get saved subscriber emails into Substack
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_ee5c0232
kind: update
occurred_at: 2026-11-11T08:26:27.884Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_051862d9.removed
    from: "Privacy page updated: the app stores the subscription and passes the email to Substack"
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_f7fc5ae1
kind: update
occurred_at: 2026-11-11T08:29:55.497Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_a4fa1bf1.checked
    from: "false"
    to: "true"
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_de6a6ed9
kind: update
occurred_at: 2026-11-11T08:30:21.281Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_1b7db57f.checked
    from: "false"
    to: "true"
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_4f2338fc
kind: update
occurred_at: 2026-11-11T08:44:26.918Z
actor:
  type: agent
  id: grok
changes:
  - field: checklist.ck_16bb5cb2.checked
    from: "false"
    to: "true"
-->
### grok updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_cbd8d12c
kind: comment
occurred_at: 2026-11-11T08:44:36.528Z
actor:
  type: agent
  id: grok
-->
### grok commented

11 Nov 2026: T3 landed. Screen 15-newsletter-prompt.html shows the signed-in app with Dialog open on the final copy. Checkpoint A is waiting on a review of that screen before the app work.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_8b4132d4
kind: update
occurred_at: 2026-11-11T08:53:18.872Z
actor:
  type: agent
  id: grok
changes:
  - field: checklist.ck_5fbcd63a.checked
    from: "false"
    to: "true"
-->
### grok updated this ticket

11 Nov 2026: Checkpoint A reviewed. The kit screen looks right in light and dark.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_8d6cae5b
kind: update
occurred_at: 2026-11-11T08:53:18.893Z
actor:
  type: agent
  id: grok
changes:
  - field: checklist.ck_6da75777.checked
    from: "false"
    to: "true"
-->
### grok updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_b6543bee
kind: update
occurred_at: 2026-11-11T09:00:04.966Z
actor:
  type: agent
  id: grok
changes:
  - field: checklist.ck_67dd3c88.checked
    from: "false"
    to: "true"
-->
### grok updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_34281838
kind: update
occurred_at: 2026-11-11T09:08:09.098Z
actor:
  type: agent
  id: grok
changes:
  - field: checklist.ck_b8829929.checked
    from: "false"
    to: "true"
-->
### grok updated this ticket

11 Nov 2026: T6. signIn resolves to { status, isNew }. The failure line still shows when the popup is blocked. A real Google sign-in and cancel were not driven from here.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_0e088c8c
kind: update
occurred_at: 2026-11-11T09:43:47.421Z
actor:
  type: agent
  id: grok
changes:
  - field: checklist.ck_e4791fdc.checked
    from: "false"
    to: "true"
-->
### grok updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_4c23fbea
kind: update
occurred_at: 2026-11-11T11:12:42.758Z
actor:
  type: agent
  id: grok
changes:
  - field: checklist.ck_f2019c5e.checked
    from: "false"
    to: "true"
-->
### grok updated this ticket

11 Nov 2026: T8. The prompt opens only after a new sign-in that has an email. A signed-out load shows no dialog. The live new-account pass still needs the rules deploy and a fresh Google account.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_df4d292e
kind: update
occurred_at: 2026-11-11T11:20:00.473Z
actor:
  type: agent
  id: grok
changes:
  - field: checklist.ck_4646a5e5.checked
    from: "false"
    to: "true"
-->
### grok updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_e58664e6
kind: update
occurred_at: 2026-11-11T11:44:34.578Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_58969123.checked
    from: "false"
    to: "true"
-->
### claude-code updated this ticket

11 Nov 2026: P1 done. The publisher deployed the Firestore rules (including subscribers/{uid}) to ai-bytes-b42d2 with firebase deploy --only firestore:rules. Compiled and released.
<!-- /longclaw:event -->
