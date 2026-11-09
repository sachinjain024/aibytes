# Task list: AIB-75v

Plan: `docs/plans/AIB-75v-plan.md`. Spec: `docs/specs/AIB-75v-ledger-saves-ui.md`.

Module 1 (T1-T5) was built on `aib-75v-ledger-saves-ui` and squash-merged in
#55. Module 2 (T6-T7) was built on `aib-75v-app-local-saves` and
squash-merged in #56. Module 3 (T8-T10) was built on `aib-75v-app-saved-view`
and squash-merged in #57. Module 4 (T11-T15) is built on
`aib-75v-app-accounts`, one commit per task, in one PR squash-merged to `main`.

## Module 1: `ledger-saves-ui`

### T1: star position on cards and rows

**Description:** Add `starPos?: "actions" | "visual"` to `FeedItem`, `Card`
and `ListRow`. `"visual"` renders the `SaveStar` in `story-visual` under the
image, at a 28px target with a 16px glyph; `"actions"` (the default) is
today's markup.

**Acceptance criteria:**
- [x] `Card.test.js` pins today's markup for a card and a row with no
      `starPos`, then covers `"visual"` (star inside `story-visual`, not in
      `item-actions`) and that no star renders without `onToggleSave`.
- [x] `Card.d.ts` and `ListRow.d.ts` document the prop; the `.prompt.md`
      files show it.
- [x] In the preview, the star under the icon fits the visual column on grid
      cards and list rows at 1280 and 390px, in both themes.

**Files:** `components/content/FeedItem.jsx`, `Card.jsx`, `ListRow.jsx`,
`Card.d.ts`, `ListRow.d.ts`, `Card.prompt.md`, `ListRow.prompt.md`,
`Card.test.js`, `styles.css`.

### T2: the Saved entry in the sidebar

**Description:** Add `onSaved`, `savedCount` and `savedActive` to `Sidebar`.
With `onSaved`, a `LIBRARY` label and a Saved row (filled star in `--save`,
count, `category` styling) render after the categories. `savedActive` marks
the row current and no category. Add a `star` icon to `icons.jsx`.

**Acceptance criteria:**
- [x] New `Sidebar.test.js` pins today's markup without `onSaved`, then
      covers the entry with a count of 0 and 3, and `savedActive`
      (`aria-current="page"` on Saved, on no category).
- [x] The drawer's Tab trap includes the Saved row (checked at 390px).
- [x] `Sidebar.d.ts` and `Sidebar.prompt.md` updated.

**Files:** `components/navigation/Sidebar.jsx`, `Sidebar.d.ts`,
`Sidebar.prompt.md`, `Sidebar.test.js`, `icons.jsx`, `styles.css`.

### T3: Sign in and the account menu in the header

**Description:** Add `onSignIn`, `user: { name, photoUrl? }`, `onSignOut` and
`onSaved` to `AppHeader`. Signed out: a `Sign in` control after the theme
toggle. Signed in: a 30px avatar with the profile photo (`alt=""`,
`referrerpolicy="no-referrer"`), the initial when there is no photo or it
fails to load, opening a menu built on `CardMenu`'s popover: name and
"Signed in with Google", `Saved`, `Sign out`.

**Acceptance criteria:**
- [x] New `AppHeader.test.js` pins today's markup with none of the new props,
      then covers Sign in, the photo, the initial without `photoUrl`, the
      accessible name, and the menu's Saved item only with `onSaved`.
- [x] In the preview: Escape closes the menu and returns focus to the avatar;
      a click outside closes it; a bad `photoUrl` shows the initial.
- [x] `contrast.test.js` covers the initial on `--surface-2` and the menu's
      secondary line on `--surface`, in both themes. (Already true: its pairs
      check `--text` and `--text-2` on `--surface` and `--surface-2`, the only
      colours these pieces use, so no new pair was needed.)
- [x] `AppHeader.d.ts` and `AppHeader.prompt.md` updated.

