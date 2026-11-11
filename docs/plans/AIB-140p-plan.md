# Implementation Plan: AIB-140p, the newsletter prompt after a first sign-in

Status: **approved 11 Nov 2026**, with T15 added and the CI step agreed. Spec (approved 11 Nov):
`docs/specs/AIB-140p-newsletter-prompt.md`. Design:
`docs/decisions/product/AIB-140p-newsletter-prompt-design.md`. Ticket:
`.longclaw/tickets/AIB-140p/ticket.md`. Task list:
`docs/plans/AIB-140p-todo.md`.

## Overview

Fifteen tasks on the existing branch `AIB-140p`, one commit per task, each
passing the full check list, all in PR #64, which is squash-merged to `main`
when the feature is done. The PR already holds the prototype, the decision
record and the spec; the plan and the build join it.

The five modules from the spec, in build order:

1. **`ledger-dialog`** (T1-T3): the `--success` token, the `Dialog`
   component, its UI kit screen.
2. **`subscriber-store`** (T4-T5): the rules and the document, then the
   client's write and read.
3. **`signin-prompt`** (T6-T9): the new-account signal, the prompt and its
   states, wiring it into the app, hiding subscribe options and the privacy
   copy.
4. **`failure-alert`** (T10-T11): the Cloud Function, then the client call.
5. **`subscriber-export`** (T12-T13): the package, then the skill.
6. **Wrap-up** (T14-T15): repo docs, the ticket, the by-hand checks, and
   `Dialog` synced to the Design System Artifact in Claude.

Every task up to T7 adds something unused by the running app, so aibytes.io
is unchanged until T8 wires the prompt in. Any commit is a clean point to
revert to inside the PR.

## Dependency graph

```
T1 --success token ──┐
T2 Dialog ───────────┼─> T3 kit screen
                     │
T4 rules + document ─┴─> T5 client write/read ─┐
T6 new-account signal ─────────────────────────┼─> T7 prompt + states ─> T8 wired into the app ─> T9 hide options, privacy
                                               │                                  │
T10 Cloud Function ────────────────────────────┴──────────────────────────────────┴─> T11 client reports a failure
T4 ─> T12 export package ─> T13 export skill
everything ─> T14 wrap-up
T1, T2, T3 ─> T15 design sync (last, so the artifact gets the final component)
```

T1, T2, T4, T6, T10 and T12 have no dependency on each other. They are
ordered so the two riskiest pieces of plumbing are proven early: the rules
(T4) before any UI depends on them, and the function's deploy shape (T10)
before the client calls it.

## Architecture decisions

- **`Dialog` is generic and lives in Ledger; the prompt's copy lives in the
  app.** `Dialog` takes a label, `onClose` and children, and owns the scrim,
  focus trap, Escape and focus return. `NewsletterPrompt` in `apps/web` is its
  content. The YC mark and the heart are inline SVGs in `NewsletterPrompt`,
  not Ledger icons, since nothing else uses them.
- **The prompt is a pure state machine plus a thin component.**
  `newsletterPrompt.js` holds `offer → saving → thanks | failed` and the
  countdown as a reducer, so `node --test` covers every transition without
  React or Firebase, the way `accountData.js` sits beside `accountSaves.js`.
- **`signIn()` changes shape once, in its own task (T6).** It resolves to
  `{ status, isNew }` in place of a string. `useAccount` is its only caller,
  and T6 leaves the app behaving exactly as before.
- **`subscribed` rides the account context.** `undefined` while unknown, then
  `true` or `false`. Subscribe options are only ever removed, after it turns
  `true`, so nothing flickers in for signed-out readers.
- **"No `imported_at`" is filtered in the export tool, not in the query.**
  Firestore cannot query for a missing field, so the tool fetches by
  `created_at` up to the cut-off and drops imported documents itself. Fine at
  this list's size.
- **The export tool uses Firestore's REST API with a `gcloud` access token.**
  Standard library only, no key file, and tests swap in a fake transport.
- **The function sits outside the npm workspaces.** `functions/` has its own
  `package.json` and lockfile, because Firebase installs it on its own at
  deploy time. CI gets one extra step to test it (T10).
- **Rules stay closed by default.** `alert_limits` needs no rule: the file
  already denies everything it does not name. T4 adds a test that says so.

## One amendment to the approved spec: the deploy command

Checked against Firebase's documentation (11 Nov 2026, "Organize multiple
functions" and "Manage functions"):

- **Confirmed:** with a `codebase` set, the CLI "no longer prompts you to
  delete functions defined outside of your immediate repository", and a
  deploy of one codebase is written `firebase deploy --only functions:<codebase>`.
