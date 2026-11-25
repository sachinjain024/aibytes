# Spec: AIB-76n, module 4 `extension-auth`

Status: **draft, 22 Nov 2026, for review.** Module 4 of 6 in
`docs/specs/AIB-76n-capability-map.md`. Builds on `extension-popup` and
`app-core`. Provides the site-to-extension contract that `site-extension` uses.
Waits on the publisher's steps below (ticket items 2.1 and 2.2, and the IAM
grant).

## Objective

Sign the extension in as the reader's aibytes.io account, keep it in step with
the site, and sync its saves. Sign-in never happens in the extension: aibytes.io
signs the reader in with Google, asks a new callable for a Firebase custom
token for that reader, and hands the token to the extension, which signs in with
it. From then on the popup's stars read and write `users/{uid}/saves`, the
same documents aibytes.io uses.

Who: a reader who stars in the popup and expects to find those items in Saved
on aibytes.io, and the other way round.

Success looks like:

- After a sign-in on aibytes.io, the popup shows the reader's avatar instead of
  Sign in, and its Saved is the account's.
- Stars made signed out in the extension are in the account right after that
  sign-in, without opening the popup.
- Closing the popup, letting Chrome stop the worker, and reopening the popup
  without visiting aibytes.io: still signed in, and a star still writes.
- A sign-out on aibytes.io signs the extension out.
- Only `https://aibytes.io` (and `http://localhost:5173` in a dev build) can
  talk to the extension; the token never appears in a log, a reply, Firestore
  or `chrome.storage.local`.

### Not in this module

The aibytes.io side of the contract (the bridge, onboarding, the install box):
`site-extension`. Gist reactions in the extension (out of scope). The avatar menu's look
(`ledger-extension-ui`).

## Prerequisites (the publisher's)

1. **IAM:** the account the functions run as holds *Service Account Token
   Creator* on itself, which `createCustomToken` needs to sign tokens. The
   command, recorded in `functions/README.md`:
   `gcloud iam service-accounts add-iam-policy-binding <runtime-sa> --member=serviceAccount:<runtime-sa> --role=roles/iam.serviceAccountTokenCreator --project ai-bytes-b42d2`.
2. **Ticket 2.1:** `chrome-extension://faamldnehjdjdobapchedpmldfjjfife` in
   Firebase Auth's authorised domains.
3. **Ticket 2.2:** the web API key, which is HTTP-referrer restricted to
   aibytes.io, also allows the extension's origin. The exact restriction, as
   set, is recorded in this spec's "As set" note when it is done.

   **As set (25 Nov 2026):** the key `…JYejxYDo` (project ai-bytes-b42d2)
   keeps Application restrictions → Websites, with five entries:
   `chrome-extension://faamldnehjdjdobapchedpmldfjjfife/*` (added for this
   item), `http://localhost:4173/*`, `http://localhost:5173/*`,
   `https://ai-bytes-b42d2.firebaseapp.com/*` and `https://aibytes.io/*`. API
   restrictions are unchanged. Checked the same day with
   `identitytoolkit/v3/relyingparty/getProjectConfig`: the extension's referrer
   (the root and `background.js`) and aibytes.io are accepted, while no
   referrer and an unknown site get `ACCESS_DENIED`. A `fetch` from the unpacked
   dev build's own page in Chrome, with the permissions still `["storage"]`,
   returned 200, so Chrome sends the `chrome-extension://` referrer and CORS
   lets it through with no host permission. The same response lists the
   extension's origin among Auth's authorised domains (item 2.1).

## The gate (the first task)

Before any other code, from an unpacked dev build with the manifest's
permissions still `["storage"]`:

