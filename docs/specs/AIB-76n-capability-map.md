# Capability map: AIB-76n, the Chrome extension

Status: **draft, 21 Nov 2026, for review.** Module specs follow in build order
once this map is approved. Progress is tracked in the ticket's checklist.

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
3. Press the ☆ button to see their saved items. Press it again to go back.
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
| `ledger-extension-ui` | The new visual pieces, in Ledger, with `.d.ts`, `.prompt.md` and UI kit screens. **Popup:** a header (wordmark, date, saved toggle with count, Sign in or avatar); the sticky footer; the gist view's top bar and bottom action bar (D2). **Onboarding:** the step card ("Step n of 2", number or tick, Optional tag), the pin animation (F1, with its five captions and still under `prefers-reduced-motion`), and the large Google button. **Site:** `ExtensionPromo` (the H3 box) and an optional `promo` slot at the top of `Sidebar`'s footer. **Brand:** the extension icon, the favicon tile, as `ExtensionIcon`. Every option is off by default, so aibytes.io is unchanged | — |
| `app-core` | Move the shared pure modules from `apps/web/src` into a new workspace package, `packages/app-core`, unchanged, with their tests: `order.js` (`rankedItems`), `saves.js` (`localSaves`, `readSaves`, `clearSaves`), `accountData.js`, `accountSaves.js` (with `mergeInto`), `merge.js`, `firebase-config.js`, and the few helpers they import (`isRealDate`, `browserStorage`). `apps/web` imports them from there. A refactor with no visible change | — |
| `extension-popup` | `apps/extension` (`@aibytes/extension`): Manifest V3, Vite + React, Ledger. The popup reads `content/index.json`, the latest edition and `gists/<slug>.json` from `https://aibytes.io/content/`. It shows visible items in `rankedItems` order, the Saved toggle, the gist view, and local saves. Every link opens a new tab. The last edition is cached so the popup paints at once. Also: the manifest with no permissions, its `key` (so dev builds keep the store ID), the background worker opening onboarding on install, `npm run dev:extension`, and `npm run package:extension` building the zip | `ledger-extension-ui`, `app-core` |
| `extension-auth` | Signing the extension in, and syncing its saves. **Function:** a callable `aibytesExtensionToken` in `functions/`, which mints a Firebase custom token for the caller's own uid. **Extension:** `externally_connectable` for `https://aibytes.io/*`, and a background handler for the message protocol below. It checks the sender's origin, signs in with `firebase/auth/web-extension`, and answers status questions (installed, version, pinned, signed-in uid). **Popup:** uses the account store while signed in, and merges local saves into the account on the first open after sign-in. **The protocol** (the provider side of the contract `site-extension` uses) is specified here | `extension-popup`, `app-core` |
| `site-extension` | The aibytes.io side. **A bridge module:** asks the extension for its status, sends a token after every sign-in (and on load, when the site is signed in and the extension isn't, or is signed in as someone else), and sends sign-out. **The onboarding page** at `/extension-onboarding` (a real page, noindex): steps 1 and 2 (E2 F1 G1), the done card, and the not-installed state with "Add to Chrome". The newsletter box subscribes through the AIB-140p path with a new `source`, `"extension-onboarding"`, which needs a rules change. **The install box** (H3) in the sidebar, while the extension is absent, on desktop Chrome only. Umami events for the box and the onboarding steps | `ledger-extension-ui`, `extension-auth` |
| `store-listing` | The update, live. Version `YY.M.D` of the submission day (above 26.1.15). The icon (from the favicon), screenshots, small promo tile, and a name, short description and description written for store search and conversion. The privacy answers (Google account email and uid for sign-in, saved item ids). `/privacy` updated to cover the extension. Submit; once live, the footer's "Chrome Extension (soon)" becomes a link to the listing. Product spec §9 rewritten | `extension-popup`, `extension-auth`, `site-extension` |

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
   so the box ships **behind a flag** and turns on with the next module.
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
`action.onUserSettingsChanged` fires. Where that event is missing, the page asks
for status every 2 seconds while step 1 shows. The extension accepts messages
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
  manifest.json          MV3; no permissions; externally_connectable; key
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

- *Always:* read only contract fields and ignore unknown ones (the extension
  cannot be hotfixed); feature-detect every Chrome API used; keep copy in one
  table per surface, taken from the prototype's `copy.js`; run every package's
  tests before a commit.
- *Ask first:* any extension permission (the target is none); any new
  dependency beyond `firebase` in the extension; any change to
  `firestore.rules` beyond the one `source` value; anything sent to the store.
- *Never:* commit the store's private key or any credential (the manifest `key`
  is the public key and is fine); load remote code in the extension; reference
  aiBytes-hub; deploy functions or rules (the publisher does); rename a content
  field.

## Success criteria for the map

- The 7 reader outcomes above work in Chrome stable with the live `content/`.
- `manifest.json` requests no permissions and no host permissions. The store's
  install dialog shows no warning.
- The popup shows a cached edition within 100 ms of opening, and the fresh one
  once it loads.
- A star made in the popup while signed in shows in Saved on aibytes.io (after
  a reload there), and the other way round.
- Signing out on aibytes.io signs the extension out; the next popup shows Sign
  in.
- The install box never shows to a reader with the extension, nor outside
  Chrome.
- The update installs over 26.1.15 for existing users and opens onboarding once.

## Assumptions

Correct any of these now; the module specs are written on them.

1. **No permissions at all.** The content is served with
   `access-control-allow-origin: *`, and `getUserSettings`, `tabs.create` and
   `onInstalled` need none. That is stricter than the ticket's "host access to
   aibytes.io only", and means a warning-free install.
2. **Saves signed out live in the popup's `localStorage`** (the extension's own
   origin), through `localSaves` from `app-core`, so no `storage` permission is
   needed. The merge into the account runs in the popup, on its first open
   after a sign-in, as on the web.
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
8. **Onboarding opens on `install`, and on the `update` from 26.1.15 only once**
   (a version check, so later updates never open it).
9. **The custom token carries no extra claims.** The extension's session is the
   reader's own uid, so the saves rules work unchanged. Reactions are not in the
   extension, so their `google.com` provider check doesn't matter.

## Risks

- **Firebase Auth in an MV3 service worker.** `firebase/auth/web-extension`
  (in the installed `firebase` 13.2.0) is meant for this, but sign-in from the
  worker is a spike, the first task of `extension-auth`. If it fails, the
  fallback is for the worker to keep the token for one hour (custom tokens
  expire after that), and for the popup to sign in on its next open.
- **The IAM grant.** `createCustomToken` needs the functions' service account
  to hold *Service Account Token Creator*. That is a one-time grant by the
  publisher, and `extension-auth` waits on it.
- **The store review** can take days, and asks for a justification for
  `externally_connectable`. `store-listing` writes that text.
- **The popup bundle.** React, Ledger and the Firebase modules are bundled
  (MV3 allows no remote code). The build records the size; the popup must stay
  usable on first paint without Firebase, which loads after it, as on the web.

## Open questions (the publisher's)

1. **The manifest `key`:** please copy the public key from the developer
   dashboard (Package → View public key). It is public, and lets the unpacked
   dev build keep the store ID.
2. **Store name:** keep "AI Bytes", or rename to "aiBytes_: daily AI news,
   ranked" (or similar) for search? `store-listing` drafts options either way.
3. **`app-core` as a package,** or should the extension import from `apps/web`
   directly for v1? The package is cleaner and costs one refactor PR.
