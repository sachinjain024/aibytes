# Ledger — the aiBytes_ design system

Design system for **aiBytes_** (`aibytes.io`): a curated daily feed of AI resources for developers. Each day is an **edition** — a dated snapshot of launches, repos, news, and HN threads. Ledger serves three surfaces on the same content: the daily app, the weekly Beehiiv newsletter, and a later Chrome new-tab extension.

**Sources given:** `uploads/aibytes-app-product-spec.md` (App Product Spec v0.2.2) and `uploads/aibytes-design-system-brief.md` (design brief — wins on conflicts). No codebase, Figma, or font binaries were provided.

**One-liner:** The latest in AI for developers — launches, repos, threads, and news in one daily edition.

**The job of the main page:** let a developer scan 30–50 items in under three minutes and know, from the card alone, where each came from and whether it's worth a click.

## CONTENT FUNDAMENTALS

- **Tone:** dense, calm, honest, technical, quietly opinionated. Never playful-startup, never marketing.
- **Voice:** plain declarative sentences. Summaries are one line, factual, no adjectives-as-hype: "AI video editor inside ChatGPT with a real timeline and XML export."
- **Person:** the product speaks in neutral third person; direct address ("you") only in functional copy ("Sign in with Google to keep them across devices").
- **Casing:** sentence case everywhere. Category/tag labels are Title Case nouns ("Dev Tool", "Open Source"). No ALL CAPS except tiny mono labels (e.g. TOP).
- **Numbers and dates are content**, set in mono with tabular numerals: `▲776`, `+6.4k ★`, `Wed, Aug 27, 2026 · 39 items · updated 4h ago`. Numbering must encode something true — editions are dated, sections are counted; nothing decorative.
- **Emoji:** none in UI copy. The wordmark's ⚡ is the only pictogram; ▲ ★ ☆ 💬-style glyphs on cards are signal icons (we render ▲/★/comment as glyphs, not emoji).
- **Empty states are invitations, not mood:** "No Repos in this edition. ← Aug 26 had 9."
- **Newsletter heritage:** wordmark `⚡ aiBytes_` with trailing underscore in cobalt; hex section numbers (`0x01`) are a *newsletter-only* device — the app uses dates and counts instead.

## VISUAL FOUNDATIONS

