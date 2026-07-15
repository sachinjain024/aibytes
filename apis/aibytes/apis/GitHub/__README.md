# GitHub trending page

No auth required. GitHub has no official trending API, so this is a plain
HTML page fetch:

- **Trending Repos** — used by the `/gh-fetch-items` skill to snapshot the
  week's trending AI-related repositories. The response is HTML; the skill
  script parses the `<article>` cards with regexes and applies the AI topic
  filter client-side. Per-language pools use the path form
  `https://github.com/trending/<language>?since=weekly`.
