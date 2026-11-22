# Capability map: AIB-76n, the Chrome extension

Status: **approved 21 Nov 2026, with the answers below; revised 22 Nov 2026
after two PR #73 reviews** (Saved's data, the contract's refuse rule, the
subscriber `source` path, the merge, sign-in sync, icons, `app-core`'s list; then the shared session, the CORS gate and the onboarding flag).
Module specs follow in build order once the revisions are accepted. Progress is
tracked in the ticket's checklist.

Source of the work: `.longclaw/tickets/AIB-76n/ticket.md` (goal and statement
of intent, confirmed 20 Nov 2026), and the design decided on 20–21 Nov 2026 in
`docs/decisions/product/AIB-76n-extension-design.md` (A2 B1 C1 D2 E2 F1 G1 H3).
The prototype, `docs/ux/prototypes/AIB-76n-extension/`, is the reference for
layout and behaviour, and its `copy.js` holds the agreed copy: every
reader-facing string below comes from there by key.

## Objective

A popup-first Chrome extension that replaces the existing "AI Bytes" listing
(`faamldnehjdjdobapchedpmldfjjfife`). Selecting its toolbar icon shows today's
edition, ranked as on aibytes.io, with a star on every row that syncs to the
reader's aibytes.io account. aibytes.io gains an onboarding page for new
installs and an install box in its sidebar.

**Who:** aibytes.io readers and newsletter subscribers first, then readers
from launch posts and store search. **Success:** installs on the Chrome Web
Store. The update must also keep the 9 existing users working.

What a reader can do when the map is done:

1. Select the toolbar icon on any tab and see today's edition, ranked, in
   Ledger's list rows, under a header with the date, a ☆ button with the saved
   count (A2), and Sign in (C1). A sticky footer has "{date} · {count} items"
   and "View on Web".
2. Star any row. Signed out, the star is kept in the extension. Signed in, it
   is written to `users/{uid}/saves`, so it shows in Saved on aibytes.io.
3. Press the ☆ button to see every item they have saved: the same list as
   Saved on aibytes.io, one section per edition or weekly issue, newest first,
   ranked inside each, with hidden items left out and the same `leftOutNote`
   line as `/saved`. Press it again to go back to today.
4. Select a row with a gist and read it full size in the popup. "← Today" (or
   "← Saved") is at the top; the star and "View on Web" are in a bar at the
   bottom (D2). A row without a gist opens its source in a new tab.
5. Sign in on aibytes.io, and the extension is signed in too. Sign out there,
   and it is signed out.
6. After installing, land on `aibytes.io/extension-onboarding`. Step 1 is pin,
   with an animation (F1), and ticks itself. Step 2 is sign in, optional, with
   the newsletter box ticked (G1). Then a done card (E2).
7. On aibytes.io without the extension, see the install box in the sidebar
   (H3). It disappears once the extension is installed.

## Why a map rather than one spec

The work splits into groups that ship and are tested apart. They live in
different places: the design system, a new app, a Cloud Function, the site,
and the store dashboard. They also differ in risk: only sign-in adds a
privileged backend call and an IAM grant.

## Modules

