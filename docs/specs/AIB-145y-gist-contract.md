# Spec: `gist-contract`, the gist files in `content/`

- **Ticket:** AIB-145y, task T4 (checklist 5.1)
- **Parent spec:** `docs/specs/AIB-145y-gists.md`, module `gist-contract`
- **Design:** `docs/decisions/product/AIB-145y-gists-design.md`
- **Status:** approved 12 Nov 2026, with D2, D3 and D4 as written

## Objective

Fix the shape of everything gists add to `content/`, so the generator (T13 to
T15), the app (T19 onwards) and the validator all build against one contract.
`content/` is append-only and read by a Chrome extension that cannot be
hotfixed. Whatever this spec puts in can only be added to later, never renamed
or removed.

What it covers:

1. `content/gists/<slug>.json`: one gist.
2. `content/gists/index.json`: every gist, keyed by its source.
3. Two new optional fields on edition and weekly items: `gist` and
   `front_page`.
4. Slugs, the source key, and how hiding works.
5. The checks `validate.py` adds, one per line.

It does not cover how gists are written (`gist-generate`) or shown
(`ledger-gist-ui`, `app-gist-pages`).

## Decisions in this spec

These go beyond the parent spec's illustrative JSON. Each is open to change
here, before T5 writes any of it in code.

| # | Decision | Why |
|---|---|---|
| D1 | A gist has a **`kind`** (`news`, `hn`, `repo`, `launch`, `x_post`) that is separate from `source`. | `source` must equal the fetcher registry (`.claude/rules/feed-schema.md`), and X posts have no fetcher. `kind` picks the sections a gist may have. |
| D2 | **Official Announcements are X posts.** They come from the same Grok snapshot (`bucket: "announcement"`), so they are `kind: "x_post"` with `preview.bucket: "announcement"`. There is no separate announcement kind. | One preview shape covers both, and the parent spec already treats them alike. |
| D3 | **`links`, not `references`.** An ordered list of the pages the gist drew on, each with a `role`. The closing buttons are the `destination` and `discussion` links, in that order; other links (a README, the open-issues page) are kept for structured data and citations. | The design replaced the References list with buttons (12 Nov). The file keeps every source, because "only what was read" needs a record of what was read. |
| D4 | **Hiding is derived, not stored.** A gist is shown if at least one of its appearances is a visible item. The gist file has no `hidden` field, and `hide.py` does not touch gists. | The edition already holds the `hidden` flag. A second copy is a fourth file that must agree, for no gain. T7 becomes a validator and build rule (see "Changes to the plan"). |
| D5 | **The gist carries `front_page`** as well as the item. | The gist page shows the badge but never loads an edition. |
| D6 | **Stats are typed per kind**, each key named and typed, not an open map. | The UI renders a grid of known cells (C2), and an open map would let a new key through without a contract change. |
| D7 | **The source key is stored in the index, not derived at read time.** | The rules for normalising a URL may improve later. A stored key never changes meaning under an old gist. |

## `content/gists/<slug>.json`

```json
{
  "schema_version": 1,
  "slug": "hn-show-hn-tinyeval",
  "kind": "hn",
  "source": "hackernews",
  "category": "hn",
  "title": "Show HN: TinyEval – an eval harness in a single Python file",
  "url": "https://github.com/mkrause/tinyeval",
  "source_url": "https://news.ycombinator.com/item?id=50443587",
  "tags": ["Evals", "Open Source"],
  "image": { "type": "none" },
  "depth": "full",
  "lede": "TinyEval is a 300-line Python file that runs prompt evaluations against any OpenAI-compatible endpoint, with no dependencies to install.",
  "sections": [
    { "key": "key_points", "points": ["One file you copy into a project; test cases are plain Python dicts.", "…", "…"] },
    { "key": "discussion", "points": [
      { "stance": "agreed", "text": "Most commenters like that it can be read in one sitting.", "url": "https://news.ycombinator.com/item?id=50443901" }
    ] }
  ],
  "stats": { "points": 212, "comments": 87, "submitted_by": "mkrause", "posted_at": "2026-08-26T18:02:00Z" },
  "stats_as_of": "2026-08-27T08:04:10Z",
  "front_page": true,
  "links": [
    { "role": "destination", "title": "mkrause/tinyeval on GitHub", "url": "https://github.com/mkrause/tinyeval" },
    { "role": "discussion", "title": "Show HN: TinyEval", "url": "https://news.ycombinator.com/item?id=50443587" }
  ],
  "appearances": [
    { "item_id": "hn-show-hn-tinyeval-2026-08-27", "edition_date": "2026-08-27" },
    { "item_id": "hn-show-hn-tinyeval-issue-9", "issue_slug": "issue-9" }
  ],
  "created_at": "2026-08-27T08:04:10Z",
  "updated_at": "2026-08-31T05:12:00Z"
}
```

