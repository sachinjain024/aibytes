# Spec: AIB-76n, module 1 `ledger-extension-ui`

Status: **draft, 22 Nov 2026, for review.** Module 1 of 6 in
`docs/specs/AIB-76n-capability-map.md`. Design:
`docs/decisions/product/AIB-76n-extension-design.md`; the prototype,
`docs/ux/prototypes/AIB-76n-extension/`, is the visual reference, and its
`copy.js` is the agreed copy.

## Objective

Give the popup, the onboarding page and the install box their visual pieces in
Ledger, so `extension-popup` and `site-extension` assemble screens and write no
styles of their own. Every addition is a new component or an option that is off
by default, so aibytes.io looks exactly as it does today when this module merges.

Who: the two modules that build on it, and the publisher reviewing the screens
in the UI kit before any app code exists.

Success looks like:

- The UI kit shows three new screens, in light and dark: the popup (Today,
  Saved, the gist view), the onboarding page (step 1, step 2, done, not
  installed), and the feed with the install box in the rail.
- Each screen matches the prototype at the published version (14) within
  Ledger's tokens: same layout, same copy, no new colours.
- `Sidebar` without `promo`, and `Button` without `size`, render byte-for-byte
  as before (tested).
- The extension icon exists as PNGs at 16, 32, 48 and 128 px, drawn from
  `apps/web/public/favicon.svg`.

### Not in this module

Data loading, saves, sign-in, Chrome APIs, routing, the onboarding page's step
logic, and the flag that hides the install box: all belong to the app modules.
Components here take values and callbacks and never fetch.

## What is added

All under `packages/design-system/components/`, each with a `.jsx`, a `.d.ts`
and a `.prompt.md` (the rule in `.claude/rules/design-system.md`). Copy reaches
each component as props whose defaults are the agreed strings, keyed as in the
prototype's `copy.js`, so the apps own the wording and Ledger still renders
something sensible alone.

### `extension/` (new folder)

| Component | What it draws | Props |
|---|---|---|
| `ExtensionIcon` | The favicon tile: the wordmark's bolt, white on cobalt, `rx` 7 of 32. Fixed brand colours, the same in both themes (it is a logo, like the source marks) | `size` (px, default 20), `title` (omitted = `aria-hidden`) |
| `PopupHeader` | The compact `Wordmark`, the edition date, then at the right the saved toggle (A2: star + count, `aria-pressed`, `aria-label` "Saved items") and either Sign in (a text button) or the reader's avatar (photo, or their initial), which opens a small menu: the name, the email, and Sign out (`pop.menu.signout`). The menu is a popover (a soft shadow is allowed), closes on Esc and outside clicks, and returns focus to the avatar | `date`, `savedCount`, `savedActive`, `onToggleSaved`, `user` (`{ name, email?, photoUrl? }` or null), `onSignIn`, `onSignOut`, `labels` |
| `PopupFooter` | The sticky footer: `--surface-2`, a top border, 44px; meta at the left in mono, a link at the right | `meta`, `children` (the link) |
| `PopupGistBar` | The gist view's top bar: one back button ("← Today" / "← Saved") (D2) | `backLabel`, `onBack` |
| `PopupActionBar` | The gist view's bottom bar (D2): the `SaveStar`, "Save" or "Saved", and the site link at the right | `saved`, `onToggleSave`, `labels`, `children` (the link) |
| `OnboardingStep` | One step card: a numbered circle that becomes a tick when `done`, the title, an "Optional" tag when `optional`, "Step {n} of {total}" at the right, then its children | `n`, `total`, `title`, `optional`, `done`, `labels`, `children` |
| `PinAnimation` | F1: the looping five-frame animation of Chrome's toolbar, the puzzle menu and the pin, with its caption under it (`onb.pin.1`–`5`). Under `prefers-reduced-motion` it shows the last frame still, with all five captions as a numbered list | `captions` (five strings) |
| `ExtensionPromo` | H3: a small bordered box: icon and "aiBytes_ for Chrome", one line, a primary "Add to Chrome" link (opens in a new tab), and a "Not now" text button | `href`, `onDismiss`, `labels` |

The popup frame is 550px wide (400px until 26 Nov 2026, the publisher's
call) and up to 580px tall (Chrome's popup limit is 800×600). The popup
renders `ListRow` with `stacked` (26 Nov 2026): the title (up to two lines)
with the ⋮ menu beside it, the summary (up to two lines), then the source and
its counts on a smaller line at the bottom, so neither takes width from the
title (B1). `GistView` is used unchanged inside the popup.

### Options on existing components

- **`Sidebar`**: `promo?: React.ReactNode`, rendered first inside
  `.sidebar-footer`, above the links, in a wrapper with 14px below it. In the
  phone drawer it renders too; the app decides when to pass it (desktop Chromium
  browsers only, per the map). Absent = today's markup.
- **`Button`**: `size?: "lg"`: 48px tall, 16px semibold, up to 360px wide. Used
  for "Sign in with Google" in step 2. Absent = today's markup. (The prototype
  had to restyle the Google button from outside because `Button` spreads
  `className` over its own; `size` replaces that workaround.)

### Icons for Chrome

