# content

The published data behind the aiBytes_ app and Chrome extension. Plain JSON,
committed to the repo and served statically — there is no content database.

| File | Written by | What it is |
|---|---|---|
| `editions/YYYY-MM-DD.json` | the curate step | One day's curated items |
| `index.json` | the curate step | Every edition that exists, newest first |
| `tags.json` | by hand | The fixed tag vocabulary |
| `hidden.json` | `hide.py` | The admin hide log |

The contract for all four lives in [`packages/feed-schema`](../packages/feed-schema),
which also holds the validator:

```bash
python3 packages/feed-schema/validate.py
```

The curate step that writes `editions/` and `index.json` exists now - it is
`packages/curate`, run through the [`curate-edition`](../.claude/skills/curate-edition)
skill. They stay empty here until the daily runner starts committing an edition
a day (AIB-8h phase 3). `tags.json` is real now: it is what the curate step
tags from, and the only vocabulary it accepts.
