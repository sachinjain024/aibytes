<!-- This file is yours. Requestly will not overwrite it.
     Use it for project-specific instructions and context that agents
     working in this folder should read alongside AGENTS.md. -->

# Project Context

## What this project is for

API requests behind the weekly AIBytes newsletter snapshots. Each collection
mirrors the HTTP calls made by a fetch skill in this repo:

- **ProductHunt** — GraphQL v2 API used by `/ph-fetch-items`
  (`.claude/skills/ph-fetch-items/scripts/fetch_ph_items.py`). Offline API docs
  live in `sources/producthunt/graphql-v2/specs/`.
- **TechCrunch** — public WordPress REST API used by `/tc-fetch-items`
  (`.claude/skills/tc-fetch-items/scripts/fetch_tc_items.py`). AI category ID
  `577047203`; paginate via the `X-WP-TotalPages` response header.
- **HackerNews** — Algolia search API used by `/hn-fetch-items`
  (`.claude/skills/hn-fetch-items/scripts/fetch_hn_items.py`) to snapshot the
  week's top AI-related HN stories (the AI filter is client-side in the
  script), and by `/tc-fetch-items` to rank TechCrunch articles by HN points
  (TechCrunch has no popularity metric).

Snapshots land under `data/<yyyy>/<mm>/weeks/week-<NN>/` at the repo root.

## Auth & conventions

- TechCrunch and HackerNews are public; no auth.
- ProductHunt auth lives in the `local` environment (gitignored — real values
  are populated there): `ph_access_token` holds a ProductHunt developer token,
  sent as a Bearer token by **Top Posts**. The **Get OAuth Token** request is
  only for OAuth client credentials; with a developer token it isn't needed and
  `ph_api_secret` stays empty.
- Date windows (the `after`/`before` params, GraphQL `postedAfter`/`postedBefore`
  variables, and the HN `numericFilters` timestamp) are saved with example
  values for one snapshot week; adjust them to the week you're inspecting.

## Things agents should not change

- Do not commit real values for the secret variables in `environments/local.json`.
- Keep the ProductHunt Top Posts query on `order: VOTES` — `RANKING` is the
  day-grouped homepage feed and only returns the current day's leaderboard.
- If a request here changes shape, update the corresponding skill script (and
  vice versa) — the collections document what the skills actually call.
