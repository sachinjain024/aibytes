---
name: ph-fetch-items
description: Fetch the top ProductHunt products of the last 7 days (default top 5, featured, ordered by votes) and save them as a weekly JSON snapshot under data/yyyy/mm/weeks/week-NN/producthunt/ph_data.json. Use when the user wants to fetch, download, refresh, or snapshot weekly ProductHunt data.
---

# ph-fetch-items

Fetches the top products of the last 7 days from the ProductHunt GraphQL v2 API and
stores them as a weekly JSON snapshot. The JSON is enriched with newsletter-ready
fields (makers, hunter, media gallery, review ratings, ranks, product links).

## Requirements

- `.env` at the repo root with `PH_API_KEY` set to a ProductHunt developer
  token (used directly as the Bearer token). Alternatively, set both
  `PH_API_KEY` and `PH_API_SECRET` (v2 OAuth client credentials) and the script
  exchanges them for a Bearer token itself.
- Python 3 (stdlib only, no dependencies).

## Usage

Run from the repo root:

```bash
python3 .claude/skills/ph-fetch-items/scripts/fetch_ph_items.py
```

Defaults: top **5** products, last **7** days ending today, `featured: true`,
ordered by `VOTES` (raw vote count across the whole window — do NOT switch to
`RANKING`, which is the day-grouped homepage feed order and only ever returns
the current day's leaderboard).

Options:

```bash
--count N      # how many products (default 5)
--days N       # window length in days (default 7)
--date YYYY-MM-DD  # end of the window / "as of" date (default today)
--output-root DIR  # root data dir (default: data)
```

## Output

Written to `newsletter/data/<yyyy>/<mm>/weeks/week-<NN>/producthunt/ph_data.json`, where
`yyyy`, `mm`, and ISO week `NN` come from the as-of date. The file is
self-describing: it records `fetched_at`, the date window, and the query params
alongside the posts. Re-running for the same week overwrites in place.

## Weekly cadence

The skill takes one snapshot per invocation; run it weekly (ideally at the end
of the ISO week, so vote counts for the whole week have settled). To automate,
schedule the script with cron or your agent runner.