| Module id | Responsibility | Depends on |
|---|---|---|
| `ledger-extension-ui` | The new visual pieces, in Ledger, with `.d.ts`, `.prompt.md` and UI kit screens. **Popup:** a header (wordmark, date, saved toggle with count, Sign in or avatar); the sticky footer; the gist view's top bar and bottom action bar (D2). **Onboarding:** the step card ("Step n of 2", number or tick, Optional tag), the pin animation (F1, with its five captions and still under `prefers-reduced-motion`), and the large Google button. **Site:** `ExtensionPromo` (the H3 box) and an optional `promo` slot at the top of `Sidebar`'s footer. **Brand:** the extension icon, the favicon tile, as `ExtensionIcon` for pages, and PNGs rasterised from `apps/web/public/favicon.svg` at 16, 32, 48 and 128 px for the manifest and the store (Chrome takes no SVG for `action` icons). Every option is off by default, so aibytes.io is unchanged | — |
| `app-core` | Move the shared pure modules from `apps/web/src` into a new workspace package, `packages/app-core`, unchanged, with their tests, and point `apps/web` at them. **Ranking:** `rankedItems` and its fallback (`TIE_ORDER`) from `order.js`; `groupedItems` and `X_GROUP` stay in `apps/web`, so `CATEGORIES` does not move. **Visibility:** `inFeed` (not hidden, not an X row) from `filters.js`, alone. **Saves:** `saves.js` (`localSaves`, `readSaves`, `clearSaves`, `asSave`, `sourceOf`), `accountData.js`, `accountSaves.js` (with `mergeInto`), `merge.js`. **Saved list:** `saved.js` (`filesToLoad`, `savedGroups`, `leftOutNote`, `savedFeed`) and the `format.js` dates it uses. **Config:** `firebase-config.js`. **Helpers:** `isRealDate`, `browserStorage`. The extension never imports `apps/web/src`. A refactor with no visible change | — |
| `extension-popup` | `apps/extension` (`@aibytes/extension`): Manifest V3, Vite + React, Ledger, with the manifest `key` below. The popup reads `content/index.json`, the latest edition and `gists/<slug>.json` from `https://aibytes.io/content/`. **Today:** the whole edition goes through `rankedItems` (hidden items included, so standing is over the edition), then `inFeed` filters it; filtering first would reshuffle it. **Saved:** as `/saved`, through `app-core`'s `saved.js`: it loads `weekly/index.json` too, then only the editions and issues the saves name. **Contract:** a file whose `schema_version` is not 1 is refused, with an error state and no rows (`feed.d.ts`). **Gists:** a row without `gist`, or whose gist file 404s, opens its source in a new tab. Every link opens a new tab. **Cache:** the last edition is kept in the popup's `localStorage` (`aibytes-extension-edition`, apart from saves), read synchronously and painted first, then replaced by the fetch. **Saves signed out** live in `chrome.storage.local` (the `storage` permission, which shows no install warning), so the background can merge them (see `extension-auth`): a small adapter loads them before the stars render and gives `localSaves` the synchronous storage it expects. Also: the manifest with only the permissions the build needs, its `key` (so dev builds keep the store ID), the background worker opening onboarding on install only, `npm run dev:extension`, and `npm run package:extension` building the zip | `ledger-extension-ui`, `app-core` |
| `extension-auth` | Signing the extension in, and syncing its saves. **Function:** a callable `aibytesExtensionToken` in `functions/`, which mints a Firebase custom token for the caller's own uid. **Extension:** `externally_connectable` for `https://aibytes.io/*`, and a background handler for the message protocol below. It checks the sender's origin, signs in with `firebase/auth/web-extension`, and answers status questions (installed, version, pinned, signed-in uid). **Merge:** on every successful `signin`, the background runs `mergeInto` with the saves in `chrome.storage.local` and clears them once the batch commits, as the web does on sign-in; the popup retries on open if that write failed or is still in flight. **The session:** `firebase/auth/web-extension` persists the signed-in user in IndexedDB at `chrome-extension://faamldnehjdjdobapchedpmldfjjfife`. The worker signs in once; the popup initialises the same Firebase app and reads `onAuthStateChanged`, with no second token, and so does a worker that Chrome has stopped and restarted. The worker uses that user for the merge, the popup for `accountSaves`. **The gate (the first task):** from an unpacked build, `signInWithCustomToken` and one Firestore read and write, with no Google host permission. If CORS refuses them, this module adds the host permission it needs, records the install warning it brings, and the permission set is frozen here, not in `store-listing`, since a new warning in a later update disables the extension for the 9 existing users until they accept it. **The token:** minted only for `request.auth.uid`; sent only by `sendMessage` to this extension's ID; never logged, stored in Firestore or echoed in a reply; dropped after `signInWithCustomToken`. **Publisher steps, before this module starts:** the IAM grant (*Service Account Token Creator*); ticket item 2.1, `chrome-extension://faamldnehjdjdobapchedpmldfjjfife` added to Firebase Auth's authorised domains; ticket item 2.2, the web API key, which is HTTP-referrer restricted to aibytes.io, changed to allow the extension's origin, with the exact restriction recorded in `AIB-76n-extension-auth.md`. **Origins:** the packaged build accepts messages from `https://aibytes.io` only; `http://localhost:5173` is in the dev build's `externally_connectable` and allowed origins, and `package:extension` builds without it. **Runbook:** `functions/README.md` gains the new function: the list before and after a deploy keeps `aibytesReportSubscribeFailure` and gains `aibytesExtensionToken`; if the CLI offers to delete anything, stop. **The protocol** (the provider side of the contract `site-extension` uses) is specified here | `extension-popup`, `app-core` |
| `site-extension` | The aibytes.io side. **A bridge module** that reconciles on every aibytes.io load and every auth change: it asks the extension for its status; if the site is signed in and the extension's uid is missing or different, it sends `signin` with a fresh token; if the site is signed out and the extension has a uid, it sends `signout`. So a missed message is put right on the next visit. **The onboarding page** at `/extension-onboarding` (a real page, noindex): steps 1 and 2 (E2 F1 G1), the done card, and the not-installed state with "Add to Chrome". The newsletter box subscribes through the AIB-140p path with a new `source`: `subscribe` and `toSubscriberDoc` take a `source` (default `"signin-prompt"`, so the existing prompt is unchanged); `firestore.rules` allows `'signin-prompt'` or `'extension-onboarding'`; emulator tests cover both and refuse anything else. The publisher deploys the rules **before** the site code that writes the new value ships (rules that allow both values break nothing already live). **The install box** (H3) in the sidebar, while the extension is absent, on desktop Chrome only. Umami events for the box and the onboarding steps | `ledger-extension-ui`, `extension-auth` |
| `store-listing` | The update, live. Version `YY.M.D` of the submission day (above 26.1.15). The icon (from the favicon), screenshots, small promo tile, and a name, short description and description written for store search and conversion. The privacy answers (Google account email and uid for sign-in, saved item ids). `/privacy` updated to cover the extension. The permission set is frozen before the zip, since adding a permission that warns in a later update disables the extension for existing users until they accept it. Submit; once live, the footer's "Chrome Extension (soon)" becomes a link to the listing | `extension-popup`, `extension-auth`, `site-extension` |

