# Task list: AIB-75v

Plan: `docs/plans/AIB-75v-plan.md`. Spec: `docs/specs/AIB-75v-ledger-saves-ui.md`.

All five tasks are built on branch `aib-75v-ledger-saves-ui`, one commit per
task, in one PR squash-merged to `main`.

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
- [ ] New `Sidebar.test.js` pins today's markup without `onSaved`, then
      covers the entry with a count of 0 and 3, and `savedActive`
      (`aria-current="page"` on Saved, on no category).
- [ ] The drawer's Tab trap includes the Saved row (checked at 390px).
- [ ] `Sidebar.d.ts` and `Sidebar.prompt.md` updated.

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
- [ ] New `AppHeader.test.js` pins today's markup with none of the new props,
      then covers Sign in, the photo, the initial without `photoUrl`, the
      accessible name, and the menu's Saved item only with `onSaved`.
- [ ] In the preview: Escape closes the menu and returns focus to the avatar;
      a click outside closes it; a bad `photoUrl` shows the initial.
- [ ] `contrast.test.js` covers the initial on `--surface-2` and the menu's
      secondary line on `--surface`, in both themes.
- [ ] `AppHeader.d.ts` and `AppHeader.prompt.md` updated.

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
- [ ] New `SaveBanner.test.js` covers the icon, the copy, the dismiss label,
      and the sticky class only with `sticky`.
- [ ] `tests/test_design_system.py`: `ToolbarTests` read `--redesign-top`;
      new checks that the rail, drawer and backdrop use it with no literal
      `52px`, that it is built from `--redesign-header` and
      `--redesign-banner`, and the z-index order masthead > banner > rail >
      toolbar.
- [ ] `contrast.test.js` covers banner text and link on `--surface-2`.
- [ ] In the preview at 1280, 900 and 390px, both themes: the banner stays
      under the header while the feed scrolls, spans over the rail, and the
      rail, drawer and toolbar clear it and move back up on dismissal.
- [ ] `SaveBanner.d.ts` and `SaveBanner.prompt.md` updated.

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
- [ ] `12-saves-signed-out.html`, `13-signed-in-menu.html` and
      `14-mobile-banner.html` render through `npm run preview:design-system`
      and match the prototype's states.
- [ ] `RemovedComponentTests` and the rest of `test_design_system.py` pass.
- [ ] The kit `README.md` lists the new screens; `readme.md` describes the
      new options.
- [ ] The ticket's `ledger-saves-ui … (PR merged)` item is ticked when the
      PR is squash-merged.

**Files:** `ui_kits/aibytes-app/App.jsx`, `index.html` (tweak),
`12-saves-signed-out.html`, `13-signed-in-menu.html`,
`14-mobile-banner.html`, `ui_kits/aibytes-app/README.md`, `readme.md`.
