# The store screenshots: frame brief (AIB-76n T21)

The Chrome Web Store listing takes five screenshots at exactly 1280×800
(`docs/specs/AIB-76n-store-listing.md`, "Screenshots"). The UI in them is
never generated: `screenshots.mjs` renders the real popup and the real
onboarding step on a fixed edition and captures them. What can vary is the
**frame** around each capture (the caption band, the page behind, the
placement), and that is what this brief asks Claude, ChatGPT, Grok and Gemini
to design. Each answer is one HTML file; the script renders all five shots
through it, so every candidate shows exactly the same UI.

## How to run it

The `proj-generate-chrome-store-screenshots` skill drives this. Every run is
a new version under `apps/extension/store/assets/screenshots/vN/`; nothing earlier is
deleted or overwritten.

1. `node apps/extension/store/screenshots.mjs raw` captures the real popup,
   site and newsletter into `assets/screenshots/vN/raw/`. The publisher approves them
   before anything is framed.
2. `node apps/extension/store/screenshots.mjs frame` renders Claude's frame
   (`store/frame.html`) into `assets/screenshots/vN/claude/`.
3. In ChatGPT, Grok and Gemini, paste the prompt below and attach the
   version's `raw/` PNGs, `packages/design-system/assets/extension/icon-128.png`,
   `docs/image-guide/AI Bytes Image Generation Style Guide.pdf` and
   `assets/references/r1/chrome-store-ref-1.png`. Save the HTML each
   returns as `assets/screenshots/vN/<tool>/frame.html`, then
   `node apps/extension/store/screenshots.mjs frame --tool <tool>`.
   A frame that breaks a rule below is dropped, not fixed by hand.
4. The publisher compares the sets and picks one. Record which tool's frame
   won, and the prompt as used, at the end of this file.

## The prompt

Use it as written in every tool, so the comparison is fair. If a tool needs
a follow-up (for example, it returned an image instead of HTML), record the
follow-up under "As used" below.

```text
You are designing the frame for five Chrome Web Store screenshots of a Chrome
extension called "aiBytes_" (a daily, ranked AI feed for developers: AI news,
trending GitHub repos, Hacker News threads and Product Hunt launches). I have
attached the extension's real UI captures (PNG, 2x), its 128px icon, a style
guide (PDF) and a layout reference image. Never redraw, restyle, crop into or
imitate the UI: each capture is placed as an <img>, whole and unchanged. Your
job is everything around it.

Return ONE self-contained HTML file (inline <style> and inline SVG, no
JavaScript, no external URLs) that a script fills in and renders once per
screenshot at exactly 1280×800 CSS pixels, device scale 1. Placeholders:

  {{TITLE_HTML}}  the headline, with its accent phrase already in <em>
  {{SUBTITLE}}    one sentence under it (plain text, HTML-escaped)
  {{LAYOUT}}      "sources" | "single" | "annotated" | "art" (see below)
  {{N}}           the screenshot's number, 1 to 5
  {{SHOT1}}       the capture's URL (empty for the art layout)
  {{SHOT1_W}} {{SHOT1_H}}  its natural size in CSS px (552×582: the popup)
  {{ICON}}        the extension icon's URL (the blue lightning tile). Show it as
                  the standard icon: a white outline and an orange (#FF7A00)
                  offset shadow down and right, so it looks raised
  For "annotated", CSS variables on :root give each source's first row in
  the capture, in CSS px: --row-hacker-news-x/-y/-w/-h, --row-techcrunch-…,
  --row-product-hunt-… . The source marks are served at /marks/github.svg,
  /marks/hackernews.svg, /marks/techcrunch.svg, /marks/producthunt.svg.

The five screenshots:
  1. sources:   "Your daily AI feed, from the best sources". Art of the four
                sources (the marks above) feeding the popup capture.
  2. single:    "Trending GitHub repos, every day". The popup, GitHub only.
  3. single:    "Get the gist of any repo". The popup showing a repo's gist.
  4. annotated: "Threads, news and launches in one list". The popup with the
                Hacker News, TechCrunch (AI news) and Product Hunt rows
                ringed and labelled "Hacker News threads", "AI news",
                "Product launches", using the row variables. Labels must not
                cover the UI's text.
  5. art:       "Stay current with AI, three ways". No capture. Illustrate
                the style guide's 2-D character (young man, glasses, curly
                dark hair, orange sweatshirt, blue trousers, orange shoes)
                reading aiBytes_ on his computer, its screen showing three
                boxes: Daily feed (aibytes.io), Extension (in Chrome),
                Newsletter (every week).

Requirements:
- Layout from the reference: the words on the left (headline in a bold
  display face with the <em> phrase in orange, the subtitle under it), the
  product or art on the right. Same placement on every shot.
- Look from the style guide: a soft cream ground, navy #1A1A2E text, orange
  #FF7A00 accents, with blue #3B82F6, purple #8B5CF6 and teal for pop;
  confetti dots and plus signs; bold outlines; playful, flat 2-D.
- Fonts: "Bricolage Grotesque" (500, 700, 800) for display text and "Inter"
  (400 to 700) for anything small. The script provides both; name them with a
  system-ui fallback.
- The capture never scales up, is never cropped, and stays readable; the
  headline must read at 640×400.
- You may show the icon, the name "aiBytes_" and the source marks. No browser
  chrome, cursors, device mockups, ratings, user counts or claims ("best
  extension", "#1", "free"). Add no words beyond the ones above.
- The page is exactly 1280×800 with nothing scrolling or overflowing.

Reply with the HTML file only, in one code block.
```

## As used

Record each tool's model and any follow-up here when you run it.

- Claude (Claude Code, Opus 5.5): `frame.html`, written alongside this brief;
  v1 on the first brief, v3 on the revised one.
- ChatGPT:
- Grok: Grok 4.6 in Grok Build, 27 Nov 2026. Prompt as written; HTML saved at `assets/screenshots/v3/grok/frame.html`. Follow-up: S1 source chips overlapped the subtitle, so they were moved right of the copy and the winding roads shortened, then `--replace`.
- Grok (r2): Grok 4.6 in Grok Build, 27 Nov 2026. Layout from `assets/references/r2/ref1.png` and `ref2.png` (pale canvas, rounded navy panel, left copy, white product card, looping arrow, accent highlight bar). HTML at `assets/screenshots/v8/grok/frame.html` on existing v8 raw. Follow-up: keep each `<em>` phrase on one line; hide the copy swoosh on S1 so the source chips carry that shot; widen S2 copy so “every day” does not orphan.
- Gemini: Gemini 4 Hydrogen (Medium) in Antigravity, 27 Nov 2026. Custom `frame.html` written at `assets/screenshots/v8/gemini/frame.html` and rendered into `assets/screenshots/v8/gemini/`.

## The pick

v12, Claude's frame (`assets/screenshots/v12-cream/claude/`), picked by the publisher on
27 Nov 2026 as the set to upload. It is v3's layout on the current popup
(550px, stacked rows, the theme toggle), with the standard raised icon in the
mark. v3 was accepted earlier the same day and is kept. The other tools were
not run.

v13-navy (`assets/screenshots/v13-navy/claude/`, `frame --look navy`) is the same frame
on the promo tile's navy ground, kept as an alternative. A version folder may
carry its look after the number (`v12-cream`); the script reads the number.
