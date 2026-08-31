# aibytes-agents

The workspace behind aiBytes_: the weekly newsletter, and the app and Chrome
extension that surface the same data. Claude Code skills fetch the top AI
content from around the web and save it as JSON snapshots in this repo.

| Path | What it is |
|---|---|
| `newsletter/` | The newsletter pipeline: issues, data snapshots, source mirrors, decision records |
| `packages/design-system/` | Design tokens + Web Components for the app and extension |
| `packages/fetchers/` | Shared, cadence-agnostic fetch machinery for every data source |

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
API key (`PH_API_KEY` in `.env`).
The skills follow the open [Agent Skills](https://agentskills.io) format, and
a `.agents/skills` symlink makes them work in OpenAI Codex and other
compatible tools too.

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

## Design system

`packages/design-system` holds the tokens and Web Components shared by the app
and the Chrome extension. Rebuild the generated CSS with `npm run build:tokens`.
The newsletter deliberately does not consume it — email HTML cannot load a
stylesheet, so its palette stays inline in the newsletter templates.

## Tests

```bash
python3 -m unittest discover -s tests -v
```

Add `AIBYTES_SKIP_LIVE=1` to skip the tests that hit live APIs.

---

For working conventions and repo structure, see [CLAUDE.md](CLAUDE.md).

## Weekly Newsletter Generation Workflow
- Generate Content - /generate-newsletter-content
- Generate Thumbnail - /generate-followup-thumbnail
- Generate Social Media Content - /generate-followup-social-content