**Files:** `components/navigation/AppHeader.jsx`, `AppHeader.d.ts`,
`AppHeader.prompt.md`, `AppHeader.test.js`, `components/components.css` or
`styles.css`, `tokens/contrast.test.js`.

### T4: the sticky save banner

**Description:** Add the `warning` icon, centre the message and pin the
dismiss button in `SaveBanner`, and add `sticky`. A sticky banner sticks at
`top: var(--redesign-header)` (z-index 38) and writes its height to
`--redesign-banner` on the root while mounted. Add `--redesign-top` to
`tokens/token.css` and move the toolbar slot, the desktop rail, the phone
drawer and the backdrop onto it, replacing the literal `52px`s.

**Acceptance criteria:**
- [x] New `SaveBanner.test.js` covers the icon, the copy, the dismiss label,
      and the sticky class only with `sticky`.
- [x] `tests/test_design_system.py`: `ToolbarTests` read `--redesign-top`;
      new checks that the rail, drawer and backdrop use it with no literal
      `52px`, that it is built from `--redesign-header` and
      `--redesign-banner`, and the z-index order masthead > banner > rail >
      toolbar.
- [x] `contrast.test.js` covers banner text and link on `--surface-2`.
      (Already true: `--text` and `--link` on `--surface-2` are in its pairs.)
- [x] In the preview at 1280, 900 and 390px, both themes: the banner stays
      under the header while the feed scrolls, spans over the rail, and the
      rail, drawer and toolbar clear it and move back up on dismissal.
- [x] `SaveBanner.d.ts` and `SaveBanner.prompt.md` updated.

**Files:** `components/content/SaveBanner.jsx`, `SaveBanner.d.ts`,
`SaveBanner.prompt.md`, `SaveBanner.test.js`,
`components/navigation/icons.jsx`, `components/components.css`,
`styles.css`, `tokens/token.css`, `tokens/contrast.test.js`,
`tests/test_design_system.py`.

### T5: UI kit screens and docs

**Description:** Give the kit's `App.jsx` save and sign-in state and a
Signed out / Signed in tweak, and add screens 12, 13 and 14 from the spec.
Update the kit `README.md` and Ledger's `readme.md` for the header, sidebar,
banner and star position.

**Acceptance criteria:**
- [x] `12-saves-signed-out.html`, `13-signed-in-menu.html` and
      `14-mobile-banner.html` render through `npm run preview:design-system`
      and match the prototype's states.
- [x] `RemovedComponentTests` and the rest of `test_design_system.py` pass.
- [x] The kit `README.md` lists the new screens; `readme.md` describes the
      new options.
- [x] The ticket's `ledger-saves-ui … (PR merged)` item is ticked when the
      PR is squash-merged.

**Files:** `ui_kits/aibytes-app/App.jsx`, `index.html` (tweak),
`12-saves-signed-out.html`, `13-signed-in-menu.html`,
`14-mobile-banner.html`, `ui_kits/aibytes-app/README.md`, `readme.md`.

## Module 2: `app-local-saves`

Spec: `docs/specs/AIB-75v-app-local-saves.md`.

### T6: the saves store

**Description:** Add `apps/web/src/saves.js`: `SAVES_KEY = "aibytes-saves"`,
`readSaves(storage)` (validate, drop bad entries, keep the first of each
`item_id`), and `localSaves(storage)` returning `list()`, `has(itemId)`,
`toggle(item, from)` and `subscribe(listener)`. `from` is `{ edition_date }`
or `{ issue_slug }`. New saves go first with an ISO `created_at`.

**Acceptance criteria:**
- [x] New `saves.test.js` (RED first), using `prefs.test.js`'s `memory` and
      `broken` storages: save, unsave and `has` round-trip for an edition item
      and a weekly item; the stored JSON is exactly the spec's shape, newest
      first.
- [x] Corrupt JSON, a non-array, entries with both or neither source field, a
      bad date (`2026-02-30`) or slug, and duplicates all read as specified.
