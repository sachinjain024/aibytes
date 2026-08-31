# feed-schema

The contract between the producer and the consumers of aiBytes_ content.

**Producer:** the curate step, run daily. **Consumers:** the web app, the
Chrome extension, and the weekly newsletter skill. A shipped extension cannot
be hotfixed, so the contract is append-only — add fields, never rename or
remove them, and bump `schema_version` for anything breaking.

The published files live in [`content/`](../../content); this package is their
schema, types, validator, and admin script.

| File | What it is |
|---|---|
| `edition.schema.json` | One day: `content/editions/YYYY-MM-DD.json` |
| `index.schema.json` | `content/index.json` — the editions that exist, newest first |
| `tags.schema.json` | `content/tags.json` — the fixed tag vocabulary |
| `hidden.schema.json` | `content/hidden.json` — the admin hide log |
| `feed.d.ts` | The same shapes as TypeScript, for the app and extension |
| `validate.py` | Stdlib validator, and the CLI that checks a whole tree |
| `hide.py` | Hides one item and reconciles the tree |

## Validate

The schemas are the contract of record; `validate.py` is a hand-written
stdlib check of what they declare, plus the cross-file invariants JSON Schema
cannot express — counts that have drifted from their items, an index that has
fallen behind the editions on disk, a tag nobody put in `tags.json`.
`tests/test_feed_schema.py` asserts the two agree on every enum, pattern, and
required key, so they cannot drift apart silently.

```bash
python3 packages/feed-schema/validate.py
python3 packages/feed-schema/validate.py --content-root /tmp/content
```

## Hide an item

The site skips items flagged `hidden`. Flipping that flag by hand leaves the
edition's `counts` and the index's `total` lying about themselves, so use the
script — it moves all three together and writes nothing unless the whole
change validates.

```bash
python3 packages/feed-schema/hide.py ph-chatcut-2026-08-27 --reason "duplicate launch"
python3 packages/feed-schema/hide.py ph-chatcut-2026-08-27 --unhide
```

Then commit and push; the site redeploys.

## Shapes at a glance

An edition carries `date`, `generated_at`, `counts` (visible items per
category, hidden excluded), and `items`. Each item:

```json
{
  "id": "ph-chatcut-2026-08-27",
  "title": "ChatCut",
  "summary": "AI video editor inside ChatGPT with a real timeline and XML export.",
  "url": "https://chatcut.ai",
  "source": "producthunt",
  "source_url": "https://www.producthunt.com/products/chatcut",
  "category": "launches",
  "tags": ["Video", "Dev Tool", "Launch"],
  "image": { "type": "logo", "url": "https://ph-files.imgix.net/..." },
  "signals": { "upvotes": 776, "comments": 42 },
  "published_at": "2026-08-26T15:02:00Z",
  "hidden": false
}
```

Ids end with their edition's date, which makes them globally unique and is what
lets a save (`item_id` + `edition_date`) resolve back to an item.