Out of scope, per the ticket: the new tab (AIB-151m); launch posts and the demo
video (AIB-152d, which reuses this map's screenshots); monetization; content
scripts; category filters and edition switching in the popup; gist reactions in
the extension; browsers other than Chrome; analytics inside the extension.

## Build order

```
ledger-extension-ui ─┐
                     ├─► extension-popup ──► extension-auth ──► site-extension ──► store-listing
app-core ────────────┘
```

1. `ledger-extension-ui` and `app-core`, in either order. Both ship with no
   visible change to aibytes.io.
2. `extension-popup`. A working extension, loaded unpacked, signed out only,
   with local saves. Nothing is published yet.
3. `extension-auth`. The callable is deployed by the publisher (after the IAM
   grant). The extension can be signed in from a dev page or the console.
4. `site-extension`. The site sends tokens, onboarding goes live at its URL,
   and the install box shows. Until the store update is live, the box's "Add
   to Chrome" opens the existing listing, which still installs the old build,
   so the box ships **behind a flag** and turns on with the next module. The
   same flag covers the onboarding page's not-installed "Add to Chrome", and no
   public link points at `/extension-onboarding` until then; an unpacked build's
   `onInstalled` still opens the page for testing.
5. `store-listing`. Submit the update; when Chrome approves it, turn on the
   install box and the footer link in one small PR.

One branch per the repo's rule (`aib-76n-chrome-extension`), one commit per
task, one PR. Specs will be saved beside this file as
`docs/specs/AIB-76n-<module-id>.md`.

## The contract between site and extension (summary)

Detailed in `AIB-76n-extension-auth.md`. The site calls
`chrome.runtime.sendMessage(EXTENSION_ID, message)`. Without the extension, the
call fails (`chrome.runtime.lastError`), and the site treats that as "not
installed". Outside Chrome there is no `chrome.runtime`, so the site treats the
extension as absent and shows nothing about it.

| Message from the site | Reply from the extension |
|---|---|
| `{ type: "status" }` | `{ installed: true, version, pinned, uid \| null }` |
| `{ type: "signin", token }` | `{ ok: true, uid }` or `{ ok: false, code }` |
| `{ type: "signout" }` | `{ ok: true }` |

For step 1's live tick, the onboarding page opens a port
(`chrome.runtime.connect`) and the extension posts `{ pinned }` whenever
`action.onUserSettingsChanged` fires. That event is Chrome 130+; `getUserSettings` is
Chrome 91+. Where the event is missing, the page asks for status every 2
seconds while step 1 shows. The extension accepts messages
only when `sender.origin === "https://aibytes.io"` (plus `http://localhost:5173`
in dev builds only). `EXTENSION_ID` is `faamldnehjdjdobapchedpmldfjjfife` in a
site constant, and the dev build has the same ID through the manifest `key`.

## How it runs (all modules)

**Commands**

```bash
npm install
npm run dev:extension              # watch build into apps/extension/dist; load it unpacked
npm run package:extension          # apps/extension/aibytes-extension-<version>.zip for the store
npm test -w @aibytes/extension     # node --test
npm test -w @aibytes/app-core
npm test -w @aibytes/web
npm run test:rules -w @aibytes/web # emulator: the subscriber source change
npm test --prefix functions
npm run build:web
npm run preview:design-system      # the new Ledger screens in the UI kit
# by the publisher only:
# firebase deploy --only functions:aibytes-web --project ai-bytes-b42d2
# firebase deploy --only firestore:rules --project ai-bytes-b42d2
```

**Structure**

```
apps/extension/
  manifest.json          MV3; minimal permissions; externally_connectable; key
  popup.html, src/popup/ the popup (React)
  src/background.js      onInstalled, onMessageExternal, port, Firebase auth
  src/*.test.js          node --test, pure modules only
packages/app-core/       shared pure modules moved from apps/web/src, and their tests
packages/design-system/  the new Ledger pieces (ledger-extension-ui)
apps/web/src/            extensionBridge.js, the onboarding page, the install box wiring
functions/               aibytesExtensionToken beside aibytesReportSubscribeFailure
```

**Code style:** as `apps/web`. Each module has a short header naming its spec.
Pure logic goes in its own file so `node --test` covers it without Chrome or
Firebase. Chrome APIs are injected, so the background handler is tested with a
fake `chrome`. The shape, from the web app's `saves.js`:

```js
// Answers aibytes.io's messages (spec AIB-76n extension-auth). `chrome` and
// `auth` are passed in so node --test drives this exact code with fakes.
export function handleExternal(message, sender, { chrome, auth, allowedOrigins }) {
  if (!allowedOrigins.includes(sender.origin)) return { ok: false, code: "origin" };
  ...
}
```

**Testing:** `node --test` for pure modules in every package, plus the
background handler against a fake `chrome`. The Firestore emulator covers the
rules change. Each module ends with a manual check: the extension loaded
unpacked in Chrome, in light and dark, against the live `content/`.

**Boundaries**

- *Always:* read only contract fields and ignore unknown ones, and refuse a
  file with an unknown `schema_version` (the extension cannot be hotfixed);
  rank the whole file, then filter; feature-detect every Chrome API used; keep copy in one
  table per surface, taken from the prototype's `copy.js`; run every package's
  tests before a commit.
- *Ask first:* nothing for permissions while building (answer 1; the set
  starts as `storage` alone), but none added once 26.x ships; any new
  dependency beyond `firebase` in the extension; any change to
  `firestore.rules` beyond the one `source` value; anything sent to the store.
- *Never:* commit the store's private key or any credential (the manifest `key`
  is the public key and is fine); load remote code in the extension; reference
  aiBytes-hub; deploy functions or rules (the publisher does); rename a content
  field.

