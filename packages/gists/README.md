# @aibytes/gists

The step between a built edition (or a weekly `items.json`) and
`content/gists/`. Claude writes the prose; this package writes every fact and
the files.

Stdlib only, like the rest of this repo's Python. Spec:
`docs/specs/AIB-145y-gist-generate.md`. File format: `gist_contract.py`.

## Two commands, and Claude in the middle

```
draft   built edition + gists/index.json -> .cache/gists/DATE/draft.json
        (fetches material for new items only)
        Claude writes gists.json against draft.json (write-gists skill)
build   gists.json -> content/gists/, the index, `gist` on each item
```

```bash
python3 packages/gists/gists.py draft --date 2026-11-11
python3 packages/gists/gists.py build --date 2026-11-11 --gists .cache/gists/2026-11-11/gists.json
```

Weekly, after `.cache/gists/issue-N/items.json` exists:

```bash
python3 packages/gists/gists.py draft --issue issue-19
python3 packages/gists/gists.py build --issue issue-19
```

Weekly X posts are `preview` gists with no Claude file. The skill wrapper is
`.claude/skills/write-gists/SKILL.md` — voice and structure, not the code.

## Modules

| Module | What it owns |
|---|---|
| `draft.py` | New vs repeat vs skip; fetch material; write `draft.json` |
| `build.py` | Check Claude's prose, copy preview gists, write files atomically |
| `copying.py` | Verbatim-run check against the fetched material |
| `cli.py` | `--date` or `--issue` |

## Things that are load-bearing

- **The script owns the facts.** Slug, URLs, stats, links, appearances and
  depth come from the edition item and what draft actually read. Claude
  writes `lede` and `sections` only, and may lower `full` to `brief`.
- **`.cache/gists/` is git-ignored.** Article text, READMEs and comments never
  leave the machine that fetched them. Tests pass `--cache-root` and
  `--content-root` at a temp dir.
- **A gist failure does not fail the edition.** One rejected gist ships its
  item without `gist`; a step-wide failure reverts `content/gists/` and the
  runner still publishes. Slack warns.
- **Repeats are not rewritten.** Lookup is the normalised source URL in
  `gists/index.json`. `build` adds the appearance and refreshes stats.
- **Fetchers fetch.** Article, HN thread, GitHub repo and Product Hunt
  launch material live in `packages/fetchers`. Caps come from
  `gist_contract.py`.
- **Nothing is written until `validate.py` passes** on a copy of the tree,
  the same discipline as `hide.py` and curate.

## Tests

```bash
python3 -m unittest tests.test_gists -v
```
