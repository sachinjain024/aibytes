# Task list: AIB-140p

Plan: `docs/plans/AIB-140p-plan.md`. Spec:
`docs/specs/AIB-140p-newsletter-prompt.md`.

Built on `AIB-140p`, one commit per task, in PR #64, squash-merged to `main`.
Every task passes the plan's verification checkpoint before its commit.
Sizes: S is 1-2 files of logic, M is 3-5.

## Module 1: `ledger-dialog`

### T1: the success colour token

**Description:** Add `--success` and `--success-fg` to `tokens/token.css`, in
the light block and in both dark blocks, from the prototype's values
(`#1a7f4b` / `#ffffff` light, `#46c282` / `#0c2417` dark), adjusted if the
contrast test asks.

**Acceptance criteria:**
- [x] The tokens exist in all three blocks and the two dark blocks match
      (`ColorTokenTests` passes unchanged).
- [x] `tokens/contrast.test.js` covers `--success-fg` on `--success` and
      `--success` on `--surface`, at AA, in both themes.
- [x] `readme.md` and `.claude/rules/design-system.md` name the token and its
      one job: confirmation ticks.

**Verification:** `npm test -w @aibytes/design-system`;
`python3 -m unittest discover -s tests -p test_design_system.py`.

**Dependencies:** none. **Size:** S.

**Files:** `packages/design-system/tokens/token.css`,
`tokens/contrast.test.js`, `readme.md`, `.claude/rules/design-system.md`.

### T2: the `Dialog` component

**Description:** A modal dialog for Ledger, taken from the prototype's
`Dialog`: scrim, `role="dialog"`, `aria-modal`, `aria-labelledby`, a close
button, Tab kept inside, Escape and a scrim click calling `onClose`, focus
moved in on open and returned on close. Props: `open`, `onClose`, `labelledBy`,
`children`, and `dismissible` (default true) for the ×.

**Acceptance criteria:**
- [x] `Dialog.test.js` renders the real component: nothing when `open` is
      false; the role, `aria-modal` and label wiring when true; the × present
      by default.
- [x] `Dialog.d.ts` and `Dialog.prompt.md` exist and describe the props and
      when to use it (one question, one answer; never for navigation).
- [x] `.ldg-dialog` rules use tokens only, a popover shadow, 420px max width,
      16px side margins, full-width stacked buttons under 480px.
- [x] `Dialog` ships its three files (`.jsx`, `.d.ts`, `.prompt.md`).

**Verification:** `npm test -w @aibytes/design-system`; in
`npm run preview:design-system`, Tab stays inside, Escape closes, focus
returns to the opener, at 1280 and 390px, both themes.
*(T2 as committed: unit tests only. The browser check of focus and Escape is still owed, in T3 with the kit screen.)*

