# Task list: AIB-76n

Plan: `docs/plans/AIB-76n-plan.md`. Specs: `docs/specs/AIB-76n-*.md`. Each
task is one commit on `aib-76n-chrome-extension` and one ticket item (in
brackets). Every task also runs the suites it touches and leaves them green.

Common checks, named below by letter:

- **(A)** `npm test -w @aibytes/app-core`, `npm test -w @aibytes/web`,
  `npm test -w @aibytes/design-system`, `npm test -w @aibytes/extension`
  (once it exists), `npm test --prefix functions`
- **(B)** `npm run test:rules -w @aibytes/web` (the emulator)
- **(C)** `npm run build:web`
- **(D)** `python3 -m unittest discover -s tests -v` with `AIBYTES_SKIP_LIVE=1`

---

## Phase 1: foundations

## T1 [3.1]: `packages/app-core` with the display modules

**Description:** Create `@aibytes/app-core` (`exports {"./*":"./src/*"}`,
`node --test`). Move `rankedItems` and `TIE_ORDER` to `order.js` (`groupedItems`
and `X_GROUP` stay in the web), `inFeed` to `visibility.js`, plus `format.js`,
`browserStorage` (now `storage.js`), `isRealDate` (now `dates.js`) and
`blocked-storage.js`, each with its tests. Update every importer, with no shims.
`tests/test_curate_edition.py` reads the new `order.js` path.

**Acceptance criteria:**
- [ ] The moved tests run in app-core, and the total test count across web and app-core equals the count before the move
- [ ] No file in `apps/web/src` re-exports a moved function
- [ ] `dist/` from `build:web` is the same before and after, apart from hashed names

**Verification:** (A), (C), (D); `npm run dev:web`, then check a dated edition
in ranked and grouped views, with filters.

**Dependencies:** None. **Files:** `packages/app-core/{package.json,src/*}`;
`apps/web/package.json` (the workspace dependency); moved whole: `format.js`,
`format.test.js`, `blocked-storage.js`; split (a name leaves, its cases move):
`order.js`, `order.test.js`, `filters.js`, `filters.test.js`, `prefs.js`,
`prefs.test.js`, `route.js`, `route.test.js`; import lines only:
`gistSite.js`, `saves.js`, `saves.test.js`, `saved.js`, `App.jsx` (all under
`apps/web/src/`, the set found by grepping for every moved name on 22 Nov
2026; grep again before the commit); `tests/test_curate_edition.py`.
**Scope:** M (many files, but most changes are moves or one import line)

## T2 [3.2]: app-core's account modules

**Description:** Move `saves.js`, `accountData.js`, `accountSaves.js`,
`merge.js`, `saved.js` and `firebase-config.js`, with their tests, into
app-core. Add app-core's own `test:rules` for `accountSaves.test.js` on the
emulator, and drop that file from the web's `test:rules` list. Add `firebase`
as a peer dependency. Update `account.js`, `App.jsx` and the other importers.

**Acceptance criteria:**
- [ ] The test count is unchanged, including the emulator suites
- [ ] Signing in on `npm run dev:web` still merges local saves and syncs stars
- [ ] `/saved` renders the same list as before

**Verification:** (A), (B), `npm run test:rules -w @aibytes/app-core`, (C).

**Dependencies:** T1. **Files:** `packages/app-core/{package.json,src/*}`;
`apps/web/package.json` (`test:rules` list); moved with their tests:
`saves.js`, `accountData.js`, `accountSaves.js`, `merge.js`, `saved.js`,
`firebase-config.js`; import lines only: `account.js`, `App.jsx` (including
its dynamic `import("./accountSaves.js")`), `hooks.test.js` (`localSaves`,
`SAVES_KEY`). Grep for every moved path before the commit. **Scope:** M

## T3 [3.3]: Ledger's `ExtensionIcon` and the Chrome PNGs

**Description:** Add `components/extension/ExtensionIcon` (`.jsx`, `.d.ts`,
`.prompt.md` and a test). `scripts/extension-icons.mjs` renders
`apps/web/public/favicon.svg` with headless Chrome to
`assets/extension/icon-{16,32,48,128}.png`, which are committed.

