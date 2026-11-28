---
paths:
  - "packages/fetchers/**"
  - ".claude/skills/*-fetch-items/**"
  - ".claude/skills/proj-generate-prompt-x-items/**"
  - ".claude/skills/proj-fetch-from-x/**"
  - ".claude/skills/fetch-weekly-items/**"
  - "tests/test_fetchers.py"
  - "tests/test_ai_filters.py"
---

# Shared fetch package

`packages/fetchers/aibytes_fetchers/` holds everything the data sources share.
Stdlib-only, no dependencies, like the rest of the repo's Python.

A source module (`sources/<name>.py`) implements only what is source-specific:
the API call, the item shape, the filter, the ranking. It declares
`NAME, SOURCE, SECTION, SUBPATH, FILENAME, ITEMS_KEY, ITEM_NOUN, DEFAULT_COUNT`
and implements `add_arguments(parser)`, `fetch(window, args) -> FetchResult`,
and `format_line(item)`. Everything else — CLI flags, window, output path,
envelope, printed summary — comes from `runner.py`.

## Cadence

Nothing in a source module knows its cadence. It receives a `Window` with an
explicit start and end, which is what lets the same code back the weekly
newsletter snapshot and the daily app feed. Add a cadence in `window.py`
(length) and `layout.py` (period folder), never inside a source.

## Two rules that are load-bearing

- **The weekly path must not change.** `newsletter/data/{yyyy}/{mm}/weeks/week-NN/`
  is what the newsletter skills read and what every committed snapshot uses.
- **Envelope key order must not change.** `envelope.build()` fixes the order to
  match the snapshots already on disk, and omits optional keys rather than
  emitting nulls, so re-running a fetch produces a clean diff.

## Adding a source

1. Write `sources/<name>.py` against the contract above.
2. Register it in `registry.py` (plus aliases).
3. If it should run weekly, add a `SkillSpec` to
   `.claude/skills/fetch-weekly-items/scripts/fetch_weekly_items.py` and a thin
   wrapper skill under `.claude/skills/<x>-fetch-items/`.
4. Cover it in `tests/test_fetchers.py`, and its filter/parser in
   `tests/test_ai_filters.py`.

The skill scripts are thin wrappers by design: they re-export their source
module's functions under the historical names so the offline tests keep
reaching them. Keep them thin — logic belongs in the package.

## X is gathered in Grok, not by fetch.py

`x_paste.py` is the exception. There is no `fetch()` the shared runner can
call, so it is not a `sources/` module and doesn't use the envelope. Grok
pulls the week with `/proj-fetch-from-x` (native X search) or the publisher
pastes JSON from `/proj-generate-prompt-x-items`. Both write
`week-NN/x/x_data.json` through `layout`, plus `x_review.md` for picking.
The contract is in
`.claude/skills/proj-generate-prompt-x-items/references/x-data.md`, and the
tests are in `tests/test_x_fetch_items.py`.

`x_render.py` turns the shortlist into the newsletter's HTML. Official
Announcements prints `text`; Viral on X prints `newsletter_title` when a
long post has one, otherwise the opening words. Its markup mirrors the
generate-newsletter-content template, the Substack export script
(`generate-newsletter-content/scripts/substack_export.py`) and the Beehiiv
patterns: change them together.