1. In the worker, `signInWithCustomToken` with a token minted from the dev
   machine (the publisher's credentials, never committed).
2. One Firestore read and one write of a save at `users/{uid}/saves`.
3. Stop the worker (`chrome://serviceworker-internals` or idle), open the
   popup: `onAuthStateChanged` reports the same user without a new token.
4. The `User`'s `displayName` and `photoURL` are present (for the avatar).

If step 1 or 2 fails on CORS, add the host permission the failure names (for
example `https://*.googleapis.com/*`), record the install warning it brings,
and freeze the permission set here (map answer 11: acceptable, though the 9
existing users must accept it). If step 1 fails in the worker for any other
reason, use the fallback in "Risks". The result is written into this spec
before the module goes on.

## The callable

`functions/index.js`, beside `aibytesReportSubscribeFailure`:

```js
// aibytesExtensionToken (spec AIB-76n extension-auth). A reader signed in with
// Google on aibytes.io gets a Firebase custom token for their own uid, to hand
// to the Chrome extension. No claims. The token is returned, never logged.
exports.aibytesExtensionToken = onCall(async (request) => {
  const decision = prepareToken(request.auth);           // pure, tested
  if (!decision.ok) throw new HttpsError(decision.code, decision.message);
  return { token: await getAuth().createCustomToken(decision.uid) };
});
```

- `prepareToken` (in `functions/extensionToken.js`) refuses no auth
  (`unauthenticated`) and any provider but Google
  (`request.auth.token.firebase.sign_in_provider !== "google.com"`,
  `permission-denied`), so a custom-token session cannot mint more tokens.
- No extra claims: the extension's session is the reader's uid, which the saves
  rules (`isOwner`) already accept. Reactions' `isGoogle()` would refuse it,
  and reactions are not in the extension.
- `functions/README.md` gains the IAM step and the deploy check: the function
  list before and after keeps `aibytesReportSubscribeFailure` and gains
  `aibytesExtensionToken`; if the CLI offers to delete anything, stop.
  Deployed by the publisher with the repo's one command.

## The contract (provider side)

The manifest gains:

```js
externally_connectable: { matches: ["https://aibytes.io/*"] },   // + "http://localhost:5173/*" in a dev build only
```

No `minimum_chrome_version`: the primary session is IndexedDB, and
`getUserSettings` is Chrome 91+. Only if the gate forces the fallback in
"Risks" (`chrome.storage.session`, Chrome 102+) is `minimum_chrome_version:
"102"` added, and recorded with the gate's result.

The packaged build has no localhost entry; a test of the production manifest
checks it. The background worker answers:

| Message from the site | Reply |
|---|---|
| `{ type: "status" }` | `{ installed: true, version, pinned, uid, signoutPending }`: `version` from the manifest; `pinned` from `chrome.action.getUserSettings().isOnToolbar` (Chrome 91+); `uid` after `auth.authStateReady()`, or `null`; `signoutPending` true while a popup Sign out is under way (below) |
| `{ type: "signin", token }` | `{ ok: true, uid, merged }` once signed in (and the merge tried), or `{ ok: false, code }` |
| `{ type: "signout" }` | `{ ok: true }` once signed out; clears `signoutPending` |
| anything else | `{ ok: false, code: "bad-message" }` |

- **Origin:** `sender.origin` must be in the build's allowed list, or the reply
  is `{ ok: false, code: "origin" }` and nothing else runs. (Chrome already
  drops messages from pages outside `matches`; the check also covers a dev
  origin left in by mistake.)
- **Shape:** `type` one of the three; `token` a string under 4 KB.
- **The token:** used once, for `signInWithCustomToken`; never logged, stored,
  or echoed. Errors reply with Firebase's code only.
- **Pin updates:** `chrome.runtime.onConnectExternal`, port name `"pin"`, same
  origin check. The worker posts `{ pinned }` on each
  `chrome.action.onUserSettingsChanged` (Chrome 130+, feature-detected); where
  it is missing the page polls `status` every 2 seconds (`site-extension`).

## The session

`src/firebase.js` initialises one Firebase app with `app-core`'s
`firebase-config.js`, `getAuth` from **`firebase/auth/web-extension`**
(IndexedDB persistence at the extension's origin) and
`getFirestore(app, FIRESTORE_DATABASE)`. The worker and the popup both import
it:

- **The worker** signs in and out, and merges.
- **The popup** imports it after its first paint (as the web does), waits for
  `onAuthStateChanged`, and swaps `localSaves` for
  `accountSaves(db, uid)` while signed in, then back when signed out. The
  header shows the avatar (`PopupHeader`'s `user`) while signed in.

## Signing out from the popup

The avatar menu's Sign out (`pop.menu.signout`) does two things at once:

1. sends `chrome.runtime.sendMessage({ type: "signout-by-reader" })` to the
   worker, and
2. opens `https://aibytes.io/extension-onboarding?action=signout` with
   `chrome.tabs.create`, where the site signs itself out (`site-extension`).

The worker handles the message in **`chrome.runtime.onMessage`** (the
extension's own pages; not `onMessageExternal`), through
`handleInternal(message, sender, { chrome, auth, storage })`:

- accepted only when `sender.id === chrome.runtime.id` and the sender has no
  web `origin` (it is the popup); anything else is ignored;
- signs the extension out (so the popup shows Sign in even if the tab never
  loads), and
- sets **`signoutPending`**: `chrome.storage.local["aibytes-extension-signout"]
  = { at: Date.now() }`, which expires after 2 minutes. `status` returns
  `signoutPending: true` while it is set and unexpired.

The site honours `?action=signout` only while `signoutPending` is true, and
its `{ type: "signout" }` clears the flag. So a page anywhere on the web that
opens the URL signs nobody out, and the site's reconcile does not mint a token
while the flag is set (it would otherwise sign the extension back in from
another open aibytes.io tab). The reader ends signed out on the web and in the
extension. No token is involved in this path.

## The merge

On a successful `signin` the worker reads the signed-out saves from
`chrome.storage.local` (`readSaves` over the `extensionStorage` adapter), runs
`mergeInto(db, uid, local)`, and only after it resolves calls `clearSaves`.
The reply carries `merged` (the count). A failed merge leaves the saves in
place and still replies `ok: true` for the sign-in. On every open while signed
in with signed-out saves still present, the popup runs the same merge, so a
failed or interrupted one is retried. The site does not show the web's "N
saves from this browser were added" line for these (they were the extension's).

## Tech stack

`firebase` ^13.2.0 added to `apps/extension` (the one runtime dependency the
map allows): `firebase/app`, `firebase/auth/web-extension`,
`firebase/firestore`. In `functions/`: `firebase-admin`'s `getAuth`, already a
dependency.

## Commands

```bash
npm install -w @aibytes/extension firebase
npm test -w @aibytes/extension
npm test --prefix functions
npm run test:rules -w @aibytes/app-core    # accountSaves under the rules, as before
# the publisher:
# firebase deploy --only functions:aibytes-web --project ai-bytes-b42d2
```

## Project structure

```
apps/extension/src/
  firebase.js            the one Firebase app (worker and popup)
  external.js            handleExternal + handlePort: pure, with injected chrome/auth/merge
  internal.js            handleInternal (signout-by-reader, signoutPending): pure
  background.js          wires onInstalled, onMessage, onMessageExternal, onConnectExternal
  popup/useAccount.js    onAuthStateChanged → the store; the merge retry
  *.test.js
functions/
  index.js               + aibytesExtensionToken
  extensionToken.js      prepareToken (pure)
  extensionToken.test.js
  package.json           "test": "node --test *.test.js" (today it runs alert.test.js only)
  README.md              + IAM step, + the deploy list check
```

## Code style

As the map: Chrome, Auth and the merge are injected, so the handler is plain
logic under `node --test`.

```js
// aibytes.io's messages (spec AIB-76n extension-auth). Pure: chrome, auth and
// merge are passed in. The token is used once and never logged or returned.
export async function handleExternal(message, sender, { allowed, chrome, auth, merge }) {
  if (!allowed.includes(sender.origin)) return { ok: false, code: "origin" };
  switch (message?.type) {
    case "status": return status(chrome, auth);
    case "signin": return signIn(message.token, auth, merge);
    case "signout": await auth.signOut(); await clearSignoutPending(chrome); return { ok: true };
    default: return { ok: false, code: "bad-message" };
  }
}
```

## Testing strategy

- **`node --test` in `apps/extension`:** every row of the contract table; a
  wrong origin runs nothing; a bad shape; `signin` signs in before merging and
  clears only after the merge resolves; a failed merge keeps the saves and
  still replies ok; no reply or console call contains the token (a spy on
  `console`); the port posts on a settings change and does nothing where the
  event is missing; the production manifest has no localhost and its
  permissions are exactly the frozen set (`storage`, plus only what the gate
  named). `handleInternal`: the extension's own id signs out and sets
  `signoutPending`; a sender with a web `origin` or another id does nothing;
  `status` reports the flag until it expires or `signout` clears it.
- **`node --test` in `functions/`:** `prepareToken` refuses no auth and a
  non-Google provider, and accepts Google. `functions/package.json`'s test
  script becomes `node --test *.test.js`, so the new file runs (CommonJS, as
  `index.js` and `alert.js`).
- **The gate** above, by hand, recorded here.
- **End to end, by hand** (after `site-extension`, or from a dev page that
  calls the callable and sends the message): sign in on aibytes.io; the popup
  shows the avatar; signed-out stars merged; a star in the popup shows in
  `/saved` after a reload; worker stopped and popup reopened; sign out on
  aibytes.io signs the popup out.

## Boundaries

- *Always:* check the origin first (the sender id for internal messages);
  feature-detect `onUserSettingsChanged` and `chrome.storage.session`; clear local saves only after the merge commits.
- *Ask first:* any permission beyond `storage` other than what the gate proves
  necessary; any custom claim; any change to `firestore.rules`.
- *Never:* log, store or return the token; accept a message from an origin not
  in the build's list; ship the localhost origin; deploy functions (the
  publisher does); use the `identity` permission or sign in inside the
  extension.

## Success criteria

1. The gate passes, and its result (with any host permission) is written here.
2. The five outcomes under "Success looks like" hold in Chrome stable.
3. `npm test -w @aibytes/extension` and `npm test --prefix functions` pass.
4. The production manifest's permissions are frozen after this module:
   `storage`, plus only what the gate required.

## Risks

- **Sign-in in the worker fails** (the gate's step 1). Fallback: the worker
  keeps the unused token in `chrome.storage.session` (feature-detected; it
  lives in memory, never on disk) and the popup signs in with it on its next
  open; a token older than an hour is dropped, and the site's reconcile sends
  a fresh one. The merge then runs in the popup.
- **The custom-token user has no profile fields** (the gate's step 4): the
  avatar falls back to the initial from the email, then to a generic one.

## Open questions

None. Decided 22 Nov 2026: the callable serves Google sign-ins only.
