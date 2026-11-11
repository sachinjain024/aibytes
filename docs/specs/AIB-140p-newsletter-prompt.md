# Spec: AIB-140p, the newsletter prompt after a first Google sign-in

Status: **draft 2, 11 Nov 2026, awaiting approval.** Draft 1's two open
questions and four assumptions were answered the same day and are folded in
(see "Decisions"). Design is final:
`docs/decisions/product/AIB-140p-newsletter-prompt-design.md` (A2 post-signup,
C1 modal dialog, D2 copy). Prototype:
`docs/ux/prototypes/AIB-140p-newsletter-prompt/`. Builds on AIB-75v
`app-accounts` (`docs/specs/AIB-75v-app-accounts.md`), which is merged.

## Objective

A reader who signs in with Google for the first time is offered the weekly
newsletter in a dialog. One click on Subscribe saves their Google email as a
subscriber in Firestore, the dialog thanks them and closes itself. From then
on the app knows that reader is subscribed and stops offering the newsletter
to them. The publisher asks an agent for the subscribers up to a date, uploads
that list to the newsletter platform, and tells the agent it is done, which
marks them imported. If a save fails, the reader can retry and the publisher
hears about it in the daily runner's Slack channel.

Who: a new reader of aibytes.io who has just signed in and has not seen the
newsletter. Why: sign-in is the one moment the app knows the reader's email
and that they are new, so it is the cheapest place to grow the list.

Success looks like:

- Sign in with a Google account that is new to aiBytes_: the dialog opens on
  the page the reader was on, with the final copy from the decision record.
- Sign in with a returning account: no dialog.
- Subscribe writes one document for the reader, then the dialog shows the
  green tick, "Thank you for subscribing." and "aiBytes_ arrives every Monday
  at <email>.", counts "Closing in 3", 2, 1 and closes.
- The ×, Escape and a click on the scrim close the dialog without subscribing.
  The reader is never shown the dialog again.
- A signed-in reader who has subscribed no longer sees the app's subscribe
  options (the sidebar's "Read aiBytes_ weekly" block and the weekly page's
  subscribe bar). Everyone else still sees them.
- A reader can only create their own subscriber document, with their own
  verified Google email: enforced by Firestore rules, not by the client.
- When the save fails, the reader sees a failure line and can try again, and a
  message reaches the runner's Slack channel.
- "Give me the subscribers up to 30 Nov" returns the emails not yet imported;
  "they are imported" marks exactly that set, and a status line says how many
  are pending and when the last import was.
- Deploying this project's function leaves every other function in the
  Firebase project as it was.
- `/privacy` says what Subscribe stores and where the email goes.

### Not in this spec

- Sending email. The newsletter platform (Substack today) sends it; this only
  collects addresses.
- Uploading to the newsletter platform. The export hands over a list; the
  upload is by hand.
- Unsubscribing in the app. A reader unsubscribes from any issue's email.
- Showing the dialog again to a reader who closed it, or to returning
  accounts.
- Changing what the remaining subscribe options do. For a reader who is not
  subscribed they still open the Substack subscribe page; making them a
  one-click save for signed-in readers is a possible follow-up.
- Knowing about readers who subscribed on Substack directly. The app only
  knows about subscriptions made through it.
- A "View archive" button (tried in review and removed for now).

## Decisions (11 Nov 2026)

| | Question | Answer |
|---|---|---|
| 1 | How the Slack alert is sent | A Firebase Cloud Function. The project is already on the Blaze plan. Only this function is deployed from this repo; the project's other functions, deployed from elsewhere, must not be touched (see "Deploying the function"). |
| 2 | Which Slack channel | The daily runner's, with the same webhook (`AIBYTES_SLACK_WEBHOOK`). |
| 3 | Where subscribers live | Top level, `subscribers/{uid}`. The app can tell whether the signed-in reader is subscribed, and uses that to stop offering the newsletter. |
| 4 | The transfer to the newsletter platform | An agent exports subscribers up to a date; the publisher uploads them; the agent then marks that date's set as imported, so what has and has not been imported is tracked. |
| 5 | On a failed save | The app shows a failure line with retry, and the alert is sent as well. |
| 6 | After the dialog is closed | Never shown again. |

## Modules and build order

One spec, five parts, on one branch (one commit per task, one PR,
squash-merged). Stable ids:

