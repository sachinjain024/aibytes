# Spec: ledger-saves-ui (AIB-75v, module 1 of 4)

Status: **reviewed 7 Nov 2026; open questions resolved.** Map: `docs/specs/AIB-75v-capability-map.md`.
Ticket: `.longclaw/tickets/AIB-75v/ticket.md`. Design:
`docs/decisions/product/AIB-75v-saves-and-sign-in-design.md`. Prototype:
`docs/ux/prototypes/AIB-75v-saves/aib-75v-saves.html` (it opens on the
decided options).

## Objective

Give Ledger every piece of save and sign-in UI the decided design needs, so
the next three modules only wire state into components that already exist.
`apps/web` and the extension render the app shell from Ledger, and
`tests/test_design_system.py` fails if the app draws shell markup itself, so
these pieces have to live in Ledger rather than in the app.

Every new option is **off unless passed**. After this module merges, aibytes.io
renders exactly as it does today: the app passes none of the new props until
`app-local-saves` and `app-accounts`.

The reader never sees this module directly. Success is that each later module
can switch a piece on with one prop, and the UI kit shows every new state in
both themes, matching the prototype.

**Out of scope:**
- Any change in `apps/web` (modules 2 to 4)
- Local storage, Firestore, Firebase, or any save logic
- The Saved page's own layout: heading, groups, hidden-items note, empty
  state. Those are `app-saved-view`, which adds any Ledger pieces it needs
- The header Saved chip (A2) and the star before the ⋮ menu (E3), not chosen
- Regenerating `_ds_bundle.js`: it is Claude Design's file, and
  `npm run preview:design-system` compiles a fresh bundle from the sources

## What changes

### 1. `Sidebar`: the Saved entry (A1)

New props:

```ts
/** the Saved entry renders only when this is passed */
onSaved?: () => void;
/** the count on the Saved entry; 0 shows "0" */
savedCount?: number;
/** the Saved page is showing: the entry is marked current and no category is */
savedActive?: boolean;
```

