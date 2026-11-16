---
paths:
  - "packages/gists/**"
  - ".claude/skills/write-gists/**"
  - "tests/test_gists.py"
---

# The gists step

`packages/gists` turns a built edition (or a weekly `items.json`) into gist
files under `content/gists/`. It is the only writer of that tree. Specs:
`docs/specs/AIB-145y-gist-generate.md` and
`docs/specs/AIB-145y-newsletter-gist-links.md`. Caps and keys live in
`packages/feed-schema/gist_contract.py`; import them, do not restate them.

## The split with Claude

The script owns every fact: slug, title, URLs, tags, image, stats, links,
appearances, timestamps, and whether the gist is `full`, `brief` or `preview`.
**Claude writes only `lede` and `sections`.** Voice and structure live in
`.claude/skills/write-gists/SKILL.md`, not in a string literal. Claude may
lower `depth` from `full` to `brief`; never raise it.

Weekly X posts and Official Announcements are `preview` gists copied from the
snapshot. They have no Claude step.

## Cache stays off the published tree

Fetched article text, READMEs and comments are other people's writing. They
go to `.cache/gists/<date-or-issue>/`, which is git-ignored. The runner stages
only `content/` and `newsletter/data/`, so this folder cannot be swept up.
Skill scripts and tests must accept `--cache-root` (and `--content-root`)
rather than assuming a path inside the repo.

## Failure never costs an edition

One bad gist is dropped and its item ships without `gist`; the rest are
written. If the step fails as a whole, nothing under `content/gists/` changes
and the edition still publishes. Slack carries a warning. The runner's tests
cover this; do not make a gist error fatal to `run.py`.

Nothing is written until the whole tree, with every change applied, passes
`validate.py` — checked on a copy first, the way `hide.py` and curate check
before they write.

## Repeats are not rewritten

The source page's normalised URL is the key in `content/gists/index.json`. A
repeat is never fetched and never shown to Claude. `build` appends the
appearance, refreshes stats, may set `front_page`, and bumps `updated_at`.
A slug never changes once it is in the index.

Weekly appearances use `issue_slug` and may land before the issue JSON
exists; `_items_agree` allows that gap for that issue only.

## Fetch logic stays in fetchers

Article text, HN threads, GitHub repos and Product Hunt launch comments are
functions in `packages/fetchers`. The gists package arranges them. Do not
reimplement a fetch inside `aibytes_gists` or the skill.

## Weekly `--issue`

`gists draft|build --issue issue-N` reads `.cache/gists/issue-N/items.json`.
Missing `items.json` is fatal. A failed gist drops that row only. Item ids
come from `packages/feed-schema/item_id.py` so the weekly builder cannot
drift.
