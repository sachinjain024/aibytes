# Spec: `newsletter-gist-links`, the issue links to gists

- **Ticket:** AIB-145y, task T33 (builds in T34, T35, T36; publisher step P6)
- **Parent spec:** `docs/specs/AIB-145y-gists.md`, module `newsletter-gist-links`
- **Builds on:** `AIB-145y-gist-contract.md` (the gist file, `preview`, `issue_slug`
  appearances), `AIB-145y-gist-generate.md` (the `--issue` entry point),
  `AIB-145y-gist-analytics.md` (newsletter UTM tags), `AIB-145y-app-gist-pages.md`
  (the page a link opens), the design record (F2)
- **Status:** draft, awaiting approval. The choices marked **Decide** below are
  recommended; they are not settled until this spec is approved.

## Objective

From the first issue after this module ships, every item in the weekly
newsletter has a gist, and the item's title in the email links to that gist.
A small source link stays beside it, so a reader who wants the original is
not forced through aibytes.io (F2). The same HTML is what
`build_weekly_issues.py` reads, so `/weekly/issue-N` still builds, its cards
keep a real source URL, and they gain `gist` so the panel opens.

This spec covers T34 (the weekly pull), T35 (the template, the skill, and the
X renderer), T36 (the weekly builder) and P6 (the publisher approves the
first issue that links this way). It does not change the daily run.

## What exists today

Checked in the repo on 16 Nov 2026:

- Daily editions already write gists. A Product Hunt launch, GitHub repo,
  TechCrunch story or HN thread that ran in the week almost always has a
  gist before the issue is written. The weekly pull is for the rest: X
  posts, Official Announcements, and any issue row whose source never
  appeared in a daily edition.
- The issue HTML is the source of truth. The Substack export and
  `content/weekly/issues/issue-N.json` are derived from it. Every edit goes
  through the issue HTML (generate-newsletter-content, step 6).
- Where each row's links point is a table in the skill. Titles go to the
  article, the product site, the repo or the HN article. `(Source)` on AI
  News is a **label**, not a link. GitHub has no trailing link. HN Deep
  titles in the **Substack** export are plain text; only `(HN thread)` is a
  link (Issue 17). Viral on X in Substack links only the handle, to the
  post. Official Announcements already have `Post on X ↗` and an optional
  domain.
- "Link URLs stay clean": the skill strips `ref` and `utm_*` from every
  href. That rule stays for source links. Gist links to aibytes.io are the
  exception, because the analytics spec needs the three UTM tags.
- `x_items.py render` writes the Official Announcements card and the Viral
  on X rows. The skill pastes that output; it does not retype the posts.
  T35 changes the renderer, or those two sections keep pointing at X.
- `build_weekly_issues.py` takes the first `<b><a href>` in a row as
  `item.url`. If that href becomes a gist, a builder that is not updated
  would store `aibytes.io/gists/...` as the source. T36 is what stops that.
- It skips the intro, Official Announcements and Viral on X. Those posts
  have no issue item, so they cannot be starred: a save is an `item_id`
  plus the file it came from (`saves.js`, AIB-75v). A gist page stars
  `appearances[0].item_id` (`GistPage.jsx`).
- Weekly items use the edition item contract. `source` is one of
  `producthunt`, `hackernews`, `techcrunch`, `github`. There is no `x`.
- Issues 1–18 stay as they are. No backfill (parent spec).

## The weekly pull (T34)

`gists draft --issue issue-N` and `gists build --issue issue-N` are the
entry point `gist-generate` already promised. This spec fixes the input,
the ids, and what happens when a gist fails.

### When it runs

Inside generate-newsletter-content, **after the skill has chosen the rows
and before it writes the issue HTML.** The daily run is not involved.

```
skill curates the week's rows (as it does today)
  → writes .cache/gists/issue-N/items.json
python3 packages/gists/gists.py draft --issue issue-N
claude -p                          # write-gists, new full/brief only
python3 packages/gists/gists.py build --issue issue-N
skill writes the issue HTML        # titles are gist URLs
substack_export.py
build_weekly_issues.py
validate.py
```

`items.json` is git-ignored (it lives under `.cache/`). It is the curated
list, not the whole snapshot: only rows that will appear in the issue,
including Official Announcements and Viral on X when those sections are
in. The skill is still the curator; the script does not pick items.

