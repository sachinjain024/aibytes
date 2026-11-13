# content

The published data behind the aiBytes_ app and Chrome extension. Plain JSON,
committed to the repo and served statically — there is no content database.

| File | Written by | What it is |
|---|---|---|
| `editions/YYYY-MM-DD.json` | the curate step | One day's curated items |
| `index.json` | the curate step | Every edition that exists, newest first |
| `tags.json` | by hand | The fixed tag vocabulary |
| `hidden.json` | `hide.py` | The admin hide log |
| `weekly/index.json` | generate-newsletter-content (AIB-105j) | Index of published weekly issues for `/weekly` |
| `weekly/issues/issue-N.json` | `build_weekly_issues.py` from issue HTML | Ledger feed for `/weekly/issue-N` (no intro / X sections yet) |
| `gists/<slug>.json` | the daily run's gists step (AIB-145y) | One gist: a short page about one source item, at `/gists/<slug>` |
| `gists/index.json` | the same step | Every gist, keyed by its normalised source URL |

The contract for the daily feed lives in [`packages/feed-schema`](../packages/feed-schema),
which also holds the validator. `weekly/index.json` and `gists/` are checked there too when present.
A gist, the index and the items that name it must agree: every item's `gist` names
a gist in the index, and every gist's appearances name items that point back
(`docs/specs/AIB-145y-gist-contract.md`):

```bash
python3 packages/feed-schema/validate.py
```

The curate step that writes `editions/` and `index.json` exists now - it is
`packages/curate`, run through the [`curate-edition`](../.claude/skills/curate-edition)
skill. They stay empty here until the daily runner starts committing an edition
a day (AIB-8h phase 3). `tags.json` is real now: it is what the curate step
tags from, and the only vocabulary it accepts.
