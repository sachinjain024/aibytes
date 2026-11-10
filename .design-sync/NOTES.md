# Design sync notes

## Since 10 Nov 2026: a Design System Artifact in Claude

Standalone Claude Design closes by 14 Dec 2026, and the project below moved
into Claude as the Artifact https://claude.ai/artifact/Ti3vLaKSjGm8h9e42VaBWH
("aiBytes_ App Design System", a Design System type). `/design-sync` can no
longer write to it: every upload gets HTTP 403 "This design system moved to
Claude". Sync it from `packages/design-system/artifact/` instead:

1. `node packages/design-system/artifact/build.mjs --out <scratch dir> --ref main@<sha>`
   writes `<dir>/project/...`: the bundle compiled from `components/`,
   `tokens.json` and `tokens.css` read from `tokens/token.css`, `bundle.css`
   (styles.css without the token values), a README and live preview per
   component (`artifact/previews.mjs`), the brand-book `README.md`
   (`artifact/README.md`) and the cover (`artifact/cover.html`). The
   `ui_kits` sample screens are not synced: they lag the app (the save
   banner there can still be dismissed), so the Artifact carries components
   only.
   Nothing in the repo is generated: token.css stays the only token source.
2. Check every preview renders, in both themes, in a frame that preloads
   tokens.css, bundle.css, React 18 and the bundle and sets `data-theme`.
3. Read the Artifact's `project/design-system.json` right before publishing,
   set only its `lastChange`, then publish everything to the Artifact's url
   in one call with that index (`root` = the scratch dir). `.d.ts` files need
   `contentType: "text/plain"`. If the publish is refused for a newer
   version, read the whole Artifact (`read` with the url alone) and retry once.
4. The source marks are uploads recorded in the index; re-upload one only
   when its sha256 there differs from `assets/marks/`.

The type keeps its own `project/api/` pages, including a few for the
removed migration components; those are the type's to regenerate, never
written by the sync.

## How Ledger synced to Claude Design (until 2 Nov 2026)

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
- 2026-11-10 (AIB-75v): first sync to the Artifact, version 4. 101 files from
  `artifact/build.mjs` at main@c510082: 27 components with live previews,
  14 screens, the redesign palette in tokens.json, a new README and cover.
  All 42 previews rendered in both themes in a simulated frame.
- 2026-11-10 (AIB-75v): version 5 removed the migration leftovers (`Brand`,
  `Content`, `Forms`, `Navigation`, `Sidenav`, `Header`, `Chip`, `SideNav`,
  `Footer`, `components/src/`, `docs/_ds_*`) and, on request, every sample
  screen (`Saved`, `HeadersAuth` and the 14 `ui_kits` screens with their
  shared scripts). The builder no longer writes screens.

## Known issues

- Preview cards are 700-1200px wide but type sizes follow the viewport, so a
  card in a narrow frame shows phone type sizes. Compare cards with the app at
  the card's own viewport width.
