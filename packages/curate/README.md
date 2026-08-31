# @aibytes/curate

The step between the fetchers and the published contract. It reads one day's
raw snapshots from `newsletter/data/`, and writes one
`content/editions/YYYY-MM-DD.json` with `index.json` kept in step.

Stdlib only, like the rest of this repo's Python.

## Two commands, and Claude in the middle

```
draft   snapshots             -> curation.json + rejected.json
        Claude writes summaries.json against curation.json
build   snapshots + that file -> content/editions/DATE.json + index.json
```

```bash
python3 packages/curate/curate.py draft --date 2026-08-31
python3 packages/curate/curate.py build --date 2026-08-31 --summaries summaries.json
```

The skill wrapper at `.claude/skills/curate-edition/scripts/curate_edition.py`
runs the same code, and `.claude/skills/curate-edition/SKILL.md` carries the
voice and tagging rules - the part a script cannot do.

`build` re-derives its items from the snapshots rather than reading
`curation.json`, so the snapshots are the single source of truth and a stale
draft cannot change what gets published.

## Modules

| Module | What it owns |
|---|---|
| `adapters.py` | Four raw snapshot shapes into the contract's one shape: ids, category, images, signals, meta |
| `relevance.py` | Which items are in the edition, and why the rest are not: the AI filter and dedup |
| `summaries.py` | The handover to Claude: the curation request, and the checks on what comes back |
| `links.py` | Product Hunt's `/r/` redirect into the product's real URL. The only network call |
| `edition.py` | Counts, `index.json`, carrying a hide forward, and reading and writing files |
| `cli.py` | The two commands |

## Things that are load-bearing

- **Snapshot paths come from the fetchers.** `edition.snapshot_paths` derives
  them from each source module's own `SUBPATH` and `FILENAME`, so curate always
  reads exactly where fetch writes. A test asserts every fetched source has an
  adapter, because adding a source without one would mean its items silently
  never reach an edition.
- **Nothing is written until everything validates.** The edition and the index
  are built and checked in memory first, so a rejected run leaves the published
  tree exactly as it was. Same discipline as `hide.py`.
- **A hide survives a re-curate.** `content/hidden.json` is applied to the new
  items, and a logged hide the run can no longer honour stops the publish
  rather than leaving the tree describing an item that is not there.
- **The filter runs per source, with that source's own predicate.** TechCrunch
  is fetched from TechCrunch's AI category and is not keyword-filtered on top;
  Product Hunt has no topic filter at all and is where the filter does its
  work. See the module docstring in `relevance.py`.
- **Re-running is byte-identical** apart from `generated_at`, so a re-run
  diffs cleanly.