## Success criteria for the map

- The 7 reader outcomes above work in Chrome stable with the live `content/`.
- `manifest.json` requests only the permissions the build uses, each with its
  reason in the module spec and the store's justification text.
- The popup paints the cached edition from `localStorage` within 100 ms of
  opening, and the fresh one once it loads.
- Saved in the popup and `/saved` on aibytes.io list the same items for the
  same account.
- A star made in the popup while signed in shows in Saved on aibytes.io (after
  a reload there), and the other way round.
- Signing out on aibytes.io signs the extension out; the next popup shows Sign
  in.
- After a sign-in, close the popup, let the worker stop, and reopen the popup
  without visiting aibytes.io: it is still signed in, and a star still writes
  to `users/{uid}/saves`.
- The store zip's manifest and handler accept `https://aibytes.io` only.
- The install box never shows to a reader with the extension, nor outside
  Chrome.
- The update installs over 26.1.15 for existing users without opening
  anything. A new install opens onboarding once.

## Assumptions

Correct any of these now; the module specs are written on them.

1. **Minimal permissions, added as needed.** The content is served with
   `access-control-allow-origin: *` (checked live on 22 Nov 2026 on
   `/content/index.json`, with `cache-control: max-age=600`), so no host
   permission; `getUserSettings`, `tabs.create`, `onInstalled` and
   `onMessageExternal` need none; `externally_connectable` is a manifest key,
   not a permission. The set is `storage` alone (assumption 2). A module may add
   one when the build needs it (answer 1); the spec names it and why.
2. **Saves signed out live in `chrome.storage.local`,** not the popup's
   `localStorage`, because the background service worker has no
   `localStorage` and must merge them the moment a sign-in arrives (as the web
   merges as soon as it sees a uid). That needs the `storage` permission, which
   shows no install warning. Only the edition cache stays in `localStorage`,
   for a synchronous first paint.
3. **The popup's Sign in opens `aibytes.io/extension-onboarding?step=signin`,**
   which shows step 2 alone. Signing in there sends the token as any sign-in
   does.
4. **No sign-out in the popup.** The avatar shows who is signed in (its title).
   Signing out happens on aibytes.io and is mirrored.