**Acceptance criteria:**
- [ ] Four square PNGs, transparent outside the tile
- [ ] `ExtensionIcon` is `aria-hidden` without `title`, and is the same in both themes

**Verification:** (A), and view the PNGs at 1× and 2×.

**Dependencies:** None. **Files:** `packages/design-system/components/extension/ExtensionIcon.*`, `scripts/extension-icons.mjs`, `assets/extension/*.png`. **Scope:** S

## T4 [3.4]: Ledger's popup components and kit page 19

**Description:** Add `PopupHeader` (saved toggle A2, Sign in, and the avatar
with its menu: name, email, Sign out), `PopupFooter`, `PopupGistBar` and
`PopupActionBar`, with their `ldg-popup-*` CSS. Add kit page
`19-extension-popup.html` with Today, Saved, empty Saved and the gist view,
signed out and signed in.

**Acceptance criteria:**
- [ ] The tests cover `aria-pressed` on the toggle, avatar vs Sign in, and the menu (Esc, an outside click, focus returning to the avatar)
- [ ] Kit page 19 matches prototype v14 at 400px, in light and dark
- [ ] Every control has a visible focus ring

**Verification:** (A), (D) (`test_design_system`), `npm run preview:design-system`.

**Dependencies:** T3. **Files:** `components/extension/Popup*.*`, `components/components.css`, `ui_kits/aibytes-app/{19-extension-popup.html,App.jsx,README.md}`. **Scope:** M

## T5 [3.5]: Ledger's onboarding components, `Button size="lg"`, kit page 20

**Description:** Add `OnboardingStep` and `PinAnimation` (five frames in code,
with a still frame and a numbered list under reduced motion), and `size="lg"`
on `Button`. Add kit page `20-extension-onboarding.html` with step 1, step 2
(also already signed in, with Continue and Use a different account), the
signed-out view, done, and not installed.

**Acceptance criteria:**
- [ ] `Button` without `size` renders the same markup as before (a snapshot test)
- [ ] The step's tick when `done`, "Step 2 of 2", and the reduced-motion list are tested
- [ ] Kit page 20 matches the prototype at 1280 and 390, in light and dark

**Verification:** (A), (D), the kit preview.

**Dependencies:** T3. **Files:** `components/extension/{OnboardingStep,PinAnimation}.*`, `components/forms/Button.*`, `components.css`, kit page 20. **Scope:** M

## T6 [3.6]: Ledger's `ExtensionPromo`, `Sidebar promo`, kit page 21, guideline

**Description:** Add `ExtensionPromo` (H3) and `promo` on `Sidebar` (first in
`.sidebar-footer`). Add kit page `21-install-box.html`. Rewrite the extension
section of `extending-ledger.md` for the popup, and list the new components in
`readme.md`.

**Acceptance criteria:**
- [ ] `Sidebar` without `promo` renders the same markup as before (a snapshot test)
- [ ] The box's link opens in a new tab; "Not now" calls `onDismiss`
- [ ] Kit page 21 matches H3 in the rail at 1280 px

**Verification:** (A), (D), (C) unchanged, the kit preview.

**Dependencies:** T3. **Files:** `components/extension/ExtensionPromo.*`, `components/navigation/Sidebar.*`, kit page 21, `guidelines/extending-ledger.md`, `readme.md`. **Scope:** M

### Checkpoint 1
- [ ] (A) to (D) pass, and `build:web` is unchanged
- [ ] The publisher reviews kit pages 19 to 21

---

## Phase 2: the popup, signed out

## T7 [3.7]: `apps/extension` scaffold, manifest, fonts, onboarding on install

**Description:** Create `@aibytes/extension` with Vite 7: inputs `popup.html`
and `src/background.js`, plus `manifest.config.js` (mode-aware: the `key`,
`storage`, the PNG icons, `default_popup`). A font plugin strips the Google
`@import` and bundles the Inter and Bricolage Grotesque woff2 files from
`@fontsource/*` (dev dependencies). `background.js` opens the onboarding URL on
`install` only. The popup shows a placeholder header.

**Acceptance criteria:**
- [ ] Loaded unpacked, the ID is `faamldnehjdjdobapchedpmldfjjfife`
- [ ] The manifest test passes: `storage` only, no `host_permissions`, `key` present
- [ ] `onInstalled` opens the URL on `install` and not on `update` (fake `chrome`); no request goes to Google Fonts

