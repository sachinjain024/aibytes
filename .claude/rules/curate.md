---
paths:
  - "packages/curate/**"
  - ".claude/skills/curate-edition/**"
  - "tests/test_curate_edition.py"
---

# The curate step

`packages/curate` turns one day's raw snapshots into one published edition. It
is the only writer of `content/editions/`, which makes it the place a bad
edition would come from.

## The split with Claude

The script does what is mechanical and checkable. **Claude writes the summaries
and picks the tags** - the daily job runs the `curate-edition` skill, which runs
`draft`, writes the copy, then runs `build`. The script never calls an LLM, and
`summaries.py` is the whole of the boundary between the two.

Voice and tagging rules live in `.claude/skills/curate-edition/SKILL.md`, not in
Python. A prompt in a string literal is a prompt nobody edits.

Severity is split deliberately: a contract violation is fatal, a matter of taste
is a warning. A missing item, a summary over the 200 cap, a tag that is not in
`tags.json` - nothing is written. A hype word or an em dash - printed to stderr,
published anyway. A script should not be the judge of a sentence.

## Two contracts meet here

Curate reads the fetchers' envelopes and writes `packages/feed-schema`'s
contract, so it is where the two can drift apart:

- Snapshot paths are derived from each source module's `SUBPATH` and `FILENAME`,
  never restated. Curate reads exactly where fetch writes.
- Every source in `registry.names()` must have an adapter in `adapters.ADAPTERS`.
  Adding a fetcher without one means its items silently never reach an edition.
  A test asserts it.
- Every limit comes from the contract: `SUMMARY_MAX`, `MAX_TAGS`, `CATEGORIES`,
  `SIGNAL_KEYS`, `META_KEYS`. Import them, do not restate them.

## The filter is per source, on purpose

Each source is filtered by its own fetcher's predicate, imported rather than
reimplemented. Two are deliberately different:

- **TechCrunch** is fetched from TechCrunch's own `artificial-intelligence`
  category, so it is not keyword-filtered on top. Doing so drops real AI stories
  whose headline does not use our vocabulary.
- **Product Hunt** is fetched with `featured: true` and no topic filter, so it
  is the one source where the filter does real work.

Every drop is logged to `rejected.json` with a reason. That file sits beside the
raw snapshots, not in `content/`, because it is about the inputs.

## Nothing is written until everything validates

The edition and the index are assembled and checked in memory, then written
together, then the whole tree is re-validated as a backstop - the same
discipline `hide.py` uses. A rejected run must leave the published tree exactly
as it was.

**A hide survives a re-curate.** `hidden.json` is applied to the newly built
items. If a logged hide names an item the new run no longer produces, `build`
refuses: publishing would leave `hidden.json` describing an item that is not
there.
