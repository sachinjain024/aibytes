# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

`aibytes-agents` is a workspace for AI agent tooling. It currently has no application code, build system, or test suite — it holds Claude Code skills (under `.claude/skills/`) and the data those skills produce (under `sources/`).

## Structure

- `.claude/skills/ph-download-api-specs/` — skill that mirrors the ProductHunt GraphQL v2 API docs site for offline use. Its script is `scripts/download_ph_docs.py` (stdlib-only Python 3, no dependencies).
- `.claude/skills/shared/` — Python helpers shared by skill scripts (not a skill itself). `ai_keywords.py` holds the AI-topic keyword vocabulary used by the HackerNews and GitHub fetch scripts; extend shared vocabulary there, source-specific extras in each script.
- `sources/producthunt/graphql-v2/specs/` — the generated offline mirror (~70 HTML pages: queries, mutations, objects, enums, etc.). This is committed output, not hand-written; regenerate it with the skill rather than editing files in it.
- `apis/aibytes/` — Requestly project mirroring the HTTP calls the fetch skills make (ProductHunt, TechCrunch, HackerNews collections + environments). See its `AGENTS.md` for the on-disk format and `PROJECT.md` for conventions; keep collections in sync with the skill scripts.

## Commands

Refresh the ProductHunt docs mirror (from the repo root; overwrites in place):

```bash
python3 .claude/skills/ph-download-api-specs/scripts/download_ph_docs.py
```

Preview the mirror locally:

```bash
python3 -m http.server -d sources/producthunt/graphql-v2/specs
```

## Conventions

- New skills go in `.claude/skills/<skill-name>/` with a `SKILL.md` (name + description frontmatter) and any scripts under `scripts/`.
- Downloaded/mirrored reference material goes under `sources/<provider>/<api>/`.
