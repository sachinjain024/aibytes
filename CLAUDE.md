# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

`aibytes-agents` is a workspace for AI agent tooling. It has no application code or build system — it holds Claude Code skills (under `.claude/skills/`), the data those skills produce (under `sources/` and `data/`), and a stdlib-only test suite for the skill scripts (under `tests/`).

## Structure

- `.claude/skills/ph-download-api-specs/` — skill that mirrors the ProductHunt GraphQL v2 API docs site for offline use. Its script is `scripts/download_ph_docs.py` (stdlib-only Python 3, no dependencies).
- `.claude/skills/shared/` — Python helpers shared by skill scripts (not a skill itself). `ai_keywords.py` holds the AI-topic keyword vocabulary used by the HackerNews and GitHub fetch scripts; extend shared vocabulary there, source-specific extras in each script.
- `sources/producthunt/graphql-v2/specs/` — the generated offline mirror (~70 HTML pages: queries, mutations, objects, enums, etc.). This is committed output, not hand-written; regenerate it with the skill rather than editing files in it.
- `apis/aibytes/` — Requestly project mirroring the HTTP calls the fetch skills make (ProductHunt, TechCrunch, HackerNews, GitHub collections + environments). See its `AGENTS.md` for the on-disk format and `PROJECT.md` for conventions; keep collections in sync with the skill scripts.
- `.agents/skills` — symlink to `.claude/skills`. The SKILL.md format is the open Agent Skills standard (agentskills.io); this symlink lets OpenAI Codex and other compatible tools discover the same skills at their standard path. `.claude/skills/` stays the canonical location — never put real files under `.agents/`.
- `tests/` — `unittest` suite for the skill scripts. `test_ai_filters.py` unit-tests the shared vocabulary and each script's filter/parser offline; `test_skill_scripts.py` smoke-tests each fetch skill end-to-end against the live APIs, writing to a per-test temp dir via `--output-root` (never the committed `data/` tree) that is removed when the test ends.

## Commands

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
- Every new skill script must be covered by the test suite: add a `test_*` method to `tests/test_skill_scripts.py` invoking it end-to-end (asserting its snapshot path, `source` name, and items key), and offline unit tests in `tests/test_ai_filters.py` for any filtering/parsing logic. Run the suite before committing.
- Skill scripts that write snapshots must support `--output-root` (and a `--date`/as-of flag) so tests can redirect output to a temp dir, and must not assume the output path is inside the repo.
- Downloaded/mirrored reference material goes under `sources/<provider>/<api>/`.
