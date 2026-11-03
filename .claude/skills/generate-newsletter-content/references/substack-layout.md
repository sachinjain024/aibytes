# Substack layout: ranked lists

From Issue 17 the issue is published on Substack (AIB-134j). Substack takes no
custom HTML or CSS, so the issue is rebuilt from the editor's own blocks. This
is the layout we picked: option 4, "Ranked lists", on the publication's
current theme. Decision record:
`newsletter/artifacts/2026-Nov-03-Substack-design-taste.html`.

The content rules in `SKILL.md` still apply: the voice, the intro beats, the
verbatim X text, where each link points, clean URLs and single hyphens. This
file only replaces how the issue is laid out.

## What the editor keeps

These were tested on 3 Nov 2026 by pasting HTML into the editor and checking
the email preview.

| Survives a paste | Lost on paste |
|---|---|
| `h2`, `h3`, `p`, `b`, `i`, `a`, `ul`, `ol`, `blockquote`, `hr` | `table` (flattened to one line) |
| `<div class="callout-block" data-callout="true"><p>…</p></div>` | coloured text (`span` with `color`) |
| `<div class="pullquote"><p>…</p></div>` | any `style` or `class` that isn't one of these |
| `<mark style="background-color:#hex">` in any colour, plus `code` | |

Every link renders in the accent colour, and there is no second link colour,
so the Beehiiv "grey attribution link" can't exist here. Stats and `(Source)`
labels are plain body text.

## Theme

Leave the publication theme as it is: background `#FFF7ED`, accent `#FF6719`,
body Spectral. The web post is cream. The email is a white sheet with a serif
body, sans headings, and orange links, blockquote bar and buttons.

## Fields outside the body

- **Title** is the email subject (step 4's title).
- **Subtitle** is the preview text (step 4's description).
- The byline and date come from Substack. There's no masthead, issue tag,
  `0x..` number or read time in the body.
- The thumbnail goes in post settings as the social image, not in the body.

## Body, in order

1. `Hello, builders 👋`, then the welcome and hook paragraph, then the `<b>`-led
   storyline, as in step 3.
2. `<p><b>In this issue</b></p>` and a `<ul>` with one item per section
   present: `{Section name} - {count}` (`AI News - 5 stories`). No emoji and no
   `0x..` markers.
3. One `<h2>` per section, in the order from step 3, written `{emoji} {Name}`
   in sentence case: `🌍 AI News`, `📣 Official announcements`,
   `🔥 Viral on X`, `🚀 New AI products`, `⭐ Trending GitHub projects`,
   `🧵 HN deep stories`. Sections aren't numbered. Where a section has a fixed
   subtitle, put it in a `<p>` right after the `<h2>`.

### AI News

- The **story of the week** comes first, as
  `<h3>{emoji} <a href="{url}">{headline}</a></h3>`, then
  `<p>{context} ({Source})</p>`, then `<hr>`. There's no "Story of the week"
  label. Being the first item, under a divider, is what marks it.
- Every other story is one paragraph:
  `<p>{emoji} <a href="{url}"><b>{headline}</b></a> {context} ({Source})</p>`.
- The quote block becomes a pull quote at the end of the section:
  `<div class="pullquote"><p>{quote}</p></div>`. There's no attribution line.

### Official announcements

Per post: `<h3>{Company} {@handle} · {Day DD}</h3>`, then the whole post in a
`<blockquote>`, with one `<p>` per paragraph, then
`<p><a href="{post}">Post on X ↗</a> · <a href="{link_url}">{domain} ↗</a></p>`.
Leave out the domain link when there's no `link_url`.

### Ranked sections

Viral on X, New AI products, Trending GitHub projects and HN deep stories are
each an `<ol>`, so the list number shows the rank. The stat goes **last** on
the row, as plain text:

- Viral on X: `{emoji} <a href="{profile}"><b>@{handle}</b></a> {opening words, linked to the post} ♥ {likes}`
- New AI products: `{emoji} <a href="{site}"><b>{name}</b></a> - {description} (<a href="{launch}">Product Hunt</a>) ▲ {votes}`
- Trending GitHub projects: `{emoji} <a href="{repo}"><b>{owner/repo}</b></a> - {description} +{stars} ★`
- HN deep stories: `{emoji} <a href="{article}"><b>{title}</b></a> (<a href="{thread}">HN thread</a>) {points} pts`

The X words are still verbatim and still come from the `x_items.py` render. It
has no Substack format yet, so add one rather than retyping the posts.

### Close

`<hr>`, then the sign-off paragraph (`Made for builders who ship with AI. See
you next week. ✌️`). Add the Subscribe button by hand in the editor
(Button → Subscribe w/ caption), since buttons aren't pasted.

## Not used in this layout

No callout block, no highlight and no inline-code chips. They all work, but
this layout leaves them out so the issue reads like an article. The other
four options are in the decision record if this changes.
