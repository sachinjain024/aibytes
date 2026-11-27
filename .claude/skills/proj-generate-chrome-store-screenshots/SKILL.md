---
name: proj-generate-chrome-store-screenshots
description: Generate the aiBytes_ Chrome Web Store screenshots (five 1280×800 PNGs) as a new numbered version under apps/extension/store/assets/screenshots/vN/, never deleting or overwriting an earlier one - first the raw captures of the real popup, site and newsletter for the publisher to approve, then the framed screenshots (Claude's frame, or ChatGPT's, Grok's or Gemini's). Use when asked to generate, regenerate, refresh or redo the Chrome store screenshots, store assets or listing images, or for "/proj-generate-chrome-store-screenshots".
---

# Generate the Chrome Web Store screenshots

The listing takes five screenshots at exactly 1280×800
(`docs/specs/AIB-76n-store-listing.md`). The UI in them is never drawn: it is
always a capture of the real build. What is designed is the **frame** around
the captures. The script is `apps/extension/store/screenshots.mjs`; the frame
brief, and the prompt for other tools, is `apps/extension/store/screenshot-brief.md`.

## Where things go

```
apps/extension/store/assets/
  references/          layout references the publisher supplies (never generated)
  screenshots/         every screenshot version, and only those
    v3/  v8/  v12-cream/  v13-navy/  ...
                       one folder per run, never deleted or overwritten. The
                       publisher may name a version's look after its number
                       (v12-cream); the script reads only the number
      raw/             the real popup, 2x: 1-today, 2-github-list, 3-github-gist, 4-mixed,
                       each with a .json of where each source's first row sits
      claude/          screenshot-1-feed.png ... screenshot-5-everywhere.png
      chatgpt/ grok/ gemini/   each tool's frame.html and its five PNGs, made only
                       when that tool is run (never an empty placeholder)
  promo-tile/vN/  marquee/vN/  the promo images (promo.mjs finish), one version
                       per upload, each with its HTML source
```

`raw` always starts a new version under `assets/screenshots/` (the highest
`vN` plus one, whatever its suffix). `frame` writes
into the newest version that has a `raw/` folder, or `--version N`, and refuses
to touch PNGs already there unless `--replace` is passed, which only redoes
that one version's set for that one tool. Nothing else is ever removed.

## Steps

1. **Read the brief first.** The shot list and words live in `SHOTS` in
   `screenshots.mjs` (from the AIB-76n ticket's "Chrome Store Screenshots"
   comment): S1 the value proposition, art of many sources feeding one feed;
   S2 GitHub repos only; S3 a repo's gist; S4 Hacker News threads, AI news and
   launches in one list, annotated (from the capture's .json); S5 art only, no
   product screenshot: the three ways to stay current (aibytes.io, the
   extension, the weekly newsletter) and the style guide's 2-D character
   reading aiBytes_ on his computer. Look at the
   newest `assets/references/` and the style guide
   `docs/image-guide/AI Bytes Image Generation Style Guide.pdf` before
   changing the frame.
2. **Capture the raw set:**
   ```bash
   node apps/extension/store/screenshots.mjs raw
   ```
   It builds the stage (the real `Popup` on the fixture edition in
   `store/fixture.js`) and captures every entry in `RAW`. A popup showing some
   sources is the real edition file with the other sources' items left out
   (`?source=`), nothing else.
3. **Look at every raw PNG** (Read them). Check that the popup rows are whole
   (title up to two lines with the ⋮ menu beside it, summary up to two lines,
   then the source line), that the gist shots show a gist, and that nothing is
   cut mid-word or blank. A UI bug is fixed in the product (Ledger or the
   extension), never in the stage, and then a new raw version is captured.
4. **Stop and show the publisher the raw set.** List the files with their
   paths. Do not frame until they approve it.
5. **Frame, once approved:**
   ```bash
   node apps/extension/store/screenshots.mjs frame                  # Claude: store/frame.html → vN/claude
   node apps/extension/store/screenshots.mjs frame --tool grok      # vN/grok/frame.html → vN/grok
   node apps/extension/store/screenshots.mjs frame --look navy      # Claude's frame on the navy ground (default cream)
   ```
   For ChatGPT, Grok or Gemini, the publisher pastes the brief's prompt with
   the version's `raw/` PNGs and the icon attached, and saves the HTML as
   `vN/<tool>/frame.html`. Each PNG is checked to be exactly 1280×800.
6. **Look at all five framed PNGs** against the reference and the brief's
   rules, then report the paths. Record each tool's model and follow-ups under
   "As used" in the brief, and the pick under "The pick".

## Rules

- Never delete or overwrite an earlier version's files. Never edit a raw PNG.
- Never draw, retouch or mock UI in a frame: the captures are placed whole.
- The aiBytes_ mark in a frame (and in any art, like S5's monitor) uses the
  standard icon: the blue bolt tile with a white outline and an orange
  `#FF7A00` offset shadow down and right, the raised look of v12 (`.brand img`
  in `store/frame.html`). The name beside it stays navy "aiBytes" with a blue
  underscore. The popup's own header bolt is part of the capture and is left
  as it is.
- No browser chrome, cursors, ratings, user counts, other products' logos or
  claims ("best", "#1", "free") in a frame; the words are the shot's title and
  subtitle and the name aiBytes_.
- Keep `SHOTS`, the brief and the listing spec's screenshot list in step.
- `npm test -w @aibytes/extension` covers the script's helpers
  (`store/screenshots.test.js`); run it after changing the script.
