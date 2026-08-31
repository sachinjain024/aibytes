# How to extend Ledger

One page for future surfaces and sources. The rule underneath everything: **text is the interface, one accent, one hot, mono for numbers, same layout in both themes.**

## Adding a source (e.g. Reddit, company blogs, The Verge)

1. **Mark.** Add a 40px tile SVG to `assets/marks/` and a case to `SourceMark`. Follow the existing pattern: the source's own brand color is allowed *inside the 40px tile only* (like PH orange, TC green); it must read on `--surface` in both themes — use a white tile + 1px `--border` when in doubt. Never let a source color leak outside the tile.
2. **Image rule.** Decide the slot content per the existing table: logo (rounded 8px), avatar (circle), thumbnail (square-cropped 8px), or none (the mark fills the slot — the HN pattern). Fixed 40px, lazy-loaded, mark as fallback.
3. **Signals.** Map the source's numbers to the existing order — upvotes/points, stars gained, comments — rendered only when present, always mono/tabular. Don't invent new glyph types; a new signal kind needs a design review, not a new icon.
4. **Source filter** picks the new source up from the edition JSON automatically; add the label to the sources list.

## v1.1 categories (Discussions · Releases · Research)

- Categories are **ordered facts, not tabs**: append them to edition order after HN Threads (Launches, Repos, News, HN Threads, Discussions, Releases, Research).
- Each gets a `SectionHeading` (`Discussions · 12`) and a chip. Nothing else changes — cards are category-agnostic.
- Empty categories don't render; the chip shows only when the edition has items (same "no fake editions" rule as the calendar).
- Reddit items: subreddit is the source link label (`r/LocalLLaMA`), points + comments as signals, no image → Reddit mark tile.

## Chrome extension (new-tab surface)

- Same `content/editions/*.json`, same components, **no new components**: Header (compact, no sign-in), EditionBar, Card grid, EndCard. No footer, no filters in v1 — the new tab is a read-only glance surface.
- Respect the OS theme by default (`prefers-color-scheme`); the manual toggle persists to extension storage.
- The wordmark `icon` variant is the extension/action icon.
- Keep the edition bar: a new tab should still answer "which day am I looking at."
- Budget: no runtime fonts fetch — package the three .woff2 files with the extension.

## Newsletter

The newsletter keeps its own Bitmark voice (hex sections `0x01`, TL;DR block, signal yellow). Ledger tokens do not apply there; only the wordmark and cobalt are shared. Don't port hex numbering into the app, and don't port Ledger's neutral restraint into the newsletter.

## What never changes

Palette and faces are fixed. No gradients, shadows at rest, glass, illustration, or infinite scroll on any surface. AA in both themes; focus ring on everything interactive.
