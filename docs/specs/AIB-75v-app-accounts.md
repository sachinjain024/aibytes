# Spec: AIB-75v, module 4 `app-accounts`

Status: **approved 8 Nov 2026**, with decisions 1-3. Module 4 of 4 in
`docs/specs/AIB-75v-capability-map.md`. Builds on `app-local-saves` (#56) and
`app-saved-view` (#57, merged as `95a71bc`). Design: B2, C2 and the Saved
view's signed-in lines in
`docs/decisions/product/AIB-75v-saves-and-sign-in-design.md`. Product spec §8.

## Objective

Readers can sign in with Google and keep their saves across browsers and
devices. Sign in is always offered while signed out (B2). While signed out
with at least one save, the sticky banner says saves live in this browser only
(C2). Signing in moves this browser's saves into the account (a union), clears
them from local storage, and says how many were added.

Who: a reader who saves items and uses more than one browser or device. Why:
product spec §8, "Sign in with Google to keep them across devices."

Success looks like:

- Sign in in the header opens Google's sign-in; afterwards the header shows the
  reader's avatar (Google photo, or their initial), with a menu holding their
  name, "Signed in with Google", Saved and Sign out.
- Signed in, every star and the Saved page read and write the account. A save
  made on one device shows on another without a reload.
- On sign-in, local saves are merged into the account and local storage is
  cleared; the Saved page then says "3 saves from this browser were added to
  your account." once.
- Signing out leaves the browser with no saves shown (they live in the
  account), and the app works as signed out again.
- Only the signed-in reader can read or write their own saves: enforced by
  Firestore security rules, not by the client.
- A short privacy page at **aibytes.io/privacy** says what signing in
  collects and where it is kept, and is the consent screen's privacy URL.

### Not in this module

- Save counts or "most saved" (`stats/{editionDate}`): later, per §8.
- Any sign-in provider but Google.
- The Chrome extension (read-only in v1).
- The two visual points left from module 3 (category counts showing "–" on
  `/saved`; the page title in the section-heading style): a Ledger follow-up.

## Prerequisites (the publisher's)

The ticket's "Firebase project created" item, before T-build starts:

1. A Firebase project for aibytes.io, a **web app** registered in it, and its
   `firebaseConfig` (apiKey, authDomain, projectId, appId; the rest optional).
   These values are public by design: they identify the project, they grant
   nothing, and the security rules do the guarding.
2. **Authentication → Google** enabled; **Authorised domains** include
   `aibytes.io` and `localhost`.
3. **Firestore** created in production mode, with its location chosen.
4. The Firebase CLI installed and logged in on the dev machine
   (`npm install -g firebase-tools`, `firebase login`).
5. The **OAuth consent screen** (Google Cloud console) with the app name,
   support email and the privacy policy URL `https://aibytes.io/privacy`
   (decision 3), once that page is live.

## Data

Firestore, as §8 and the map say, with the module-2 fields:

```
users/{uid}/saves/{itemId}
  item_id:      string   (= the document id)
  edition_date: string   "YYYY-MM-DD"     ┐ exactly one
  issue_slug:   string   "issue-N"        ┘
  created_at:   timestamp
```

Nothing else is stored about the reader. Their name and photo come from the
Google sign-in on each load and are never written to Firestore.

## Security rules (`firestore.rules`, repo root)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/saves/{itemId} {
      allow read, delete: if request.auth != null && request.auth.uid == uid;
      allow create, update: if request.auth != null && request.auth.uid == uid
        && isSave(request.resource.data, itemId);
    }
    // Everything else is closed.
  }
  function isSave(d, itemId) {
    return d.item_id == itemId && itemId.size() <= 200
      && d.created_at is timestamp
      && ((d.keys().hasOnly(['item_id', 'edition_date', 'created_at'])
           && d.edition_date is string && d.edition_date.matches('^[0-9]{4}-[0-9]{2}-[0-9]{2}$'))
       || (d.keys().hasOnly(['item_id', 'issue_slug', 'created_at'])
           && d.issue_slug is string && d.issue_slug.matches('^issue-[0-9]+$')));
  }
}
```

- Owner only; no listing of other users; nothing outside
  `users/{uid}/saves` is readable or writable.
- Every written document is exactly the save shape, so the collection cannot
  be used as free storage.
- **Deployed by hand** from the dev machine (map decision 2), after review:
  `firebase deploy --only firestore:rules --project <project-id>`. No token
  in GitHub, no workflow. `firebase.json` and `.firebaserc` (project id only)
  are committed so the command needs no flags but `--project`.

## The account store

`apps/web/src/accountSaves.js`, the same interface as `localSaves`:

```js
export function accountSaves(firestore, uid) {
  return { list, has, toggle, subscribe };
}
```

- `subscribe` / `list`: one `onSnapshot` on `users/{uid}/saves`, ordered by
  `created_at` descending, mapped to the module-2 shape
  (`created_at` as an ISO string). `list()` keeps its array identity until a
  snapshot changes it (the `useSyncExternalStore` rule from T6).
- `toggle(item, from)`: `setDoc` or `deleteDoc`. Firestore applies the write
  to the local snapshot at once (latency compensation), so the star fills
  without waiting on the network; a rejected write reverts it. Returns
  `{ saved, kept: true }` immediately; `kept` is not used by the app.
- The same validation of `from` as `localSaves` (exactly one valid source).
- A small pure part (`toSave(doc)`, `toDoc(item, from, now)`) is split out
  so `node --test` covers the mapping without Firebase.

## Signing in, and the merge

`apps/web/src/account.js` owns Firebase: it initialises the app from
`firebase-config.js`, exposes `signIn()`, `signOut()` and
`onUser(listener)`. It is imported normally and loads on every page
(decision 1), so a returning reader's session restores without a hint.

- **Sign in:** `signInWithPopup` with the Google provider. The reader
  closing the popup does nothing; any other failure shows "Could not sign in.
  Try again." as a status line under the header, dismissed on the next action.
- **The store follows the user:** `App` holds the current store, `localSaves`
  while signed out and `accountSaves(uid)` while signed in, and passes it down
  as today. `useSaves` already re-subscribes when the store changes.
- **Merge, on every sign-in with local saves** (not only the first: saves made
  signed out after signing out are merged the next time):
  1. Read the account's saves once.
  2. Batch-write each local save the account lacks, keeping its
     `created_at`. Saves the account already has keep the account's copy.
  3. Only after the batch commits, clear `aibytes-saves`.
  4. Remember the number added for this page view; the Saved page shows the
     line once ("1 save from this browser was added to your account." / "3
     saves ... were added ..."), and nothing when it is 0.
  A failed batch leaves local storage untouched, so the next sign-in retries.
- **Sign out:** `signOut`; the store goes back to `localSaves`, which is
  empty after a merge.
- **A returning reader:** Firebase keeps the session in IndexedDB. While it
  is restoring, the header shows neither Sign in nor the avatar, so it does
  not flash Sign in for a reader who is signed in.

## UI wiring (`App.jsx`)

All Ledger options already exist (`ledger-saves-ui`):

- `AppHeader`: `onSignIn`; `user={{ name, photoUrl }}` and `onSignOut` when
  signed in; `onSaved` opens `/saved`.
- `SaveBanner sticky`, straight after `AppHeader`, when signed out, with at
  least one save, not dismissed this session (a `sessionStorage` flag,
  through the same safe-storage helper), and **not on `/saved`** (C2).
  Its Sign in link calls `signIn()`.
- `/saved` lines (design record), restoring what module 3 left out:
  - signed out, not empty: "Stored in this browser only. **Sign in with
    Google** to keep them across devices." (a link that signs in);
  - signed in, not empty: "Synced to your Google account.";
  - the empty state's last line: "Saves stay in this browser until you sign
    in with Google." or, signed in, "Your saves sync to your Google account.";
  - the merge line, once, after a sign-in that added saves.

## Tech stack

- `firebase` (the modular SDK, current major 13) added to **`apps/web`**
  `dependencies`, the one new runtime dependency (map assumption 5). It loads
  on every page (decision 1); the build check records its gzipped size.
- `@firebase/rules-unit-testing` as an **`apps/web` dev dependency**, for the
  rules tests only (decision 2). Only
  `firebase/app`, `firebase/auth` and `firebase/firestore` are imported.
- The stray `firebase` entry in the **root** `package.json` (uncommitted, not
  from this work) is not used: it is reverted before T-build starts.
- `firebase-tools` stays a global CLI on the dev machine, not a dependency.

## Commands

```bash
npm install -w @aibytes/web firebase
npm test -w @aibytes/web
npm run build:web
npm run dev:web                                          # localhost is an authorised domain
firebase deploy --only firestore:rules --project <id>   # by hand, after review
# Rules tests (decision 2), skipped when the emulator or Java is missing:
npm run test:rules -w @aibytes/web
```

## Project structure

```
apps/web/src/firebase-config.js     the public firebaseConfig (new)
apps/web/src/account.js             Firebase init, signIn, signOut, onUser (new, lazy)
apps/web/src/accountSaves.js        the account store (new)
apps/web/src/accountSaves.test.js   its pure mapping (new)
apps/web/src/merge.js, merge.test.js  which local saves to add; the line's wording (new, pure)
apps/web/src/App.jsx                the store switch, header, banner, Saved lines, PrivacyApp
apps/web/src/route.js, pageMeta.js  the /privacy route and its head (indexable)
apps/web/vite.config.js             dist/privacy/index.html
apps/web/rules.test.js              Firestore rules against the emulator (new)
firestore.rules, firebase.json, .firebaserc   rules and their deploy config (new, repo root)
```

## Code style

As the rest of `apps/web/src`: pure modules with `node --test` tests wherever
the logic allows; Firebase calls kept to `account.js` and `accountSaves.js`;
no Firebase import in a component.

## Testing strategy

- **Pure, `node --test`:** `toSave` / `toDoc` mapping (both source kinds,
  timestamps both ways); `merge.js` (local minus account, created_at kept,
  nothing to add, the line's singular and plural); the banner's show rule
  (signed out × saves × dismissed × page).
- **Rules** (decision 2): `rules.test.js` with `@firebase/rules-unit-testing`
  against the Firestore emulator, run by `npm run test:rules`: the owner reads
  and writes, another user and a signed-out reader denied, a bad shape denied
  on create and update, extra fields denied, anything outside the path
  denied. It skips with a message when the emulator or Java is missing, like
  `tests/test_thumbnail.py`, and is not part of `npm test`.
- **Privacy page:** the route, its built page and head in `route.test.js`
  and `pageMeta.test.js`; the copy reviewed by the publisher in the PR.
- **Browser** (`npm run dev:web` on localhost, a real Google account):
  sign in and out; the avatar and its menu; the banner's rules including
  dismissal and `/saved`; merge with 3 local saves into an account holding 1
  of them (added: 2, local cleared, line shown once); a save on one browser
  appearing in another; a reload while signed in (no Sign in flash);
  `/privacy` from the footer and the Sidebar.
- **Production check after deploy:** sign in on aibytes.io once.

## Boundaries

- **Always:** rules reviewed before they are deployed; clear local storage
  only after a merge commits; keep `account.js` the only Firebase entry point.
- **Ask first:** deploying the rules (the publisher runs it); any Firebase
  product beyond Auth and Firestore (Analytics, App Check, Functions); any
  dev dependency beyond the rules-testing kit; storing anything about the
  reader beyond saves.
- **Never:** a service-account key, deploy token or CI secret in the repo;
  Firestore open to unauthenticated reads or writes, even briefly; analytics
  on sign-in or saves; referencing `aiBytes-hub`.

## Success criteria

1. Sign in, the avatar menu and Sign out work on localhost and aibytes.io.
2. Signed in, saves read and write `users/{uid}/saves`, appear on a second
   device without a reload, and the Saved page reads them.
3. The merge adds exactly the missing local saves, clears local storage only
   after it commits, and shows the line once.
4. The banner shows exactly when C2 says.
5. The deployed rules allow the owner and deny everything listed above.
6. `/privacy` is a real, indexable page linked from the Sidebar's links and
   used as the consent screen's privacy URL.
7. The full check list passes.

## The privacy page (`/privacy`, decision 3)

A real, indexable page in the build (like `/weekly`), in the same shell,
linked from the Sidebar's links beside Suggest a link and Advertise. Plain
text, short, in the newsletter's voice. It says:

- **Without signing in:** saves stay in this browser's local storage; nothing
  leaves it. The site sets no cookies and runs no analytics.
- **Signing in with Google** gives aiBytes_ your name, email address and
  profile photo through Firebase Authentication (Google). The name and photo
  are shown in the header; the email is not used for anything else.
- **Saves** are stored in Google Cloud Firestore under your account, readable
  only by you. Each is an item id, the edition date or issue slug, and when
  you saved it.
- **Deleting:** unstar to delete a save; email the publisher to delete the
  account and its saves.
- **The newsletter** is on Substack, under Substack's own policy; signing in
  does not subscribe you.
- Contact, and the date it was last changed.

The publisher reviews the wording in the PR before it ships; it is the URL
Google's consent screen points to.

## Decisions (answered 8 Nov 2026)

1. **Firebase loads on every page** (option b). Simpler, and a returning
   reader's session restores without a local hint. Its size is measured in
   the build check.
2. **The rules get emulator tests** (option a), skipped when the emulator or
   Java is missing.
3. **A short `/privacy` page** is part of this module, as above.

4. **Saves get their own named Firestore database, `aibytes`** (answered 9
   Nov 2026). Project `ai-bytes-b42d2` already had a `(default)` database
   from November 2025, and a database has one rules file, so deploying ours
   there could break whatever uses it. `aibytes` was created in us-central1
   (like the default) with delete protection, closed until the rules are
   deployed. `firebase.json` targets only it; the client opens it with
   `getFirestore(app, FIRESTORE_DATABASE)`.

## Open questions

None. The "Subscribe to the weekly newsletter" prompt after sign-in is a fast
follow-up, AIB-140p, built on this module once it is merged.