- [x] A throwing storage: `list()` is empty, `toggle` returns `kept: false`,
      and `has` still reports the change for the page view.
- [x] `list()` returns the same array until a change; `subscribe` fires on a
      local toggle and on a `storage` event for `aibytes-saves` (including a
      corrupt value), not for other keys, and not after unsubscribe.
- [x] `toggle` throws on a `from` without exactly one valid field.

**Files:** `apps/web/src/saves.js`, `apps/web/src/saves.test.js`, and
`route.js` (exports `isRealDate`, reused for `edition_date`).

### T7: the star on edition and weekly pages

**Description:** Add `useSaves(store)` to `hooks.js`
(`useSyncExternalStore` over `subscribe` and `list`). `App` creates one
`localSaves()` and passes it to `EditionApp` and `WeeklyIssueApp`, which pass
`{ edition_date: ref.date }` or `{ issue_slug: ref.slug }` down through
`ItemSections`. Every `Card` and `ListRow` gets `saved`, `onToggleSave` and
`starPos="visual"`.

**Acceptance criteria:**
- [x] `npm test -w @aibytes/web`, the build, `test_design_system.py` and
      `validate.py` pass; the Sidebar and the weekly archive are unchanged.
- [x] In `npm run dev:web` at 1280 and 390px, both themes: the star sits under
      the source icon on grid cards and list rows, on an edition and a weekly
      issue; a click fills and empties it at once; `aibytes-saves` holds the
      spec's shape with `edition_date` or `issue_slug` as appropriate.
- [x] Saves survive a reload and a move to another edition or issue; a save
      in one tab appears in a second tab without a reload.
- [x] With local storage blocked in DevTools the page renders and the star
      still toggles for the page view; DevTools shows no network request on
      a save.

**Files:** `apps/web/src/hooks.js`, `hooks.test.js`, `App.jsx`; and, for a
bug the blocked-storage check found, `prefs.js`, `prefs.test.js`, `saves.js`,
`saves.test.js` and the test helper `blocked-storage.js`. With site data
blocked, reading `window.localStorage` itself throws, and `prefs.js` read it
in a default argument outside its `try`, so the whole app (on `main` too)
rendered blank. Both modules now go through `browserStorage()`.

## Module 3: `app-saved-view`

Spec: `docs/specs/AIB-75v-app-saved-view.md`.

### T8: the grouping

**Description:** Add `apps/web/src/saved.js`: `filesToLoad(saves, editions,
issues)`, `savedGroups(saves, { editions, issues, files })` and
`leftOutNote(leftOut)`, as the spec's Code section describes. A file still
loading or failed is a group with `status: "loading"` or `"error"`.

**Acceptance criteria:**
- [x] New `saved.test.js` (RED first): `filesToLoad` names only the
      referenced editions and issues, once each, and skips saves whose file
      is not in its index.
- [x] Groups are newest first with editions and issues interleaved by date
      (an issue by its `published_on`); labels are `Fri, Nov 6` and
      `Issue #9 · Nov 2`; items inside follow `rankedItems` over the whole
      file, with a hidden item between two saved ones not changing their order.
- [x] Left out and counted: a hidden item, an item gone from its file, a file
      gone from its index. The note's wording for 1 and many, editions only,
      issues only, and mixed; no note when nothing is left out.
- [x] No saves give no groups and no note; a loading or failed file gives a
      group in that state without losing the others.

**Files:** `apps/web/src/saved.js`, `apps/web/src/saved.test.js`.

### T9: the address

**Description:** `parseRoute` gains `{ kind: "saved" }` for `/saved` and
`/saved/`, and `route.js` exports `savedPath()`. `pageMeta.js` gains
`SAVED_HEAD` (title `aiBytes_ · Saved`, `noindex`) and `withHead` an optional
`robots`. `vite.config.js` writes `dist/saved/index.html` with that head.

**Acceptance criteria:**
- [x] `route.test.js` and `pageMeta.test.js` cover the route, `savedPath`,
      `SAVED_HEAD`, and that `robots` is added only when given (weekly pages
      unchanged).
