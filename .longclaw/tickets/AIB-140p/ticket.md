---
format: longclaw.ticket/v1
id: 65689d76-3a4e-4e2c-805f-480520818265
key: AIB-140p
title: Offer the weekly newsletter after a reader's first Google sign-in
status: todo
priority: p2
labels:
  - app
type: feature
created_at: 2026-11-07T18:34:46.510Z
updated_at: 2026-11-07T18:34:46.510Z
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

- [ ] Design options for the prompt (aibytes-design) and a decision record <!-- longclaw:item=ck_69e2182d -->
- [ ] Ledger Dialog component with tests and a UI kit screen <!-- longclaw:item=ck_2210eb45 -->
- [ ] Prompt wired to the new-account signal in apps/web <!-- longclaw:item=ck_2cc310fa -->
- [ ] Substack email prefill checked <!-- longclaw:item=ck_f0ba29e7 -->

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