### Fields

| Field | Type | Required | Rule |
|---|---|---|---|
| `schema_version` | `1` | yes | As every content file. |
| `slug` | string | yes | Equals the file name without `.json`. See "Slugs". |
| `kind` | `news` \| `hn` \| `repo` \| `launch` \| `x_post` | yes | D1. |
| `source` | `Source` | no | One of the fetcher sources. Absent for `x_post` and only there. |
| `category` | `Category` | no | As the item. Absent for `x_post` and only there. |
| `title` | string | yes | Non-empty, at most 200 chars. From the first appearance, never rewritten (a shared link keeps its title). |
| `url` | http(s) URL | yes | Where the item points: the article, product, repo, or the post. |
| `source_url` | http(s) URL | yes | The source page, as on the item. The source key is made from this. |
| `tags` | string[] | yes | Zero to four names from `tags.json`, as on items. |
| `image` | `ItemImage` | yes | As on items. Used for the header mark and the share image. |
| `depth` | `full` \| `brief` \| `preview` | yes | Only `full` is indexed. `preview` only with `x_post`, and `x_post` is always `preview`. |
| `lede` | string | yes, except `preview` | One or two sentences, 40 to 320 chars. The page's meta description. |
| `sections` | `Section[]` | yes | Possibly empty. See "Sections". At most one of each key, in the order listed there. |
| `stats` | object | no | Keys fixed per kind; see "Stats". At least one key when present. |
| `stats_as_of` | timestamp | with `stats` | When the stats were read, UTC ISO 8601. Shown as "As of …, IST". |
| `front_page` | `true` | no | D5. `kind: "hn"` only. Never `false`: absent means "not seen there". Once set, never removed. |
| `preview` | `XPreview` | `x_post` only | See "X post previews". |
| `links` | `Link[]` | yes | One to eight. See "Links". |
| `appearances` | `Appearance[]` | yes | At least one. Oldest first; the first is "first covered". |
| `created_at` | timestamp | yes | When the gist was first written. |
| `updated_at` | timestamp | yes | The last change of any kind (a new appearance, refreshed stats). At or after `created_at`. |

No other keys. Keys are `snake_case`.

### Sections

Each section is `{ "key": <key>, … }`. Which keys a kind may carry, in the
order they render:

| Key | Shape | Caps | Kinds |
|---|---|---|---|
| `key_points` | `points: string[]` | 3 to 5 points, each at most 200 chars | all but `x_post`; required for `full` |
| `why_it_matters` | `text: string` | at most 320 chars | `news` |
| `who_its_for` | `text: string` | at most 240 chars | `launch` |
| `pricing` | `text: string` | at most 240 chars | `launch` |
| `try_it` | `command: string` | one line, at most 200 chars, no newline | `repo` |
| `discussion` | `points: { stance, text, url }[]` | 3 to 5; `stance` is `agreed`, `disputed`, `counterpoint` or `theme`; `text` at most 240 chars; `url` an http(s) link to a comment | `hn` |
| `whats_open` | `points: { text, url? }[]` | 2 to 5; `text` at most 240 chars | `repo` |