- [x] `npm run build:web` writes `dist/saved/index.html` with the title and
      `<meta name="robots" content="noindex" />`.
- [x] Until T10, `/saved` in `npm run dev:web` shows the not-found message,
      as any unknown path does today.

**Files:** `apps/web/src/route.js`, `route.test.js`, `pageMeta.js`,
`pageMeta.test.js`, `apps/web/vite.config.js`, and `App.jsx`: the edition
feed treats `saved` as not found until T10, because any route it does not
know otherwise reaches `longDate(route.date)` and throws.

### T10: the page and the entry

**Description:** `SavedApp` in `App.jsx`: the shell with `savedActive`, the
`h1` and count, the "Stored in this browser only." line, sections with
`SectionHeading` and `Card` / `ListRow` (star filled, `starPos="visual"`),
the note, the empty state and the loading and error lines. `FeedShell` passes
`onSaved={() => navigate(savedPath())}`, `savedCount` and
`savedActive={false}` to `Sidebar`; on `/saved` a category navigates to
`/?c=<key>`.

**Acceptance criteria:**
- [x] The full check list passes, and `test_design_system.py` still finds no
      shell markup drawn by the app.
- [x] In `npm run dev:web` at 1280 and 390px, both themes: Saved and its
      count in the Sidebar and the drawer on an edition and a weekly issue,
      `0` included; it opens `/saved` as the current entry.
- [x] `/saved` with edition and weekly saves, in grid and list: sections in
      date order, rank order inside; unstarring removes the item and an
      emptied section; the empty state and its link.
- [x] A left-out save is skipped with the note: a save written into local
      storage for an id that is not in its edition (no published item is
      hidden today, and the dev server always serves the real `content/`,
      which is never edited for a test; `hidden: true` itself is covered in
      T8). One file blocked in DevTools shows its section error and the rest;
      Network shows only the two indexes and the referenced files.

**Files:** `apps/web/src/App.jsx`, and `saved.js` / `saved.test.js`: each
group now carries `from`, what unstarring its items needs. The browser checks
ran on the production build through `vite preview`; the failed-file case
deleted one edition from `dist/`, never `content/`, and the rebuild restored it.

## Module 4: `app-accounts`

Spec: `docs/specs/AIB-75v-app-accounts.md`.

### T11: the privacy page

**Description:** `parseRoute("/privacy")` is `{ kind: "privacy" }`;
`PRIVACY_HEAD` (indexable, canonical `https://aibytes.io/privacy`);
`dist/privacy/index.html`; `PrivacyApp` in the shell with the spec's text; a
"Privacy" link in the Sidebar's links.

**Acceptance criteria:**
- [x] `route.test.js` and `pageMeta.test.js` cover the route and head (no
      `noindex`); the build writes `dist/privacy/index.html`.
- [x] The page states only what is true: checked against the built site that
      it sets no cookies and loads no analytics, before the claim ships.
- [x] In `npm run dev:web` at 1280 and 390px, both themes: the page reads
      cleanly and the Sidebar link opens it.

**Files:** `apps/web/src/route.js`, `route.test.js`, `pageMeta.js`,
`pageMeta.test.js`, `footer.js`, `footer.test.js`, `App.jsx`,
`apps/web/vite.config.js`. `FeedShell`'s `savedPage` became `page` ("feed",
"saved", "privacy"). Checked: the build loads only Google Fonts and the item
images' own hosts, with no analytics script and no `document.cookie`. Open:
links in the page's text are the body colour until hover (Ledger's base `a`
rule), raised with the publisher.

### T12: the pure parts

**Description:** `accountData.js`: `toSave(id, data)` and `toDoc(item, from,
now)`. `merge.js`: `toAdd(local, account)` (local saves the account lacks,
`created_at` kept) and `mergedLine(count)`. `showBanner({ signedIn, saveCount,
dismissed, page })`.

