---
format: longclaw.ticket/v1
id: 48fcd238-c1f5-48fe-a374-f89a14322e22
key: AIB-142z
title: Send a welcome email on a reader's first sign-in
status: todo
priority: p2
labels:
  - app
type: feature
created_at: 2026-11-11T08:08:53.546Z
updated_at: 2026-11-11T08:09:01.554Z
---

Send a welcome email when a reader signs up (signs in with Google) for the first time. A simple text-based email, sent directly from Firebase.

## What is wanted

- **When:** once, on the reader's first sign-in, to their Google account email.
- **What:** plain text, no HTML template. Short: a welcome, what aiBytes_ is, and where to find the daily edition and the weekly newsletter.
- **How:** from Firebase itself, not a separate email service wired by hand.

## To settle in the spec

- **The sending mechanism.** Firebase Auth has no built-in welcome email, so "directly from Firebase" means a Cloud Function on first sign-in, or the Trigger Email extension. Either needs a mail provider (SMTP or an API) and a sender address on aibytes.io; pick both.
- **The copy and the sender name and address.**
- **Consent and the privacy page.** A one-off welcome is a transactional email, separate from the newsletter subscription (AIB-140p); `/privacy` must say it is sent.
- **Failure.** Whether a failed send alerts the runner's Slack channel, as AIB-140p's failed subscribe does.

## Constraints carried over from AIB-140p

- Any function goes in this repo's own Functions codebase (`aibytes-web`) and is deployed with a fully scoped command, so the project's other functions are never touched.
- No credential (mail API key, SMTP password) in the repo; Firebase secrets only.
- No reader email in the repo, a log, a fixture or a ticket.

Depends on AIB-140p's `failure-alert` module landing first, which sets up the Functions codebase.


## Checklist

- [ ] Spec: sending mechanism, mail provider, sender address and copy decided <!-- longclaw:item=ck_4a883586 -->
- [ ] Welcome email sent once on a reader's first sign-in <!-- longclaw:item=ck_b2632ece -->
- [ ] Privacy page says the welcome email is sent <!-- longclaw:item=ck_e39042ba -->
- [ ] Deployed with the scoped command; other functions unchanged <!-- longclaw:item=ck_0a6a3bd4 -->
## Activity

<!-- longclaw:event
id: evt_6f1e198b
kind: create
occurred_at: 2026-11-11T08:08:53.546Z
actor:
  type: agent
  id: claude-code
-->
### claude-code created this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_9296cbc9
kind: update
occurred_at: 2026-11-11T08:09:01.554Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_4a883586.added
    to: "Spec: sending mechanism, mail provider, sender address and copy decided"
  - field: checklist.ck_b2632ece.added
    to: Welcome email sent once on a reader's first sign-in
  - field: checklist.ck_e39042ba.added
    to: Privacy page says the welcome email is sent
  - field: checklist.ck_0a6a3bd4.added
    to: Deployed with the scoped command; other functions unchanged
-->
### claude-code updated this ticket
<!-- /longclaw:event -->
