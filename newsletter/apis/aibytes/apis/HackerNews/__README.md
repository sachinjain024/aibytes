# HackerNews Algolia search API

No auth required. Two uses:

- **Top Stories** — used by the `/hn-fetch-items` skill to snapshot the week's
  top AI-related HN stories (points floor via `numericFilters`; the AI topic
  filter and points sort happen client-side in the skill script — the API has
  no topic facet).
- **Search Stories by URL** — used by the `/tc-fetch-items` skill to rank
  TechCrunch articles by HN points (TechCrunch exposes no popularity metric).