| Module id | What it is | Depends on |
|---|---|---|
| `ledger-dialog` | Ledger `Dialog` component and a `--success` colour token | none |
| `subscriber-store` | The Firestore document, its rules, the client write and the "am I subscribed" read | none |
| `signin-prompt` | In `apps/web`: the new-account signal, the dialog content and states, hiding subscribe options once subscribed, privacy copy | `ledger-dialog`, `subscriber-store` |
| `failure-alert` | The Cloud Function that posts a failed save to Slack, and the client call | `signin-prompt` |
| `subscriber-export` | The package and skill that list subscribers up to a date and mark them imported | `subscriber-store` |

Build order: `ledger-dialog`, `subscriber-store` → `signin-prompt` →
`failure-alert`, `subscriber-export`.

## Tech stack

As the app has it today: Vite 7 + React 18 static build on GitHub Pages;
Firebase JS SDK 13 (Auth, Firestore, and now the Functions client, loaded only
when a save fails); the named Firestore database `aibytes` in project
`ai-bytes-b42d2`; Ledger (`packages/design-system`) for UI.

New:

- `functions/`: one 2nd-gen callable Cloud Function on Node 22, with
  `firebase-functions` and `firebase-admin`, in its own Functions **codebase**
  `aibytes-web`. Its own `package.json`, outside the npm workspaces.
- `packages/subscribers/`: Python, standard library only, talking to
  Firestore's REST API with an access token from the `gcloud` CLI. No
  service-account key file and no new Python dependency.

## Behaviour

### 1. The new-account signal

`account.js`'s `signIn()` drops the popup's result today. It will resolve to
the same three outcomes, plus whether the account is new, read from
`getAdditionalUserInfo(result).isNewUser`:

```js
/** Opens Google's sign-in. Resolves to { status: "ok" | "cancelled" | "failed", isNew }; never rejects. */
export function signIn() {
  return signInWithPopup(auth, new GoogleAuthProvider()).then(
    (result) => ({ status: "ok", isNew: !!getAdditionalUserInfo(result)?.isNewUser }),
    (error) => ({ status: CANCELLED.has(error.code) ? "cancelled" : (console.warn("Sign-in failed:", error.code || error), "failed"), isNew: false }),
  );
}
```

`onUser` also passes the reader's `email`. The dialog opens when a sign-in
resolves `ok` with `isNew` and the user has an email. Nothing is stored to
remember that the reader was asked: `isNewUser` is true once per account, so
closing the dialog, a reload, or signing in on a second device never shows it
again. A session restored on page load never shows it.

The merge of local saves runs as it does today, independently of the dialog.
The dialog does not mention merged saves.

### 2. The dialog

Ledger `Dialog` holds the app's `NewsletterPrompt`. Copy, order and alignment
are exactly the decision record's "D2 · The copy" section. States:

| State | Shows | Leaves by |
|---|---|---|
| `offer` | Heading with tick, lead line, six-point list, Subscribe, proof line, built-by line | Subscribe → `saving`; ×, Escape, scrim → closed |
| `saving` | Same, Subscribe disabled and labelled "Subscribing…" | write commits → `thanks`; write fails or 10 s pass → `failed` |
| `failed` | Same as `offer`, with one line above the button: "Could not subscribe. Check your connection and try again." (`role="alert"`) | Subscribe → `saving`; ×, Escape, scrim → closed |
| `thanks` | Green tick, "Thank you for subscribing.", "aiBytes_ arrives every Monday at <email>.", "Closing in 3" | countdown reaches 0, ×, Escape → closed |

"Thank you" shows only after the write has committed. The 10 s limit exists
because a Firestore write made offline does not fail, it waits; a write that
lands after the limit is harmless, since the document is keyed by the reader.
With `prefers-reduced-motion`, the countdown still runs (it is text, not
motion).

### 3. The subscriber document

One document per reader at **`subscribers/{uid}`** in the `aibytes` database:

| Field | Type | Written by | Meaning |
|---|---|---|---|
| `email` | string | the reader, once | Their Google account email |
| `source` | string, `"signin-prompt"` | the reader, once | Where the subscription came from |
| `created_at` | timestamp | the reader, once | When they subscribed (server time) |
| `imported_at` | timestamp | the export tool | When the publisher confirmed the import; absent until then |
| `imported_until` | string, `YYYY-MM-DD` | the export tool | The cut-off date of the import that covered this subscriber |

Rules, added beside the saves rules in `firestore.rules`:

```
// A reader subscribes themselves, once, with their own verified Google email.
// They can read their own document, which is how the app knows they are
// subscribed; nobody can list, change or delete from a client. The export
// tool marks imports with the publisher's own Google credentials, which
// bypass these rules.
function isSubscriber(d) {
  return d.keys().hasOnly(['email', 'source', 'created_at'])
    && d.email == request.auth.token.email && request.auth.token.email_verified == true
    && d.source == 'signin-prompt'
    && d.created_at == request.time;
}

match /subscribers/{uid} {
  allow get: if isOwner(uid);
  allow create: if isOwner(uid) && isSubscriber(request.resource.data);
}
```

