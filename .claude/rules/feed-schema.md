---
paths:
  - "packages/feed-schema/**"
  - "content/**"
  - "tests/test_feed_schema.py"
  - "tests/test_hide.py"
  - "tests/test_gist_*.py"
---

# The content contract

`content/` is what the app and the extension read. The weekly newsletter does
not - it curates from raw `newsletter/data/` and always will. `packages/feed-schema` is its contract: the schemas,
`feed.d.ts` for the JS consumers, `validate.py`, `hide.py`, and `gist_contract.py`
for gists (AIB-145y).

## Append-only

A shipped Chrome extension cannot be hotfixed. **Add fields, never rename or
remove them.** Anything breaking bumps `schema_version`, and a consumer that
meets a version it does not know must refuse it rather than guess.

Keys are `snake_case` throughout, following the shape in the product spec.
This differs from the fetcher envelopes, which are mixed — the two are separate
contracts and neither should be reshaped to match the other.

## Four files that must agree

Changing one usually means changing another:

- an item's `hidden` flag, the edition's `counts`, and the index's `total`
- an edition file, and its entry in `index.json`
- an item's `tags`, and the names in `tags.json`
- an item's `gist`, the gist file it names, that gist's `appearances`, and
  its entry in `gists/index.json` (keyed by the normalised source URL)

`validate.py` checks all of it, including the cross-file invariants. Run it
before committing anything under `content/`:

```bash
python3 packages/feed-schema/validate.py
```

Gists are never hand-written: the run's gists step writes the file, the index
entry and the item's `gist` together. A gist's slug and index entry never
change once published. Whether a gist is shown is worked out from its items'
`hidden` flags; nothing about hiding is stored in the gist.

Never hand-edit a `hidden` flag — `hide.py` exists so all three files move
together, and it writes nothing unless the whole change validates.

## Editing the schemas

The schema files are the contract of record; `validate.py` is a hand-written
stdlib check of the same rules, plus the invariants JSON Schema cannot express.
**Change both together.** `tests/test_feed_schema.py` compares every enum,
pattern, required-key list, and cap across the two, so a one-sided edit fails
the suite rather than shipping. It also runs the schema files through a real
JSON Schema engine when `jsonschema` happens to be installed — checking they
are well-formed, and that the validator is never *laxer* than the schema.
Stricter is fine and expected; the cross-field invariants are why it exists.
`jsonschema` is **not** a dependency (this repo's Python is stdlib only), so
those tests skip when it is absent.

`feed.d.ts` is the third face of the same contract. Update it in the same pass.

## Two lists that are not free to change

- **`SOURCES`** must equal `registry.names()` in `packages/fetchers`. Adding a
  source means landing it in both, or the app cannot render what the fetcher
  produces. A test asserts this.
- **`tags.json`** is the vocabulary the curate step tags from. Adding a tag is
  cheap and needs no schema change — that is why the list lives in `content/`.
  Cutting or renaming one is expensive: it re-tags history.

The v1.1 categories (`discussions`, `releases`, `research`) are deliberately
absent from the enum. Adding one is a conscious edit to the schema, `counts`,
and every consumer's chip list — not something a producer can introduce alone.