5. **"View on Web"** opens `https://aibytes.io/<date>`, or `/gists/<slug>` from
   a gist, with `?utm_source=chrome-extension` so Umami counts the visits.
6. **The newsletter box** subscribes with `source: "extension-onboarding"`, so
   the subscriber export can tell where signups came from. The rule allows
   both values.
7. **The install box shows only on desktop Chrome.** Chrome on a phone can't
   install extensions, so it never shows in the phone drawer (this narrows the
   decision record, which said it would). After "Not now" it stays hidden for
   30 days, kept in `localStorage`.
8. **Onboarding opens on `install` only** (answer 4). An `update`, including
   the one from 26.1.15, opens nothing.
9. **The custom token carries no extra claims.** The extension's session is the
   reader's own uid, so the saves rules work unchanged. Reactions are not in the
   extension, so their `google.com` provider check doesn't matter.

## Risks

- **Firebase Auth in an MV3 service worker.** `firebase/auth/web-extension`
  (in the installed `firebase` 13.2.0) is meant for this, but sign-in from the
  worker is a spike, the first task of `extension-auth`. If it fails, the
  fallback is for the worker to keep the unused token in
  `chrome.storage.session`, feature-detected (Chrome 102+; a worker's memory
  does not last; custom tokens
  expire after an hour) and for the popup to sign in with it on its next open;
  after an hour the bridge's reconcile sends a fresh one.
- **The publisher's Firebase steps.** `createCustomToken` needs the functions'
  service account to hold *Service Account Token Creator*; Firebase Auth needs
  `chrome-extension://faamldnehjdjdobapchedpmldfjjfife` as an authorised domain
  (Firebase's Chrome-extension guide); and a referrer-restricted API key would
  refuse the extension. `extension-auth` waits on all three.
- **XSS on aibytes.io** could ask the callable for a token and hand it to the
  extension, but it could already act as the signed-in reader on the site, so
  the extension adds no new reach. Pages outside `externally_connectable`'s
  `matches` cannot message the extension at all.
- **The store review** can take days, and asks for a justification for
  `externally_connectable`. `store-listing` writes that text.
- **The popup bundle.** React, Ledger and the Firebase modules are bundled
  (MV3 allows no remote code). The build records the size; the popup must stay
  usable on first paint without Firebase, which loads after it, as on the web.

## Answers (21 Nov 2026)

1. **Permissions:** no hard rule of none. Add a permission when the build needs
   it; the module spec says which and why.
2. **The rules change** for `source: "extension-onboarding"` is approved.
3. **The experience** in assumptions 3, 4, 5 and 7 is agreed.
4. **Onboarding opens once, on install only.** Existing users updating from
   26.1.15 get nothing opened.
5. **The manifest `key`** (public, from the dashboard; it gives the ID
   `faamldnehjdjdobapchedpmldfjjfife`, checked):

   ```
   MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxPHtR6Mr6q8jKMI3ikRUPZh5Zk9qkdTBRgz9mCTXSCSx2Bky1zaexCtLsZuiMrCVai2mA3k3pC5jGQgaIN4fRvQYTktDp1/51eYOzhEaiWzTXRzHLhDLgVUDo/EZwDIpy6N0qklmdAI99QCGmaYd83D2bEsbqjxOQcaNXrHoXm0G5vVOlASKlG2iALeRqickCM3YmxnZSq+j1QUk03N3f13rgpYZ8zE+Oo2JtWxk1Hz08EC30IbnyNDH7bGmxeNTSLcLQQnUW+qvo1GqWjGATAw5Pt3624lk98E62Kj20bYAZ0BhuWk3OEoOkag9o1kErMlF5CxFEin4epSK3yawRwIDAQAB
   ```
6. **`packages/app-core`** is approved.
7. **The store name is "aiBytes – AI News Feed for Developers".** No underscore
   in the store name, so a search for "aibytes" matches; no superlatives, and no
   third-party names in the title (they go in the description).
   `AIB-76n-store-listing.md` writes the rest of the listing around it.

## Answers after the review (22 Nov 2026)

8. **Saved in the popup lists every save,** the same list as `/saved` on
   aibytes.io (review point 1, confirmed).
9. **The authorised domain** `chrome-extension://faamldnehjdjdobapchedpmldfjjfife`
   is a publisher step before `extension-auth`: ticket item 2.1.
10. **The web API key is HTTP-referrer restricted to aibytes.io.** The
    extension's Auth and Firestore calls would be refused until the key allows
    the extension. Confirming and changing that is ticket item 2.2, before
    `extension-auth`; its spec records how the key is set.