The client writes with `serverTimestamp()` for `created_at`. A second
Subscribe by the same reader (a retry after a late commit) is a refused
`create`; the client then reads the document back, and if it exists treats the
attempt as a success.

### 4. Knowing who is subscribed

When a reader is signed in, the app reads `subscribers/{uid}` once per session
(one document read, after first paint, in the Firebase chunk) and holds
`subscribed` in the account context: `undefined` while loading or signed out,
then `true` or `false`. It becomes `true` the moment the dialog's write
commits.

While `subscribed` is `true`:

- the sidebar and drawer leave out the "Read aiBytes_ weekly · Subscribe"
  block (`Sidebar` already renders it only when `subscribeUrl` is passed);
- the weekly issue page leaves out its subscribe bar, and the weekly archive's
  intro line drops its Subscribe link.

While it is `undefined` or `false` they show as today, so signed-out readers
and a slow read never see the layout change twice: the block is only ever
removed, after the read answers `true`.

### 5. Exporting and marking imports

A package, `packages/subscribers`, with a thin skill over it,
`.claude/skills/export-subscribers`, so the publisher can ask any agent. Three
commands, all against the `aibytes` database, authenticated with
`gcloud auth print-access-token` (the publisher's own Google login; nothing is
stored):

```bash
# Who subscribed up to and including a date, and is not yet imported
python3 packages/subscribers/subscribers.py export --until 2026-11-30 --output ~/Downloads/aibytes-subscribers-2026-11-30.csv

# After the upload: mark that same set as imported
python3 packages/subscribers/subscribers.py mark-imported --until 2026-11-30

# Where things stand
python3 packages/subscribers/subscribers.py status
```

- **The date** is a calendar day in Asia/Kolkata, inclusive: `--until
  2026-11-30` covers everyone whose `created_at` is before 1 Dec 00:00 IST.
- **`export`** selects documents with `created_at` up to the cut-off and no
  `imported_at`, and writes a CSV with a header row and the columns `email`,
  `subscribed_at`. It prints the count and the path, never the emails.
- **`mark-imported`** selects the same set by the same rule, so a reader who
  subscribed after the cut-off is not marked even if they arrived before the
  command ran. It sets `imported_at` (now) and `imported_until` (the date),
  prints the count, and asks for `--yes` before writing.
- **`status`** prints counts only: imported, pending, the latest
  `imported_until`, and the oldest pending `created_at`.
- **The output path must be outside the repository.** The command refuses a
  path inside the repo, because the repo is public and the file holds email
  addresses. `--output` is the equivalent of the skill convention's
  `--output-root`; tests point it at a temp dir.

The skill's `SKILL.md` carries the routine: export, hand the path to the
publisher, wait for "imported", then mark, then show status. Until an import
happens a thanked reader receives nothing, so the wait before a first issue
can be as long as the gap between imports.

### 6. The failure alert

When the dialog enters `failed`, the app calls the function once per attempt,
fire and forget: its result never changes what the reader sees.

`aibytesReportSubscribeFailure`, a callable function:

- refuses a call without a signed-in reader (`request.auth`);
- takes the uid and email from the verified token, never from the request;
  the request carries only the error `code` (`permission-denied`,
  `unavailable`, `timeout`, …) and the page path, both length-capped and
  stripped to plain text;
- allows at most 3 alerts per reader per day, counted in
  `alert_limits/{uid}`, a collection only the function can touch (the rules
  give clients nothing there);
- posts one message to the webhook: "aibytes.io: a newsletter subscribe
  failed", with the email, uid, code, page and time, so the reader can be
  added by hand;
- reads the webhook from the secret `AIBYTES_SLACK_WEBHOOK` in Secret Manager,
  set once to the same URL the runner uses.

It is best effort: a reader who is offline cannot reach the function either.

### 7. Deploying the function

The Firebase project also runs functions that are deployed from outside this
repo. This repo's deploy must never change or delete them:

- `firebase.json` declares one Functions source with its own codebase:
  `{ "source": "functions", "codebase": "aibytes-web", "runtime": "nodejs22" }`.
  A deploy acts only on the functions of the codebase it names, so functions
  in any other codebase, including the unnamed default one, are left alone.
- The function has a name unlikely to collide, `aibytesReportSubscribeFailure`.
- The only deploy command is the fully scoped one:
  `firebase deploy --only functions:aibytes-web:aibytesReportSubscribeFailure --project ai-bytes-b42d2`.