**Dependencies:** none (uses T1's token only through T3). **Size:** M.

**Files:** `components/content/Dialog.jsx`, `Dialog.d.ts`,
`Dialog.prompt.md`, `Dialog.test.js`, `components/components.css`.

### T3: the UI kit screen

**Description:** Screen `15-newsletter-prompt.html`: the kit app, signed in,
with the dialog open on the final copy. The kit's `App.jsx` gains a
`prompt0` prop that opens a sample prompt built from `Dialog`.

**Acceptance criteria:**
- [x] The screen's first line is its `@dsCard` marker; it loads `App.jsx`
      with `signedIn0` and `prompt0`.
- [x] A Python test beside `SavesKitTests` pins the screen, the kit `App.jsx`
      wiring and the two readmes listing it.
- [x] The kit `README.md` and Ledger's `readme.md` list the screen and
      `Dialog`.

**Verification:** the Python design-system tests; the screen in the preview
matches the decision record's layout in both themes.

**Dependencies:** T1, T2. **Size:** M.

**Files:** `ui_kits/aibytes-app/15-newsletter-prompt.html`,
`ui_kits/aibytes-app/App.jsx`, `ui_kits/aibytes-app/README.md`, `readme.md`,
`tests/test_design_system.py`.

### Checkpoint A: after T3

- [x] Ledger and Python suites pass; `npm run build:web` is unchanged in
      behaviour (the app does not use `Dialog` yet).
- [x] Review the kit screen with the publisher before the app work.

## Module 2: `subscriber-store`

### T4: the subscriber document and its rules

**Description:** Add the `subscribers/{uid}` rules from the spec to
`firestore.rules`, and `subscriber.js` with the pure `toSubscriberDoc(user,
now)`.

**Acceptance criteria:**
- [x] On the emulator: the owner creates their document with their token's
      verified email and `serverTimestamp()`, and can `get` it.
- [x] Refused: another email, an unverified email, an extra field, a wrong
      `source`, a client-set `imported_at` or `imported_until`, another
      reader's uid, signed out, update, delete, list.
- [x] Refused: any client read or write of `alert_limits`.
- [x] `subscriber.test.js` covers the document's shape and that a user with
      no email throws.

**Verification:** `npm run test:rules -w @aibytes/web`;
`npm test -w @aibytes/web`.

**Dependencies:** none. **Size:** M.

**Files:** `firestore.rules`, `apps/web/rules.test.js`,
`apps/web/src/subscriber.js`, `apps/web/src/subscriber.test.js`.

### T5: the client's write and read

**Description:** In `subscriber.js`: `subscribe(db, user)` resolves to `"ok"`
or `{ failed: code }`, never rejects, with the 10 s limit and the
read-back-on-refusal rule; `isSubscribed(db, uid)` resolves to a boolean.

**Acceptance criteria:**
- [x] On the emulator: `subscribe` creates the document; a second call
      resolves `"ok"` without changing it; `isSubscribed` is false before and
      true after.
- [x] With a write that never settles, `subscribe` resolves
      `{ failed: "timeout" }` after the limit (injected clock, no real wait).
- [x] A refused write on a missing document resolves
      `{ failed: "permission-denied" }`.

**Verification:** `npm run test:rules -w @aibytes/web` (the emulator test
file is added to that script); `npm test -w @aibytes/web`.

**Dependencies:** T4. **Size:** S.

**Files:** `apps/web/src/subscriber.js`, `apps/web/src/subscriberStore.test.js`,
`apps/web/package.json` (the `test:rules` script).

### Checkpoint B: after T5

- [x] Rules and store tests pass on the emulator.
- [ ] The publisher deploys the rules (P1) so later by-hand checks can write.

## Module 3: `signin-prompt`

### T6: the new-account signal

**Description:** `signIn()` resolves to `{ status, isNew }`; `onUser` adds
`email`. `useAccount` in `App.jsx` reads `status` where it read the string.
No visible change.

**Acceptance criteria:**
- [x] The mapping from a popup result or error to `{ status, isNew }` is a
      pure exported function with tests: new, returning, cancelled (three
      codes), failed.
- [ ] Sign in, cancel and the sign-in error line behave as before in the
      browser.

**Verification:** `npm test -w @aibytes/web`; by hand, sign in and cancel on
`npm run dev:web`.

**Dependencies:** none. **Size:** S.

**Files:** `apps/web/src/account.js`, `apps/web/src/signInResult.js`,
`apps/web/src/signInResult.test.js`, `apps/web/src/App.jsx`.

### T7: the prompt and its states

**Description:** `newsletterPrompt.js`, the reducer for `offer`, `saving`,
`failed`, `thanks` and the countdown; `NewsletterPrompt.jsx`, the dialog
content for each state on Ledger's `Dialog`, with the final copy, the YC mark
and the heart. Not yet mounted by the app.

**Acceptance criteria:**
- [x] `newsletterPrompt.test.js`: Subscribe → saving; saved → thanks; error
      and timeout → failed; retry from failed; ticks 3, 2, 1 then closed;
      close from offer, failed and thanks.
- [x] The copy matches the decision record word for word (a test compares
      the six list items, the lead line, the proof line and the built-by line).
- [x] In `saving`, Subscribe is disabled and reads "Subscribing…"; in
      `failed`, the failure line has `role="alert"`.

**Verification:** `npm test -w @aibytes/web`; `npm run build:web`.

**Dependencies:** T2, T5. **Size:** M.

**Files:** `apps/web/src/newsletterPrompt.js`,
`apps/web/src/newsletterPrompt.test.js`, `apps/web/src/NewsletterPrompt.jsx`,
`packages/design-system/styles.css` (the prompt's layout rules).

### T8: the prompt in the app

**Description:** `useAccount` opens the prompt when a sign-in resolves `ok`
with `isNew` and the user has an email, runs `subscribe` on Subscribe, and
holds `subscribed` (read once per signed-in session, set true on success) in
the account context.

**Acceptance criteria:**
- [ ] A new account sees the dialog on the page it signed in from; a
      returning account and a restored session do not.
      A signed-out load shows no dialog. The new-account pass needs P1 and P4.
- [ ] Subscribe writes the document, shows the thank-you with the reader's
      email, and closes after the countdown; ×, Escape and the scrim close it
      without writing.
- [ ] Offline, Subscribe shows the failure line within 10 s and works again
      once back online.

**Verification:** `npm test -w @aibytes/web`; `npm run build:web`; by hand
with a new account (P1, P4) at 1280 and 390px, both themes.

**Dependencies:** T6, T7. **Size:** M.

**Files:** `apps/web/src/App.jsx`, `apps/web/src/account.js` (if the lazy
chunk needs `subscriber.js` exported through it).

### T9: subscribed readers and the privacy page

**Description:** While `subscribed` is true, leave out the sidebar's
newsletter block (no `subscribeUrl` passed), the weekly page's subscribe bar
and the archive intro's Subscribe link. Update `/privacy`'s newsletter
paragraph to the spec's text.

**Acceptance criteria:**
- [x] Which subscribe options show is one pure function of `subscribed`,
      tested for `undefined`, `false` and `true`.
- [x] Signed out, and signed in without subscribing, all three show; after
      subscribing, none does, with no reload.
- [x] `/privacy` carries the new paragraph (pinned by a test on the page's
      text).

**Verification:** `npm test -w @aibytes/web`; by hand on `/`, a weekly issue
and `/weekly`.

**Dependencies:** T8. **Size:** S.

**Files:** `apps/web/src/App.jsx`, `apps/web/src/subscribeOptions.js`,
`apps/web/src/subscribeOptions.test.js`.

### Checkpoint C: after T9

- [ ] All suites pass; the build succeeds.
- [ ] The whole flow works by hand: new account → dialog → Subscribe →
      thank-you → options gone; returning account → nothing.
- [ ] Review with the publisher. The feature is shippable here without the
      alert and the export.

## Module 4: `failure-alert`

### T10: the Cloud Function

**Description:** `functions/` with its own `package.json`: `alert.js` (pure:
clean the inputs, build the Slack text, decide the daily cap) and `index.js`
(the `aibytesReportSubscribeFailure` callable: auth required, email and uid
from the token, the cap in `alert_limits/{uid}`, the webhook from the secret
`AIBYTES_SLACK_WEBHOOK`). `firebase.json` gains the functions entry with
codebase `aibytes-web`. `functions/README.md` is the deploy runbook. The spec's
deploy command is amended as the plan describes.

**Acceptance criteria:**
- [x] `alert.test.js`: no auth is refused; the email comes from the token and
      a body email is ignored; `code` and `page` are capped and stripped; the
      fourth report in a day is dropped; the message text.
- [x] `firebase.json` names the codebase `aibytes-web`; no file contains a
      webhook URL (a test greps the repo for `hooks.slack.com`).
- [x] The runbook gives P2 and P3 exactly, with the list comparison, and says
      what to do if the CLI offers to delete anything (answer no, stop).
- [x] CI runs the function's tests (one step in `tests.yml`).

**Verification:** `npm test --prefix functions`; the Python suite (the
webhook grep); `firebase emulators:exec` is not required.

**Dependencies:** none. **Size:** M.

**Files:** `functions/package.json`, `functions/index.js`,
`functions/alert.js`, `functions/alert.test.js`, `functions/README.md`,
`firebase.json`, `.github/workflows/tests.yml`,
`docs/specs/AIB-140p-newsletter-prompt.md`.

### T11: the app reports a failure

**Description:** `reportFailure.js` calls the function through
`firebase/functions`, imported only when a save fails, once per failed
attempt, ignoring its result. `/privacy` gains the sentence about Slack.

**Acceptance criteria:**
- [ ] A failed attempt calls the reporter once with the error code and the
      page path, and never with an email (tested with a fake reporter).
- [ ] The reporter failing or hanging changes nothing the reader sees.
- [ ] The Functions client is in its own chunk, absent from the first-paint
      and sign-in chunks (`npm run build:web` output).

**Verification:** `npm test -w @aibytes/web`; `npm run build:web`; after P2
and P3, a forced failure produces one Slack message and the function list is
unchanged apart from the new function.

**Dependencies:** T8, T10. **Size:** S.

**Files:** `apps/web/src/reportFailure.js`,
`apps/web/src/newsletterPrompt.js` (the effect hook-up),
`apps/web/src/App.jsx`.

### Checkpoint D: after T11

- [ ] All suites pass.
- [ ] The publisher runs P2 and P3; the before and after function lists are
      pasted into the PR.

## Module 5: `subscriber-export`

### T12: the export package

**Description:** `packages/subscribers`: selection by an Asia/Kolkata cut-off,
the CSV writer, a Firestore REST client taking a token and a transport, and
the `subscribers.py` CLI with `export`, `mark-imported` and `status`.

**Acceptance criteria:**
- [ ] `tests/test_subscribers.py`, offline with a fake transport: 23:59 IST
      on the date is in and 00:00 the next day is out; imported documents are
      skipped; `mark-imported` writes exactly the exported set and needs
      `--yes`; a second export for the same date is empty; `status` counts.
- [ ] An `--output` inside the repository is refused; output prints counts
      and the path, never an email.
- [ ] A missing `gcloud`, or a refused token, gives a one-line message naming
      the fix. The live test skips under `AIBYTES_SKIP_LIVE=1` and without
      `gcloud`.

**Verification:** `AIBYTES_SKIP_LIVE=1 python3 -m unittest discover -s tests -v`
on Python 3.8 syntax.

**Dependencies:** T4 (the document shape). **Size:** M.

**Files:** `packages/subscribers/subscribers.py`,
`packages/subscribers/aibytes_subscribers/__init__.py`, `select.py`,
`firestore.py`, `tests/test_subscribers.py`.

### T13: the export skill

**Description:** `.claude/skills/export-subscribers/` with `SKILL.md` (the
routine: export, hand over the path, wait for "imported", mark, show status)
and a thin `scripts/export_subscribers.py` over the package.

**Acceptance criteria:**
- [ ] The skill script is covered in `tests/test_subscribers.py` end to end
      with the fake transport and a temp output dir.
- [ ] `SKILL.md` has name and description frontmatter, says the file must
      stay outside the repo, and never asks the agent to print emails.
- [ ] The skill appears through `.agents/skills` (the symlink), with no real
      file under `.agents/`.

**Verification:** the Python suite.

**Dependencies:** T12. **Size:** S.

**Files:** `.claude/skills/export-subscribers/SKILL.md`,
`.claude/skills/export-subscribers/scripts/export_subscribers.py`,
`tests/test_subscribers.py`.

### Checkpoint E: after T13

- [ ] All suites pass.
- [ ] After P5, the publisher runs `status` once against the real project.

## Wrap-up

### T14: repo docs, the ticket and the final checks

**Description:** `CLAUDE.md` gains layout rows for `functions/` and
`packages/subscribers`, the export commands, and the scoped-deploy rule. The
ticket's items are ticked with the CLI. The PR description is rewritten for
the whole feature.

**Acceptance criteria:**
- [ ] The spec's thirteen success criteria are each checked off in the PR
      description, with how each was checked.
- [ ] No webhook and no real email anywhere in the repo or `apps/web/dist`
      (grep).
- [ ] The publisher's steps P1-P5 are listed in the PR as done or pending.

**Verification:** the full checkpoint; the by-hand matrix from the spec at
1280 and 390px in both themes.

**Dependencies:** all. **Size:** S.

**Files:** `CLAUDE.md`, `.longclaw/tickets/AIB-140p/ticket.md`.

### T15: `Dialog` in the Design System Artifact

**Description:** Sync Ledger's Design System Artifact in Claude with this
feature's additions, the way AIB-75v's last task did: a component preview for
`Dialog` (closed-over-page and the newsletter prompt as its example content),
the `--success` token in the colour foundations, and the README's component
list. Components only; the UI kit screens are not synced.

**Acceptance criteria:**
- [ ] `artifact/previews.mjs` has a `Dialog` preview and `artifact/build.test.js`
      covers it.
- [ ] The artifact is republished from `artifact/build.mjs` and shows
      `Dialog` and the success token in both themes.
- [ ] `artifact/README.md` records the sync.

**Verification:** `npm test -w @aibytes/design-system`; the published
artifact opened and checked.

**Dependencies:** T1, T2, T3; done last. **Size:** S.

**Files:** `packages/design-system/artifact/previews.mjs`, `build.test.js`,
`README.md`.