`assets/extension/icon-16.png`, `-32`, `-48`, `-128`: the favicon rasterised,
transparent outside the tile. Chrome takes no SVG for `action` icons, and the
store needs the 128px PNG. Generated once by `scripts/extension-icons.mjs`
(headless Chrome screenshots of the SVG at each size, the same way the
prototype was checked; no new dependency), and committed. The script is rerun
only if the favicon changes.

### UI kit and docs

- Three kit pages, `ui_kits/aibytes-app/19-extension-popup.html`,
  `20-extension-onboarding.html`, `21-install-box.html`, each with the
  `<!-- @dsCard … -->` marker as its first line, wired in the kit's `App.jsx`
  and listed in its `README.md`, like the gist screens before them.
- `guidelines/extending-ledger.md`: the "Chrome extension (new-tab surface)"
  section is rewritten for the popup: the components above, the 550px frame,
  the favicon as the icon (not the wordmark's `icon` variant), and fonts
  bundled with the extension rather than fetched. The new-tab notes move under
  a short "Later: the new tab (AIB-151m)" line.
- `readme.md` lists the new components.

The `_ds_*` files, `.thumbnail` and existing markers are Claude Design's
round-trip surface and are not hand-edited.

## Tech stack

React 18 JSX with relative imports, as every Ledger component. `esbuild` (an
existing dev dependency) for the tests. Nothing new.

## Commands

```bash
npm test -w @aibytes/design-system          # node --test: components, including the new ones
npm run preview:design-system               # then open http://localhost:4300/ui_kits/aibytes-app/
python3 -m unittest tests.test_design_system -v   # dark/light blocks, focus ring, kit pages
node packages/design-system/scripts/extension-icons.mjs   # regenerate the PNGs (only if the favicon changes)
```

## Project structure

```
packages/design-system/
  components/extension/      ExtensionIcon, PopupHeader, PopupFooter, PopupGistBar,
                             PopupActionBar, OnboardingStep, PinAnimation, ExtensionPromo
                             (.jsx, .d.ts, .prompt.md each; extension.card.html; *.test.js)
  components/navigation/Sidebar.*   + promo
  components/forms/Button.*         + size
  components/components.css         the new classes (ldg-popup-*, ldg-onb-*, ldg-promo)
  assets/extension/icon-{16,32,48,128}.png
  scripts/extension-icons.mjs
  ui_kits/aibytes-app/19-21-*.html, App.jsx, README.md
  guidelines/extending-ledger.md, readme.md
```

## Code style

As `SaveBanner`: a short header comment saying what the component is for, copy
as props with defaults, no data fetching, tokens only.

```jsx
// The gist view's bottom bar in the popup (AIB-76n, D2): the star, its label,
// and the link to the site. The app owns what saving does and where the link goes.
export function PopupActionBar({ saved = false, onToggleSave, labels = {}, children }) {
  const { save = "Save", savedLabel = "Saved" } = labels;
  return (
    <div className="ldg-popup-actions">
      <SaveStar saved={saved} onToggle={onToggleSave} />
      <span>{saved ? savedLabel : save}</span>
      {children}
    </div>
  );
}
```

Classes are `ldg-`-prefixed. Mono with tabular numerals on the count and the
footer meta. 1px borders, no shadow at rest (the popup itself is Chrome's
window, not a Ledger popover).

## Testing strategy

- **`node --test`** beside each component, as `SaveBanner.test.js` does:
  render with `renderToStaticMarkup` and assert the structure that matters
  (the saved toggle's `aria-pressed` and label; avatar vs Sign in; the step's
  tick when `done`; "Step 2 of 2"; the promo's link opening in a new tab; the
  animation's still frame and list under reduced motion, through a prop the
  test can set).
- **No regression:** `Sidebar` without `promo` and `Button` without `size`
  render the same markup as before (snapshot strings in the tests).
- **`tests/test_design_system.py`:** the new kit pages are seeded kit pages
  with the marker first; dark and light token blocks still match.
- **By eye:** the three kit screens beside the prototype, light and dark, at
  550px for the popup and 1280px and 390px for the site.

## Boundaries

- *Always:* tokens only; both themes; a visible 2px focus ring on every control;
  `.d.ts`, `.prompt.md` and `.jsx` change together; new options default off.
- *Ask first:* a new token or colour; changing an existing component's default
  markup; any dependency.
- *Never:* hand-edit `_ds_manifest.json`, `_ds_bundle.js`,
  `_adherence.oxlintrc.json`, `.thumbnail` or existing `@dsCard` markers; point
  the newsletter at Ledger; add a shadow at rest.

## Success criteria

1. `npm test -w @aibytes/design-system` and `tests.test_design_system` pass,
   including the new tests.
2. The three kit screens render in light and dark and match the prototype's
   layout and copy.
3. aibytes.io built from this branch (`npm run build:web`) is unchanged: no
   app file imports the new components yet, and the two new options are unused.
4. The four PNGs exist, are square, transparent outside the tile, and look
   right at 16px in Chrome's toolbar (checked when `extension-popup` loads them).
5. Every new control is reachable by keyboard and has a visible focus ring.

## Open questions

None. Decided 22 Nov 2026: the pin animation is code (DOM and CSS), so it
themes and respects reduced motion; the avatar opens a menu with Sign out (map
answer 12).
