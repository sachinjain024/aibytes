# aibytes-agents

Tooling behind the weekly AIBytes newsletter. A set of Claude Code skills
fetches the week's top AI content from around the web and saves it as JSON
snapshots in this repo.

## Skills

| Skill | What it fetches |
|---|---|
| `/fetch-weekly-items` | Runs all weekly fetch skills below |
| `/ph-fetch-items` | Top ProductHunt products of the week |
| `/hn-fetch-items` | Top AI-related HackerNews stories |
| `/tc-fetch-items` | Most popular TechCrunch AI articles |
| `/gh-fetch-items` | Trending AI-related GitHub repositories |

Each skill lives in `.claude/skills/` and is a plain Python 3 script — no
dependencies. Only ProductHunt needs an API key (`PH_API_KEY` in `.env`).
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

Snapshots land under `data/<year>/<month>/weeks/week-<NN>/`, one folder per
source. Run the skills at the end of each week; re-running overwrites that
week's snapshot.

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