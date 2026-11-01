---
name: aibytes-design
description: Design and build well-branded interfaces for the aiBytes_ web app and Chrome extension using Ledger, the design system in packages/design-system - tokens, React components, per-source marks, and the nine app screens. Use when designing or building any app or extension UI, prototyping a screen, or checking whether a change is on-brand. Not for the newsletter, which has its own inline email design system.
---

Ledger lives in `packages/design-system/`. Read `packages/design-system/readme.md`
first as the source of truth for the current app design, then explore what you need.

Key paths, all under `packages/design-system/`:

- `styles.css` — the token entry point (light default, dark via `[data-theme="dark"]`)
- `tokens/token.css` — the authoritative palette, typography, spacing, shape, and language tokens
- `components/` — React primitives grouped as `brand/`, `navigation/`, `content/`,
  `forms/`. Each has a `.jsx`, a `.d.ts`, and a `.prompt.md` describing its intent
- `assets/marks/` — per-source SVGs (Product Hunt, Hacker News, GitHub, TechCrunch)
- `ui_kits/aibytes-app/` — the nine app screens plus an interactive `index.html`
- `guidelines/` — foundation specimen cards and `extending-ledger.md`

The source brief and product spec are in `docs/aibytes-design-system-brief.md` and
`docs/aibytes-app-product-spec.md`. The brief wins on conflicts.

## Non-negotiables

- Use `tokens/token.css` as the single token source; do not restore legacy token files or add override layers.
- Use the neutral redesign palette in both themes, Inter for UI/metadata and Bricolage Grotesque for the brand/edition heading.
- Separate link text (`--link`) from filled actions (`--accent` and `--accent-fg`).
- Preserve all public component options, source/destination links, optional save callbacks, and image fallbacks.
- Keep keyboard focus visible; suppress pointer rings without turning them on for ordinary typing.
- Validate effective light/dark colors and focus/control boundaries with the contrast tests.
- Preserve edition loading, ranking, URL filters and persisted preferences. The redesign interactions documented in readme.md are intentionally retained.

## Scope

Ledger is for the **app and the Chrome extension only**. The newsletter keeps its own
palette inline in the generate-newsletter-content and generate-followup-thumbnail
templates, because email HTML cannot load a stylesheet. Never point a newsletter
template at `packages/design-system`.

If asked to design something visual for review, copy the assets out and produce a
static HTML file. For production code, read the rules above and build with the tokens.
