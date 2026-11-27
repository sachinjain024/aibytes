> **Current app UI:** The approved static redesign supersedes conflicting historical visual rules below. See [current styling guidance](../readme.md) for `styles.css`, `tokens/token.css`, component ownership and validation. Existing product behavior is retained.

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

## Chrome extension (the popup, AIB-76n)

- **The popup** is a 400 × 580 `.ldg-popup` frame: `PopupHeader` (compact wordmark, the date, the saved toggle, Sign in or the avatar), then `.ldg-popup__scroll` holding a `RowList` of `ListRow` with `starPos="visual"` and the `.ldg-popup__end` line, then `PopupFooter`. A gist swaps the header for `PopupGistBar`, renders `GistView as="panel"` in `.ldg-popup__gist`, and ends with `PopupActionBar`. Same `content/editions/*.json`, same ranking. No filters, no theme toggle.
- **Under 761px `ListRow` takes its narrow layout**, which is what the popup needs; don't restyle rows in the extension.
- **The avatar is aibytes.io's**: `PopupHeader` uses `AppHeader`'s `AccountMenu`, so the menu, Escape and the outside click behave as on the site.
- **The icon is the favicon**, `ExtensionIcon` (the bolt on the cobalt tile), not the wordmark's `icon` variant. Chrome's PNGs are `assets/extension/icon-{16,32,48,128}.png`, drawn by `scripts/extension-icons.mjs`.
- **The onboarding page and the install box live on aibytes.io**: `OnboardingStep`, `OnboardingStatus`, `PinAnimation` and `Button size="lg"` in `.ldg-onb`; `ExtensionPromo` in Sidebar's `promo`.
- Respect the OS theme (`prefers-color-scheme`); there is no manual toggle in the popup.
- Budget: no runtime fonts fetch. Package the .woff2 files with the extension.

Later: the new tab (AIB-151m) reuses the same edition with `AppHeader` (no menu button), the edition bar, and a `CardGrid` of `Card`s and `EndCard`; it keeps the edition bar so a new tab still says which day it shows.

## Newsletter

The newsletter keeps its own Bitmark voice (hex sections `0x01`, TL;DR block, signal yellow). Ledger tokens do not apply there; only the wordmark and cobalt are shared. Don't port hex numbering into the app, and don't port Ledger's neutral restraint into the newsletter.

## Prose pages (privacy, about, help)

Write running text in `<p>` inside the app shell, and its links show at rest: `--link` plus an underline. Prose that isn't in a `<p>` (a list, a definition) or sits outside `.app-main` goes under `.ldg-prose` for the same rule. Don't restyle the global `a`: nav, card, row and button links stay text-coloured until hover.

## What never changes

Palette and faces are fixed. No gradients, shadows at rest, glass, illustration, or infinite scroll on any surface; the only exceptions are popovers (a soft shadow) and the desktop Sidebar's selected category (its faint gradient and shadow). AA in both themes; focus ring on everything interactive.
