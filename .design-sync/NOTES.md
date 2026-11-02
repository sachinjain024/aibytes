# Design sync notes

## How Ledger syncs

- Target: "aiBytes_ App Design System" (`projectId` in `config.json`). Ledger
  was exported from this project, and its bundle namespace
  `LedgerAiBytesDesignSystem_b1be4f` is named after it.
- The project is a native Claude Design source project, in the same layout as
  `packages/design-system/` (flat `components/<group>/<Name>.{jsx,d.ts,prompt.md}`,
  `*.card.html` with `@dsCard` first lines, `ui_kits/`, `guidelines/`). Do not
  run the design-sync converter against it: that would re-lay the project out
  as `components/<group>/<Name>/` folders with `_vendor/` and `_preview/`.
- Sync is a source round-trip: upload the repo's tracked files verbatim, from
  `localDir = packages/design-system`, fenced by `_ds_needs_recompile`.
  Claude Design rebuilds `_ds_bundle.js`, `_ds_manifest.json` and
  `_adherence.oxlintrc.json` from the sources when the project is opened.
- Never upload: `_ds_bundle.js`, `_ds_manifest.json`, `_adherence.oxlintrc.json`,
  `.thumbnail` (the app generates them), `package.json`, `*.test.js`.
- Leave alone, they exist only in the project: `SKILL.md`, `aiBytes App.html`,
  `screenshots/`, `uploads/`.
- No `_ds_sync.json` anchor: its hash recipe is the converter's, so every sync
  re-uploads everything. That is cheap (about 105 small text files).

## Verify before uploading

The committed `_ds_bundle.js` lags the sources (only Claude Design regenerates
it), so `npm run preview:design-system` serves `/_ds_bundle.js` compiled from
source on every request (`packages/design-system/scripts/preview.mjs`) and
leaves the committed file alone. Open every `*.html` page there before
uploading: no page errors, no 4xx, non-empty body.

When the bundle's components change, bump the `_ds_bundle.js?v=N` query on the
`ui_kits` pages. Otherwise Claude Design's preview can keep a cached old bundle
and the screens report "Ledger bundle not compiled yet".

## Sync log

- 2026-11-02 (AIB-133k): first sync from the repo. Uploaded 105 files after
  PR #43 (redesign), #45 (reformat) and #46 (deprecations); deleted the five
  pre-consolidation token files (`tokens/{base,colors,fonts,spacing,typography}.css`,
  replaced by `tokens/token.css`). 29/29 pages rendered against a bundle
  compiled from source.
- 2026-11-02 (AIB-133k, PR #47): Ledger became the app's source. Uploaded 112
  files (new AppHeader, Toolbar, Sidebar, FilterPanel, ActiveFilters, Feed;
  shell/sidebar/feed cards; the nine screens redrawn) and deleted 17: Header,
  Chip, SideNav, Footer, `navigation.card.html`, `sidenav.card.html`,
  `content.card.html`, `ui_kits/aibytes-app/{06-saved,09-headers-auth}.html`.
  `FeedItem.jsx` is still a tracked source, so it stays. 28/28 pages rendered
  against a bundle compiled from source; the app showed 0 computed-style
  differences across 74 states. The screens then showed "Ledger bundle not
  compiled yet" from a cached `?v=14` bundle; bumped to `?v=15` and re-uploaded
  the 11 `ui_kits` pages.

## Known issues

- Preview cards are 700-1200px wide but type sizes follow the viewport, so a
  card in a narrow frame shows phone type sizes. Compare cards with the app at
  the card's own viewport width.
