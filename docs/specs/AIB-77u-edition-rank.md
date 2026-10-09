# Spec: edition-rank (AIB-77u, module 1 of 3)

Status: **reviewed 2026-10-09; open questions resolved.** Map: `docs/specs/AIB-77u-capability-map.md`.
Ticket: `.longclaw/tickets/AIB-77u/ticket.md`.

## Objective

Give every published edition item a `rank`: its place in the day's single
reading order across all four sources. The app's Ranked mode (module
`app-feed-order`) sorts by it, so a reader sees the strongest items first rather
than every Product Hunt launch before the first repo.

- **Who reads it:** `apps/web` now. The Chrome extension (AIB-76n) later, and
  that extension cannot be hotfixed once shipped. The newsletter does not read
  `content/`.
- **Who writes it:** `packages/curate`, mechanically, at `build`. No LLM call,
  no change to the curate-edition skill, nothing for Claude to write.
- **Out of scope:** the TOP-today marker; any UI; changing which items make the
  edition or their file order. **Backfilling** editions published before this
  merges is its own ticket, **AIB-79t**.

Decided on 2026-10-09: rank is a deterministic score in curate. The backfill
route moved to AIB-79t. Ties at equal standing break **GitHub, Hacker News,
TechCrunch, Product Hunt**.

## The field

| | |
|---|---|
| Key | `rank` on each item (snake_case, like every key in `content/`) |
| Type | integer, minimum 1; `1` is first |
| Required | **No** in the schema, so files written before this change stay valid. But **all or none**: if any item in an edition has `rank`, every item does |
| Scope | Ranks are exactly `1..N` over **all** items in the edition, **hidden ones included**, with no gaps or repeats |
| Schema version | Stays `1`. The field is additive (`.claude/rules/feed-schema.md`) |
| Key order | Written last, after `hidden`, so existing diffs stay small |

**Why hidden items keep their rank:** `hide.py` flips `hidden` and must not
have to renumber the edition. A reader never sees a hidden item, so the gap it
leaves in the visible order is invisible. Un-hiding puts the item back exactly
where it was.

Consumers sort ascending by `rank` and must not assume the visible ranks are
contiguous.

## The score

The input is the kept drafts after `relevance.apply`. Each carries
`draft.source` and `draft.rank`, the fetcher's own 0-based position for that
item (PH by votes, HN by points, GitHub by stars gained, TechCrunch by its
fetch ranking).

1. **Standing within the source.** Group the items by `source`; sort each group
   by `draft.rank`, then `id`. An item at position `p` in a group of `n` has
   standing `p / n`. The best item of every source has standing `0`. The group
   is the source, not the category, so a Show HN (category `launches`) and an HN
   thread are ranked against each other by points.
2. **Interleave.** Sort all items by `(standing, TIE_ORDER.index(source), id)`,
   where `TIE_ORDER = ("github", "hackernews", "techcrunch", "producthunt")` is
   defined in `rank.py`. It is deliberately **not** `adapters.ORDER`, which
   fixes the file's reading order (Product Hunt first inside `launches`, pinned
   by `test_show_hn_sorts_after_product_hunt_inside_launches`). Changing that
   would reorder the published files. A test asserts that `TIE_ORDER` is a
   permutation of `registry.names()`, so a new source cannot be forgotten.
3. **Number.** `rank` is the 1-based position in that order.

TechCrunch items have no `signals`, and the score needs none: they fall back on
the fetcher's own order, which is why the score uses `draft.rank` rather than
re-reading signals.

Worked example, 2026-10-09 (PH 5, GitHub 3, TC 10, HN 10):

| rank | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| item | GH 1st | HN 1st | TC 1st | PH 1st | HN 2nd | TC 2nd | HN 3rd | TC 3rd | PH 2nd | HN 4th | TC 4th | GH 2nd |
| standing | 0 | 0 | 0 | 0 | .1 | .1 | .2 | .2 | .2 | .3 | .3 | .33 |

(Computed, not hand-worked; `RankTests` pins this table.)

A source with few items does not get buried. Each source's leader is in the
top four, and its later items spread out in proportion.

Known limit: the score ignores absolute strength. A day's top Product Hunt
launch with 120 votes still ties a top HN thread with 900 points. Tuning that
is a later change to `rank.py` alone, with no contract change.

## Where it lands

```
packages/curate/aibytes_curate/rank.py      NEW  assign(drafts) -> {id: rank}
packages/curate/aibytes_curate/cli.py       build: set item["rank"] after merge
packages/curate/README.md                   document rank
packages/feed-schema/edition.schema.json    item.properties.rank
packages/feed-schema/validate.py            accept rank; the all-or-none and 1..N invariant
packages/feed-schema/feed.d.ts              rank?: number, with its doc comment
packages/feed-schema/README.md              rank in the item example
docs/aibytes-app-product-spec.md            rank in the §3 item example, dated note
tests/test_curate_edition.py                RankTests and build tests
tests/test_feed_schema.py                   rank acceptance, rejection, and parity
```

`index.json` does not change: it carries no per-item data. No file under
`content/` changes in this module. Published editions stay rank-less (and valid)
until AIB-79t backfills them.

## Backfill

Out of this module; tracked in **AIB-79t**. That ticket picks between a
`curate.py rank --date` subcommand, which writes only `rank`, and re-running
`build` with each day's saved `summaries.json`, which rewrites `generated_at`.
This module only has to keep both routes possible, and it does: `rank.assign`
takes drafts, which either route can re-derive from the saved snapshots.

## Commands