### `items.json`

One object per row, enough for `draft` to classify and for `build` to
write an appearance:

```json
{
  "issue_slug": "issue-19",
  "items": [
    {
      "id": "hn-life-on-claude-nine-issue-19",
      "title": "Life on Claude Nine",
      "url": "https://babuschk.in/posts/2026-01-25-life-on-claude-nine.html",
      "source_url": "https://news.ycombinator.com/item?id=50443587",
      "source": "hackernews",
      "category": "hn",
      "summary": "…",
      "signals": { "points": 412, "comments": 198 }
    },
    {
      "id": "x-anthropicai-applications-are-now-open-for-issue-19",
      "kind": "x_post",
      "url": "https://x.com/AnthropicAI/status/…",
      "source_url": "https://x.com/AnthropicAI/status/…",
      "post": { }
    }
  ]
}
```

`id` uses the same function `build_weekly_issues.py` uses today
(`{prefix}-{slugify(title)}-issue-{N}`, clashes get `-2` before the
suffix), moved to a shared helper so T34 and T36 cannot drift. An X
post's id is the contract's X slug plus `-issue-N`:
`x-anthropicai-applications-are-now-open-for-issue-19`.

`post` is the snapshot object from `x_data.json` (the fields `build`
already copies into a preview). The script does not re-read the snapshot
file to find the post.

### What `draft` and `build` do

Look up each item by `source_key(source_url)` in `content/gists/index.json`.

| Already in the index | New, `kind` not `x_post` | New, `x_post` |
|---|---|---|
| Repeat. Not fetched, not shown to Claude. `build` appends `{ item_id, issue_slug }`, refreshes stats from the item when the kind has them, sets the row's gist slug in the report. | Same path as the daily run: fetch, `full` or `brief`, Claude writes, `build` validates. Appearance is `{ item_id, issue_slug }`. | `draft` records `kind: "x_post"`, `depth: "preview"`. Claude is not called for it. `build` copies the preview from `post`, as the contract requires. |

The write-gists skill already skips `preview`. The weekly Claude call is
only the new full/brief rows. A week whose every news/repo/launch/HN row
already has a gist writes **no** Claude file for those, and `build` still
runs to add appearances and to write the X previews.

`--date` stays daily-only. `--issue issue-N` is the weekly flag. Both
share `draft.py` / `build.py`. Cache folder: `.cache/gists/issue-N/`.

### Failure

Same rule as the daily run, applied to the issue: a gist that fails is
dropped; the rest are written; a failed step as a whole writes nothing
under `content/gists/`. The issue HTML is still written. A row whose gist
is missing keeps **today's** source link as its title href, so the email
never points at a 404. Slack is not part of the weekly skill; the skill
prints the `gists build` summary (new / updated / failed) and stops only
if the script exits non-zero for a reason other than per-gist failures
(a missing `items.json`, a broken index). Per-gist failures are warnings,
exit 0, as the daily step is.

## The links (T35)

F2: the title is the gist, a small source link stays beside it. UTM tags
come from the analytics spec, restated here so T35 has one table.

### The gist URL

```
https://aibytes.io/gists/<slug>?utm_source=newsletter&utm_medium=email&utm_campaign=issue-<N>
```

One helper, `gist_newsletter_url(slug, issue_number)`, used by the skill
tests, `x_render.py`, and any fixture. Values are lower case, no spaces.
Source links stay canonical: no `utm_*`, no `ref`. The skill's "Link URLs
stay clean" line becomes: source links stay clean; gist links carry the
three tags above and nothing else.

`ref=aiBytes_` is for outbound links from aibytes.io (T38). It is not
added in the email.

### Issue HTML (two link colours)

The v3 template already has cobalt on the name and grey `.src` on the
trailing attribution. F2 uses both.

| Section | Title / name (cobalt) | Trailing `.src` (grey) |
|---|---|---|
| AI News | gist | `(Source)` → the article. Today this is a label; it becomes a link. |
| New AI Products | gist | `(ProductHunt)` → the launch page, as today. The product site is the gist's destination button. |
| Trending GitHub | gist | `(GitHub)` → the repo. New; today the name *is* the repo. |
| HN Deep Stories | gist | `(HackerNews)` → the thread, as today. The article is the gist's destination button. |
| Viral on X | `@handle` → the profile, as today. Opening words → gist. | `(X)` → the post. Today the words *are* the post link. |
| Official Announcements | Footer gains `Gist ↗` first, cobalt, to the preview gist. | `Post on X ↗` and the domain `↗` stay. The post body stays verbatim and unlinked. |