**Acceptance criteria:**
- [x] New tests (RED first): both source kinds both ways, timestamps as ISO;
      `toAdd` with none, some and all already in the account; the line for
      0 (none), 1 and many; the banner rule over each input.

**Files:** `apps/web/src/accountData.js`, `merge.js`, `banner.js` (the
banner rule in its own module) and their tests; `saves.js` exports `sourceOf`
and `asSave`, so local and account saves share one validation. `showBanner`
takes `signedIn: null` while the session restores and shows nothing then.

### T13: the rules

**Description:** `firestore.rules` as in the spec, `firebase.json` (rules
path, emulator port), `apps/web/rules.test.js` with
`@firebase/rules-unit-testing` against the emulator under project id
`demo-aibytes`, and `npm run test:rules -w @aibytes/web`
(`firebase emulators:exec`).

**Acceptance criteria:**
- [x] RED first against an empty-deny rules file, then GREEN: the owner
      creates, reads, updates and deletes; another user and a signed-out
      reader are denied each; a missing or extra field, both or neither
      source, a bad date or slug, a mismatched `item_id`, and any other path
      are denied.
- [x] The test skips with a message when Java or the CLI is missing; it is
      not part of `npm test`.

**Files:** `firestore.rules`, `firebase.json`, `apps/web/rules.test.js`,
`apps/web/package.json`, `package-lock.json`, `.gitignore` (the emulator's
`*-debug.log`). 8 tests; each was checked to bite by loosening the rules (any
signed-in user as owner; extra fields allowed) and watching the matching test
fail. `firebase` is in the lock as the testing kit's peer; T14 makes it a
dependency. The stray root `firebase` change was backed up and reverted first.

### T14: signing in and the account store (needs the Firebase project)

**Description:** `firebase` in `apps/web`; `firebase-config.js` with the
publisher's values; `.firebaserc` with the project id; `account.js` (init,
`signIn` with the popup, `signOut`, `onUser`); `accountSaves.js` on
`accountData.js`; `App` switches stores on the user and runs the merge;
`AppHeader` gets `onSignIn`, `user`, `onSignOut`, `onSaved`, with neither
control while the session restores.

