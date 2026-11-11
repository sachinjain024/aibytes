Ledger is the design system of **aiBytes_** (`aibytes.io`): a curated daily feed of AI resources for developers. Each day is an **edition**, a dated snapshot of launches, repos, news and HN threads. Ledger serves the daily app and the Chrome extension; the weekly newsletter keeps its own inline email styles.

**One-liner:** The latest in AI for developers — launches, repos, threads, and news in one daily edition.

**The job of the main page:** let a developer scan 30–50 items in under three minutes and know, from the card alone, where each came from and whether it's worth a click.

## Content fundamentals

- **Tone:** dense, calm, honest, technical, quietly opinionated. Never playful-startup, never marketing.
- **Voice:** plain declarative sentences. Summaries are one line, factual, no adjectives-as-hype: "AI video editor inside ChatGPT with a real timeline and XML export."
- **Person:** the product speaks in neutral third person; direct address ("you") only in functional copy ("Sign in with Google to keep them across devices").
- **Casing:** sentence case everywhere. Category and tag labels are Title Case nouns ("Dev Tool", "Open Source"). No ALL CAPS except tiny labels (TOP, LIBRARY).
- **Numbers and dates are content**, with tabular numerals: `▲776`, `+6.4k ★`, `Wed, Aug 27`. Numbering must encode something true: editions are dated, sections are counted; nothing decorative.
- **Emoji:** none in UI copy. ▲ ★ and the comment bubble are signal glyphs, not emoji.
- **Empty states are invitations, not mood:** "No Repos in this edition. ← Aug 26 had 9."

## Visual foundations

- **Text is the interface.** Images are small accents in a fixed slot (`img-slot`, `img-slot-list`), never heroes or banners. No illustration, no photography.
- **Colour.** A neutral field: `paper` ground, `surface` for raised fills, `ink` text, `muted` secondary text, `line` hairlines. Use the aliases in components: `bg`, `text`, `text-2`, `border`, `surface-2`. Light is cool blue-grey; dark is neutral zinc. Same layout in both themes; only the palette flips.
- **Links and actions are separate.** In-sentence links use `link` with a 1px underline, 2px on hover. Filled actions use `accent` with `accent-fg` text; in dark `accent` is a neutral grey, so never put `link` text on it.
- **Three signal colours, each with one job.** `hot` only for the "top today" left edge and the HN tile, with `hot-text` for the TOP label. `save` only in the filled star. `success`, with `success-fg` for the mark drawn on it, only in a confirmation tick.
- **Type.** Inter for everything in the UI, with `tracking-body` (−0.01em); the scale is `ui-12` … `ui-28` (`--text-12`/`--lh-12` … `--text-28`/`--lh-28`). Bricolage Grotesque only for the wordmark and the edition heading, with `tracking-heading`. Numbers use tabular numerals (`--mono-features`).
- **Backgrounds:** flat fills. No gradients, glass or textures. One exception: the Sidebar's selected category keeps a faint horizontal gradient and soft shadow so it reads as raised; nothing else copies it.
- **Borders and shadows:** 1px (`border-w`) everywhere; no shadows at rest. Popovers (calendar, filter panel, card and account menus) may carry a soft `shadow`, since they float over the feed.
- **States.** Hover: a `hover` or `surface-2` wash on rows and chips; cards lift by `lift`. Press: `accent-active`. Disabled: `disabled`.
- **Motion:** `transition` (120ms ease) on colour, border and transform only. Under `prefers-reduced-motion`, drop the lift and keep the colour change.
- **Radii:** `radius-card` 10px, `radius-chip` 6px, `radius-img` 8px.
- **Spacing:** the 4px scale `space-1` … `space-16`; `card-pad` 16, `grid-gap` 12. Layout: 52px AppHeader (`redesign-header`), 250px desktop rail (`redesign-rail`), 1200px reading column (`content-max`), 20px phone gutters (`gutter-mobile`). The Sidebar becomes a drawer below 761px.
- **Focus:** a visible 2px `focus-ring` (`focus-w`), offset `focus-offset`, on every interactive element, for the keyboard only. AA contrast in both themes.

## Composing the app

The app is built from these components, so a design made with them is the shipped app:

- **Shell:** `AppHeader` (sticky, 52px), then `SaveBanner sticky` when it shows, then `Sidebar` (category rail and the phone drawer) and the main column: `Toolbar` (count, search, Filters, Ranked | Grouped, List | Grid, then an `EditionBar` as the date picker), `ActiveFilters` under it while anything is selected, `FilterPanel` and `CalendarPopover` as popovers.
- **Feed:** `CardGrid` of `Card`s or `RowList` of `ListRow`s. Ranked order (the default) is one list with no headings; Grouped order puts a `SectionHeading` before each category's grid or list. End every feed with `EndCard`; use `EmptyState` when filters or a search leave nothing and `StatusMessage` for loading and errors.
- **Saves and sign-in:** pass `onToggleSave` to show the star (`starPos="visual"` puts it under the source icon, as the app does). Signed out with a save, show `SaveBanner`; it cannot be dismissed in the app. `AppHeader` takes `onSignIn`, or `user` with `onSignOut` for the avatar and its account menu. `Sidebar` takes `onSaved` and `savedCount` for the LIBRARY section.
- **Dialogs:** `Dialog` is one question, asked once, over a scrim: a heading (`.ldg-dialog__title`) named by `labelledBy`, plain paragraphs, and `.ldg-dialog__actions` for the buttons. Escape, the × and a press on the scrim call `onClose`; focus moves in, stays inside, and returns to the opener. The app uses it for the newsletter offer after a first sign-in. Never for navigation.
- **Prose:** a link inside a sentence needs the `.ldg-prose` class on a container (or a `<p>` inside `.app-main`) to get `link` and its underline; the base `a` rule inherits the text colour for nav, card and button links.

## Iconography

- **No icon font, no icon library.** Iconography is limited to per-source marks, signal glyphs, and a handful of functional 1.5px-stroke inline SVGs in the text colour (star, arrows, sun/moon, calendar, ×, warning).
- **Per-source marks** (`assets/marks/*.svg`, theme-aware): `producthunt.svg`, `hackernews.svg` (white Y on the `hot` tile), `github.svg` (Octocat in `text`), `techcrunch.svg`. The `SourceMark` component inlines the same marks; `ItemImage` falls back to it when an item has no image.
- **Signal glyphs:** ▲ upvotes or points, ★ stars, a stroked speech bubble for comments, always with tabular numerals.
- **No logo file exists.** The wordmark is typographic (`aiBytes_`, Bricolage Grotesque 800, the underscore set apart), rendered by `Wordmark` and inside `AppHeader`. No drawn mark was provided and none was invented.

## Not synced

- The OS-theme fallback (`prefers-color-scheme: dark` on a root without `data-theme`) stays in the repo's `tokens/token.css`; here the theme is always set explicitly.
- `--mono-features` and `--redesign-top` (a `calc()` over `redesign-header` and the banner's height) live in `components/bundle.css`, since tokens.json cannot hold them.
- Fonts are Google Fonts (Inter, Bricolage Grotesque), loaded by `components/bundle.css`; there are no font files.
- The foundation specimen pages under `guidelines/*.html` are the repo's historical references and are not refreshed here.
