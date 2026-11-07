# Task list: AIB-75v

Plan: `docs/plans/AIB-75v-plan.md`. Spec: `docs/specs/AIB-75v-ledger-saves-ui.md`.

Module 1 (T1-T5) was built on `aib-75v-ledger-saves-ui` and squash-merged in
#55. Module 2 (T6-T7) was built on `aib-75v-app-local-saves` and
squash-merged in #56. Module 3 (T8-T10) is built on `aib-75v-app-saved-view`,
one commit per task, in one PR squash-merged to `main`.

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
- [ ] New `saved.test.js` (RED first): `filesToLoad` names only the
      referenced editions and issues, once each, and skips saves whose file
      is not in its index.
- [ ] Groups are newest first with editions and issues interleaved by date
      (an issue by its `published_on`); labels are `Fri, Nov 6` and
      `Issue #9 · Nov 2`; items inside follow `rankedItems` over the whole
      file, with a hidden item between two saved ones not changing their order.
- [ ] Left out and counted: a hidden item, an item gone from its file, a file
      gone from its index. The note's wording for 1 and many, editions only,
      issues only, and mixed; no note when nothing is left out.
- [ ] No saves give no groups and no note; a loading or failed file gives a
      group in that state without losing the others.

**Files:** `apps/web/src/saved.js`, `apps/web/src/saved.test.js`.

### T9: the address

**Description:** `parseRoute` gains `{ kind: "saved" }` for `/saved` and
`/saved/`, and `route.js` exports `savedPath()`. `pageMeta.js` gains
`SAVED_HEAD` (title `aiBytes_ · Saved`, `noindex`) and `withHead` an optional
`robots`. `vite.config.js` writes `dist/saved/index.html` with that head.

**Acceptance criteria:**
- [ ] `route.test.js` and `pageMeta.test.js` cover the route, `savedPath`,
      `SAVED_HEAD`, and that `robots` is added only when given (weekly pages
      unchanged).
- [ ] `npm run build:web` writes `dist/saved/index.html` with the title and
      `<meta name="robots" content="noindex" />`.
- [ ] Until T10, `/saved` in `npm run dev:web` shows the not-found message,
      as any unknown path does today.

**Files:** `apps/web/src/route.js`, `route.test.js`, `pageMeta.js`,
`pageMeta.test.js`, `apps/web/vite.config.js`.

### T10: the page and the entry

**Description:** `SavedApp` in `App.jsx`: the shell with `savedActive`, the
`h1` and count, the "Stored in this browser only." line, sections with
`SectionHeading` and `Card` / `ListRow` (star filled, `starPos="visual"`),
the note, the empty state and the loading and error lines. `FeedShell` passes
`onSaved={() => navigate(savedPath())}`, `savedCount` and
`savedActive={false}` to `Sidebar`; on `/saved` a category navigates to
`/?c=<key>`.

**Acceptance criteria:**
- [ ] The full check list passes, and `test_design_system.py` still finds no
      shell markup drawn by the app.
- [ ] In `npm run dev:web` at 1280 and 390px, both themes: Saved and its
      count in the Sidebar and the drawer on an edition and a weekly issue,
      `0` included; it opens `/saved` as the current entry.
- [ ] `/saved` with edition and weekly saves, in grid and list: sections in
      date order, rank order inside; unstarring removes the item and an
      emptied section; the empty state and its link.
- [ ] A left-out save is skipped with the note: a save written into local
      storage for an id that is not in its edition (no published item is
      hidden today, and the dev server always serves the real `content/`,
      which is never edited for a test; `hidden: true` itself is covered in
      T8). One file blocked in DevTools shows its section error and the rest;
      Network shows only the two indexes and the referenced files.

**Files:** `apps/web/src/App.jsx`.