- Never a bare `firebase deploy`, never `--only functions` without the
  codebase and function name, never `--force` (which deletes without asking).
  If the CLI ever offers to delete a function, the answer is no and the deploy
  is stopped.
- Before the first deploy, `firebase functions:list --project ai-bytes-b42d2`
  is saved; after it, the list must be the same plus the one new function.
- The publisher runs the deploys. The codebase behaviour above is checked
  against Firebase's documentation during planning, before anything is
  deployed.

### 8. The privacy page

`/privacy`'s "The newsletter" section changes from "Signing in here does not
subscribe you." to say: signing in does not subscribe you; if you choose
Subscribe after signing in, your Google email is stored as a subscriber and
added to the newsletter's list on Substack; unsubscribe from any issue; and if
subscribing fails, your email is sent to the publisher's Slack workspace so
you can be added by hand.

## Commands

```bash
npm run dev:web                                   # http://localhost:5173/
npm run build:web
npm test -w @aibytes/web                          # node --test: pure modules
npm run test:rules -w @aibytes/web                # firestore.rules on the emulator (needs Firebase CLI + Java)
npm test -w @aibytes/design-system                # Dialog.test.js and the other component tests
npm test --prefix functions                       # the function's pure logic, node --test
AIBYTES_SKIP_LIVE=1 python3 -m unittest discover -s tests -v   # incl. test_subscribers.py, test_design_system.py
npm run preview:design-system                     # UI kit, incl. the new dialog screen
git diff --check

# By hand, by the publisher, after merge
firebase deploy --only firestore:rules --project ai-bytes-b42d2
firebase functions:secrets:set AIBYTES_SLACK_WEBHOOK --project ai-bytes-b42d2
firebase functions:list --project ai-bytes-b42d2
firebase deploy --only functions:aibytes-web:aibytesReportSubscribeFailure --project ai-bytes-b42d2
```

## Project structure

```
packages/design-system/
  tokens/token.css                     + --success, --success-fg in the light block and both dark blocks
  components/content/Dialog.jsx        new, with Dialog.d.ts, Dialog.prompt.md, Dialog.test.js
  components/components.css            .ldg-dialog rules
  ui_kits/aibytes-app/15-newsletter-prompt.html   new screen (marker line first)
  readme.md                            Dialog and the success token, under "Saves and sign-in"
apps/web/src/
  account.js                           signIn() returns { status, isNew }; onUser adds email
  subscriber.js                        new: toSubscriberDoc(), subscribe(db, user) with the 10 s limit, isSubscribed(db, uid)
  subscriber.test.js                   new
  NewsletterPrompt.jsx                 new: the dialog content and its four states
  newsletterPrompt.js (+ .test.js)     new: the pure state machine and countdown
  reportFailure.js                     new: the callable, imported only on failure
  App.jsx                              opens the prompt on a new sign-in; `subscribed` in the account context; hides subscribe options; privacy copy
apps/web/rules.test.js                 + subscribers and alert_limits cases
firestore.rules                        + subscribers rules
firebase.json                          + the functions entry with codebase aibytes-web
functions/
  package.json, index.js               the one callable
  alert.js (+ alert.test.js)           pure: message text, input cleaning, the daily cap
packages/subscribers/
  subscribers.py                       CLI: export, mark-imported, status
  aibytes_subscribers/                 selection by cut-off, CSV, Firestore REST client
.claude/skills/export-subscribers/
  SKILL.md, scripts/export_subscribers.py   thin wrapper over the package
tests/test_subscribers.py              offline, with a fake Firestore transport
.claude/rules/design-system.md         --hot's third use (the YC mark); --success's one use (confirmation ticks)
CLAUDE.md                              layout rows for functions/ and packages/subscribers; the scoped deploy rule
```

## Code style

As the files touched have it: plain ES modules, pure logic split from Firebase
and React so `node --test` covers it without either (`accountData.js` beside
`accountSaves.js` is the model), a comment at the top of each module naming the
spec, and functions that resolve to a small result rather than reject:

```js
// A subscriber as a Firestore document, subscribers/{uid} (spec AIB-140p).
// Pure, so node --test covers it; subscriber.js does the write.
export function toSubscriberDoc(user, now) {
  if (!user?.email) throw new Error("A subscriber needs an email");
  return { email: user.email, source: "signin-prompt", created_at: now };
}
```

Ledger components keep their three files in step (`.jsx`, `.d.ts`,
`.prompt.md`), use tokens only, and add nothing to a page that does not pass
the new props. The Python package follows `packages/fetchers`: standard
library, logic in the package, the skill script a thin entry point.

