---
name: tc-fetch-items
description: Fetch the most popular TechCrunch AI articles of the last 7 days (default top 10, ranked by HackerNews points then recency) and save them as a weekly JSON snapshot under data/yyyy/mm/weeks/week-NN/news/techcrunch/tc_data.json. Use when the user wants to fetch, download, refresh, or snapshot weekly TechCrunch AI news.
---

# tc-fetch-items

Fetches TechCrunch AI-category articles from the last 7 days and stores the most
popular ones as a weekly JSON snapshot, ready for the newsletter's **AI News**
section. Each article carries a heading (title), description, publish date,
canonical URL, author, hero image, estimated reading time, and — when the story
hit HackerNews — its points, comment count, and HN thread link.

## How it works

1. Pulls all posts in the window from TechCrunch's public WordPress REST API
   (`/wp-json/wp/v2/posts`, category `artificial-intelligence`). No auth needed.
2. TechCrunch exposes no popularity metric, so popularity comes from the public
   HackerNews Algolia API: articles are ranked by HN points, with publish
   recency as the tiebreaker (unmatched articles rank by recency alone).
3. Writes the top N articles as JSON.

## Requirements

- Python 3 (stdlib only, no dependencies). No API keys.

## Usage

Run from the repo root:

```bash
python3 .claude/skills/tc-fetch-items/scripts/fetch_tc_items.py
```

Defaults: top **10** articles, last **7** days ending today.

Options:

```bash
--count N          # how many articles (default 10)
--days N           # window length in days (default 7)
--date YYYY-MM-DD  # end of the window / "as of" date (default today)
--output-root DIR  # root data dir (default: data)
--no-hn            # skip HackerNews ranking; order by recency only
```

## Output

Written to `data/<yyyy>/<mm>/weeks/week-<NN>/news/techcrunch/tc_data.json`,
where `yyyy`, `mm`, and ISO week `NN` come from the as-of date (same layout as
the ProductHunt snapshot, under a `news/` subtree for newsletter news sources).
The file is self-describing: it records `fetched_at`, the date window, the
ranking used, and `totalCount` (all AI articles seen in the window) alongside
the top articles. Re-running for the same week overwrites in place.

## Weekly cadence

One snapshot per invocation; run it weekly at the end of the ISO week alongside
`/ph-fetch-items` so HN points for the week's stories have settled. To automate,
schedule it with cron or the `/schedule` skill.
