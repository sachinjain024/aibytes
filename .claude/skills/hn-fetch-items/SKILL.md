---
name: hn-fetch-items
description: Fetch the top/trending AI-related HackerNews stories of the last 7 days (default top 10, ranked by points then recency) and save them as a weekly JSON snapshot under data/yyyy/mm/weeks/week-NN/news/hackernews/hn_data.json. Use when the user wants to fetch, download, refresh, or snapshot weekly HackerNews AI news.
---

# hn-fetch-items

Fetches the top AI-related HackerNews stories of the last 7 days and stores
them as a weekly JSON snapshot, ready for the newsletter's **AI News** section.
Each story carries a title, external URL (or the HN thread for Ask/Show HN
posts with no link), story type, points, comment count, author, submit time,
and the HN thread link.

## How it works

1. Queries the public HackerNews Algolia search API
   (`https://hn.algolia.com/api/v1/search`, `tags=story`) for all stories in
   the window with at least `--min-points` points (default 50). No auth needed.
2. Filters to AI-related stories. HN has no topic tags, so this is a heuristic:
   keyword/model/company-name matching on the title (word-boundary regexes,
   case-sensitive for acronyms like AI/LLM/GPT) plus an AI-domain allowlist for
   the story URL (openai.com, anthropic.com, huggingface.co, …). The patterns
   live at the top of the script — extend them there as new model/product
   names emerge; genuinely AI stories whose titles avoid all AI vocabulary can
   slip through the filter.
3. Ranks the remainder by points, with submit recency as the tiebreaker.
4. Writes the top N stories as JSON.

## Requirements

- Python 3 (stdlib only, no dependencies). No API keys.

## Usage

Run from the repo root:

```bash
python3 .claude/skills/hn-fetch-items/scripts/fetch_hn_items.py
```

Defaults: top **10** stories, last **7** days ending today.

Options:

```bash
--count N          # how many stories (default 10)
--days N           # window length in days (default 7)
--date YYYY-MM-DD  # end of the window / "as of" date (default today)
--output-root DIR  # root data dir (default: data)
--min-points N     # points floor for candidate stories (default 50)
--no-ai-filter     # keep all top stories, not just AI-related ones
```

## Output

Written to `data/<yyyy>/<mm>/weeks/week-<NN>/news/hackernews/hn_data.json`,
where `yyyy`, `mm`, and ISO week `NN` come from the as-of date (same layout as
the TechCrunch snapshot, under the `news/` subtree for newsletter news
sources). The file is self-describing: it records `fetched_at`, the date
window, the ranking and topic filter used, `totalCount` (AI-related stories
over the points floor in the window), and `poolCount` (all stories over the
floor, before the AI filter) alongside the top stories. Re-running for the
same week overwrites in place.

## Weekly cadence

One snapshot per invocation; run it weekly at the end of the ISO week alongside
`/ph-fetch-items` and `/tc-fetch-items` so points for the week's stories have
settled. To automate, schedule it with cron or the `/schedule` skill.
