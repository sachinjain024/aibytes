---
name: export-subscribers
description: Export aiBytes_ newsletter subscribers who signed up in the app, hand the publisher the CSV path, then mark that set imported. Use when the user wants to export, mark, or check newsletter subscribers.
---

# export-subscribers

The commands live in `packages/subscribers/subscribers.py`. This skill is the routine. Print counts and the file path. Never print, quote, or commit an email address.

The CSV must stay outside the repository. `--output` under the repo is refused, because the file holds email addresses and the repo is public.

1. Export through the cut-off day. Pick a path outside the repo, such as `~/Downloads/`.

```bash
python3 .claude/skills/export-subscribers/scripts/export_subscribers.py export --until YYYY-MM-DD --output ~/Downloads/aibytes-subscribers-YYYY-MM-DD.csv
```

2. Give the publisher the path. Wait until they say the upload is imported. Do not upload it yourself.
3. Mark that same day. This writes nothing without `--yes`.

```bash
python3 .claude/skills/export-subscribers/scripts/export_subscribers.py mark-imported --until YYYY-MM-DD --yes
```

4. Show where things stand. Report the counts.

```bash
python3 .claude/skills/export-subscribers/scripts/export_subscribers.py status
```