```bash
# Tests (offline)
AIBYTES_SKIP_LIVE=1 python3 -m unittest tests.test_curate_edition tests.test_feed_schema -v
AIBYTES_SKIP_LIVE=1 python3 -m unittest discover -s tests -v      # full suite before commit

# The contract
python3 packages/feed-schema/validate.py

# A full build still works and now writes rank
python3 packages/curate/curate.py build --date 2026-10-09 \
  --summaries newsletter/data/2026/10/days/2026-10-09/summaries.json \
  --content-root "$TMP/content"        # into a copy, never over the live tree
```

## Code style

Python, stdlib only, module docstrings that say *why*, and limits imported from
the contract. In the idiom of `relevance.py`:

```python
"""Each item's place in the day's one reading order, across every source.

Mechanical on purpose, like the rest of curate: the fetchers have already ranked
each source by its own signal, so this only decides how the four lists
interleave. An item's standing is how far down its own source it sits; the best
item of every source stands at 0.
"""

# Who wins a tie at equal standing. Not adapters.ORDER: that one is the file's
# reading order, and changing it would reorder every published edition.
TIE_ORDER = ("github", "hackernews", "techcrunch", "producthunt")


def assign(drafts):
    """{item id: rank}, 1-based, over every draft - hidden ones included."""
    by_source = {}
    for draft in drafts:
        by_source.setdefault(draft.source, []).append(draft)
    standing = {}
    for group in by_source.values():
        group.sort(key=lambda d: (d.rank, d.item["id"]))
        for position, draft in enumerate(group):
            standing[draft.item["id"]] = position / len(group)
    order = sorted(drafts, key=lambda d: (
        standing[d.item["id"]], TIE_ORDER.index(d.source), d.item["id"]))
    return {d.item["id"]: n for n, d in enumerate(order, start=1)}
```

Validator messages follow the existing form, e.g. `rank 0 must be an integer
of at least 1` and `ranks must be 1..28 with no repeats; missing 7, repeated 3`.

## Testing strategy

stdlib `unittest`, offline, using the fixtures already in
`tests/test_curate_edition.py` (`drafts_from`, `ph_post`, `gh_repo`,
`tc_article`, `hn_story`).

**`RankTests`** (unit, `rank.assign`):
- Each source's leader takes ranks 1-4 in `TIE_ORDER` (GH, HN, TC, PH) when all four sources are present.
- `TIE_ORDER` is a permutation of `registry.names()`.
- `adapters.ORDER`, and so the file's item order, is unchanged.
- The worked example above reproduces exactly.
- A single-source edition ranks in the fetcher's order.
- A Show HN and HN threads are ranked as one HN group.
- TechCrunch items with no signals follow fetch order.
- The output is identical across two runs, and independent of input order.
- Every rank is `1..N`, with no repeats.

**Build** (integration, temp content root):
- `build` writes `rank` on every item, hidden ones included, as each item's last key.
- A re-run over the same inputs is byte-identical (apart from `generated_at`, as today).

**Contract** (`tests/test_feed_schema.py`):
- An edition with no ranks validates.
- Full ranks `1..N` validate.
- Failures: a partial set; a repeat; a gap; `0`; a negative; a float; `true`; a string.
- Hiding an item with `hide.py` leaves the edition valid.
- **Parity:** the schema declares `rank` as an integer with minimum 1, and is
  not in `required`; the validator's optional item keys include `rank`. Extend
  the existing `test_*_agree` pattern so a one-sided edit fails.

The full suite and `validate.py` pass before every commit.

## Boundaries

- **Always:**
  - Change `edition.schema.json`, `validate.py`, and `feed.d.ts` in one commit.
  - Import the contract's limits and `registry.names()`; never restate them. `TIE_ORDER` is the one source list `rank.py` owns.
  - Run `validate.py` and the full suite before committing.
- **Ask first:**
  - Any change to the score's weighting.
  - Making `rank` required, or bumping `schema_version`.
  - Touching `index.json`.
- **Never:**
  - Rename or remove an existing field.
  - Hand-edit an edition file.
  - Call an LLM or the network from `rank.py`.
  - Edit any published edition in this module; that is AIB-79t.
  - Let `hide.py` renumber ranks.
  - `git add -A`.

## Rollout and risks

- **Editions published before merge** carry no `rank`. That is valid by the
  contract, and the app falls back to signals; AIB-79t backfills them.
- **The runner and this branch.** This checkout is on `aib-77u-home-side-nav`.
  If the launchd agent runs from this working tree, it refuses to push from a
  non-main branch (`packages/runner/aibytes_runner/cli.py:332`) and the day's
  edition fails. Before 13:30 IST, either switch the tree back to `main` or do
  this work in a separate worktree. I could not confirm which path the
  installed agent uses.
- **The app before `app-feed-order`.** Nothing reads `rank` yet, so this module
  changes nothing on screen. That is intended, and makes it safe to ship first.

## Success criteria

1. `build` writes `rank` `1..N` on every item of a new edition, hidden included,
   computed exactly as **The score** describes.
2. `validate.py` accepts editions with full ranks or none, and rejects partial,
   duplicate, gapped, or non-integer ranks. Schema/validator parity is enforced
   by a test.
3. `feed.d.ts` and both READMEs document `rank`. The product spec's item
   example shows it.
4. No file under `content/` changes, and `validate.py` still passes on the
   published tree.
5. `AIBYTES_SKIP_LIVE=1 python3 -m unittest discover -s tests -v` passes.
6. Ties at equal standing break GitHub, Hacker News, TechCrunch, Product Hunt,
   and the file's reading order is unchanged.

## Open questions

None open. Resolved 2026-10-09: the backfill route moved to AIB-79t; ties break
GitHub, Hacker News, TechCrunch, Product Hunt via `TIE_ORDER` in `rank.py`.
