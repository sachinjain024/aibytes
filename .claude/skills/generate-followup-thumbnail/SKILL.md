---
name: generate-followup-thumbnail
description: Render the 1200x630 thumbnail image for a published aiBytes_ issue, saved next to the issue as issue-{num}-thumbnail.png and ready to upload to Beehiiv. Use whenever the user wants a thumbnail, cover image, header image, post image, social preview, or OG image for the newsletter - triggers include "make the thumbnail", "generate the cover for issue N", "I need the Beehiiv image", or "/generate-followup-thumbnail".
---

# Generate Follow-up Thumbnail (aiBytes_)

Beehiiv wants one image per post at **1200x630**. That image is doing two jobs: it is the card on the Beehiiv web archive, and it is the Open Graph preview whenever anyone shares the issue. Both get seen small, so the thumbnail is the issue's headline set large, not a decorated poster.

## Run it

```bash
python3 .claude/skills/generate-followup-thumbnail/scripts/generate_thumbnail.py \
  --issue-dir newsletter/2026/week-33-Issue-4 \
  --highlight "Oracle said no"
```

Writes `newsletter/2026/week-33-Issue-4/issue-4-thumbnail.png`, exactly 1200x630.

| Flag | What it does |
|---|---|
| `--issue-dir` | required, the folder holding `aiBytes-issue-{num}.html` |
| `--highlight` | the phrase to set in signal yellow, matched case-insensitively; errors if it is not in the headline |
| `--headline` | override the headline instead of taking it from the issue title |
| `--output-root` | write the PNG somewhere else, used by the tests |
| `--html-only` | emit the HTML and skip rendering, for when Chrome is unavailable |

The script reads the issue number, hex tag, date, read time and section names straight out of the issue HTML, so the thumbnail cannot drift from the issue it belongs to. Generate the issue first.

## Workflow

### 1. Find the issue

Default to the most recently published folder under `newsletter/{yyyy}/`, unless the user names one. The issue HTML must already exist.

### 2. Choose the highlight phrase

The headline is the subject line with the `aiBytes_ {NN}: ` prefix stripped, since the wordmark is already on the image and repeating it wastes the largest type on the page.

Pick **two to four words** to mark in signal yellow. The right choice is the most concrete thing in the headline: a company doing something, a number, a reversal. Not a connective phrase, and not the whole headline, which defeats the point. For "DeepMind's shake-up and the week Oracle said no", `Oracle said no` is the half a reader can act on.

Never mark a phrase that breaks awkwardly across the line wrap. Render it and look.

### 3. Render and look at it

Always open the PNG after generating. The check is whether the headline is readable at the size a feed card actually shows, roughly 300px wide. Things that go wrong:

- **Headline too long.** Above about 60 characters the type has to wrap to four lines and the balance collapses. The title rule in `generate-newsletter-content` keeps subjects at ~62 characters including the `aiBytes_ {NN}: ` prefix, so a compliant subject always fits. If a headline overflows, shorten it with `--headline` rather than shrinking the type.
- **Highlight in the wrong place**, sitting alone on its own line or splitting a phrase.
- **Fonts not loaded.** Chrome fetches Bricolage Grotesque and JetBrains Mono from Google Fonts at render time. If the machine is offline the image still renders, in Helvetica, and looks wrong. Check the wordmark: the real face has a distinctly tight, high-contrast `a`.

### 4. Hand it over

Report the path and the dimensions. In Beehiiv the image goes in the post's thumbnail field, not pasted into the body as an HTML snippet.

## Design

Set by `assets/thumbnail.html`; keep changes there so every issue's thumbnail stays part of the same series.

- **Ink canvas, paper card**, inset 18px, with the issue's signature notch cut from the top-right corner so the ink shows through. That notch is the one shape the newsletter owns, and it is what makes the card recognisable at thumbnail size.
- **Top row**: `⚡ aiBytes_` wordmark with the cobalt underscore, and `ISSUE 0x{hex} · {date}` in mono on the right.
- **Headline**: Bricolage Grotesque 800 at 70px, tight leading, `text-wrap: balance`, with the highlight phrase on signal yellow using `box-decoration-break: clone` so a wrapped phrase keeps its padding on both lines.
- **Foot**: a 2px ink rule over the section list and the read time, both in mono.

Palette matches the issue exactly: paper `#FAFAF7`, ink `#191C26`, cobalt `#2B4EF0`, signal `#FFD338`, slate `#6B7080`.

## How the rendering works

Headless Chrome screenshots the page at `--force-device-scale-factor=2`, producing 2400x1260, then `sips` downsamples to exactly 1200x630. The 2x pass is what keeps the type crisp; screenshotting at 1x gives visibly softer edges on the display face. The script verifies the final dimensions by reading the PNG's IHDR chunk and fails loudly if they are not 1200x630.

Chrome is found at the usual macOS app paths, then on `PATH`. With no Chrome, the script tells you to rerun with `--html-only` and screenshot the page yourself at 1200x630.
