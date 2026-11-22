# Hero prompts

Two prompts per issue, one for Gemini (web UI) and one for Grok CLI (run from
the repo root). Fill the slots, then hand both to the publisher. Issue 19 shipped
from these (`week-48-Issue-19/thumbnails/`).

## Slots

| Slot | What goes in it | Issue 19 |
|---|---|---|
| `{NUM}` | the issue number | `19` |
| `{HEADLINE_1}` / `{HEADLINE_2}` | the subject line without its emoji, shortened to two balanced lines, **no person's name** | `Anthropic goes public, Meta's agent` / `leaks data, FBI warns` |
| `{STOP_1..3_LABEL}` | one to three words per story, in capitals | `IPO`, `AGENT LEAK`, `FBI ALERT` |
| `{STOP_1..3_SCENE}` | the story drawn as a flat object, never a person or a logo | a ringing stock-exchange bell above a chart that shoots up, then dips |

Three stops is the shape: the story of the week and the two other title hooks.
Two stops is fine for a two-hook title.

## Gemini (web UI)

```text
Create a 16:9 landscape illustration (1920x1080) for a tech newsletter cover.

STYLE: playful, flat 2D vector illustration with simple shapes and bold navy outlines (#1A1A2E). Friendly, energetic, educational. Not isometric, not 3D, not photorealistic, no gradients beyond soft flat shading.

BACKGROUND: soft cream/beige, sprinkled with colorful confetti dots and small plus signs in orange #FF7A00, teal green, purple #8B5CF6, blue #3B82F6, plus a few yellow and pink accents.

HEADLINE: at the CENTER-TOP, centered, in a bold navy sans-serif, on two lines:
"{HEADLINE_1}
{HEADLINE_2}"
The headline must sit well inside the frame: at least 15% of the image width away from the left and right edges, and at least 8% away from the top edge.

ATTRIBUTION: small, thin, light-gray sans-serif text in the top-right area, written exactly as: aiBytes_  (lowercase "ai", capital "B", trailing underscore). Place it at least 13% of the width in from the right edge and 9% down from the top. No other credit text.

SCENE (below the headline, centered): a dark-gray winding road with white dashed center lines runs from left to right across the lower two-thirds, connecting three stops. At each stop stands a rounded rectangular label box with a flat cartoon icon and a short label:
1. Left stop, label "{STOP_1_LABEL}": {STOP_1_SCENE}.
2. Middle stop, label "{STOP_2_LABEL}": {STOP_2_SCENE}.
3. Right stop, label "{STOP_3_LABEL}": {STOP_3_SCENE}.
Use orange, teal, purple and blue fills on the icons. Keep all three stops and their labels inside the central 76% of the image width.

SAFE AREA: this image will be cropped to 3:2 and to 1.91:1, so nothing important may touch the outer 12% on the left and right or the outer 8% on the top and bottom. Fill those margins only with confetti and background.

AVOID: real company logos, real people, readable brand marks, hoodie hackers, skulls, red alarm color schemes, neon, dark backgrounds, and any text other than the headline, the attribution and the three labels.
```

## Grok CLI

```text
Generate the hero image for aiBytes_ newsletter Issue #{NUM}.

First read the brand guide at docs/image-guide/AI Bytes Image Generation Style Guide.pdf and follow it. Do NOT use or read anything under .claude/skills/generate-followup-thumbnail/ - that is Claude's post-processing skill, not the brand. The rules from the guide that matter here, restated so you cannot miss them:

- Style: playful, flat 2D vector illustration, simple cartoon shapes with bold outlines. Mood friendly, energetic, educational. Not isometric, not 3D, not photorealistic.
- Aspect ratio: 16:9 landscape.
- Background: soft cream/beige with colorful confetti dots and plus signs.
- Colors: navy #1A1A2E (outlines and headline), orange #FF7A00, teal green, purple #8B5CF6, blue #3B82F6; secondary light gray, yellow, pink, pastel blue, red-orange for pops.
- Typography: bold sans-serif title at the CENTER-TOP; small, thin, light-gray attribution at the top-right.
- Visual motif: a dark-gray winding road with white dashed lines connecting the points of the story. The road runs off the edges of the image or curves away; it never ends in a hard square cut.
- Icons & labels: rounded rectangular boxes, each with a flat friendly cartoon icon and a short label.
- Leave out the guide's main character. The scene carries the story.

Two overrides of the guide:
- The attribution text is exactly: aiBytes_  (lowercase "ai", capital "B", trailing underscore). Never "AI Bytes Newsletter".
- No real company logos and no real people.

CONTENT
- Headline, centered at the top, two lines:
  "{HEADLINE_1}
  {HEADLINE_2}"
- Road with three stops, left to right, each with a label box:
  1. "{STOP_1_LABEL}": {STOP_1_SCENE}.
  2. "{STOP_2_LABEL}": {STOP_2_SCENE}.
  3. "{STOP_3_LABEL}": {STOP_3_SCENE}.
- Fill the frame: the scene takes the lower two-thirds, with no large empty band at the bottom.

SAFE AREA: Substack crops this image to about 3:2 on the post page, cutting roughly 8% off each side, and to 1.91:1 for social previews, cutting the top and bottom. So:
- Keep the headline, the attribution, all three stops and their labels inside the central 76% of the width and the central 84% of the height.
- The headline must be centered, never left-aligned against the edge.
- Put the attribution about 13% in from the right edge and 9% down from the top.
- Only confetti, background and the road in the outer margins.

Output: render at 1920x1080 or larger, and save it as .cache/thumbnails/issue-{NUM}-hero-grok.png (create the folder; .cache/ is git-ignored). Do not write anywhere else in the repo and do not commit anything.

Then check your own output before you finish: open the image, confirm the headline, the labels and the attribution are spelled exactly as above (numbers and units included), nothing is cut off when you imagine cropping 8% from the left and right, and there are no stray marks or watermarks in the corners. Report what you checked.
```
