# aiBytes_

The workspace behind **aiBytes_** — a curated feed of AI resources for
developers: launches, repos, threads, and news, with nothing else mixed in.

The same curation reaches three surfaces:

- a **weekly newsletter**, written from the snapshots in this repo
- a **daily web app** at `aibytes.io`, served as static JSON *(in progress)*
- a **Chrome new-tab extension** on the same JSON *(planned)*

Claude Code skills fetch the top AI content from around the web and commit it
here as dated JSON snapshots. The pipeline is deliberately boring: stdlib-only
Python, no database, no server, content as files in git.

| Path | What it is |
|---|---|
| `newsletter/` | The newsletter pipeline: issues, data snapshots, source mirrors, decision records |
| `packages/fetchers/` | Shared, cadence-agnostic fetch machinery for every data source |
| `packages/feed-schema/` | The contract for `content/`: schemas, TypeScript types, a validator |
| `packages/design-system/` | Ledger — design tokens + React components for the app and extension |
| `content/` | The published data the app and extension read — editions, index, tags, hide log |
| `docs/` | The app product spec and the design-system brief |

## Skills

| Skill | What it fetches |
|---|---|
| `/fetch-weekly-items` | Runs all weekly fetch skills below |
| `/ph-fetch-items` | Top ProductHunt products of the week |
| `/hn-fetch-items` | Top AI-related HackerNews stories |
| `/tc-fetch-items` | Most popular TechCrunch AI articles |
| `/gh-fetch-items` | Trending AI-related GitHub repositories |

Each skill lives in `.claude/skills/` and is a thin Python 3 wrapper over
`packages/fetchers` — stdlib only, no dependencies. Only ProductHunt needs an
API key (`PH_API_KEY` in a git-ignored `.env`); every other source is public.

The skills follow the open [Agent Skills](https://agentskills.io) format, and a
`.agents/skills` symlink makes them work in OpenAI Codex and other compatible
tools too.

## Usage

Fetch all weekly snapshots:

```bash
python3 .claude/skills/fetch-weekly-items/scripts/fetch_weekly_items.py
```

If ProductHunt credentials are unavailable, run only the public sources:

```bash
python3 .claude/skills/fetch-weekly-items/scripts/fetch_weekly_items.py --skip producthunt
```

## Data

Snapshots land under `newsletter/data/<year>/<month>/weeks/week-<NN>/`, one
folder per source. Run the skills at the end of each week; re-running overwrites
that week's snapshot.

The same fetchers run at any cadence. For a scheduled job, use the in-process
entry point:

```bash
python3 packages/fetchers/fetch.py --cadence daily --output-root feed
```

Daily snapshots file under `<year>/<month>/days/<yyyy-mm-dd>/` instead, so they
never collide with the weekly newsletter tree.

## Published content

Raw snapshots become one curated **edition** per day under `content/`, which is
what the app and the extension read over HTTP — no database, no server:

| File | What it is |
|---|---|
| `content/editions/YYYY-MM-DD.json` | One day's items: title, summary, category, tags, image, signals |
| `content/index.json` | Every edition that exists, newest first |
| `content/tags.json` | The fixed tag vocabulary the curation step draws from |
| `content/hidden.json` | The admin hide log |

`packages/feed-schema` holds the schemas, the TypeScript types, and a
stdlib validator that checks each file and how they agree with each other:

```bash
python3 packages/feed-schema/validate.py
```

The editions and index are empty until the daily runner lands.

## Design system

`packages/design-system` is **Ledger**, the system shared by the app and the
Chrome extension: authored CSS tokens (`styles.css` + `tokens/`), React
components, per-source marks, and the nine app screens in `ui_kits/`. There is
no build step. Browse it with:

```bash
npm run preview:design-system   # http://localhost:4300/ui_kits/aibytes-app/
```

The newsletter deliberately does not consume it — email HTML cannot load a
stylesheet, so its palette stays inline in the newsletter templates.

## Tests

```bash
python3 -m unittest discover -s tests -v
```

Add `AIBYTES_SKIP_LIVE=1` to skip the tests that hit live APIs.

## Weekly newsletter workflow

1. `/generate-newsletter-content` — the issue HTML and the Beehiiv export
2. `/generate-followup-thumbnail` — the 1200×630 cover
3. `/generate-followup-social-content` — the LinkedIn and X follow-ups

## Status and licence

This is a personal working repo, public so the pipeline can be read and
borrowed from, not a supported project. Expect the structure to move.

**No licence yet.** Without one, default copyright applies and no reuse rights
are granted — which is the honest state today rather than a considered "all
rights reserved". If you want to use something here, open an issue and ask.

Note that the newsletter issues, social copy, thumbnails, and the aiBytes_ brand
and Ledger design system are editorial and brand work, and would stay reserved
under any licence that lands later.

---

For working conventions and repo structure, see [CLAUDE.md](CLAUDE.md).
