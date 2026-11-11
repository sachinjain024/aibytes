---
format: longclaw.ticket/v1
id: 04e77af4-0bfc-4897-844f-a5b4d66b2764
key: AIB-144b
title: Run the first subscriber export for the Substack import
status: todo
priority: p3
labels:
  - app
type: chore
created_at: 2026-11-11T13:57:08.956Z
updated_at: 2026-11-11T13:57:08.956Z
---

The export tool for app subscribers was built in AIB-140p (packages/subscribers and the export-subscribers skill, spec docs/specs/AIB-140p-newsletter-prompt.md, task list docs/plans/AIB-140p-todo.md T12 and T13) and tested against a fake Firestore transport. It has never run against the live aibytes database, and AIB-140p was closed without that step.

## What is wanted

- Settle how the tool gets a Google access token. Today it runs gcloud auth print-access-token, and gcloud is not installed on the publisher's machine. Options: install gcloud and log in, or read the token from the Firebase CLI's saved login instead.
- Run python3 packages/subscribers/subscribers.py status against the live database and confirm it prints counts only.
- Do a first export for a chosen date to a path outside the repo, import it to the newsletter platform by hand, then mark it imported.

## Care

- The repo is public: exports are written outside it, and no email or token is ever committed or printed.
- The rules deny client reads of subscribers, so only the publisher's own credentials can read them.

## Activity

<!-- longclaw:event
id: evt_ee0f7aed
kind: create
occurred_at: 2026-11-11T13:57:08.956Z
actor:
  type: agent
  id: claude-code
-->
### claude-code created this ticket
<!-- /longclaw:event -->
