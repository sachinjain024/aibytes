---
name: generate-followup-thumbnail
description: Make the hero image for an aiBytes_ issue - write the Gemini and Grok CLI prompts from the brand guide, then take the two images the publisher generates, remove Gemini's watermark, move anything outside Substack's crop safe area, compress both to under 200KB, and save them in the issue's thumbnails/ folder for the publisher to pick one. Use whenever the user wants a thumbnail, hero, cover, header image, social preview or OG image for the newsletter, a Gemini or Grok image prompt for an issue, or to prepare, resize or fix a generated hero - triggers include "give me the Gemini prompt", "prompt for Grok", "make the thumbnail for issue N", "prepare the hero", or "/generate-followup-thumbnail".
---

# Generate Follow-up Thumbnail (aiBytes_)

Each Substack post carries one hero image: the post's cover on the archive and
in readers' feeds, and the Open Graph preview whenever the issue is shared.
From Issue 19 the publisher generates it in **two models, Gemini (web UI) and
Grok CLI**, from prompts Claude writes. Claude then prepares both, and the
publisher picks one to upload. Both prepared variants are kept in the repo.

The 1200x630 HTML card this skill used to render (three backgrounds, Issues
1-16) is retired.

## Workflow

### 1. Write both prompts

Fill the templates in `references/hero-prompts.md` for the issue and hand both
to the publisher in chat, as two code blocks. The slots:

- **Headline**: the subject line without its emoji, shortened to two balanced
  lines.
- **Stops**: the story of the week and the title's other hooks, each a short
  label plus a scene drawn as objects.
- **Issue number**: for Grok's output path.

The two prompts carry the same brand rules. The Grok one also tells Grok CLI to
read `docs/image-guide/`, not this skill, and to save to
`.cache/thumbnails/issue-{num}-hero-grok.png`.

The brand guide is `docs/image-guide/AI Bytes Image Generation Style Guide.pdf`:
flat playful 2D vector, cream background with confetti dots and plus signs,
navy outlines, the guide's palette, a centre-top title, a winding road
connecting the story's points, and rounded icon-and-label boxes. Two standing
overrides of the guide:

- **No character.** The guide's cartoon developer was tried and rejected on
  Issue 17. The scene carries the story.
- **The attribution is exactly `aiBytes_`**, small and light gray at the top
  right. Never "AI Bytes Newsletter".

**Name no real person** in either prompt. Gemini refuses any prompt that names
a public figure ("I can't depict some public figures"), even with no person in
the scene. Issue 18's first prompt named Jensen Huang and was refused; "The
chipmaker loses its CEO" worked. Companies and agencies are fine.

### 2. The publisher generates both

Gemini's file lands in `~/Downloads` (about 2730x1536, 4-5MB, with a sparkle
watermark in the bottom-right corner). Grok's lands in `.cache/thumbnails/` of
the checkout the publisher ran it in, which may be the main checkout rather
than a worktree. Ask for both paths.

### 3. Prepare them

```bash
python3 .claude/skills/generate-followup-thumbnail/scripts/prepare_hero.py \
  --issue-dir newsletter/issues/{yyyy}/week-NN-Issue-N \
  --gemini "~/Downloads/<gemini file>.png" \
  --grok <checkout>/.cache/thumbnails/issue-N-hero-grok.png \
  --move-attribution gemini \
  --previews {scratchpad}/hero-N
```

| Flag | What it does |
|---|---|
| `--issue-dir` | required, the issue folder; the number comes from its `-Issue-N` suffix |
| `--gemini`, `--grok` | the originals; either or both |
| `--move-attribution` | providers whose `aiBytes_` should be moved inside the safe area if it sits outside |
| `--previews` | where the crop previews go (default: a new temp folder). Keep it outside the repo |
| `--output-root` | write `thumbnails/` somewhere else, used by the tests |

For each image it:

1. Fills Gemini's sparkle by blending from the box's four edges (a flat fill
   leaves a seam).
2. Moves the attribution, when asked, so its right edge sits 13% in. It
   refuses a match too big to be the attribution, so it never smears the
   headline.
3. Reports margin warnings:
   - **`cut:`** dark marks fall outside Substack's crop.
   - **`tight:`** they survive the crop but sit inside the 12% / 8% margin.
4. Resizes to 1456px wide with Lanczos and saves a progressive JPEG at quality
   85, stepping down until it is under 200KB.

It writes `thumbnails/issue-{num}-hero-gemini.jpg` and `-grok.jpg`, and prints
a JSON report.

### 4. Look, fix, report

Open every preview: both 3:2 crops, both 1.91:1 crops, and the top-right and
bottom-right corners. The script finds what it can; the eye check is what
catches the rest.

- **Run `--move-attribution`** for any variant whose `aiBytes_` is cut in the
  3:2 crop. Gemini put it at the very edge on Issue 19.
- **Treat a `cut:` warning on the headline or a label as a regenerate.** Moving
  a headline is not a fix.
- **Check the spelling** of the headline, the labels and any number ("3h" came
  out as "3l" in Grok's Issue 19 image). A misspelling means a regenerate.
- **Look for stray marks** and hard-cut road ends.

Then tell the publisher, per variant, what you fixed, what still needs a
regenerate, and which one you'd upload and why.

### 5. Hand over

When the publisher picks one, copy its JPG to `~/Downloads` for the upload.
They upload it as the post cover or under Settings → Social preview. Tick the
ticket's thumbnail item and note both files.

## Rules

- **Safe area.** Substack's post page crops the 16:9 hero to about 3:2, cutting
  roughly 8% off each side. The social preview crops to 1.91:1, cutting the top
  and bottom. Keep the headline, the labels and the attribution inside the
  central 76% of the width and 84% of the height, with the headline centred.
  Issue 18's left-aligned headline lost its first letters on the post page.
- **Never commit the originals.** Git keeps every binary forever; Issue 17's
  4.4MB PNG is still the largest file in the repo. Only the two prepared JPGs go
  in, each under 200KB.
- **Both variants ship in the repo**, as the record of what the cover could
  have been, the way the card's three backgrounds used to.
