---
name: fetch-weekly-items
description: Run all weekly AIBytes source fetch skills in one command and save the current ProductHunt, HackerNews, TechCrunch, and GitHub JSON snapshots. Use when the user wants to fetch, refresh, download, update, or snapshot all weekly AIBytes data sources together, or asks for the parent/all-sources weekly fetch skill.
---

# fetch-weekly-items

Fetch all weekly AIBytes source snapshots by invoking the source-specific
skills in sequence:

- `ph-fetch-items` for ProductHunt products
- `hn-fetch-items` for HackerNews AI stories
- `tc-fetch-items` for TechCrunch AI articles
- `gh-fetch-items` for GitHub trending AI repositories

## Usage

Run from the repo root:

```bash
python3 .claude/skills/fetch-weekly-items/scripts/fetch_weekly_items.py
```

Common options:

```bash
--date YYYY-MM-DD       # as-of date for every child skill; default today
--output-root DIR       # root data dir passed to every child; default data
--count N               # optional count override passed to every child
--days N                # optional window override for ProductHunt, HN, and TechCrunch
--skip SOURCE           # skip one source; repeatable: producthunt, hackernews, techcrunch, github
--keep-going            # continue after a child skill fails, then exit nonzero if any failed
--techcrunch-no-hn      # pass --no-hn to tc-fetch-items for faster smoke runs
```

The runner verifies each expected output file after the child script exits.
Snapshots are written by the child skills under
`data/<yyyy>/<mm>/weeks/week-<NN>/`.

## Maintenance

When adding a new weekly fetch skill, update the `SKILLS` registry in
`scripts/fetch_weekly_items.py`, add the new child skill to the list above, and
extend the parent-skill smoke test in `tests/test_skill_scripts.py`.

This skill is stored in `.claude/skills`, which is the canonical Claude Code
location in this repo. Codex discovers the same skill through the existing
`.agents/skills -> ../.claude/skills` symlink, so do not duplicate files under
`.agents/`.
