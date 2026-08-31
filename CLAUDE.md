# CLAUDE.md

Guidance for Claude Code (claude.ai/code) working in this repository.

## What this repo is

`aibytes` is the workspace behind aiBytes_: the weekly newsletter, and the app
and Chrome extension that surface the same data. Detailed conventions live in
path-scoped rules under `.claude/rules/`, which load only when you touch the
matching files — this file stays a map.

## Layout

| Path | What it is |
|---|---|
| `newsletter/` | The whole newsletter pipeline: `issues/`, `data/` snapshots, `sources/` mirrors, `apis/` Requestly project, `artifacts/` decision records |
| `packages/design-system/` | Tokens + Web Components for the app and extension (**not** the newsletter) |
| `packages/fetchers/` | Shared, cadence-agnostic Python fetch machinery for every data source |
| `.claude/skills/` | Claude Code skills. Stays at the repo root — nested skill dirs are not in autocomplete until a file in them is touched |
| `.claude/rules/` | Path-scoped conventions, loaded on demand |
| `tests/` | stdlib `unittest` suite for the Python side |

`.agents/skills` is a symlink to `.claude/skills` so Codex and other tools using
the open [Agent Skills](https://agentskills.io) format find the same skills.
Never put real files under `.agents/`.

## Commands

```bash
# Fetch every source. --cadence weekly (default) | daily | monthly
python3 packages/fetchers/fetch.py --cadence daily --output-root feed

# The weekly newsletter run, via the skills (subprocess per source, skippable)
python3 .claude/skills/fetch-weekly-items/scripts/fetch_weekly_items.py
python3 .claude/skills/fetch-weekly-items/scripts/fetch_weekly_items.py --skip producthunt

# Design tokens (regenerates packages/design-system/dist/)
npm run build:tokens

# Tests. AIBYTES_SKIP_LIVE=1 skips the ones that hit live APIs.
python3 -m unittest discover -s tests -v
AIBYTES_SKIP_LIVE=1 python3 -m unittest discover -s tests -v
```

Only ProductHunt needs credentials (`PH_API_KEY` in `.env`).

## Conventions

- New skills go in `.claude/skills/<skill-name>/` with a `SKILL.md` (name +
  description frontmatter) and scripts under `scripts/`.
- Skill scripts that write snapshots must support `--output-root` and a
  `--date`, and must not assume the output path is inside the repo — that is how
  the tests redirect output to a temp dir.
- Every new skill script must be covered by the test suite, and the suite must
  pass before committing. Fetch skills: an end-to-end test in
  `tests/test_skill_scripts.py` plus offline unit tests. Other skill scripts:
  their own `tests/test_<skill>.py`, with the external-tool test skipped when
  the tool is missing (see `tests/test_thumbnail.py`).
- Fetch logic belongs in `packages/fetchers`, not in a skill script. See
  `.claude/rules/fetchers.md`.

## Git workflow

Newsletter content never lands on `main` directly:

1. Branch from an up-to-date `main`, named for the issue (`issue-06`, or
   `issue-06-social` when follow-up content lands separately).
2. Commit the week's generated output there: `newsletter/data/` snapshots, the
   `newsletter/issues/{yyyy}/week-NN-Issue-{num}/` folder, social posts, thumbnails.
3. Push and open a PR against `main` with `gh pr create`; merge once reviewed.

Two exceptions:

- **Tooling changes** (skills, packages, tests) are separate from content
  commits, on their own branch and PR.
- **Scheduled fetches** are automated and cannot open PRs. The daily job pushes
  its output straight to `main`; that is the one case where generated content
  bypasses review.
