# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

`aibytes-agents` is a workspace for AI agent tooling. It has no application code or build system — it holds Claude Code skills (under `.claude/skills/`), the data those skills produce (under `sources/` and `data/`), and a stdlib-only test suite for the skill scripts (under `tests/`).

## Structure

- `.claude/skills/ph-download-api-specs/` — skill that mirrors the ProductHunt GraphQL v2 API docs site for offline use. Its script is `scripts/download_ph_docs.py` (stdlib-only Python 3, no dependencies).
- `.claude/skills/fetch-weekly-items/` — parent skill that invokes the weekly fetch skills for ProductHunt, HackerNews, TechCrunch, and GitHub in one run. Its child registry lives in `scripts/fetch_weekly_items.py`.
- `.claude/skills/shared/` — Python helpers shared by skill scripts (not a skill itself). `ai_keywords.py` holds the AI-topic keyword vocabulary used by the HackerNews and GitHub fetch scripts; extend shared vocabulary there, source-specific extras in each script.
- `.claude/skills/generate-followup-thumbnail/` — renders an issue's 1200x630 Beehiiv thumbnails from `assets/thumbnail.html` via headless Chrome: three background variants (dot grid, cobalt wash, graph grid) saved in the issue's `thumbnails/` folder as `issue-{num}-thumbnail-{variant}.png`. Its script is `scripts/generate_thumbnail.py` (stdlib-only; Chrome is the one external dependency).
- `sources/producthunt/graphql-v2/specs/` — the generated offline mirror (~70 HTML pages: queries, mutations, objects, enums, etc.). This is committed output, not hand-written; regenerate it with the skill rather than editing files in it.
- `apis/aibytes/` — Requestly project mirroring the HTTP calls the fetch skills make (ProductHunt, TechCrunch, HackerNews, GitHub collections + environments). See its `AGENTS.md` for the on-disk format and `PROJECT.md` for conventions; keep collections in sync with the skill scripts.
- `.agents/skills` — symlink to `.claude/skills`. The SKILL.md format is the open Agent Skills standard (agentskills.io); this symlink lets OpenAI Codex and other compatible tools discover the same skills at their standard path. `.claude/skills/` stays the canonical location — never put real files under `.agents/`.
- `tests/` — `unittest` suite for the skill scripts. `test_ai_filters.py` unit-tests the shared vocabulary and each script's filter/parser offline; `test_skill_scripts.py` smoke-tests each fetch skill end-to-end against the live APIs, writing to a per-test temp dir via `--output-root` (never the committed `data/` tree) that is removed when the test ends.

## Commands

Run all weekly source fetches:

```bash
python3 .claude/skills/fetch-weekly-items/scripts/fetch_weekly_items.py
```

Without ProductHunt credentials, run only public sources:

```bash
python3 .claude/skills/fetch-weekly-items/scripts/fetch_weekly_items.py --skip producthunt
```

Refresh the ProductHunt docs mirror (from the repo root; overwrites in place):

```bash
python3 .claude/skills/ph-download-api-specs/scripts/download_ph_docs.py
```

Preview the mirror locally:

```bash
python3 -m http.server -d sources/producthunt/graphql-v2/specs
```

Run the test suite (stdlib `unittest`, no dependencies; the smoke tests hit the live APIs):

```bash
python3 -m unittest discover -s tests -v
```

Offline (skips the live smoke tests, keeps the filter/parser unit tests):

```bash
AIBYTES_SKIP_LIVE=1 python3 -m unittest discover -s tests -v
```

## Conventions

- New skills go in `.claude/skills/<skill-name>/` with a `SKILL.md` (name + description frontmatter) and any scripts under `scripts/`.
- New weekly source fetch skills must also be registered in `.claude/skills/fetch-weekly-items/scripts/fetch_weekly_items.py`, documented in `.claude/skills/fetch-weekly-items/SKILL.md`, and covered by the parent smoke test.
- Every new skill script must be covered by the test suite, and the suite must pass before committing.
  - **Fetch skills**: add a `test_*` method to `tests/test_skill_scripts.py` invoking the script end-to-end (asserting its snapshot path, `source` name, and items key), plus offline unit tests in `tests/test_ai_filters.py` for any filtering/parsing logic.
  - **Other skill scripts**: give them their own `tests/test_<skill>.py` with offline unit tests for the parsing/templating logic and one end-to-end test, skipped when an external tool it needs is missing (see `tests/test_thumbnail.py`, which skips its render test without Chrome).
- Skill scripts that write snapshots must support `--output-root` (and a `--date`/as-of flag) so tests can redirect output to a temp dir, and must not assume the output path is inside the repo.
- Downloaded/mirrored reference material goes under `sources/<provider>/<api>/`.
