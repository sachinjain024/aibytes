---
format: longclaw.ticket/v1
id: f3ed7982-a918-4bd5-9515-1677fd728b37
key: AIB-143m
title: Upgrade firebase-functions in the aibytes-web codebase
status: todo
priority: p3
labels:
  - app
type: chore
created_at: 2026-11-11T13:55:57.289Z
updated_at: 2026-11-11T13:55:57.289Z
---

The Firebase CLI warns on every deploy of the aibytes-web functions codebase: package.json indicates an outdated version of firebase-functions, and an upgrade has breaking changes. Found while deploying AIB-140p (11 Nov 2026).

## What is wanted

- Upgrade firebase-functions (and firebase-admin if the release needs it) in functions/package.json, and re-lock.
- Fix whatever the breaking changes touch in functions/src. The codebase is one callable, aibytesReportSubscribeFailure.
- Keep the unit tests (npm test --prefix functions) passing.

## Care

- The deploy stays scoped to this codebase and is run by the publisher, with the function list compared before and after (see AIB-140p).
- The callable's behaviour must not change: auth required, email from the token, 3 alerts a day per reader, secret webhook.

## Activity

<!-- longclaw:event
id: evt_6cc2b93e
kind: create
occurred_at: 2026-11-11T13:55:57.289Z
actor:
  type: agent
  id: claude-code
-->
### claude-code created this ticket
<!-- /longclaw:event -->