## Testing strategy

- **Pure modules, `node --test`:** `subscriber.test.js` (document shape, no
  email throws), `newsletterPrompt.test.js` (offer → saving → thanks; saving →
  failed on error and on the 10 s limit; retry; countdown 3, 2, 1, close),
  `functions/alert.test.js` (message text, input cleaning, the cap of 3 a day,
  no auth refused).
- **Rules, emulator:** in `rules.test.js`: the owner creates their document
  with their token's email and can `get` it; a different email, an unverified
  email, an extra field, a wrong `source`, a client-set `imported_at`, another
  reader's uid, a signed-out write, an update, a delete and a list are all
  refused; any client read or write of `alert_limits` is refused.
- **Ledger:** `Dialog.test.js` renders the real component: `role="dialog"`,
  `aria-modal`, the label wiring, and that nothing renders when closed. Focus
  trap, Escape and focus return are checked in a browser, as the Sidebar
  drawer's are. `test_design_system.py` covers the new tokens' parity across
  the two dark blocks and AA contrast of `--success-fg` on `--success`.
- **Export, `tests/test_subscribers.py`, offline:** the cut-off in IST (a
  subscriber at 23:59 IST is in, one at 00:00 the next day is out); already
  imported documents are skipped; `mark-imported` touches exactly the exported
  set; the CSV shape; a path inside the repo is refused; counts print and
  emails do not. A live test against the real project is skipped under
  `AIBYTES_SKIP_LIVE=1` and when `gcloud` is missing. Fixtures use
  `@example.com` addresses only.
- **By hand, in a browser, at 1280 and 390 px, both themes:** new account →
  dialog → Subscribe → thank-you → closes, and the sidebar's subscribe block
  is gone; returning account → no dialog; dismiss; offline Subscribe → failure
  line → retry; a forced failure → one Slack message.
- **By hand, the deploy:** the function list before and after, as in
  "Deploying the function".
- The whole suite passes before each commit.

## Boundaries

- **Always:** tokens only, no literal colours; sentence case; visible focus
  ring; tests green before committing; a rules change and its tests in the
  same commit; preserve Ledger's public component options and the Claude
  Design round-trip files; the fully scoped deploy command, with the function
  list compared before and after.
- **Ask first:** any further dependency or hosted service; any change to the
  subscriber document's fields after first deploy; a second function in this
  codebase; anything that would run a deploy (the publisher does them).
- **Never:** a Slack webhook, or any credential, in the repo, the bundle, a
  test fixture or a ticket; a subscriber's email in the repo, a log, a commit,
  a ticket or a fixture; an export written inside the repo; a bare
  `firebase deploy`, `--only functions` without codebase and name, or
  `--force`; a change to any function this repo did not create, or a mention
  of where those come from in code, docs or comments; subscribing a reader
  without their click; touching the `(default)` Firestore database.

## Success criteria

1. A new Google account sees the dialog after sign-in; a returning account
   and a restored session do not; a reader who closed it never sees it again.
2. The dialog matches the decision record's copy, order and alignment at 1280
   and 390 px in both themes, and passes the Ledger contrast tests.
3. Subscribe creates `subscribers/{uid}` with exactly `email`, `source`,
   `created_at`; the thank-you shows only after the write commits and the
   dialog closes itself about 3 s later.
4. Every refused case in the rules tests is refused on the emulator.
5. A failed or timed-out write shows the failure line and Subscribe works
   again.
6. Tab stays inside the open dialog, Escape closes it, and focus returns to
   where it was.
7. A subscribed, signed-in reader sees no sidebar subscribe block and no
   weekly subscribe bar; a signed-out reader and a signed-in reader who has
   not subscribed see both.
8. `export --until D` writes the not-yet-imported subscribers up to D to a
   file outside the repo; `mark-imported --until D` marks exactly those;
   a second `export --until D` is then empty; `status` reports the counts.
9. A forced failure produces one Slack message in the runner's channel with
   the uid, email and error code; a fourth failure by the same reader that day
   produces none; a signed-out call is refused.
10. After the function's first deploy, the project's other functions are
    listed exactly as before.
11. No webhook and no subscriber email appears anywhere in the repo or the
    built bundle.
12. `/privacy` carries the new newsletter paragraph.
13. Every command under "Commands" that runs tests passes.

## Open questions

None blocking. Three defaults taken, to change at review if wrong:

1. The export's date is read in Asia/Kolkata.
2. The export file is a two-column CSV (`email`, `subscribed_at`).
3. The function runs in `us-central1`, Firebase's default region.