**Verification:** `npm test -w @aibytes/extension`, `npm run dev:extension`,
then load it in `chrome://extensions`.

**Dependencies:** T3, T4. **Files:** `apps/extension/{package.json,vite.config.js,manifest.config.js,popup.html,src/popup/main.jsx,src/background.js,*.test.js}`, `.gitignore`. **Scope:** M

## T8 [3.8]: the sign-in gate

**Description:** The four steps of extension-auth's gate. Add `firebase` and
`src/firebase.js` (`firebase/auth/web-extension`). From the worker, call
`signInWithCustomToken` with a token the publisher mints by hand, then read and
write one save. Stop the worker, reopen the popup and expect the same user.
Check that the profile fields are there. This is throwaway wiring: only
`firebase.js` stays.

**Acceptance criteria:**
- [ ] The result is recorded in extension-auth's gate section: pass or fail per step, and any host permission with its warning
- [ ] The frozen permission set is written into the spec and the manifest test
- [ ] If the worker can't sign in, the spec states that the fallback is in force

**Verification:** by hand in Chrome stable; no token in the repo, a log or
`chrome.storage.local`.

**Dependencies:** T7, ticket items 2.1 and 2.2. **Files:** `apps/extension/{package.json,src/firebase.js}`, `docs/specs/AIB-76n-extension-auth.md`. **Scope:** S

## T9 [3.9]: Today's edition in the popup

**Description:** `content.js`: paint the cached edition, fetch the index, then
the newest edition, refuse any `schema_version` but 1, rank, then `inFeed`.
`links.js` builds the "View on Web" URLs with their three UTM tags; add that
row to AIB-145y's tag table. Render the header, `ListRow`s, the end line, the
footer, and the four states with `copy.js`.

**Acceptance criteria:**
- [ ] Today equals aibytes.io's ranked feed for the same date
- [ ] The cache paints within 100 ms (`performance.now()` at first render)
- [ ] Tests cover refusing schema 2 for each file type, rank-before-filter, the cache validation, and the links

**Verification:** `npm test -w @aibytes/extension`; by hand: online, offline
with a cache, and offline without one.

**Dependencies:** T1, T7, T8 (the frozen permission set and the gate's
outcome come first). **Files:** `apps/extension/src/{content,links,copy}.js`, `src/popup/Popup.jsx`, tests, `docs/specs/AIB-145y-gist-analytics.md`. **Scope:** M

## T10 [3.10]: stars and Saved, signed out

**Description:** Add `extensionStorage.js`, the `chrome.storage.local` adapter
for `localSaves`. Stars on rows. Saved through `filesToLoad`, `savedGroups` and
`leftOutNote`, with `weekly/index.json`, weekly sections, and the empty copy.

**Acceptance criteria:**
- [ ] A star survives closing the popup and restarting Chrome
- [ ] Saved equals `/saved` for the same saves
- [ ] Adapter tests: load, write-through, and an outside change raising `storage`

**Verification:** `npm test -w @aibytes/extension`; by hand.

**Dependencies:** T2, T9. **Files:** `apps/extension/src/{extensionStorage.js,popup/Popup.jsx}`, tests. **Scope:** M

## T11 [3.11]: the gist view and new-tab links

**Description:** Open a gist from a row: load `gists/<slug>.json`. On a 404, a
parse error or an unknown schema, open the source instead. Show `GistView
as="panel"` with absolute appearance links, `PopupGistBar` and `PopupActionBar`,
and keep the list's scroll position for Back. One click handler opens every
http(s) link with `chrome.tabs.create`.

**Acceptance criteria:**
- [ ] Back returns to Today or Saved at the same scroll position
- [ ] A row without a gist, or with a missing gist file, opens its source in a new tab
- [ ] No click (plain, modified, or on an appearance link) navigates the popup itself

**Verification:** `npm test -w @aibytes/extension`; by hand, with
chrome-devtools-mcp.

**Dependencies:** T10. **Files:** `apps/extension/src/popup/{Popup,GistPanel}.jsx`, `src/content.js`, tests. **Scope:** M

## T12 [3.12]: the store zip

