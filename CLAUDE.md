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
| `docs/` | The app product spec and the design-system brief — the source documents for the app and extension |
| `packages/design-system/` | **Ledger**: tokens + React components for the app and extension (**not** the newsletter) |
| `packages/fetchers/` | Shared, cadence-agnostic Python fetch machinery for every data source |
| `packages/curate/` | The curate step: a day's raw snapshots become one published edition |
| `packages/feed-schema/` | The contract for everything in `content/`: schemas, `feed.d.ts`, `validate.py`, `hide.py` |
| `content/` | The published data — `editions/YYYY-MM-DD.json`, `index.json`, `tags.json`, `hidden.json` |
| `.claude/skills/` | Claude Code skills. Stays at the repo root — nested skill dirs are not in autocomplete until a file in them is touched |
| `.claude/rules/` | Path-scoped conventions, loaded on demand |
| `apps/web/` | *(planned, AIB-8h)* the aibytes.io daily-edition app — Vite + React, static build, GitHub Pages |
| `apps/extension/` | *(planned, AIB-8h)* the Chrome new-tab extension, on the same edition JSON |
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

# Preview the Ledger design system and the nine app screens
npm run preview:design-system   # then open http://localhost:4300/ui_kits/aibytes-app/

# Curate one day's snapshots into an edition. Claude writes the summaries
# between the two commands - see the curate-edition skill.
python3 packages/curate/curate.py draft --date 2026-08-31
python3 packages/curate/curate.py build --date 2026-08-31 --summaries summaries.json

# Check the published content tree against its contract
python3 packages/feed-schema/validate.py

# Hide one item from a published edition (moves the edition, index, and log together)
python3 packages/feed-schema/hide.py ph-chatcut-2026-08-27 --reason "duplicate launch"

# Tests. AIBYTES_SKIP_LIVE=1 skips the ones that hit live APIs.
python3 -m unittest discover -s tests -v
AIBYTES_SKIP_LIVE=1 python3 -m unittest discover -s tests -v
```

Only ProductHunt needs credentials (`PH_API_KEY` in `.env`).

## This repo is public

It is deployed to GitHub Pages, so treat everything here as world-readable.
Secrets live only in a git-ignored `.env` or the macOS Keychain, never in a
committed file, a skill script default, a test fixture, or a Requestly
environment. `newsletter/apis/aibytes/environments/local.json` is git-ignored for
exactly this reason. Before adding a file that carries a token, an email
address, or a subscriber list, assume it will be indexed.

## aiBytes-hub is a separate project

`aiBytes-hub` is a different repo with its own Chrome extension backed by
Firebase APIs. It is **not** part of this workspace and must not be referenced
in code, docs, comments, or schemas here. Nothing in this repo consumes it and
nothing here is built for it. If work ever genuinely needs to cross into it, the
user will call that out explicitly — do not infer the connection yourself.

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
  `.claude/rules/fetchers.md`. Curation logic belongs in `packages/curate` the
  same way; its skill carries the voice rules, not the code. See
  `.claude/rules/curate.md`.
- Anything under `content/` is a published contract read by a shipped Chrome
  extension that cannot be hotfixed. Add fields, never rename or remove them,
  and run `validate.py` before committing. See `.claude/rules/feed-schema.md`.

## Git workflow

Newsletter content never lands on `main` directly:

1. Branch from an up-to-date `main`, named for the issue (`issue-06`, or
   `issue-06-social` when follow-up content lands separately).
2. Commit the week's generated output there: `newsletter/data/` snapshots, the
   `newsletter/issues/{yyyy}/week-NN-Issue-{num}/` folder, social posts, thumbnails.
3. Push and open a PR against `main` with `gh pr create`; merge once reviewed.

Two special cases:

- **Tooling changes that come out of an issue** (a template, skill, package or
  test change made because of what the week's issue needed) land on that
  issue's branch and ship in its PR, as their own commits. Keep them out of
  the content commits so they can be reviewed apart. Only tooling work that
  isn't tied to an issue gets its own branch and PR.
- **Scheduled fetches** are automated and cannot open PRs. The daily job pushes
  its output straight to `main`; that is the one case where generated content
  bypasses review.