- Renders after the categories, before the footer links: a `LIBRARY` label in
  the `sidebar-label` style, then one row with a filled star (a new `star`
  entry in `icons.jsx`, `SaveStar`'s path) in `--save`, the
  text `Saved`, and the count, built like a category row (`category` class,
  so hover, active and the drawer layout come for free).
- Shown whenever `onSaved` is passed, including at 0 (A1: always there).
- `savedActive` sets `active` and `aria-current="page"` on the Saved row and
  clears both from every category row, whatever `active` says.
- In the phone drawer it is part of the same Tab trap, and selecting it calls
  `onSaved`; closing the drawer stays the app's job, as with `onCategory`.

### 2. `AppHeader`: Sign in and the account menu (B2)

New props:

```ts
/** signed out: a "Sign in" control renders at the right end when this is passed and `user` is not */
onSignIn?: () => void;
/** signed in: an avatar replaces Sign in: the Google profile photo, or the first letter of `name` */
user?: { name: string; photoUrl?: string };
/** the menu's Sign out item; the avatar renders only when this and `user` are passed */
onSignOut?: () => void;
/** the menu's Saved item renders only when this is passed */
onSaved?: () => void;
```

- **Sign in:** a `control` button reading `Sign in`, after the theme toggle.
  No Google logo in the header; the provider is named in the menu and the
  banner.
- **Avatar:** a 30px circle with a `--border` edge, showing the reader's
  Google profile photo (`user.photoUrl`, Firebase's `photoURL`) cropped to
  the circle. The photo is decorative (`alt=""`) and loads with
  `referrerpolicy="no-referrer"`, which Google's image host needs to serve it
  reliably to another site.
- **Fallback:** the initial, in Inter 600 13px `--text` on `--surface-2`,
  when there is no `photoUrl` or the image fails to load (`onError` swaps to
  the initial for the rest of the session, so a broken image is never
  shown). The button's accessible name is "Account: {name}" either way.
- **Menu:** reuses `CardMenu`'s popover (`ldg-menu__panel`, the soft popover
  shadow Ledger allows) and its dismissal: Escape closes it and returns focus
  to the avatar, and a pointer down outside closes it. Contents, in order:
  the name in `--text` over "Signed in with Google" in `--text-2`; `Saved`
  (when `onSaved` is passed); `Sign out`. Items are `role="menuitem"`.
- The order at the right end becomes: GitHub, theme toggle, then Sign in or
  the avatar.

### 3. `SaveBanner`: icon, centred, sticky (C2)

New prop:

```ts
/** stick under the AppHeader at full width, over the Sidebar; the rail, drawer and toolbar move down to clear it */
sticky?: boolean;
```

- **Always, sticky or not:** a warning icon before the message, a new
  `warning` entry in `components/navigation/icons.jsx` (1.5px stroke,
  `currentColor`, 16px). The message is centred in the strip. The dismiss
  button is pinned to the right and keeps its `Dismiss` label. The copy is
  unchanged: "Saved items are stored in this browser only. Sign in with Google
  to keep them across devices."
- **Below 761px:** the message wraps and is left-aligned, with room kept for
  the dismiss button.
- **Sticky:** rendered by the app straight after `AppHeader`. It sticks at
  `top: var(--redesign-header)` and stacks under the masthead and above the
  rail and toolbar (masthead 40 > banner 38 > rail 35 > toolbar 30).
- **The offset:** while mounted, a sticky banner measures its own height with
  a `ResizeObserver` and writes it to `--redesign-banner` on
  `document.documentElement`, then removes the property on unmount. A new
  token, `--redesign-top: calc(var(--redesign-header) + var(--redesign-banner,
  0px))`, replaces `--redesign-header` everywhere something clears the top
  bar: the toolbar slot's `top`, the desktop rail's `top`, the phone drawer's
  `top` and `height`, and the backdrop's `inset`. Today those use either the
  token or a literal `52px`; both become `--redesign-top`.
  `--redesign-header` itself stays the masthead's height.
- Without `sticky`, the banner renders as it does today, plus the icon and
  centring.

### 4. `FeedItem` / `Card` / `ListRow`: star position (E2)

New prop on all three:

```ts
/** "actions" = after the ⋮ menu (default, as shipped); "visual" = under the source icon */
starPos?: "actions" | "visual";
```

- `"visual"` renders the `SaveStar` in `story-visual`, under the image, at a
  28px target with a 16px glyph, on both cards and rows.
- `"actions"` is today's markup, byte for byte.
- Still renders only when `onToggleSave` is passed.

## UI kit

Three new screens in `packages/design-system/ui_kits/aibytes-app/`, seeded
like the existing ones (the kit's `App.jsx` gains save and sign-in state, and
the tweaks panel a Signed out / Signed in control):

- `12-saves-signed-out.html`: light, grid, three items saved, sticky banner,
  Saved entry with its count, stars under the source icons.
- `13-signed-in-menu.html`: dark, list, signed in, the account menu open.
- `14-mobile-banner.html`: phone width, the wrapped banner and the open
  drawer below it, showing the Saved entry.

These replace the removed `06-saved` and `09-headers-auth` screens. The kit's
`README.md` lists them.

## Tech stack

Unchanged: React 18 components in `.jsx`, CSS in `styles.css` and
`components/components.css`, tokens in `tokens/token.css`. Tests run under
`node --test` (esbuild renders the real components, as in `Card.test.js`) and
Python `unittest`. No new dependency.

## Commands

```bash
npm test -w @aibytes/design-system                         # component and contrast tests
npm test -w @aibytes/web                                   # the app still passes, untouched
npm run build:web                                          # the app still builds
python3 -m unittest discover -s tests -p test_design_system.py
npm run preview:design-system                              # http://localhost:4300/ui_kits/aibytes-app/
git diff --check
```

## Project structure

```
packages/design-system/
  components/navigation/Sidebar.{jsx,d.ts,prompt.md}       Saved entry
  components/navigation/AppHeader.{jsx,d.ts,prompt.md}     Sign in, avatar, menu
  components/navigation/icons.jsx                          + warning, + star (filled)
  components/content/SaveBanner.{jsx,d.ts,prompt.md}       icon, centring, sticky
  components/content/FeedItem.jsx, Card.*, ListRow.*       starPos
  components/content/Card.test.js                          + starPos cases
  components/navigation/AppHeader.test.js                  new
  components/navigation/Sidebar.test.js                    new
  components/content/SaveBanner.test.js                    new
  components/components.css, styles.css, tokens/token.css  styles, --redesign-top
  ui_kits/aibytes-app/                                     screens 12-14, App.jsx, README.md
  readme.md                                                header, sidebar, banner notes
tests/test_design_system.py                                offsets and stacking
```

## Code style

Follow the components as they are: a control renders only when its handler is
passed, and the comment says what renders and when.

```jsx
{onSaved && (
  <div className="sidebar-saved">
    <div className="sidebar-label">LIBRARY</div>
    <button className={"category" + (savedActive ? " active" : "")} aria-current={savedActive ? "page" : undefined} onClick={onSaved}>
      <span className="sidebar-saved__name"><Icon name="star" />Saved</span>
      <span>{savedCount ?? 0}</span>
    </button>
  </div>
)}
```

Colours come only from tokens. No new palette token: the pieces use `--text`,
`--text-2`, `--surface`, `--surface-2`, `--border`, `--link`, `--save`, and
the existing popover shadow. Focus uses the existing `:focus-visible` ring.

## Testing strategy

- **Rendering, `node --test`:** the new test files use `Card.test.js`'s
  harness (esbuild-bundle the real component, `renderToStaticMarkup`).
  - Each component with none of the new props renders the same markup as
    before this module (a snapshot taken from `main` in the first commit).
  - `Sidebar`: no Saved entry without `onSaved`; the entry with a count of 0;
    `savedActive` marks the Saved row and no category.
  - `AppHeader`: Sign in only with `onSignIn` and no `user`; with `user` and
    `onSignOut`, the photo (`alt=""`, `referrerpolicy="no-referrer"`) when
    `photoUrl` is given and the initial when it is not, the accessible name
    either way; the menu's Saved item only with `onSaved`. The swap to the
    initial on a failed load is checked in the preview.
  - `SaveBanner`: the icon, the copy, the dismiss label, and the sticky class
    only with `sticky`.
  - `Card` / `ListRow`: `starPos="visual"` puts the star inside
    `story-visual` and not in `item-actions`; the default leaves it in
    `item-actions`; neither renders a star without `onToggleSave`.
- **Behaviour, in the browser preview:** the account menu's Escape and
  outside click; the banner's offset moving the rail, drawer and toolbar, and
  their return when it is dismissed; at 1280, 900 and 390px, in both themes.
- **CSS rules, `tests/test_design_system.py`:** `ToolbarTests` changes from
  `var(--redesign-header)` to `var(--redesign-top)`; new checks that the rail,
  drawer and backdrop use `--redesign-top` and no literal `52px`, that
  `--redesign-top` is defined from `--redesign-header` and `--redesign-banner`,
  and the z-index order masthead > banner > rail > toolbar.
- **Contrast, `tokens/contrast.test.js`:** add the new pairs to the AA checks
  in both themes: banner text and link on `--surface-2`, the avatar initial
  on `--surface-2`, and the menu's secondary line on `--surface`.

## Boundaries

- **Always:** keep every new prop optional with today's output as the
  default; update each component's `.d.ts` and `.prompt.md` with its props;
  keep `tokens/token.css` the only token source; run the full command list
  before committing.
- **Ask first:** any new colour token; changing an existing prop's default;
  changing the banner copy; any new dependency.
- **Never:** touch `apps/web`; edit `_ds_bundle.js`; add shadows at rest or
  gradients beyond Ledger's two exceptions; point anything from the
  newsletter at `packages/design-system`.

## Success criteria

1. Each component, given none of the new props, renders the same markup as
   on `main` (tested).
2. `Sidebar` with `onSaved` shows the Saved entry with its count, including
   0, and `savedActive` marks it current (tested).
3. `AppHeader` shows Sign in when signed out and an avatar menu with Saved and
   Sign out when signed in; the menu closes on Escape and outside click, and
   Escape returns focus to the avatar (tested and checked in the preview).
4. A sticky `SaveBanner` stays under the header while the feed scrolls, spans
   the full width over the rail, and the rail, drawer and toolbar clear it at
   1280, 900 and 390px, moving back when it is removed (checked in the
   preview).
5. `starPos="visual"` puts the star under the source icon on cards and rows
   (tested).
6. New colour pairs pass AA in both themes (tested).
7. UI kit screens 12, 13 and 14 match the prototype's states.
8. aibytes.io is unchanged: `npm run build:web` passes and `apps/web` has no
   diff.
9. Every command under **Commands** passes.

## Decisions (answered 7 Nov 2026)

1. **Avatar:** the Google profile photo, with the initial as its fallback
   when there is no photo or it fails to load.
2. **Sidebar label:** `LIBRARY` above the Saved entry, in place of the
   prototype's `YOURS`.
