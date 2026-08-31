---
name: aibytes-design
description: Design and build well-branded interfaces for the aiBytes_ web app and Chrome extension using Ledger, the design system in packages/design-system - tokens, React components, per-source marks, and the nine app screens. Use when designing or building any app or extension UI, prototyping a screen, or checking whether a change is on-brand. Not for the newsletter, which has its own inline email design system.
---

Ledger lives in `packages/design-system/`. Read `packages/design-system/readme.md`
first, then explore what you need.

Key paths, all under `packages/design-system/`:

- `styles.css` — the token entry point (light default, dark via `[data-theme="dark"]`)
- `tokens/` — `fonts.css`, `colors.css`, `typography.css`, `spacing.css`, `base.css`
- `components/` — React primitives grouped as `brand/`, `navigation/`, `content/`,
  `forms/`. Each has a `.jsx`, a `.d.ts`, and a `.prompt.md` describing its intent
- `assets/marks/` — per-source SVGs (Product Hunt, Hacker News, GitHub, TechCrunch)
- `ui_kits/aibytes-app/` — the nine app screens plus an interactive `index.html`
- `guidelines/` — foundation specimen cards and `extending-ledger.md`

The source brief and product spec are in `docs/aibytes-design-system-brief.md` and
`docs/aibytes-app-product-spec.md`. The brief wins on conflicts.

## Non-negotiables

- **Text is the interface.** Images are 40px accents in a fixed slot, never heroes.
- **One accent, one hot.** Cobalt `--accent` for anything interactive; orange `--hot`
  only for "top today" and the HN tile; yellow `--save` only in the filled star.
- **Mono for numbers.** JetBrains Mono with tabular numerals on every signal, count,
  tag, and date so they line up in a column across cards.
- **1px borders, no shadows at rest.** Hover swaps `--border` for `--accent` plus a
  1px lift. No gradients, no glass, no illustration, no infinite scroll.
- **Same layout in light and dark** — only the palette flips.
- AA contrast and a visible 2px focus ring on every interactive element, both themes.

## Scope

Ledger is for the **app and the Chrome extension only**. The newsletter keeps its own
palette inline in the generate-newsletter-content and generate-followup-thumbnail
templates, because email HTML cannot load a stylesheet. Never point a newsletter
template at `packages/design-system`.

If asked to design something visual for review, copy the assets out and produce a
static HTML file. For production code, read the rules above and build with the tokens.
