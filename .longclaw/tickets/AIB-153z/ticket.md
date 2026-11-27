---
format: longclaw.ticket/v1
id: 655b5be3-4c30-4d8e-b9ec-a288fe0128af
key: AIB-153z
title: Upgrade firebase-functions in the aibytes-web codebase (6.x to 7.x)
status: todo
priority: p3
labels:
  - app
type: chore
created_at: 2026-11-25T13:50:02.252Z
updated_at: 2026-11-25T13:50:02.252Z
---

The `aibytes-web` functions codebase (`functions/`) pins `firebase-functions` `^6.3.2`; the current release is 7.x. The deploy of `aibytesExtensionToken` on 25 Nov 2026 (AIB-76n, ticket item 3.22) warned:

> package.json indicates an outdated version of firebase-functions. Please upgrade using npm install --save firebase-functions@latest in your functions directory. Please note that there will be breaking changes when you upgrade.

Left out of AIB-76n on purpose: it is a dependency change with breaking changes, and that PR is the Chrome extension.

Scope: `functions/` only (`aibytesReportSubscribeFailure`, `aibytesExtensionToken`). Check `firebase-admin` alongside. The other 13 functions in the project belong to another codebase and are not touched.

## Checklist

- [ ] 1 Read the firebase-functions 7 release notes and list the breaking changes that touch onCall, HttpsError, defineSecret <!-- longclaw:item=ck_e0bd2dcb -->
- [ ] 2 Upgrade firebase-functions (and firebase-admin if needed) in functions/package.json and the lockfile <!-- longclaw:item=ck_63ac2b6b -->
- [ ] 3 npm test --prefix functions passes <!-- longclaw:item=ck_c51346ba -->
- [ ] 4 Publisher: deploy with firebase deploy --only functions:aibytes-web --project ai-bytes-b42d2; the function list before and after is the same; stop if the CLI offers to delete anything <!-- longclaw:item=ck_2ff2eb1e -->
- [ ] 5 Smoke test both callables after the deploy <!-- longclaw:item=ck_77f50202 -->

## Activity

<!-- longclaw:event
id: evt_a21be317
kind: create
occurred_at: 2026-11-25T13:50:02.252Z
actor:
  type: human
  id: local
-->
### You created this ticket
<!-- /longclaw:event -->