- **Text is the interface.** Images are 40px accents in a fixed slot, never heroes or banners. No illustration, no photography.
- **Color:** neutral warm-grey field (`--bg` #F7F7F4 light / #0F1115 dark). One accent (cobalt `--accent`) for everything interactive; one hot (orange `--hot`) only for "top today" and the HN tile; yellow `--save` only in the filled star. Same layout in both themes — only the palette flips.
- **Type:** Bricolage Grotesque (500/700/800) for logo/headings/section titles; Inter with Linear-style tight tracking (`--tracking-body:-0.01em`) for body/UI (incl. chips and header nav, weight 500); JetBrains Mono for meta, signals, tags, dates, the edition bar. Scale 13/14/16/20/28 (+12 mono meta). Headings tracked slightly tight (−0.02em), mono slightly loose (+0.02em), tabular numerals on all mono.
- **Backgrounds:** flat fills only. No gradients, no glass, no textures, no patterns.
- **Borders & shadows:** 1px borders everywhere; **no shadows at rest**. Hover = border swaps to `--accent` + 1px lift (`translateY(-1px)`).
- **Hover states:** border-color change + subtle lift on cards; darker/lighter accent on links & buttons; `--surface-2` wash on chips.
- **Press states:** `--accent-active` (darker in light, deeper in dark); no shrink transforms.
- **Motion:** 120ms ease, color/border/transform only. `prefers-reduced-motion`: drop the lift, keep the color change. No bounces, no fades-in-on-scroll.
- **Radii:** 10px cards, 6px chips, 8px images, 2px focus-ring offset.
- **Spacing:** 4px base scale; card padding 16, grid gap 16, section gap 40. Content max-width 1200px centered; 20px mobile gutters.
- **Focus:** visible 2px `--accent` ring, 2px offset, on every interactive element. AA contrast in both themes (dark accent lifted to #6C86FF for this; text on dark-accent fills is dark `--accent-fg`).
- **Layout constants:** header + edition bar sticky together. Grid 3 cols ≥1200, 2 tablet, 1 mobile. No infinite scroll, no Load more — editions end with an end-card.
- **Transparency/blur:** none.
- **Signature element:** the **edition bar** — a dated, pageable ledger of days set in JetBrains Mono. Everything around it stays quiet.

## ICONOGRAPHY

- **No icon font, no icon library.** Iconography is limited to: (1) per-source marks, (2) signal glyphs, (3) a handful of functional strokes (star, arrows, sun/moon, calendar, ×) drawn as 1.5px-stroke inline SVGs matching text color.
- **Per-source marks** (`assets/marks/*.svg`, 40px tiles, theme-aware via CSS vars with fallbacks): `producthunt.svg` (orange P on white tile), `hackernews.svg` (white Y on `--hot` tile), `github.svg` (Octocat mark in `--text`), `techcrunch.svg` (green TC on white tile). Also inlined by the `SourceMark` component.
- **Signal glyphs:** ▲ upvotes/points, ★ stars, a stroked speech-bubble for comments — always mono, always with tabular numbers.
- **Emoji:** never. Unicode glyphs (▲, ·, ←, →) are used as typographic devices in mono strings.
- **No logo file exists.** The wordmark is typographic — `⚡ aiBytes_`, Bricolage Grotesque 800, underscore in `--accent` — rendered by the `Wordmark` component (full / compact / icon variants). No drawn brand mark was provided and none was invented.

## Open decisions (section 11) — recommendations made and shown

1. **Top-today marker:** mono label `TOP` in `--hot-text` (the AA-safe text shade of `--hot`) in the meta row + 2px `--hot` left edge on the card. Shown on the ChatCut card. (Label carries meaning; edge makes it scannable in a grid.) → simplified to **left edge stripe + mono label**, pick shown in components card.
2. **Edition date as H1:** **yes** — the edition-bar date is the page `<h1>`; the wordmark is a link, not a heading. Encodes the truth that a page = a day.
3. **Repo language dot:** **reduced palette** — 8 muted hues mapped from GitHub's set, defined as tokens in the Card component, so dots never outshine the accent.
4. **Hex-numbered sections:** **no echo.** The app's section headings use name + mono count (`Repos · 9`). The mono count is the only rhyme with the newsletter's numbering.

## Index

- `styles.css` → imports `tokens/` (fonts, colors, typography, spacing, base)
- `assets/marks/` — per-source SVGs (standalone, theme-aware)
- `components/brand/` — Wordmark, SourceMark
- `components/navigation/` — Header, EditionBar, CalendarPopover, Chip, SideNav, Footer
- `components/content/` — Card, ListRow, ItemImage, SectionHeading, Tag, SaveStar, CardMenu, SaveBanner, EmptyState, EndCard
- `components/forms/` — Button, Input
- `ui_kits/aibytes-app/` — the nine screens + interactive `index.html`, shared `data.js`
- `guidelines/` — foundation specimen cards, `extending-ledger.md`
- `SKILL.md` — agent skill entry point

## Caveats / intentional notes

- **Fonts:** no binaries provided; loaded from Google Fonts (`tokens/fonts.css`). All three faces are on Google Fonts, so this is an exact match, not a substitution — but supply .woff2 files for self-hosting in production.
- **Intentional additions:** `SourceMark`, `SaveStar`, `EndCard`, `EmptyState` as named components (the brief describes them inside other components; splitting keeps cards composable).
- **`ItemImage`** (added in the app build, not the Claude Design export) is the image slot shared by `Card` and `ListRow`: it requests each image at the slot's size from hosts that support it, and falls back to the source mark when an image is missing or fails to load.
- The newsletter's own system ("Bitmark") is *not* recreated here; Ledger is the app system, per the brief.