- **Confirmed:** removing a function always asks for confirmation first.
- **Not documented:** the three-part form the spec used,
  `functions:aibytes-web:aibytesReportSubscribeFailure`.

So the plan uses the documented form,
`firebase deploy --only functions:aibytes-web --project ai-bytes-b42d2`. The
codebase holds exactly one function, so it deploys exactly that function. The
spec's other deploy rules stand: never a bare `firebase deploy`, never
`--only functions` alone, never `--force`, answer no to any offer to delete,
and compare `firebase functions:list` before and after. T10 updates the spec's
three mentions of the command in the same commit.

The documentation does not say outright that a codebase deploy can never
touch another codebase; the before-and-after list is what proves it for this
project.

## What only the publisher can do

None of these is done by an agent; T14's checklist lists them in order.

| Step | When | What |
|---|---|---|
| P1 | after T4, before any by-hand check of Subscribe | `firebase deploy --only firestore:rules --project ai-bytes-b42d2` |
| P2 | after T10 | `firebase functions:secrets:set AIBYTES_SLACK_WEBHOOK --project ai-bytes-b42d2`, with the runner's webhook URL |
| P3 | after P2 | save `firebase functions:list`, run the scoped deploy, compare the list |
| P4 | for the by-hand checks | a Google account that is new to aiBytes_ (or delete the test user under Authentication, so its next sign-in counts as new) |
| P5 | before the first export | `gcloud auth login` on the machine that runs the export |

The by-hand browser checks of the real flow (T8, T11) need P1, and for the
alert P2 and P3. Until then those tasks are verified by their tests and by
the emulator.

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| The function deploy disturbs the project's other functions | High | Own codebase; documented scoped command; no `--force`; list compared before and after (P3); the publisher runs it. |
| `created_at == request.time` refuses the client's write | Med | T4's emulator tests write with `serverTimestamp()` exactly as the client will, before any UI exists. |
| An offline write never settles, so the dialog hangs on "Subscribing…" | Med | The 10 s limit in T5, tested with a write that never resolves. |
| A retry after a late commit is refused as a second `create` | Med | T5 reads the document back and treats "already there" as success; tested on the emulator. |
| The `isNewUser` flag cannot be exercised on the emulator | Med | The flag is mapped in one small pure function (T6, tested); the real flow is a by-hand check with a fresh account (P4). |
| The dialog shifts the page or traps focus badly on phones | Med | Built from the prototype's `Dialog`, which was checked at 1280 and 390 px; T2 and T8 repeat the check in the kit and the app. |
| Hiding the sidebar block causes a visible jump on load | Low | It is only removed after the read answers `true`; never added late. |
| The callable is blocked by CORS or a missing public invoker | Med | `onCall` handles both by default; T11's by-hand check after P3 proves it from aibytes.io and from localhost. |
| Slack is spammed through the function | Med | Auth required, email from the token, 3 a day per reader, inputs length-capped and stripped; all unit-tested in T10. |
| A subscriber's email lands in the public repo | High | The export refuses any path inside the repo (tested); output prints counts only; fixtures use `@example.com`. |
| The `gcloud` token lacks access to the named database | Low | The first `status` run is the check; the error message names the fix (`gcloud auth login`, the project, the database `aibytes`). |
| `_ds_bundle.js` falls behind the sources | Low | Not edited by hand; the preview server compiles a fresh bundle for the kit screen. |
| The `longclaw` CLI strips sections of `.longclaw/AGENTS.md` on each write | Low | Restore the file from git after every CLI write, as done so far; never commit that change. |

## Verification checkpoint (every task)

Each commit passes all of these before it is made:

```bash
npm test -w @aibytes/design-system
npm test -w @aibytes/web
npm run test:rules -w @aibytes/web          # when the Firebase CLI and Java are present
npm test --prefix functions                 # from T10 on
AIBYTES_SKIP_LIVE=1 python3 -m unittest discover -s tests -v
npm run build:web
git diff --check
```

Plus the task's own by-hand check where it has one. A reviewer checkpoint
follows T3, T5, T9, T11 and T13 (see the task list).

## Decided at approval (11 Nov 2026)

1. **The Design System Artifact in Claude** is synced as part of this ticket:
   T15, as AIB-75v did for the saves and sign-in UI.
2. **CI:** the one step in `.github/workflows/tests.yml` that runs the
   function's unit tests (T10) is agreed.

## Tracking

Every task, checkpoint and publisher step is a numbered checklist item in the
ticket (4.1 is T1, 4.2 is T2, and so on), ticked as it lands, together with
the matching boxes in `docs/plans/AIB-140p-todo.md`.