**Acceptance criteria:**
- [x] The full check list and `test:rules` pass; the build check records the
      gzipped size Firebase adds: the app's JS goes from 63.3 kB to 236.3 kB
      gzipped (+173 kB, against the spec's ~100 kB estimate). Raised with the
      publisher before T15, who chose to load it just after the first paint:
      the page's JS is 64.9 kB gzipped, Firebase 172.5 kB in its own chunks,
      fetched after the edition request (checked on `vite preview`).
- [x] On localhost with a real Google account: sign in and out; the photo
      (the initial fallback is covered by `Avatar` in Ledger, not seen live:
      the account has a photo); the menu's Saved and Sign out; a reload while
      signed in shows neither control for ~0.4 s, then the avatar, no Sign in
      flash. Two local saves merged on sign-in with their `created_at`, local
      storage cleared, read back from the server (10 Nov).
- [x] Merge: 3 local saves into an account holding 1 of them adds 2 and keeps
      the account's copy (`accountSaves.test.js` on the emulator, real rules);
      merging into another account rejects, and `App` clears local storage
      only in the success path.
- [x] A save in one browser appears in a second, signed in, without a reload
      (the publisher, 10 Nov; also covered on the emulator).
- [ ] Closing the popup does nothing; a blocked popup shows "Could not sign
      in. Try again." Not run yet, by the publisher's choice; the result
      mapping is in `account.js` and the line in `SignInFailed`.

Signed out, checked on the dev server: Sign in appears once Firebase has
loaded after the first paint, no avatar, no errors. Signed in, the dev console
shows uncaught `AbortError: signal is aborted without reason` from Firestore's
streams around page reloads and sign-in; nothing fails. To check on the
production build in T15.

**Files:** `apps/web/package.json`, `package-lock.json`,
`apps/web/src/firebase-config.js`, `account.js`, `accountSaves.js`,
`App.jsx`, `.firebaserc`; also `header.js` (what the masthead shows per
state), `accountSaves.test.js`, `header.test.js`, and `clearSaves` in
`saves.js`. `test:rules` runs its two files one at a time: run together,
`rules.test.js` clears the emulator under the store's tests.

### T15: the banner and the signed-in lines

**Description:** `SaveBanner sticky` by `showBanner`, with no dismiss button
(the publisher, 10 Nov), its Sign in link; the
`/saved` lines signed out and signed in, the empty state's last line, and the
merge line once.

**Acceptance criteria:**
- [x] At 1280 and 390px, both themes: the banner shows signed out with a
      save, not on `/saved`, and not signed in; the rail, drawer and toolbar
      clear it. Its Sign in link signs in (the publisher, 10 Nov).
- [x] `/saved` shows the right line for each state, and the merge line once:
      signed out, "Stored in this browser only. Sign in with Google..." and
      the empty state's "Saves stay in this browser..."; signed in, "Synced to
      your Google account."; after a sign-in that merged 1 save, "1 save from
      this browser was added to your account.", gone after leaving `/saved`.
      Neither line shows while the session restores.
- [x] The full check list and `test:rules` pass: 94 web tests, 15 emulator
      tests, 31 Ledger tests; page JS 65.6 kB gzipped.

Also fixed here, from T14: the error line's `dismiss` and the new
`clearMerged` are stable callbacks, so the effects that call them on
navigation no longer fire on every account change (which cleared "Could not
sign in" as soon as it was set); and the merge runs once per sign-in, its
result shared, so StrictMode's second effect run cannot report 0.

**Files:** `apps/web/src/App.jsx`, `hooks.js`.

### T16: the Saved view as a category view

**Description:** the publisher, 10 Nov (ticket item `ck_c38f9423`): `/saved`
looks and works like a category view such as HN Threads. Decisions: the
Toolbar shows the count, search, Filters, Ranked | Grouped and List | Grid,
with no date picker; Ranked and Grouped mean what they mean on the feed
(Grouped by category, Ranked one list), over the saves ordered newest file
first and rank inside; the "Stored in this browser only" / "Synced to your
Google account" line goes, so the banner now shows on `/saved` too (amends
C2); the merge line still shows once. This amends module 3's "No toolbar" and
fixed order. The Sidebar's categories filter the saves, as they filter an
edition.

**Acceptance criteria:**
- [x] `saved.js` `savedFeed(groups)`: one list in the groups' order, each
      item's file, and which files are loading or failed (tests).
- [x] `banner.js`: the banner shows on `/saved` (tests).
- [x] `/saved` has the Toolbar without the date; search, Filters, the
      Sidebar's categories and the two modes filter and order the saves; the
      URL carries the filters as on the feed; unstarring still works per file.
- [x] Empty states: no saves; a filter or search that empties the list
      (clear it); a file that fails says so; the left-out note stays.
- [x] At 1280 and 390px, both themes; the full check list passes.

**Files:** `apps/web/src/saved.js`, `banner.js`, their tests, `App.jsx`.

Checked signed out on the dev server with 7 saves from two editions and a
weekly issue: Grouped and Ranked, a Sidebar category (`/saved?c=news`), search
(`&q=`), a search with no match, unstarring, the banner, 1280 and 390px in both
themes. Not done, needing a Ledger change (ask first): the search placeholder
still says "Search this edition…", and `Sidebar` shows no category as current
while `savedActive`, so a category picked on `/saved` shows only in the
results and the URL. Rows do not show their edition (the publisher: not needed).

### After the PR

- [x] The publisher reviews `firestore.rules` and deploys it to the
      `aibytes` database (the only one `firebase.json` names):
      `firebase deploy --only firestore:rules --project ai-bytes-b42d2`.
      Deployed 9 Nov, before the merge, for the signed-in checks.
- [ ] One sign-in on aibytes.io after Pages deploys.
