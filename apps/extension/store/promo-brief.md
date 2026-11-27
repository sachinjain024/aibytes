# The promo images: brief (AIB-76n T22)

The Chrome Web Store shows two promo images besides the screenshots: the
**small promo tile** (440×280), shown in search results and category lists,
and the **marquee** (1400×560), shown when the store features the extension.
Both are generated, shortlisted and picked by the publisher
(`docs/specs/AIB-76n-store-listing.md`, "The promo images"). Unlike the
screenshots, they show no UI.

## How to run it

1. **Claude** writes its candidates as HTML in `store/candidates/`
   (`claude-tile-<n>.html`, `claude-marquee-<n>.html`), then
   `node apps/extension/store/promo.mjs render` captures each one at its exact
   size, with the screenshots' fonts and the icon at `/icon.png` (or
   `/icon.svg`, its vector source, for a large icon).
2. **ChatGPT, Grok and Gemini:** paste the prompt below into each, attaching
   `packages/design-system/assets/extension/icon-128.png`,
   `docs/image-guide/AI Bytes Image Generation Style Guide.pdf` and one of
   the accepted screenshots (`assets/screenshots/v12-cream/claude/screenshot-1-feed.png`) for the
   look. Save what comes back in `store/candidates/` as
   `<tool>-tile-<n>.png` and `<tool>-marquee-<n>.png` (`chatgpt`, `grok`,
   `gemini`). A tool that answers in HTML: save it as `.html` and run `render`.
   `candidates/` is git-ignored, so nothing rejected is ever committed.
3. **Shortlist:** every candidate on one numbered review page, at real size,
   grouped by tool, on light and dark surrounds. The publisher picks one tile
   and one marquee by number.
4. **Finish:** `node apps/extension/store/promo.mjs finish --tile
   candidates/<pick>.png --marquee candidates/<pick>.png` writes
   the next version, `store/assets/promo-tile/vN/promo-tile.png` and
   `store/assets/marquee/vN/marquee.png`, at exactly 440×280 and 1400×560,
   opaque PNG, with the pick's HTML source beside it when it has one. An
   earlier version, one already uploaded, is never touched. If a tool garbled the lettering, redraw it in
   Bricolage Grotesque before finishing. Record the picks and their tools in
   `CHROMEWEBSTORE.md` and under "The pick" below.

## The prompt

Use it as written in every tool, so the comparison is fair. Record any
follow-up under "As used".

```text
Design two promotional images for the Chrome Web Store listing of a Chrome
extension called "aiBytes_": a daily, ranked AI news feed for developers. I
have attached its icon (a blue tile with a lightning bolt), a brand style
guide (PDF) and one of its store screenshots, for the look.

Make:
  1. A small promo tile, exactly 440×280 px.
  2. A marquee, exactly 1400×560 px.

Each must show, and nothing more in words:
  - the icon, as attached (do not redraw it);
  - the name "aiBytes_" (lower-case "ai", capital "B", ending in an
    underscore);
  - the line "AI News Feed for Developers".
The marquee may add one short line under it: "Today's AI news, trending repos,
threads and launches, ranked every morning."

Look (from the style guide and the screenshot): a soft cream ground
(#F5EEE2), navy #1A1A2E text, orange #FF7A00 as the accent, with blue
#3B82F6, purple #8B5CF6, teal #10A37F, yellow #FFC83D and pink #FF8FB1 only
as small confetti dots and plus signs; bold navy outlines, flat 2-D, playful.
A dark variant on navy is welcome. Display type in a bold grotesque like
"Bricolage Grotesque"; never a script or serif face.

Rules:
- No screenshots, UI, browser windows, devices or mock interfaces.
- No other company's logo or name (no GitHub, Hacker News, Product Hunt,
  OpenAI, Google and so on).
- No claims, ratings, badges, prices or calls to action ("free", "#1",
  "best", "install now").
- The tile must read at its real size: the name at least 40 px tall, the line
  at least 18 px, nothing important within 12 px of an edge.
- Flat colour to the edges: no transparency, no rounded outer corners, no
  border around the whole image.

Return the two images as PNG at exactly those sizes.
```

## As used

- Claude (Claude Code, Opus 5.5), 27 Nov 2026: HTML candidates written in
  `candidates/`, rendered with `promo.mjs render`.
- ChatGPT:
- Grok:
- Gemini:

## The pick

Claude's candidates, picked by the publisher on 27 Nov 2026 on the review
page; the other tools were not run.

- **Tile:** T2, `claude-tile-2` (navy; the icon in a cream outline with an
  orange offset shadow; the name and line on the right) → `assets/promo-tile/v1/`.
- **Marquee:** M4, `claude-marquee-4`: M2 (navy, everything centred) with
  the four sources' marks in small chips under "From", added at the
  publisher's ask → `assets/marquee/v1/`. That breaks the prompt's "no other
  company's logo" rule by the publisher's choice; the marks only name what the
  feed reads. Reddit is left out: it is not one of the edition's sources.
