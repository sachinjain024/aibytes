# Spec: AIB-140p, the newsletter prompt after a first Google sign-in

Status: **draft, 11 Nov 2026, awaiting approval.** Design is final:
`docs/decisions/product/AIB-140p-newsletter-prompt-design.md` (A2 post-signup,
C1 modal dialog, D2 copy). Prototype:
`docs/ux/prototypes/AIB-140p-newsletter-prompt/`. Builds on AIB-75v
`app-accounts` (`docs/specs/AIB-75v-app-accounts.md`), which is merged.

## Objective

A reader who signs in with Google for the first time is offered the weekly
newsletter in a dialog. One click on Subscribe saves their Google email as a
subscriber in Firestore, the dialog thanks them and closes itself. The
publisher moves saved emails into Substack by hand, weekly or monthly, and
marks them as moved. If a save fails, the publisher hears about it in Slack.

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
  The reader is not asked again.
- A reader can only create their own subscriber document, with their own
  verified Google email: enforced by Firestore rules, not by the client.
- When the save fails, the reader sees a failure line and can try again, and a
  message reaches the Slack channel.
- `/privacy` says what Subscribe stores and that the email is passed to
  Substack.

### Not in this spec

- Sending email. Substack sends the newsletter; this only collects addresses.
- Any automatic sync to Substack, or a script that exports subscribers. The
  transfer is by hand from the Firebase console.
- Unsubscribing in the app. A reader unsubscribes from any Substack email.
- Asking readers who dismissed the dialog, or returning accounts, again.
- The sidebar's "Read aiBytes_ weekly · Subscribe" link and the weekly page's
  subscribe bar: both still open the Substack subscribe page.
- A "View archive" button (tried in review and removed for now).

## Modules and build order

One spec, four parts, built in this order on one branch (one commit each, one
PR, squash-merged):

| Module id | What it is | Depends on |
|---|---|---|
| `ledger-dialog` | Ledger `Dialog` component and a `--success` colour token | none |
| `subscriber-store` | The Firestore document, its rules, and the client write | none |
| `signin-prompt` | The prompt in `apps/web`: new-account signal, dialog content, thank-you, failure line, privacy copy | `ledger-dialog`, `subscriber-store` |
| `failure-alert` | The Slack message when a save fails | `signin-prompt`; **blocked on open question 1** |

`failure-alert` can ship in a follow-up PR without holding the other three.

## Tech stack

As the app has it today: Vite 7 + React 18 static build on GitHub Pages;
Firebase JS SDK 13 (Auth and Firestore only), loaded as its own chunk after
first paint; the named Firestore database `aibytes` in project
`ai-bytes-b42d2`; Ledger (`packages/design-system`) for UI. No new runtime
dependency for the first three modules. `failure-alert` adds a server-side
piece (open question 1).

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

`onUser` also passes the reader's `email`. The prompt opens when a sign-in
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
| `created_at` | timestamp | the reader, once | When they subscribed |
| `transferred_at` | timestamp | the publisher, in the console | When the email was added to Substack; absent until then |

A top-level collection, not `users/{uid}/…`, so the publisher sees every
subscriber in one list in the Firebase console and can filter for documents
without `transferred_at`.

Rules, added beside the saves rules in `firestore.rules`:

```
// A reader subscribes themselves, once, with their own verified Google email.
// They can read their own document; nobody can list, change or delete from a
// client. The publisher marks transfers in the console, which bypasses rules.
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
`create`; the client treats `permission-denied` on a document that already
exists as success by reading it back with `get`.

### 4. The manual transfer

The publisher's routine, weekly or monthly, documented in the spec's PR and
in a short section of `apps/web`'s README:

1. Firebase console → Firestore → database `aibytes` → `subscribers`.
2. Add each document without `transferred_at` to Substack (Subscribers → Add).
3. Set `transferred_at` on each to now.

Until step 2 happens a thanked reader receives nothing, so the wait between
subscribing and the first issue can be up to the transfer interval.

### 5. The failure alert

When the dialog enters `failed`, the app reports it once per attempt and the
publisher gets a Slack message: the reader's uid and email, the error code
(`permission-denied`, `unavailable`, `timeout`, …), the page, and the time, so
the reader can be added to Substack by hand.

The web app is a static bundle in a public repo, and a Slack webhook URL is a
bearer credential (CLAUDE.md, "This repo is public"). The browser therefore
cannot post to Slack directly; a server-side piece must hold the webhook.
Which one is open question 1. Whatever it is, it must: accept reports only
from a signed-in reader (a verified Firebase ID token), take the email from
the token rather than the request body, cap reports per reader, and keep the
webhook in a secret store, never in the repo. The report is best effort: a
reader who is offline cannot reach it either.

### 6. The privacy page

`/privacy`'s "The newsletter" section changes from "Signing in here does not
subscribe you." to say: signing in does not subscribe you; if you choose
Subscribe after signing in, your Google email is stored as a subscriber and
added to the Substack list; unsubscribe from any issue. If `failure-alert`
ships, it also says a failed subscription sends the email to the publisher's
Slack workspace.

## Commands

```bash
npm run dev:web                                   # http://localhost:5173/
npm run build:web
npm test -w @aibytes/web                          # node --test: pure modules
npm run test:rules -w @aibytes/web                # firestore.rules on the emulator (needs Firebase CLI + Java)
npm test -w @aibytes/design-system                # Dialog.test.js and the other component tests
python3 -m unittest discover -s tests -p test_design_system.py   # token parity and contrast
npm run preview:design-system                     # UI kit, incl. the new dialog screen
git diff --check
firebase deploy --only firestore:rules --project ai-bytes-b42d2  # by hand, by the publisher, after merge
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
  subscriber.js                        new: toSubscriberDoc(), subscribe(db, user) with the 10 s limit
  subscriber.test.js                   new
  NewsletterPrompt.jsx                 new: the dialog content and its four states
  newsletterPrompt.js (+ .test.js)     new: the pure state machine and countdown, node --test
  App.jsx                              opens the prompt on a new sign-in; privacy copy