**Description:** `npm run package:extension` runs a production build and zips
`dist` to `aibytes-extension-<version>.zip` (git-ignored). Start
`CHROMEWEBSTORE.md` with the justification for each permission in T8's
frozen set (`storage`, and any host permission the gate added).

**Acceptance criteria:**
- [ ] The zip installs by drag-and-drop in a clean profile with the same ID
- [ ] The zip has no source maps, no localhost, and no dev-only files

**Verification:** `npm run package:extension`, then `unzip -l`.

**Dependencies:** T11. **Files:** `apps/extension/{package.json,CHROMEWEBSTORE.md}`, `.gitignore`. **Scope:** S

### Checkpoint 2
- [ ] extension-popup's success criteria 1 to 5, 7 and 8
- [ ] The production manifest's permissions equal T8's frozen set (criterion 6,
  "storage only", is T7's check, before the gate can add a host permission)
- [ ] The gate's result is recorded (T8)

---

## Phase 3: sign-in

**Ticket 2.5 (publisher):** grant the functions' runtime service account the
Token Creator role on itself (the command is in extension-auth's prerequisites).

## T13 [3.13]: the `aibytesExtensionToken` callable

**Description:** Add `functions/extensionToken.js` (`prepareToken`: no auth
gives `unauthenticated`, a non-Google provider gives `permission-denied`), and
the callable in `index.js`. Change the test script to `node --test *.test.js`.
Add the IAM step and the deploy-list check to `README.md`.

**Acceptance criteria:**
- [ ] `prepareToken` tests: no auth, custom-token provider and Google
- [ ] The callable never logs the token
- [ ] `npm test --prefix functions` runs both test files

**Verification:** `npm test --prefix functions`.

**Dependencies:** none (the deploy needs 2.5). **Files:** `functions/{index.js,extensionToken.js,extensionToken.test.js,package.json,README.md}`. **Scope:** S

**Ticket 3.22 (publisher):** deploy with
`firebase deploy --only functions:aibytes-web --project ai-bytes-b42d2`, check
that the function list keeps `aibytesReportSubscribeFailure`, and stop if the
CLI offers to delete anything.

## T14 [3.14]: the site-to-extension contract and the internal sign-out

**Description:** Add `external.js` (`handleExternal`: status with
`signoutPending`, signin, signout, the origin and shape checks, and the `pin`
port with `onUserSettingsChanged` feature-detected) and `internal.js`
(`handleInternal`: `signout-by-reader` sets the 2-minute `signoutPending`).
Wire `onMessage`, `onMessageExternal` and `onConnectExternal`. Add
`externally_connectable`, with localhost in the dev build only. Signin merges
the signed-out saves, then clears them.

**Acceptance criteria:**
- [ ] Every row of the contract table is tested; a wrong origin runs nothing; no reply or console call contains the token
- [ ] The production manifest has no localhost, and its permissions equal T8's frozen set
- [ ] Saves are cleared only after the merge resolves; a failed merge keeps them

**Verification:** `npm test -w @aibytes/extension`.

**Dependencies:** T8, T10. **Files:** `apps/extension/src/{external,internal,background}.js`, `manifest.config.js`, tests. **Scope:** M

## T15 [3.15]: the popup signed in

**Description:** `useAccount.js`: `onAuthStateChanged` after first paint, then
`accountSaves` while signed in, the merge retry on open, and the avatar in
`PopupHeader`. Sign out in the menu sends `signout-by-reader` and opens
`?action=signout`.

**Acceptance criteria:**
- [ ] Signed in from a dev page, the popup shows the avatar, and stars write to `users/{uid}/saves`
- [ ] Still signed in after the worker stops, without visiting aibytes.io
- [ ] Sign out shows Sign in at once and opens the sign-out URL

**Verification:** `npm test -w @aibytes/extension`; by hand from a dev page
that calls the deployed callable.

**Dependencies:** T2, T4, T14, 3.22. **Files:** `apps/extension/src/popup/{useAccount.js,Popup.jsx}`, tests. **Scope:** M

### Checkpoint 3
- [ ] extension-auth's success criteria 1 to 4

---

## Phase 4: aibytes.io, behind `EXTENSION_LIVE`

## T16 [3.16]: the bridge

**Description:** `extensionBridge.js`: `extensionStatus` (null when there's no
runtime, on `lastError`, or after 1.5 s) and `reconcile` (one at a time, no
mint while `signoutPending`, the token kept only in memory). Wire it in
`App.jsx` on the first `onUser` call and on every sign-in and sign-out.

**Acceptance criteria:**
- [ ] Tests cover every reconcile case, absent, timeout, `signoutPending`, and the token never logged or returned
- [ ] With the dev extension: signing in and out on any page is mirrored within a second
- [ ] Without the extension: no error and no callable call

**Verification:** (A), (C); by hand with `dev:web` and the dev extension.

**Dependencies:** T14, 3.22. **Files:** `apps/web/src/{extensionBridge.js,extensionBridge.test.js,App.jsx}`. **Scope:** S

## T17 [3.17]: the newsletter source

**Description:** `toSubscriberDoc` and `subscribe` take a `source` (default
`signin-prompt`, refusing anything else). In `firestore.rules`, `isSubscriber`
allows `signin-prompt` or `extension-onboarding`.

**Acceptance criteria:**
- [ ] Emulator tests: both values are allowed and a third is refused
- [ ] The existing prompt still writes `signin-prompt`

**Verification:** (A), (B).

**Dependencies:** None. **Files:** `apps/web/src/{subscriber.js,subscriber.test.js,subscriberStore.test.js}`, `firestore.rules`, `apps/web/rules.test.js`. **Scope:** S

**Ticket 3.23 (publisher):** deploy with
`firebase deploy --only firestore:rules --project ai-bytes-b42d2` before PR #73
merges.

## T18 [3.18]: the onboarding page shell

**Description:** Add the route `extension_onboarding` (with `?step=signin` and
`?action=signout`), `ONBOARDING_HEAD` (noindex), and `vite.config.js` emitting
`/extension-onboarding/`. The page has a header and no sidebar. Add the
`onboarding.js` reducer, the not-installed state (the button only with the
flag on), and suppress the newsletter prompt on this page. Create
`extension.js` with `EXTENSION_LIVE = false` and the store URL here; T20 adds
the rest of that file.

**Acceptance criteria:**
- [ ] `dist/extension-onboarding/index.html` exists with noindex
- [ ] The reducer's tests cover every transition, including `?action=signout` with and without `signoutPending`
- [ ] Not installed with the flag off: no "Add to Chrome"

**Verification:** (A), (C), with a build test in the style of `gistBuild.test.js`.

**Dependencies:** T5, T16. **Files:** `apps/web/src/{route.js,pageMeta.js,App.jsx,onboarding.js,ExtensionOnboarding.jsx,extension.js,copy/extension.js}`
(`App.jsx` branches to the page as it does for `PrivacyApp`),
`apps/web/vite.config.js`, tests. **Scope:** M

## T19 [3.19]: the onboarding steps

**Description:** Step 1: pinning through the port, or a 2 s poll, then the tick
and 900 ms. Step 2: Google sign-in, the ticked newsletter box (subscribing with
`extension-onboarding`), Continue as and Use a different account, and the
error lines. The sign-out view. Done. Add the four Umami events to AIB-145y's
table first, then send them.

**Acceptance criteria:**
- [ ] A fresh dev install: pinning ticks step 1 within 2 s; signing in signs the popup in and subscribes
- [ ] Sign out in the popup leads to the site signed out, the extension signed out, and the signed-out view; opening the URL by hand does nothing
- [ ] Light and dark, 1280 and 390, keyboard only

**Verification:** (A), (B); by hand with chrome-devtools-mcp.

**Dependencies:** T15, T17, T18. **Files:** `apps/web/src/{ExtensionOnboarding.jsx,onboarding.js,analytics.js}`, `docs/specs/AIB-145y-gist-analytics.md`, tests. **Scope:** M

## T20 [3.20]: the install box

**Description:** `extension.js` (created in T18 with `EXTENSION_LIVE` and the
store URL) gains `isDesktopChromium` and the 30-day dismiss. Pass `ExtensionPromo` to `Sidebar`
only when every condition holds. Re-check the status after the click and when
the tab becomes visible again. Send the two Umami events.

**Acceptance criteria:**
- [ ] Detection tests: Chrome, Edge, Brave, Opera, Vivaldi and Arc are in; Safari, Firefox, Android and iOS are out
- [ ] With the flag forced on: the box shows in Chrome and Edge without the extension, and goes once it's installed
- [ ] With the flag off: `build:web` output equals Checkpoint 1's outside the onboarding page

**Verification:** (A), (C); by hand.

**Dependencies:** T6, T16. **Files:** `apps/web/src/{extension.js,extension.test.js,App.jsx}`. **Scope:** S

### Checkpoint 4
- [ ] site-extension's success criteria 1 to 5; (A) to (D) pass

---

## Phase 5: the store

## T21 [3.21]: the five screenshots

**Description:** `store/screenshots.mjs` renders real components on a fixed
edition fixture, with a caption band, at 1280×800, using headless Chrome.
Shots 1 to 4 (Today, a gist, Saved, dark) render the popup's own components
(`Popup.jsx` with the fixture). Shot 5 (onboarding step 1) renders Ledger's
`OnboardingStep` and `PinAnimation` with the onboarding copy, the same pieces
the live page uses, so it needs no running site. Commit the five PNGs.

**Acceptance criteria:**
- [ ] Five PNGs at exactly 1280×800, captions as in the store-listing spec
- [ ] Only real UI appears

**Verification:** `node apps/extension/store/screenshots.mjs`, then check the
sizes.

**Dependencies:** T5, T15. **Files:** `apps/extension/store/{screenshots.mjs,*.png}`. **Scope:** S

## T22 [4.2]: the promo tile and marquee

**Description:** Write `store/promo-brief.md`. The publisher runs it in Claude,
Grok, OpenAI and Gemini; the candidates go in `store/candidates/`
(git-ignored). A numbered review artifact shortlists them, and the publisher
picks one tile and one marquee. Resize the picks to 440×280 and 1400×560 and
commit them.

**Acceptance criteria:**
- [ ] Two committed PNGs at the exact sizes, and the pick recorded in `CHROMEWEBSTORE.md`
- [ ] No rejected candidate is committed

**Verification:** check the sizes; the publisher signs off.

**Dependencies:** T3. **Files:** `apps/extension/store/{promo-brief.md,promo-tile.png,marquee.png}`, `.gitignore`. **Scope:** S

## T23 [4]: listing text, `/privacy`, version and zip

**Description:** `CHROMEWEBSTORE.md` gets the name, the short description (with
Reddit), the description, the category, the justifications and the privacy
answers. Add "The Chrome extension" section to `/privacy`, worded so it doesn't bring
back the phrase `analytics.test.js` forbids in `App.jsx` (`runs no analytics`;
the site uses Umami): say that the extension itself sends no analytics events.
The site's own sections stay as they are. Set the version to
`YY.M.D`. Freeze-check the permissions, then build the zip.

**Acceptance criteria:**
- [ ] The version is above `26.1.15` (a test), and the permissions equal T8's set
- [ ] The privacy answers and `/privacy` agree, and match the build
- [ ] The zip passes T12's checks in a clean profile, signed in and out, against production

**Verification:** (A), (C), `npm run package:extension`.

**Dependencies:** T21, T22. **Files:** `apps/extension/{CHROMEWEBSTORE.md,package.json}`, `apps/web/src/{App.jsx,analytics.test.js}`, `docs/specs/AIB-76n-store-listing.md` (the step 2 wording, below). **Scope:** S

**Publisher [4, 4.1]:** upload the zip, set the category to News & Weather,
fill the listing from `CHROMEWEBSTORE.md`, and submit.

## T24 [5]: after approval, the flag and the footer link

**Description:** A follow-up PR from `main` (PR #73 has merged by then; this
replaces store-listing's "on the same branch", which T23 corrects):
`EXTENSION_LIVE = true`, and `footer.js` drops "(soon)" and links the
listing.

**Acceptance criteria:**
- [ ] The footer test is updated; the box and the onboarding button are live
- [ ] A clean install from the store opens onboarding once; a 26.1.15 install updates silently

**Verification:** (A), (C); by hand on aibytes.io after deploy.

**Dependencies:** store approval. **Files:** `apps/web/src/{extension.js,footer.js,footer.test.js}`. **Scope:** XS

### Checkpoint 5: complete
- [ ] store-listing's success criteria 1 to 5 and the map's success criteria