The intro's one inline link stays a source link. F2 is the item rows, not
the publisher's voice.

A row whose gist failed to write uses the **current** title href (article,
product site, repo, HN article, post) and no trailing gist. The source
link table above still applies where it already exists today.

### Substack (one link colour)

Every link is accent orange. There is no grey. The export script keeps
taking hrefs from the issue HTML, so the destinations match. The layout
rules in `substack-layout.md` change in the same commit as the renderer:

| Section | What is linked |
|---|---|
| AI News | Headline → gist. `(Source)` → the article. Context stays body text. |
| New AI Products | Name → gist. `(Product Hunt)` → the launch. |
| Trending GitHub | `owner/repo` → gist. `(GitHub)` → the repo. |
| HN Deep Stories | **Title → gist** (linked, still not bold: Issue 17's unbolded title stays; the "not linked" rule does not). `(HN thread)` → the thread. |
| Viral on X | `@handle` → gist. Words stay plain body text (Issue 16). Trailing `Post on X` → the post. |
| Official Announcements | `Gist ↗` → the preview. `Post on X ↗` and the domain stay. |

Two orange links per row is the cost of F2 under Substack's one colour.
Leaving the title unlinked would hide the gist; making only the gist a
link would hide the source. F2 wants both. **(Decide 1)**

`x_items.py verify` still checks that every shortlisted post's **words**
are present and in order. It does not require the handle's href to be
the post; T35 updates the verifier to accept the gist href on the handle
(Substack) / on the opening words (issue HTML) and a trailing post link.

### Taste

The Substack layout is a taste decision (AIB-134j). Changing which text
is a link is a layout change, so it goes through the usual path: edit
`substack-layout.md` and `substack_export.py` together, with a short note
in `newsletter/artifacts/` dated the day T35 lands, pointing at this spec
rather than a new numbered-options round. The destinations are a product
decision (F2); the artifact only records that the one-colour mapping was
applied.

## The weekly builder (T36)

`build_weekly_issues.py` already walks each row's `<b><a href>`. After
T35 that href is a gist. The builder:

1. Parses the title href. If it is `https://aibytes.io/gists/<slug>`
   (query string ignored, `www.` ignored, trailing slash ignored), that
   slug is `item.gist`.
2. Loads `content/gists/<slug>.json`. `item.url` is the gist's
   `destination` link if it has one, else its `url`. `item.source_url`
   is the `discussion` link if it has one, else `source_url`.
3. If the gist file is missing, the row is skipped with a stderr warning
   and the rest of the issue still builds; `validate.py` then fails the
   run if a `gist` field points at nothing, so the skill does not commit
   a broken tree.
4. If the title href is **not** a gist (Issues 1–18, and any row whose
   weekly gist failed), behaviour is unchanged: `item.url` is that href,
   `source_url` from the trailing HN/PH link as today, no `gist` field.

HN Deep in the issue HTML has a gist title and a trailing thread link.
The builder prefers the gist file over guessing from remaining hrefs, so
`url` is the article and `source_url` is the thread, matching daily
items.

A fixture issue whose titles are gist links must build the same `url`,
`source_url`, `source` and `category` as the same issue written with
today's source titles, plus `gist`. Issues 1–18 rebuild with no diff.

### X posts and announcements in the issue file **(Decide 2)**

The parent module says X posts and announcements become starrable. A
save needs an item in an edition or issue file. Recommended: T36 **adds**
those rows to `content/weekly/issues/issue-N.json`.

That needs a contract addition, because today's item requires `source`
in the four fetchers and `category` in the four chips:

| Field | Value |
|---|---|
| `id` | the X id from T34 |
| `title` | `@handle` plus the first five words, or the company name for an announcement |
| `summary` | the preview text, cut at `SUMMARY_MAX` |
| `url` / `source_url` | the post |
| `source` | `x` |
| `category` | `x` |
| `gist` | the preview slug |
| `hidden` | `false` |
| `tags` | `[]` |
| `image` | `{ "type": "none" }` |

`counts` on the issue file gains `x` (append-only). The weekly page's
chip list stays the four it has: launches, repos, news, hn. Items with
`category: "x"` are omitted from those lists and have no chip. They exist
so a gist page can star them and so `validate.py` can check the
appearance's `item_id`.

`source: "x"` is **weekly-only**. Edition items still refuse it.
`packages/fetchers` does not gain an `x` source. The test that
`SOURCES == registry.names()` stays about the fetchers; the item `source`
enum in the schema becomes that list plus `x`.

If Decide 2 is rejected, T36 does not add these rows, preview gists get
an `issue_slug` appearance with no matching item, `validate.py`'s
cross-file rule  (appearance names an item that points back) has to
carve out `x_post`, and starring an X gist is out of this module.

## Commands

```bash
python3 packages/gists/gists.py draft --issue issue-19
python3 packages/gists/gists.py build --issue issue-19
python3 .claude/skills/generate-newsletter-content/scripts/substack_export.py \
  --issue newsletter/issues/2026/week-47-Issue-19/aiBytes-issue-19.html
python3 packages/feed-schema/build_weekly_issues.py
python3 packages/feed-schema/validate.py
python3 -m unittest tests.test_gists tests.test_build_weekly_issues tests.test_substack_export tests.test_x_fetch_items -v
```

Existing commands that must stay green: the plan's verification
checkpoint.

## Project structure

```
packages/gists/aibytes_gists/cli.py          --issue on draft and build
packages/gists/aibytes_gists/draft.py        weekly items.json, x_post preview
packages/gists/aibytes_gists/build.py        issue_slug appearances; preview copy
packages/feed-schema/build_weekly_issues.py  gist href → url, source_url, gist
packages/feed-schema/item_id.py              shared id helper (new, from the builder)
packages/feed-schema/edition.schema.json     source/category `x`; issue counts.x
packages/feed-schema/feed.d.ts               the same
packages/fetchers/aibytes_fetchers/x_render.py
.claude/skills/generate-newsletter-content/SKILL.md
.claude/skills/generate-newsletter-content/assets/template.html
.claude/skills/generate-newsletter-content/references/substack-layout.md
.claude/skills/generate-newsletter-content/scripts/substack_export.py
tests/test_gists.py, test_build_weekly_issues.py, test_substack_export.py,
tests/test_x_fetch_items.py
newsletter/artifacts/YYYY-MMM-DD-newsletter-gist-links.html
```

Python stays stdlib only. No new npm dependency.

## Code style

Match the generate spec: the script writes facts (slug, URLs, preview
text, appearances); Claude writes only new full/brief prose; voice rules
stay in write-gists. One helper for the gist URL, one for the item id.
Caps and enums imported from the contract, never restated.

Issue HTML row, AI News, after T35:

```html
<p class="news-item">🔥 <b><a href="https://aibytes.io/gists/tc-jensen-huang-is-out-at-nvidia?utm_source=newsletter&amp;utm_medium=email&amp;utm_campaign=issue-19">Jensen Huang is out at Nvidia</a></b>
 one-line context <span class="hot">Story of the week</span>
 <span class="src">(<a href="https://techcrunch.com/...">TechCrunch</a>)</span></p>
```

## Testing strategy

| Level | What |
|---|---|
| T34 `draft` / `build` | Fixture items.json: a repeat (already in the index) is not fetched and gains an `issue_slug` appearance; a new HN row is `full` or `brief` as the daily rules say; an X post is `preview` with no Claude file; a failed gist leaves that row out and writes the others; `validate.py` passes on the result. |
| T35 issue HTML | A fixture issue: every news / products / GitHub / HN title href is a gist URL with the three UTM tags; each has a trailing source link without UTM; a missing gist keeps the source as the title href. |
| T35 X | `x_items.py render` (issue HTML and Substack) puts the gist URL where the table says and keeps the post's words verbatim. `verify` accepts that shape. |
| T35 Substack | `tests/test_substack_export.py` reads the new hrefs out of a fixture issue and checks the layout file's rules (HN title linked, Viral handle → gist, trailing Post on X). |
| T36 | An issue whose titles are gist links builds the same items as one whose titles are source links, plus `gist`. Issues 1–18: no diff. A gist href with UTM still resolves. X rows present if Decide 2 is yes. |
| Contract | `source: "x"` accepted on a weekly item, rejected on an edition item; `counts.x` required on new issue files, absent on old ones still valid **or** always present at 0 — pick in T36 so old files do not break: **absent is valid, present is an int ≥ 0** (append-only, old issues stay). |

## Boundaries

- **Always:** look up by `source_key` before writing a gist; keep source
  links free of `utm_*` and `ref`; keep Issues 1–18 building; run
  `validate.py` before committing `content/`; leave the daily runner
  alone; X preview text comes from the snapshot, never from Claude.
- **Ask first:** adding `source: "x"` / `category: "x"` (Decide 2); a new
  dependency; switching an already-sent issue's live Substack post over
  to gist links; a second UTM shape; putting gist links in the intro.
- **Never:** backfill Issues 1–18; point an email at a gist that was not
  written; retitle or rewrite an X post to make the link fit; add
  `ref=aiBytes_` in the email; change a published slug; reference
  aiBytes-hub.

## Success criteria

Parent criterion 11, made checkable:

1. Every row in the first issue that uses this module has a gist file,
   or the printed summary names it as failed and that row's title still
   opens the source.
2. In the issue HTML and in the Substack export, every successful row's
   title (or the Viral handle / OA `Gist ↗`) is `https://aibytes.io/gists/<slug>`
   with `utm_source=newsletter`, `utm_medium=email`,
   `utm_campaign=issue-<N>`.
3. Every such row has a source link to the original (article, launch,
   repo, HN thread, or post) with a clean URL.
4. `build_weekly_issues.py` on that HTML writes `item.url` as the
   original destination, `item.source_url` as today, and `item.gist` as
   the slug. `/weekly/issue-N` cards open the panel.
5. A repeat item that already ran in a daily edition has one gist, two
   appearances (edition and issue).
6. Official Announcements and Viral on X are `preview` gists, `noindex`,
   copied from the snapshot. They are starrable if Decide 2 is yes.
7. P6: the publisher would send the first issue with these links.

## Decide

1. **Two orange links per Substack row.** Recommended: gist and source
   both linked, because F2 wants both and Substack has one colour. The
   alternative is gist only, which is fewer orange runs and closer to
   Issue 17's HN row, but it drops the "not forced through aibytes.io"
   half of F2.
2. **X posts in the weekly issue JSON.** Recommended: add `source: "x"`
   and `category: "x"` on weekly items, `counts.x` optional on old files,
   chips unchanged. The alternative is to leave them out of the issue
   file; then starring and the appearance cross-check need a carve-out,
   and `/saved` cannot load them.
3. **HN Deep title becomes a link on Substack.** Recommended: yes, to
   the gist, still unbolded. The alternative keeps the Issue 17 "title
   is plain text" rule and puts the gist on `(HN thread)`, which would
   make the thread no longer a source link.

## Tasks after this spec

Unchanged in count (T34, T35, T36, P6). Reshaped in files:

- **T34** — `--issue`, `items.json`, shared item-id helper, X previews
  in `build` with no Claude, issue_slug appearances. Tests in
  `tests/test_gists.py`.
- **T35** — skill, template example row, `x_render.py` (both issue HTML
  and Substack formats), `substack-layout.md`, `substack_export.py` if
  the parser needs the new trailing links, verifier, a dated artifact
  note. P6 on the first real issue.
- **T36** — gist href resolution; Decide 2's schema addition if approved.

## Not in this spec

Social-post UTM (analytics spec: tagged by hand until a skill writes
them). The follow-up LinkedIn/X skill. Changing the daily runner.
Backfill. Rewriting Issues 1–18 on Substack. Comments. A weekly Claude
step inside GitHub Actions — the publisher's machine runs the issue
skill, as today.

## Open questions

None beyond the three Decide rows. Assumptions used in this draft, to
correct before approval:

1. The next unpublished issue after merge is the first to link to gists
   (Issue 19 if this lands before that issue is written).
2. The weekly pull is a step in the issue skill, not a GitHub Action.
3. Intro links stay on the source.
4. Product Hunt title goes to the gist; the product website is not in
   the email row (it is on the gist). Same for the HN article on Deep
   Stories.
