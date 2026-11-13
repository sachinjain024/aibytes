# Spec: writing gists in the daily run (AIB-145y, `gist-generate`)

Module spec for plan tasks T10 to T17. Parent spec:
`docs/specs/AIB-145y-gists.md`. The file format it writes is fixed by
`docs/specs/AIB-145y-gist-contract.md`; this spec never restates a cap or a
key from there, it names them.

Status: **draft for approval** (T9, 13 Nov 2026).

## Objective

Every item in a daily edition gets a gist, unattended, in the same run that
publishes the edition, without ever putting the edition at risk. New items get
a gist written from material the run actually read. Items seen before get
their existing gist updated (a new appearance, fresh stats) and are never
rewritten.

## Measured before writing this (12 to 13 Nov 2026)

| Fact | Number | What it decides |
|---|---|---|
| Items per edition | 30 (10 TechCrunch, 10 HN, 5 Product Hunt, 5 GitHub) | The upper bound per run |
| Items new to aiBytes_ per day, last 30 editions | median 24, max 31 | The real writing load: repeats only refresh |
| TechCrunch articles readable with a plain stdlib fetch | 10 of 10, 570 to 1,300 words | News gists can be `full` |
| Pages linked from HN stories, readable the same way | 10 of 10, 500 to 3,800 words | HN link posts can be `full` |
| Product Hunt launch page, `/r/` redirect, product site | 403 on all three, every launch | Launch gists work from the PH API alone; see Q1 |
| Product Hunt description in the snapshot | 58 to 82 words, plus 3 topics and the makers | That is the launch material |
| HN thread from Algolia `items` | 196 comments, 126 KB, 1.7 s for a 187-comment story | One call gives the text |
| Algolia's comment order | by time, not by HN's ranking | Rank comes from HN's own `kids` list |
| `edition` workflow runs, last 8 | 1.3 to 1.9 minutes, no `timeout-minutes` (GitHub's 6-hour default) | The time budget below |

Found on the way: on the runner, curate's Product Hunt link resolver gets a
403 with no `Location`, so every launch in the edition links to
producthunt.com rather than the product's site. That predates gists and is
outside this ticket; Q4 asks whether to file it.

## Decisions in this spec

| # | Question | Decision |
|---|---|---|
| G1 | Who writes what | **The script writes every fact; Claude writes only prose.** Slug, title, URLs, tags, image, stats, `stats_as_of`, `front_page`, links, appearances and timestamps come from the edition item and the fetched material. Claude writes `lede` and `sections`, and may lower `depth` from `full` to `brief`, never raise it. |
| G2 | Where the material goes | A working folder outside the repo's published paths, `.cache/gists/<date>/`, git-ignored. Fetched article text, READMEs and comments are other people's writing and must never be committed to this public repo. The runner stages only `content/` and `newsletter/data/`, so this folder cannot be swept up. |
| G3 | How Claude refers to a comment or an issue | By the id the draft gives it (`c3`, `i2`). `build` turns ids into URLs and rejects an id that is not in that item's material, so every link in a gist points at something the run read. |
| G4 | `full` or `brief` | Decided per item by the script from what it could read (table below), before Claude sees it. |
| G5 | Copying | `build` compares Claude's text with the material. A verbatim run of 20 or more words is fatal for that gist; 12 or more is a warning. Quotes inside a discussion point count too: the parent spec allows one attributed sentence, and 20 words covers that. |
| G6 | Repeats | Looked up by source key in `content/gists/index.json`. Not fetched for prose and not shown to Claude. `build` appends the appearance, refreshes `stats` and `stats_as_of` from the edition item (no extra fetch), sets `front_page` if the item has it, and bumps `updated_at`. |
| G7 | Failure | Per gist, not per run. A gist that fails `build` is dropped and its item ships without `gist`; the rest are written. If the step fails as a whole (timeout, Claude writes nothing, every gist rejected), nothing under `content/gists/` changes and the edition publishes without any `gist` fields. |

## Material per kind

`draft` fetches for new items only, one at a time, with the shared fetcher
`User-Agent`, 15 seconds per request, 2 MB per response.

| Kind | Fetched | Kept for Claude (caps) | `full` when | Stats (from) |
|---|---|---|---|---|
| `news` (TechCrunch) | `article_text(url)` | title, byline, paragraphs; 12,000 chars | at least 150 words read | none |
| `hn` | HN `item/<id>.json` (ranked `kids`, `score`, `descendants`, `by`, `time`); Algolia `items/<id>` (comment text); `article_text(url)` for a link post | the article as for news; self-post text; the top 10 top-level comments by HN rank, 600 chars each, each with its first reply at 300 chars; ids `c1`… | the article or the self-post has at least 150 words | `points`, `comments`, `submitted_by`, `posted_at` (edition item, HN item) |
| `repo` | GitHub REST: `repos/{o}/{r}`, `readme`, `contributors?per_page=1&anon=1` (count from `Link`), `releases/latest`, `issues?state=open&sort=comments&per_page=10` (pull requests dropped) | description, topics, README 15,000 chars; issues as title, labels, comment count, ids `i1`… | README has at least 100 words | all nine repo keys; `stars_gained` from the edition item |
| `launch` (Product Hunt) | nothing new: the day's PH snapshot; `article_text` on the product site only if curate resolved one | tagline, description, topics, makers; the site's text, 12,000 chars | see Q1 | `upvotes`, `comments` |
| `launch` (Show HN, Launch HN) | as `hn` | as `hn` | as `hn` | as `hn` |

A `brief` gist is built from the edition item alone: title, summary, counts.
Claude writes a lede and nothing else. The contract already lets a `brief`
gist have no sections, and the parent spec keeps it out of search indexes.

`article_text` says "unreadable" rather than returning junk: a non-200, a
non-HTML type, a page under 150 words of paragraph text, or the marks of a
bot check or paywall (a `cf-chl` form, "enable JavaScript", "subscribe to
continue"). The draft records which of these it was.

GitHub calls use `GITHUB_TOKEN` when it is set (5,000 requests an hour;
without it, 60). At five calls a repo and at most five new repos a day, both
are enough, but GitHub's shared runner addresses often hit the anonymous
limit, so the workflow passes the token (P3). A 403 or 429 makes that repo
`brief`; it never stops the run.

## The three steps

```
gists draft --date D   reads the built edition and the index; fetches; writes
                       .cache/gists/D/draft.json
claude -p              reads draft.json and the write-gists skill; writes
                       .cache/gists/D/gists.json (Read, Write, Edit only)
gists build --date D   validates gists.json against the contract and the
                       draft; writes content/gists/, the index, and `gist`
                       on each edition item, together
```

### `draft.json`

```json
{
  "date": "2026-11-11",
  "new": [
    {
      "item_id": "hn-alphaproof-code-2026-11-11",
      "slug": "hn-alphaproof-code",
      "kind": "hn",
      "depth": "full",
      "title": "AlphaProof Code",
      "summary": "…the edition's one line…",
      "tags": ["Research"],
      "material": {
        "article": { "title": "…", "byline": "…", "text": "…" },
        "comments": [ { "id": "c1", "by": "…", "text": "…", "reply": { "by": "…", "text": "…" } } ]
      },
      "unreadable": null
    }
  ],
  "repeats": [ { "item_id": "gh-agent-skills-2026-11-11", "slug": "gh-agent-skills" } ]
}
```

`slug` comes from `gist_contract.slug_from_item_id` and `unique_slug`
against the index and the other new slugs. Repeats are listed only so the
counts in Slack add up.

### `gists.json`, what Claude writes

```json
{
  "date": "2026-11-11",
  "gists": {
    "hn-alphaproof-code-2026-11-11": {
      "depth": "full",
      "lede": "…",
      "sections": [
        { "key": "key_points", "points": ["…", "…", "…"] },
        { "key": "discussion", "points": [ { "stance": "disputed", "text": "…", "comment": "c4" } ] }
      ]
    }
  }
}
```

Section keys, shapes, caps and which kinds may carry them are the contract's
`SECTION_KEYS`, `SECTION_KINDS` and caps in `gist_contract.py`. The only
difference is that `discussion` and `whats_open` points carry `comment` or
`issue` ids instead of `url`; `build` swaps them.

### What `build` rejects, and what it only warns about

Fatal for that gist (it is dropped, its item ships without `gist`):

- Anything `validate_gist` rejects once the script's fields are added.
- `depth` raised from `brief` to `full`.
- A `comment` or `issue` id not in that item's material.
- A verbatim run of 20 or more words from the material (G5).
- An item in `gists.json` that is not in `draft.json`'s `new` list.

Warnings (published, listed in the run log and counted in Slack):

- A new item Claude wrote nothing for (it ships without `gist`).
- A verbatim run of 12 to 19 words.
- A hype word or an em dash, by the same list the curate step uses.
- A `full` gist under 120 words or over 350 (target 150 to 300).

Then the whole tree is checked with `validate.py`, as curate and `hide.py`
do, and nothing is written unless it passes. If the whole set fails the
check, nothing is written at all.

## The runner step

`step_gists` runs after the edition is built and before `validate`:

```
sync → fetch → draft → summaries (Claude) → build → gists → validate → publish
```

| Part | Time limit | On failure |
|---|---|---|
| `gists draft` | 10 minutes; fetching stops at 8 and the rest become `brief` | Step skipped, warning |
| `claude -p` with `/write-gists` | 20 minutes, 80 turns, same model as summaries | Step skipped, warning |
| `gists build` | 2 minutes | Step skipped, warning |

"Skipped" means `content/gists/` and the edition file are restored to what
`build` (the edition's) left, so `validate` and `publish` see an edition with
no `gist` fields. `--skip-gists` skips the step for a re-run.

Expected cost per day: about 100 requests and 2 to 3 minutes of fetching,
and one Claude session reading about 120,000 tokens of material and writing
about 25 gists. The run goes from under 2 minutes to about 15. The hard
ceiling for the step is 32 minutes, inside GitHub's 6-hour job default; Q3
asks whether to set `timeout-minutes` on the job.

Slack gets one line under the edition's:

```
Gists: 19 new (4 brief), 9 updated, 2 failed (see run log)
```

## The weekly entry point (used by T34)

`gists draft --issue issue-N` and `gists build --issue issue-N` do the same
for a weekly issue file, with `issue_slug` appearances. X posts and Official
Announcements are made by `build` straight from the saved `x_data.json`, as
`preview` gists with no Claude step, because the contract says previews are
copied, never written. T34 fixes the details; this spec only promises the
flag and the shared code path.

## Project structure

```
packages/fetchers/aibytes_fetchers/article.py       article_text (T10)
packages/fetchers/aibytes_fetchers/hn_thread.py     hn_thread (T10)
packages/fetchers/aibytes_fetchers/github_repo.py   repo_details (T11)
packages/gists/gists.py                             CLI: draft, build
packages/gists/aibytes_gists/draft.py               T12, T13
packages/gists/aibytes_gists/build.py               T15
packages/gists/aibytes_gists/copying.py             the verbatim-run check
.claude/skills/write-gists/SKILL.md                 T14
tests/test_gists.py, tests/test_fetchers.py, fixtures under tests/fixtures/gists/
```

Python 3.8, stdlib only, like the rest of the repo's Python.

## Commands

```bash
python3 packages/gists/gists.py draft --date 2026-11-11
python3 packages/gists/gists.py build --date 2026-11-11 --gists .cache/gists/2026-11-11/gists.json
python3 packages/runner/run.py --skip-fetch --no-push --date 2026-11-11   # rehearse
python3 -m unittest tests.test_gists tests.test_fetchers -v
```

## Testing

| Level | What |
|---|---|
| Fetchers | Saved fixtures for a readable article, a bot-check page, a paywall, an HN item and thread, each GitHub endpoint, a 403. One live test each, skipped by `AIBYTES_SKIP_LIVE=1`. |
| `draft` | A repeat is not fetched; slugs and clashes; the `full`/`brief` rule per kind; the 8-minute cut-off with a fake clock. |
| `build` | Every fatal rule and warning above; one bad gist of thirty leaves twenty-nine; a failing whole set writes nothing; the result passes `validate.py`. |
| Runner | Claude writes nothing, a timeout, a rejected build: each still publishes the edition, with a warning. |
| Skill | Every key and cap it names exists in `gist_contract.py`. |

## Boundaries

- **Always:** keep fetched material out of the repo; keep Claude to Read,
  Write and Edit; let the edition publish whatever happens to gists.
- **Ask first:** a new dependency; any change to `edition.yml` beyond passing
  `GITHUB_TOKEN`; a model other than the summaries step's.
- **Never:** publish a fact the script did not read; fetch for an item that
  already has a gist; retry a blocked site with a browser-like disguise.

## Open questions

1. **Product Hunt launches: `full` or `brief`?** Every PH page blocks the
   fetch, so a launch gist has only the maker's 60 to 80 word description,
   the topics and the counts. *Recommendation:* `brief`. Those words are the
   maker's pitch, and a `full` gist built from them would mostly restate it.
   That keeps launch gists out of search (the parent spec's rule for `brief`)
   until a real source is readable. A Show HN launch is unaffected.
2. **Copying thresholds.** 20 words fatal, 12 a warning. *Recommendation:*
   as written; T17's rehearsal will show whether 12 is noisy.
3. **A job time limit.** *Recommendation:* add `timeout-minutes: 60` to the
   `edition` job in the same change that passes `GITHUB_TOKEN` (P3), so a
   hung step can never hold the edition for six hours.
4. **The Product Hunt resolver on the runner** (found above) returns no
   product site. *Recommendation:* a separate LongClaw ticket, not this one.
