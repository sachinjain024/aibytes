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

## Requirements

- Python 3 (stdlib only, no dependencies).
- A repo-root `.env` with `PH_API_KEY` for the ProductHunt child skill. To run
  only public sources without ProductHunt credentials, pass `--skip producthunt`.

## Usage

Run from the repo root:

```bash
python3 .claude/skills/fetch-weekly-items/scripts/fetch_weekly_items.py
```

Common options:

```bash
--date YYYY-MM-DD       # as-of date for every child skill; default today
--output-root DIR       # root data dir passed to every child; default newsletter/data
--cadence CADENCE       # daily | weekly | monthly, forwarded to every child; default weekly
--count N               # optional count override passed to every child
--days N                # optional window override for ProductHunt, HN, and TechCrunch
--skip SOURCE           # skip one source; repeatable: producthunt, hackernews, techcrunch, github
--keep-going            # continue after a child skill fails, then exit nonzero if any failed
--github-since WINDOW   # daily | weekly | monthly, passed to gh-fetch-items; default: follows --cadence
--github-languages L [L...]  # extra GitHub language trending pages to merge
--techcrunch-no-hn      # pass --no-hn to tc-fetch-items for faster smoke runs
--dry-run               # print child commands and expected snapshots without running
```

The runner verifies each expected output file after the child script exits.
Snapshots are written by the child skills under
`newsletter/data/<yyyy>/<mm>/weeks/week-<NN>/`.

## Cadence

The default is the weekly newsletter cadence. `--cadence daily` runs the same
child skills against a one-day window and files the snapshots under
`<yyyy>/<mm>/days/<yyyy-mm-dd>/` instead. For an unattended scheduled run,
prefer the in-process entry point, which skips the subprocess-per-source
overhead:

```bash
python3 packages/fetchers/fetch.py --cadence daily --output-root feed
```

Use this skill when you want per-source isolation (one source failing does not
stop the others) or `--skip`/`--dry-run`.

## Maintenance

The fetch logic itself lives in `packages/fetchers`, not in these scripts - the
child skills are thin CLI wrappers over `aibytes_fetchers.sources.*`. When
adding a new source, write the source module first (see
`.claude/rules/fetchers.md`), then register it in `registry.py`, add a
`SkillSpec` to `scripts/fetch_weekly_items.py`, add the child skill to the list
above, and extend the parent-skill smoke test in `tests/test_skill_scripts.py`.

This skill is stored in `.claude/skills`, which is the canonical Claude Code
location in this repo. Codex discovers the same skill through the existing
`.agents/skills -> ../.claude/skills` symlink, so do not duplicate files under
`.agents/`.