apps/web/rules.test.js                 + subscribers cases
firestore.rules                        + subscribers rules
.claude/rules/design-system.md         --hot's third use (the YC mark); --success's one use (confirmation ticks)
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
the new props.

## Testing strategy

- **Pure modules, `node --test`:** `subscriber.test.js` (document shape, no
  email throws), `newsletterPrompt.test.js` (offer → saving → thanks; saving →
  failed on error and on the 10 s limit; retry; countdown 3, 2, 1, close).
- **Rules, emulator:** in `rules.test.js`: the owner creates their document
  with their token's email; a different email, an unverified email, an extra
  field, a wrong `source`, a client-set `transferred_at`, another reader's
  uid, a signed-out write, an update, a delete and a list are all refused; the
  owner can `get` their own.
- **Ledger:** `Dialog.test.js` renders the real component: `role="dialog"`,
  `aria-modal`, the label wiring, and that nothing renders when closed. Focus
  trap, Escape and focus return are checked in a browser, as the Sidebar
  drawer's are. `test_design_system.py` covers the new tokens' parity across
  the two dark blocks and AA contrast of `--success-fg` on `--success`.
- **By hand, in a browser, at 1280 and 390 px, both themes:** new account →
  dialog → Subscribe → thank-you → closes; returning account → no dialog;
  dismiss; offline Subscribe → failure line → retry.
- The whole suite passes before each commit.

## Boundaries

- **Always:** tokens only, no literal colours; sentence case; visible focus
  ring; `validate`-style tests green before committing; rules change and its
  tests in the same commit; preserve Ledger's public component options and the
  Claude Design round-trip files.
- **Ask first:** any new dependency or hosted service (this covers
  `failure-alert`); changing the Firebase plan; any change to the subscriber
  document's fields after first deploy; deploying rules (the publisher does
  it).
- **Never:** a Slack webhook, or any credential, in the repo, the bundle, a
  test fixture or a ticket; a subscriber's email in a log, a commit or a
  fixture (tests use `@example.com`); subscribing a reader without their
  click; touching the `(default)` Firestore database; `git add -A` in this
  repo's content paths.

## Success criteria

1. A new Google account sees the dialog after sign-in; a returning account
   and a restored session do not.
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
7. `/privacy` carries the new newsletter paragraph.
8. `failure-alert`, once its mechanism is chosen: a forced failure produces
   one Slack message with the uid, email and error code, and no webhook
   appears anywhere in the repo or the built bundle.
9. `npm test -w @aibytes/web`, `npm run test:rules -w @aibytes/web`,
   `npm test -w @aibytes/design-system` and
   `python3 -m unittest discover -s tests -p test_design_system.py` pass.

## Assumptions to confirm

1. Subscribers live in a top-level `subscribers/{uid}` collection in the
   `aibytes` database, not under `users/{uid}`.
2. "Update here" means the publisher sets `transferred_at` on each document in
   the Firebase console after adding it to Substack. No export script.
3. On failure the reader sees a failure line and can retry; the Slack alert is
   in addition to that, not instead of it.
4. A reader who closes the dialog is never asked again.
5. Only a verified Google email is accepted (Google accounts normally are).

## Open questions

1. **How the Slack alert is sent.** The browser cannot hold the webhook. The
   options: (a) a Firebase Cloud Function, callable by signed-in readers, with
   the webhook in Secret Manager. It needs the project on the Blaze
   (pay-as-you-go) plan and adds a `functions/` deploy. (b) A small worker on
   another host (for example Cloudflare Workers) that verifies the Firebase ID
   token and posts to Slack: no plan change, one more service to own.
   (c) Ship without the alert for now and rely on the reader's retry.
   Recommended: (a) if Blaze is acceptable, otherwise (c) first with (b) as
   the follow-up.
2. **Which Slack channel.** The daily runner's channel (the existing
   `AIBYTES_SLACK_WEBHOOK`), or a new webhook for app alerts?
