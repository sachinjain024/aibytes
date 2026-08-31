---
name: gh-fetch-items
description: Fetch the trending AI-related GitHub repositories of the last week (default top 10, ranked by stars gained this week) and save them as a weekly JSON snapshot under data/yyyy/mm/weeks/week-NN/github/gh_data.json. Use when the user wants to fetch, download, refresh, or snapshot weekly trending GitHub repos.
---

# gh-fetch-items

Fetches the trending AI-related GitHub repositories of the last week and
stores them as a weekly JSON snapshot, ready for the newsletter's **Trending
Repos** section. Each repo carries its full name, URL, description, primary
language, total stars, forks, and stars gained in the trending period.

## How it works

1. Scrapes the public trending page (`https://github.com/trending?since=weekly`).
   GitHub has no official trending API, so this parses the page HTML — if
   GitHub changes the trending page markup, update the regexes in
   `parse_trending()`. No auth needed. The overall page lists ~25 repos;
   `--languages` merges in per-language pages to widen the pool.
2. Filters to AI-related repos. The trending page shows no topics, so this is
   a heuristic: keyword/model/company-name matching on the repo name and
   description (case-insensitive — repo names are usually lowercase). The
   shared vocabulary lives in `.claude/skills/shared/ai_keywords.py` (also
   used by `/hn-fetch-items`) with repo-specific extras at the top of this
   script — extend them there as new model/product names emerge; genuinely
   AI repos whose name and description avoid all AI vocabulary can slip
   through the filter.
3. Ranks by stars gained in the period, with total stars as the tiebreaker.
4. Writes the top N repos as JSON.

## Requirements

- Python 3 (stdlib only, no dependencies). No API keys.

## Usage

Run from the repo root:

```bash
python3 .claude/skills/gh-fetch-items/scripts/fetch_gh_items.py
```

Defaults: top **10** repos, GitHub's **weekly** trending window.

Options:

```bash
--count N            # how many repos (default 10)
--since WINDOW       # daily | weekly | monthly (default weekly)
--date YYYY-MM-DD    # as-of date used to file the snapshot (default today)
--output-root DIR    # root data dir (default: data)
--languages L [L...] # extra per-language trending pages to merge, e.g. python jupyter-notebook
--no-ai-filter       # keep all trending repos, not just AI-related ones
```

Unlike the HN/TC skills there is no `--days`: the window is GitHub's own
trending period (`--since`), and the page is always live — `--date` only
controls which week directory the snapshot is filed under, so it cannot
backfill past weeks.

## Output

Written to `newsletter/data/<yyyy>/<mm>/weeks/week-<NN>/github/gh_data.json`, where
`yyyy`, `mm`, and ISO week `NN` come from the as-of date (same layout as the
ProductHunt snapshot; GitHub repos are their own newsletter section, so they
sit outside the `news/` subtree). The file is self-describing: it records
`fetched_at`, the trending window and topic filter used, `totalCount`
(AI-related repos on the trending pages fetched), and `poolCount` (all
trending repos fetched, before the AI filter) alongside the top repos.
Re-running for the same week overwrites in place.

## Weekly cadence

One snapshot per invocation; run it weekly at the end of the ISO week
alongside `/ph-fetch-items`, `/tc-fetch-items`, and `/hn-fetch-items`. Because
the trending page is live-only, run it while the target week is still GitHub's
"this week" — it cannot be backfilled later. To automate, schedule the script
with cron or your agent runner.
