---
name: generate-followup-thumbnail
description: Render the 1200x630 thumbnail images for a published aiBytes_ issue - three background variants saved in the issue's thumbnails/ folder, one of which gets uploaded to Beehiiv. Use whenever the user wants a thumbnail, cover image, header image, post image, social preview, or OG image for the newsletter - triggers include "make the thumbnail", "generate the cover for issue N", "I need the Beehiiv image", or "/generate-followup-thumbnail".
---

# Generate Follow-up Thumbnail (aiBytes_)

Beehiiv wants one image per post at **1200x630**. That image is doing two jobs: it is the card on the Beehiiv web archive, and it is the Open Graph preview whenever anyone shares the issue. Both get seen small, so the thumbnail is the issue's headline set large, not a decorated poster.

Every run renders the same card with **three background treatments** - dot grid, cobalt wash, graph grid - into the issue's `thumbnails/` folder. Which one ships is decided at upload time, issue by issue; the alternatives cost nothing to keep.

## Run it

```bash
python3 .claude/skills/generate-followup-thumbnail/scripts/generate_thumbnail.py \
  --issue-dir newsletter/2026/week-33-Issue-4 \
  --highlight "Oracle said no"
```

Writes three PNGs, each exactly 1200x630, into the issue's `thumbnails/` folder:

```
newsletter/2026/week-33-Issue-4/thumbnails/issue-4-thumbnail-dot-grid.png
newsletter/2026/week-33-Issue-4/thumbnails/issue-4-thumbnail-cobalt-wash.png
newsletter/2026/week-33-Issue-4/thumbnails/issue-4-thumbnail-graph-grid.png
```

| Flag | What it does |
|---|---|
| `--issue-dir` | required, the folder holding `aiBytes-issue-{num}.html` |
| `--highlight` | the phrase to set in signal yellow, matched case-insensitively; errors if it is not in the headline |
| `--headline` | override the headline instead of taking it from the issue title |
| `--output-root` | write the `thumbnails/` folder somewhere else, used by the tests |
| `--html-only` | emit the three HTML pages and skip rendering, for when Chrome is unavailable |

The script reads the issue number, hex tag and date straight out of the issue HTML, so the thumbnail cannot drift from the issue it belongs to. Generate the issue first.

## Workflow

### 1. Find the issue

Default to the most recently published folder under `newsletter/{yyyy}/`, unless the user names one. The issue HTML must already exist.

### 2. Choose the highlight phrase

The headline is the subject line with the `aiBytes_ {NN}: ` prefix stripped, since the wordmark is already on the image and repeating it wastes the largest type on the page.

Pick **two to four words** to mark in signal yellow. The right choice is the most concrete thing in the headline: a company doing something, a number, a reversal. Not a connective phrase, and not the whole headline, which defeats the point. For "DeepMind's shake-up and the week Oracle said no", `Oracle said no` is the half a reader can act on.

Never mark a phrase that breaks awkwardly across the line wrap. Render it and look.

### 3. Render and look at them

Always open the PNGs after generating - all three, since a background can misbehave behind one headline and not another. The check is whether the headline is readable at the size a feed card actually shows, roughly 300px wide. Things that go wrong:

- **Headline too long.** Above about 60 characters the type has to wrap to four lines and the balance collapses. The title rule in `generate-newsletter-content` keeps subjects at ~62 characters including the `aiBytes_ {NN}: ` prefix, so a compliant subject always fits. If a headline overflows, shorten it with `--headline` rather than shrinking the type.
- **Highlight in the wrong place**, sitting alone on its own line or splitting a phrase.
- **Fonts not loaded.** Chrome fetches Bricolage Grotesque and JetBrains Mono from Google Fonts at render time. If the machine is offline the image still renders, in Helvetica, and looks wrong. Check the wordmark: the real face has a distinctly tight, high-contrast `a`.

### 4. Hand them over

Report the three paths and the dimensions, and show all three so the user can pick. Exactly one goes in Beehiiv's post thumbnail field - not pasted into the body as an HTML snippet - and the other two stay in `thumbnails/` as the record of what the card could have been.

## Design

Set by `assets/thumbnail.html`; keep changes there so every issue's thumbnail stays part of the same series.

- **Ink canvas, paper card**, inset 18px, with the issue's signature notch cut from the top-right corner so the ink shows through. That notch is the one shape the newsletter owns, and it is what makes the card recognisable at thumbnail size.
- **Top row**: `⚡ aiBytes_` wordmark with the cobalt underscore, and `ISSUE 0x{hex} · {date}` in mono on the right.
- **Headline**: Bricolage Grotesque 800 at 70px, tight leading, `text-wrap: balance`, with the highlight phrase on signal yellow using `box-decoration-break: clone` so a wrapped phrase keeps its padding on both lines.
- **No foot.** The card carries the wordmark and the headline, nothing else. The section list and read time that used to sit under a rule at the bottom are gone: they are unreadable at the ~300px a feed card actually renders at, and they spent the card's quietest space on the one thing the reader already gets from the post itself. The headline centres in the space under the top row, however many lines it takes.
- **Three backgrounds, chosen 2026-08-17** (decision record: `artifacts/2026-Aug-17-Thumbnail-background-taste.html`). Each is a `.card::before` layer gated by a variant class on `<body>` (`dot-grid`, `cobalt-wash`, `graph-grid`), and each fades to plain paper behind the headline so the texture never competes with the type. Dot grid is slate dots (engineer's notebook, the quietest); graph grid is hairline squares with a stronger rule every fourth line; cobalt wash is a cobalt glow off the notch corner answered by signal yellow bottom-left, the only one that adds colour. A new variant means a new class in the template, its name in the script's `VARIANTS` tuple, and a fresh taste round - not an inline style on one issue.

Palette matches the issue exactly: paper `#FAFAF7`, ink `#191C26`, cobalt `#2B4EF0`, signal `#FFD338`, slate `#6B7080`.

## How the rendering works

Headless Chrome screenshots the page at `--force-device-scale-factor=2`, producing 2400x1260, then `sips` downsamples to exactly 1200x630. The 2x pass is what keeps the type crisp; screenshotting at 1x gives visibly softer edges on the display face. The script verifies the final dimensions by reading the PNG's IHDR chunk and fails loudly if they are not 1200x630.

Chrome is found at the usual macOS app paths, then on `PATH`. With no Chrome, the script tells you to rerun with `--html-only` and screenshot the pages yourself at 1200x630.