A section with nothing behind it is left out, never padded ("Only what was
read"). A `brief` gist may have no sections at all.

Word budget: the parent spec's 150 to 300 words is a writing target for the
`write-gists` skill, not a validator rule. The caps above are the hard limits.

### Stats

| Kind | Keys and types |
|---|---|
| `hn` | `points` int, `comments` int, `submitted_by` string, `posted_at` timestamp |
| `repo` | `stars` int, `stars_gained` int, `forks` int, `language` string, `license` string (SPDX id or `"Other"`), `created_on` date, `contributors` int, `open_issues` int, `last_release` `{ tag: string, published_on: date }` |
| `launch` | `upvotes` int, `comments` int |
| `x_post` | `likes` int, `reposts` int, `replies` int, `views` int |
| `news` | none: a news gist has no `stats` |

Every key is optional within its kind. Ints are at least 0. The UI shows ages
("19h", "3 years") worked out from `posted_at` and `created_on` against
`stats_as_of`, so the file never stores a relative time that goes stale.

### Links

`{ "role", "title", "url" }`, at most eight, each `url` unique.

| Role | Meaning | Rule |
|---|---|---|
| `destination` | The thing itself: the article, the product's site, the repo, the linked page of an HN post | At most one |
| `discussion` | The page about it: the HN thread, the Product Hunt launch | At most one |
| `source` | Anything else the gist drew on: a README, the open-issues page, a second article | Any number |

At least one `destination` or `discussion` link. The closing buttons are the
`destination` link (primary) and then the `discussion` link. A GitHub repo or a
TechCrunch story has only a destination; an Ask HN post has only a
discussion. `title` is the page's own title, at most 200 chars. Button labels
("View on Hacker News") are the UI's job, worked out from the role and host.

### X post previews

```json
"preview": {
  "bucket": "announcement",
  "author_name": "Anthropic",
  "author_handle": "@AnthropicAI",
  "posted_on": "2026-11-02",
  "text": "Applications are now open for the Anthropic Residency…",
  "media": "link"
}
```

Copied from the saved Grok snapshot (`x_data.json`), never written by Claude.
`bucket` is `announcement` or `insight`; `text` at most 4,000 chars; `media`
uses the snapshot's own values. `url` is the post, `source_url` equals `url`,
and `links` holds the post as its one `discussion` link. The newsletter's one
line about the post may be the `lede`; for a preview the lede is optional.

### Appearances

`{ "item_id", "edition_date" }` for a daily item, or `{ "item_id",
"issue_slug" }` for a weekly issue item, never both. Each `item_id` appears
once. The run adds an appearance when the source shows up again; nothing ever
removes one.

## `content/gists/index.json`

```json
{
  "schema_version": 1,
  "generated_at": "2026-08-31T05:12:00Z",
  "gists": [
    { "slug": "hn-show-hn-tinyeval", "source_key": "news.ycombinator.com/item?id=50443587", "path": "gists/hn-show-hn-tinyeval.json", "created_at": "2026-08-27T08:04:10Z" }
  ]
}
```

- `gists` is sorted by `slug`, so a new gist is a one-line diff.
- `slug` and `source_key` are each unique across the list.
- `path` is relative to `content/`, as the weekly index does it.
- `generated_at` is the last run that added a gist.

The app never loads this file. The run reads it to answer "does this source
already have a gist?", and the build reads it for the sitemap.

## The source key

Made from the item's `source_url`:

1. Lower-case the scheme and host; drop the scheme and a leading `www.`.
2. Drop the fragment.
3. Drop tracking parameters: every `utm_*`, `ref`, `ref_src`, `fbclid`,
   `gclid`, `mc_cid`, `mc_eid`. Keep every other parameter in its original
   order, because some carry identity: HN's `?id=`.
4. Drop one trailing `/` from the path, unless the path is `/`.

`https://www.GitHub.com/owner/Repo/?utm_source=x#readme` →
`github.com/owner/Repo`. The path keeps its case, since GitHub and many sites
treat it as significant.

The function lives in the contract package (`packages/feed-schema`), so the
generator and the validator share one copy, and it has its own tests.

## Slugs

- A slug is the item id without its `-YYYY-MM-DD` or `-issue-N` ending:
  `hn-show-hn-tinyeval-2026-08-27` → `hn-show-hn-tinyeval`.
- An X post's slug is `x-` plus the handle in lower case without the `@`,
  plus the first five words of the text slugified: `x-anthropicai-applications-are-now-open-for`.
- Pattern `^[a-z0-9]+(?:-[a-z0-9]+)*$` (the repo's `SLUG_RE`), at most 80
  chars, trimmed at a hyphen.
- When the slug is taken by a different source key, add `-2`, `-3` and so on.
- **A slug never changes once it is in the index.** A retitled source keeps
  its slug. The validator cannot see history, so `gist-generate` enforces
  this by never rewriting an index entry. A test covers it.

## New fields on items

On `EditionItem`, used by editions and weekly issues alike. Both are optional,
so every existing file stays valid.

| Field | Type | Meaning |
|---|---|---|
| `gist` | slug string | This item's gist. Absent before launch and when gist writing failed for it; the card then opens the source, as today. |
| `front_page` | `true` | The HN fetcher saw the story on the front page. Hacker News items only. Absent otherwise; never `false`. |

## Hiding

D4 in practice:

- A gist is **shown** when any of its appearances is an item whose `hidden` is
  `false`. Otherwise it is **withdrawn**: no page, no sitemap entry, and its
  cards are hidden anyway.
- `hide.py` is unchanged. Unhiding an item brings its gist back on the next
  build.
- The validator, the build and the app share one function for this,
  `gist_is_shown(gist, items_by_id)`, tested in Python and mirrored in
  JavaScript with the same fixtures.

## What `validate.py` checks

Per gist file:

1. It is valid JSON, and its fields follow the tables above: types, enums,
   caps, http(s) URLs only, no unknown keys.
2. `slug` matches the file name.
3. `kind` agrees with `source`, `category`, `depth` and `preview` as listed.
4. Every section key is allowed for the kind, appears at most once and in
   order, and is within its caps.
5. `stats` keys are the kind's own; `stats_as_of` is present exactly when
   `stats` is.
6. `front_page` is `true`, on an `hn` gist.
7. `links`: at most one `destination` and one `discussion`, at least one of
   the two, unique URLs.
8. `appearances`: at least one, unique `item_id`s, each with exactly one of
   `edition_date` and `issue_slug`, oldest first.
9. `updated_at` is at or after `created_at`.
10. Every tag is in `tags.json`.

Across files:

11. `gists/index.json` is valid, sorted by slug, with unique slugs and
    source keys.
12. Every index entry has its file, and every file has its index entry.
13. Every index entry's `source_key` equals the key computed from its gist's
    `source_url`.
14. Every item's `gist` names a gist in the index.
15. Every appearance names an item that exists, in that edition or issue,
    whose `gist` names this gist. And every item with a `gist` is one of that
    gist's appearances.
16. `front_page` on a gist is set when any of its appearances has it.
17. An item's `front_page` is on a `hackernews` item.

A content tree with no `gists/` directory is valid. That is today's tree, and
it is what launch day starts from.

## `feed.d.ts`

New types `GistKind`, `GistDepth`, `Gist`, `GistSection` (one interface per
key, joined as a union on `key`), `GistStats` per kind, `GistLink`,
`GistAppearance`, `XPreview`, `GistIndex`, `GistIndexEntry`; and `gist?:
string` and `front_page?: true` on `EditionItem`. Its comments repeat the caps
the way it does for `summary` today. The caps themselves are defined once, in
`validate.py`, and both the schema test and the generator import them from
there.

## Changes to the plan

- **T7** changes from "`hide.py` moves the gist" to "**hidden items withdraw
  their gist**": `gist_is_shown` in Python and JS, the validator's use of
  it, and tests. `hide.py` is not edited. The ticket item is renamed to match.
- **T5** also adds the source-key function and its tests.

## Testing

- `tests/test_feed_schema.py`: schema and validator agree on every enum,
  pattern, required key and cap for the two new schemas, as it does today.
- Fixtures: one valid gist per kind and depth; one broken fixture for each
  rule 1 to 17, each rejected with a message naming the rule.
- Source key: the examples in this spec, tracking parameters, HN `?id=` kept,
  a trailing slash, `www.`, path case kept.
- Slugs: date and issue endings removed, the 80-char trim, a clash gets `-2`.
- `validate.py` still passes on today's `content/`.

## Boundaries

- **Always:** change the schema, `validate.py` and `feed.d.ts` in one commit;
  add fields, never rename or remove.
- **Ask first:** a new `kind`, a new section key, or loosening a cap after
  launch.
- **Never:** store a relative time; let Claude write an X preview's text;
  rewrite a slug or an index entry.

## Open questions

None. D2, D3 and D4 were agreed on 12 Nov 2026.

**Note for consumers:** links in the files are stored clean. The
`ref=aiBytes_` parameter added on 12 Nov 2026 (plan task T38) is appended
when a link is rendered, never written into `content/`, and the source key
already drops `ref`.
