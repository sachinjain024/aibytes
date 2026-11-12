# Spec: gists, a summary page for each item (AIB-145y)

Status: **approved 12 Nov 2026.** Nothing is built yet. This is the product
spec and the capability map; the plan and the module specs follow.
Ticket: `.longclaw/tickets/AIB-145y/ticket.md`.
Intent confirmed with the publisher on 2026-11-12 (the ticket's Statement of
intent).

## Objective

Every item aiBytes_ covers gets a **gist**: a short page on aibytes.io that
explains the item at a glance, lists its sources, and links back to the
edition or issue it ran in. The same content opens in a right-hand panel when
a card is clicked on a daily or weekly page.

- **Who:** the publisher, who links to gists from the newsletter and social
  posts instead of to the sources; and the reader, who understands a repo, an
  HN thread or a story in a minute without digging through the original.
- **Why now:** every click from the newsletter and social posts goes to someone
  else's site today. Gists bring that traffic to aibytes.io, some visitors sign
  up, and the audience is what gets monetized later.
- **Success:** traffic on gist pages is visible (visits per gist, and where
  they came from) and growing.

### Release 1

Gist pages built for search, the side panel, stars, emoji reactions, and
traffic measurement. Gists start with the first daily run after launch.

### Out of scope

- **Comments.** A later release, with its own spec (spam, moderation, a
  report and delete path).
- **Backfill.** Items in editions and issues published before launch get no
  gist. Their cards keep today's behaviour and open the source.
- **Monetization.** No ads, sponsorship slots or paywall work.
- **The Chrome extension.** It keeps reading the edition JSON. The new fields
  are additive, so it is unaffected.
- **A human review step.** Gists publish unattended, like today's summaries.

## What exists today, and what it means for gists

Checked in the repo on 2026-11-12:

- **A card links straight to the source.** There is no item page and no panel.
- **Pages are a JavaScript shell.** Edition and weekly pages are built as
  `index.html` copies with their own `<head>`; the content is rendered in the
  browser. A gist page needs its text in the HTML itself to be indexed well.
- **Items repeat.** Across the 35 published editions, 1,016 items point at 788
  distinct source pages; 112 of those appear on more than one day, one of them
  on nine. So a gist belongs to the **source item**, not to one day's card,
  or the same story would get nine competing pages.
- **The run already has a bounded Claude step.** The runner script fetches,
  Claude reads `curation.json` and writes `summaries.json` with `Read` and
  `Write` only, and plain Python decides whether the result is published.
  Gists follow the same split.
- **The run reads little of each item.** Snapshots hold titles, links and
  counts. Article text, HN comments, READMEs and open issues are not fetched
  today; gists need all four.
- **A star already exists.** It is the save from AIB-75v: kept in the browser
  with no account, and synced to Firestore after Google sign-in.
- **The site runs no analytics,** and `/privacy` says so in words. Measuring
  traffic changes that page.
- **The HN fetcher sees front-page status and drops it.** The search API it
  calls tags a story `front_page` while it is on the front page (checked live
  on 2026-11-12). The fetcher reads those tags for Show HN and Ask HN only.
- **X posts are saved and rendered already.** `x_paste.py` and `x_render.py`
  in `packages/fetchers` hold the week's posts and draw them for the
  newsletter. They are not in the weekly issue file, so they cannot be starred
  today.
- **The weekly issue page is scraped from the issue HTML.** If the
  newsletter's links become gist links, `build_weekly_issues.py` has to
  resolve them back to sources.

## Decisions

| Question | Decision |
|---|---|
| What a gist belongs to | One gist per **source item**, keyed by its source page (`source_url`). An item that reappears on a later day reuses its gist. |
| URL | `https://aibytes.io/gists/<slug>`, e.g. `/gists/hn-life-on-claude-nine`. The slug is the item id without its date: source prefix (`hn-`, `gh-`, `tc-`, `ph-`) plus the title slug. |
| Slug stability | A slug never changes once published, even if the source retitles. Two different sources that produce the same slug get `-2`, `-3`. |
| Where gists are stored | `content/gists/<slug>.json`, one file per gist, under the published contract and checked by `validate.py`. |
| Where the item-to-gist link is kept | In three places that must agree; see "How a source item and its gist stay linked". |
| When a gist is written | In the daily run, after the edition is built, for every item with no gist yet. The weekly pull writes one for any issue item still missing one. |
| When an item reappears | The gist's list of appearances and its stats are refreshed. The prose is not rewritten, so a shared link keeps the content it was shared with. |
| When the source cannot be read | The item still gets a gist, marked `brief`, built from what the run already knows (title, summary, counts). It never fills the gap with guesses. |
| When gist writing fails | The edition publishes anyway; the affected items ship without a `gist` and their cards open the source. A gist failure never costs an edition. Slack reports it. |
| Hidden items | A gist whose every appearance is hidden is not built as a page and drops out of the sitemap. `hide.py` moves it with the edition, index and log. |
| Panel and page | One shared view component renders both, so they cannot drift apart. |
| A card click | Opens the panel. The card is a real link to the gist page, so search engines follow it and a new-tab click opens the page. The source is one click away in the panel. |
| Stars | The existing save, behaving as it does everywhere else: it works with no account, kept in the browser, and syncs after Google sign-in. A star made on a gist shows on the card and on `/saved`. |
| X posts | A gist with a preview of the post (author, handle, text, counts, a link to the post) and no written summary. It exists so the post has a page on aibytes.io that can be shared and starred. Drawn from the saved snapshot, not X's embed script, so the page loads nothing from X. Kept out of search indexes. |
| Official Announcements | Treated like X posts for now: a preview gist (who announced it, the title, the issue's one line, a link to the announcement), no written summary, kept out of search indexes. |
| Newsletter links | Every item in the issue links to its gist, and the issue template changes to match. Whether a small "source" link stays beside it is decided in `gist-design`. |
| `brief` gists | Published, and kept out of search indexes (`noindex`, not in the sitemap). |
| Analytics | A free tool, part of this ticket. Cookieless, so no consent banner. The `gist-analytics` spec compares the candidates and names one. |
| Reactions | GitHub's fixed set of eight: 👍 👎 😄 🎉 😕 ❤️ 🚀 👀. Counts are public; reacting needs Google sign-in. One toggle per person per emoji. |
| Reading | Never needs sign-in. |

## How a source item and its gist stay linked

The source page's address is the key. It is normalised first (host in lower
case, no trailing slash, no tracking parameters), so the same thread fetched
on two days is the same key even if its title was edited in between.

| Where | What it holds | Who reads it |
|---|---|---|
| `content/gists/index.json` | One entry per gist: `slug`, the normalised `source_url`, `created_at`. | The run, to answer "does this source already have a gist?" before writing one. The build, for the sitemap. |
| `content/gists/<slug>.json` | The gist itself, with its `source_url` and `appearances`: every edition and issue item that carried it, by `item_id` with `edition_date` or `issue_slug`. | The gist page and panel, for "Appeared in". |
| The item, in an edition or issue file | `gist`: the slug. Optional; absent before launch. | The card, to open the panel and link to the page. The app never loads the index. |

The daily run looks the source up in the index. If it is there, the run adds
the new appearance to that gist and sets the item's `gist`; if not, it writes
a new gist and adds an index entry. `validate.py` checks the three agree:
every index entry has a file, every item's `gist` names a real file, and
every appearance names a real item that points back. Nothing is written
unless all of it validates, the same rule the edition and its index follow.

## Keeping a gist out of search indexes

Three kinds of gist are published but not indexed: `brief` gists, X post
previews and Official Announcement previews. Each gist file carries a `depth`
of `full`, `brief` or `preview`, and only `full` is indexed.

- **The page says so itself.** The build writes
  `<meta name="robots" content="noindex">` into the page's `<head>`, through
  the same `robots` option in `pageMeta.js` that `/saved` uses today.
- **It is left out of `sitemap.xml`.**
- **It is not blocked in `robots.txt`.** A crawler has to be allowed to fetch
  the page to see the `noindex` tag. Blocking the path would hide the tag, and
  a blocked address can still be listed from links that point at it.
- **Links still work.** The page opens normally from the newsletter, a social
  post or a card, and can be starred and reacted to.
- **It is reversible.** A `brief` gist that is later rewritten as `full`
  loses the tag and joins the sitemap on the next build.

`pageMeta.test.js` checks the tag per depth, and the build check confirms the
sitemap lists `full` gists only.

## What a gist contains

The publisher's sketch (HN: summary, stats, discussion; news: summary; GitHub:
summary, stats, open issues) was a reference. This is the proposed structure.
Every gist shares one skeleton, and each type adds only the sections its
source can support. A whole gist is 150 to 300 words.

**Every gist:**

1. **Header:** title, source mark, tags, the date first covered.
2. **Lede:** one or two sentences that stand alone. It is also the page's
   meta description and the share preview.
3. **Key points:** three to five bullets on what the item is and what is new.
4. **Type sections,** from the table below.
5. **References:** every source the gist drew on, as real links. The source
   itself is first and is also a button near the top.
6. **Appeared in:** links to each daily edition and weekly issue that carried
   it.
7. **Actions:** star, reactions.

| Type | Read by the run | Extra sections |
|---|---|---|
| **News** (TechCrunch) | The article text | **Why it matters:** one or two sentences for developers. |
| **HN thread** | The linked article and the top comments | **Stats:** points, comments, submitter, age, and "on the front page" when seen. **The discussion:** three to five themes: where commenters agree, where they split, the strongest counterpoint, each linked to a comment. |
| **GitHub repo** | The README, repo metadata, open issues | **Try it:** the install or run line, only if the README gives one. **Stats:** stars, stars gained, forks, language, licence, created, contributors, open issues, last release. **What's open:** the themes in the most-discussed open issues. |
| **Launch** (Product Hunt) | The launch page and the product site | **Who it's for** and **Pricing,** each only if the source states it. **Stats:** upvotes, comments. |
| **X post** (weekly only) | The saved post | No lede, key points or written sections: the post preview, its counts, references and actions. |
| **Official announcement** (weekly only) | What the issue already holds | As an X post: a preview, references and actions. |

**HN front page.** The fetcher will keep the `front_page` tag it drops today.
It reports where a story is at the moment of the fetch, not its history, so
the gist says "on the front page" once any fetch has seen it there and keeps
saying so. A story never seen there shows nothing: the run cannot tell "never
on the front page" from "left it before we looked".

### Rules for the writing

- **Only what was read.** Every claim comes from the material the run fetched
  for that item. A section with nothing to support it is left out, not padded.
- **Summarize, don't copy.** No lifted paragraphs. A quoted HN comment is one
  sentence at most, attributed and linked.
- **Same voice as the edition.** The hype-word and punctuation rules of the
  `curate-edition` skill apply; they live in a skill file, not in Python.
- **Contract breaks are fatal, taste is a warning.** A missing lede, an empty
  references list, a non-http link or a section over its cap means that gist
  is not written. A hype word is logged and published.

### Shape of the file (illustrative; the `gist-contract` spec fixes it)

```json
{
  "schema_version": 1,
  "slug": "hn-life-on-claude-nine",
  "source": "hackernews",
  "category": "hn",
  "title": "Life on Claude Nine",
  "url": "https://babuschk.in/posts/2026-01-25-life-on-claude-nine.html",
  "source_url": "https://news.ycombinator.com/item?id=50443587",
  "tags": ["Anthropic"],
  "depth": "full",
  "lede": "…",
  "sections": [
    { "key": "key_points", "points": ["…", "…", "…"] },
    { "key": "discussion", "points": [{ "text": "…", "url": "https://news.ycombinator.com/item?id=…" }] }
  ],
  "stats": { "points": 122, "comments": 80 },
  "stats_as_of": "2026-11-11T08:04:10Z",
  "references": [{ "title": "Life on Claude Nine", "url": "https://babuschk.in/…" }],
  "appearances": [{ "edition_date": "2026-11-11", "item_id": "hn-life-on-claude-nine-2026-11-11" }],
  "created_at": "2026-11-11T08:04:10Z",
  "updated_at": "2026-11-11T08:04:10Z"
}
```

Keys are `snake_case`. Section keys come from a fixed list, so a new section
is a deliberate contract change. Append-only, like the rest of `content/`.

## Capability map

The work is eight modules. Each has its own code and tests and can be checked
without the ones after it.

| Module id | Responsibility | Depends on |
|---|---|---|
| `gist-analytics` | A free, cookieless analytics tool on aibytes.io: page views per path, referrers, campaign tags, and a "panel opened" event. The `/privacy` copy changes to match. A link convention for the newsletter and social posts (`utm_source`, `utm_campaign`). | — |
| `gist-contract` | `content/gists/<slug>.json`: schema, `feed.d.ts`, `validate.py`, the optional `gist` field on edition and weekly items, the slug rules, and `hide.py` moving a gist with its item. | — |
| `gist-generate` | The run writes gists. Fetchers for article text, HN comments, READMEs, repo metadata and open issues; a `draft` step that collects them per item; Claude writes; a `build` step that validates and writes the files and sets each item's `gist`. A `write-gists` skill holds the voice rules. Wired into the daily runner and Slack report. | `gist-contract` |
| `gist-design` | The gist page and panel as a prototype with numbered options, decided by the publisher, recorded in `docs/decisions/product/AIB-145y-gists-design.md`. Phone layout included. | — |
| `ledger-gist-ui` | Ledger components: the shared gist view, the right-hand panel (a full-screen sheet on phones), the reaction bar. `.d.ts`, `.prompt.md`, UI kit screen, tests. All additive. | `gist-design` |
| `app-gist-pages` | `/gists/<slug>` in `route.js` and as a real page per gist in the build, with the gist text in the HTML, its own title, description, canonical URL, Open Graph tags and structured data. `sitemap.xml` and `robots.txt`. The star. | `gist-contract`, `ledger-gist-ui` |
| `app-gist-panel` | A card click opens the panel on edition and weekly pages. The open gist is in the URL, so Back closes it and a reload keeps it. Items with no gist behave as today. | `app-gist-pages` |
| `app-reactions` | Emoji reactions in Firestore: public counts, one toggle per signed-in person per emoji, `firestore.rules` and emulator tests. Shown on the page and the panel. | `app-gist-pages` |
| `newsletter-gist-links` | The weekly pull writes gists for issue items that lack one, including Official Announcements and the X post previews; the issue template and the `generate-newsletter-content` skill link every item to its gist with campaign tags; X posts and announcements become starrable (they are in no issue file today); `build_weekly_issues.py` resolves gist links back to sources; issue items carry `gist`. | `gist-generate`, `app-gist-pages` |

### Build order

```
gist-analytics
gist-contract ──► gist-generate ─────────────────────────────┐
gist-design ──► ledger-gist-ui ──► app-gist-pages ──► app-gist-panel
                                         ├──► app-reactions
                                         └──► newsletter-gist-links ◄┘
```

1. `gist-analytics` first. It is independent, and it gives a month of
   baseline traffic to compare gists against.
2. `gist-design`, in parallel: it needs the publisher's eye and nothing else.
3. `gist-contract`, then `gist-generate`. **Checkpoint:** rehearse a week of
   real editions with `--no-push` and read the gists before any page exists.
   This is the test of the constraint that nobody reviews them later.
4. `ledger-gist-ui`, `app-gist-pages`, `app-gist-panel`. **Launch** is the
   first daily run after these are on `main`.
5. `app-reactions`, then `newsletter-gist-links`. The newsletter switches to
   gist links only after gist pages have been live and read for a week.

One branch (`aib-145y-gists`), one commit per task, one PR, as the repo works
now. Each module gets its spec at `docs/specs/AIB-145y-<module-id>.md` before
it is built, and the plan goes in `docs/plans/AIB-145y-plan.md`.

## Tech stack and project structure

No new language or framework. New and changed paths:

```
content/gists/<slug>.json            the published gists (new)
packages/feed-schema/                gist.schema.json, feed.d.ts, validate.py, hide.py
packages/fetchers/                   article text, HN comments, README, repo metadata, issues
packages/gists/                      draft and build: material in, validated gist files out (new)
packages/runner/                     the gists step, after build, before validate
.claude/skills/write-gists/          voice and structure rules for the Claude step (new)
packages/design-system/              the gist view, panel and reaction bar
apps/web/src/                        route, page head, gist page, panel wiring, reactions store
apps/web/vite.config.js              one page per gist, sitemap.xml, robots.txt
firestore.rules                      reactions
docs/specs/, docs/plans/, docs/decisions/product/, docs/ux/prototypes/AIB-145y-gists/
tests/                               test_gists.py, fetcher tests, runner tests
```

Python stays stdlib only. Fetch logic goes in `packages/fetchers`, not in the
gists package or a skill script.

## Commands

Existing commands that must stay green:

```bash
AIBYTES_SKIP_LIVE=1 python3 -m unittest discover -s tests -v
python3 packages/feed-schema/validate.py
npm test -w @aibytes/web
npm test -w @aibytes/design-system
npm run build:web
python3 packages/runner/run.py --skip-fetch --no-push    # rehearse, change nothing
```

Proposed new ones, mirroring curate (names fixed in the `gist-generate` spec):

```bash
python3 packages/gists/gists.py draft --date 2026-12-01
python3 packages/gists/gists.py build --date 2026-12-01 --gists gists-draft.json
```

## Code style

The repo's existing conventions, unchanged: stdlib `unittest` and
`node --test`; pure functions for anything a test should reach (`route.js`,
`pageMeta.js`); limits imported from the contract, never restated; prompts
and voice rules in a skill file, not in a string literal; Ledger tokens only
in the UI. The JSON above shows the naming.

## Testing strategy

| Concern | Test |
|---|---|
| The gist contract | `tests/test_feed_schema.py` compares schema and validator; bad gists (no lede, empty references, unknown section key, a `gist` slug with no file) are rejected. |
| Slugs | Stable across a retitle; collision gets a suffix; an item that reappears resolves to the same gist. |
| Fetchers | Offline unit tests on saved fixtures; one live test each, skipped by `AIBYTES_SKIP_LIVE=1`. |
| Draft and build | Nothing is written unless everything validates; an unreadable source yields a `brief` gist; a rejected run leaves `content/` as it was. |
| The runner | Claude finishing without writing the file fails the step; a failed gists step still publishes the edition and is reported. |
| Hide | Hiding an item's only appearance removes its gist page; unhide restores it. |
| Routes and page head | `route.test.js`, `pageMeta.test.js`: `/gists/<slug>`, title, description, canonical, robots. |
| The built site | `npm run build:web` emits `dist/gists/<slug>/index.html` containing the lede text, plus `sitemap.xml` listing it. |
| Reactions | Emulator rules tests: signed-out cannot write, a person cannot react twice with one emoji or write another person's reaction, only the eight emoji are accepted. |
| In the browser | Card click opens the panel; Back closes it; a new-tab click opens the page; panel and page show the same content; 375px layout; a pre-launch card still opens the source. |

## Boundaries

**Always**

- Run `validate.py` before anything under `content/` is committed.
- Add fields to the published contract; never rename or remove one.
- Keep the edition publishable when gists fail.
- Keep Claude's step to `Read` and `Write`; the script fetches, validates and
  commits.
- Stage only `content/` and `newsletter/data/` in the runner.

**Ask first**

- The analytics provider, and the new wording on `/privacy`.
- Any new dependency, in Python or npm.
- A Cloud Function for reactions, if the rules alone cannot keep counts honest.
- Changing the runner's schedule, timeout or the `edition` workflow.
- Switching the newsletter's links to gists for the first time.

**Never**

- Publish a claim the run did not read in the source.
- Copy source text beyond a one-sentence attributed quote.
- Commit a secret or an analytics key that is not meant to be public.
- Change a slug after it is published.
- Reference `aiBytes-hub`.

## Success criteria

1. From launch day, every visible item in every daily edition has a `gist`,
   and `https://aibytes.io/gists/<slug>` returns 200 for each.
2. With JavaScript off, a gist page shows its title, lede, key points and
   references, and carries a canonical URL, Open Graph tags and structured
   data.
3. `sitemap.xml` lists every published gist and no hidden one.
4. Clicking a card on a daily or weekly page opens the panel with the same
   content as the page; Back closes it.
5. A gist page links to every edition and issue the item appeared in, and
   each of those cards links to the gist.
6. An item that appears on three days has one gist and one URL.
7. A reader can star from the page and the panel, and the star shows on the
   card and on `/saved`.
8. A signed-in reader can add and remove each of the eight reactions; counts
   are visible to everyone.
9. The publisher can see, per gist and per day, how many visits it had and
   whether they came from the newsletter, a social post, search or the site.
10. A daily run where gist writing fails still publishes the edition, and
    Slack names the failure.
11. Every item in a weekly issue links to a gist, and the issue page on
    aibytes.io still builds from the issue HTML.
12. In a seven-edition rehearsal, the publisher reads the gists and would
    link to them without edits.

## Risks

| Risk | Mitigation |
|---|---|
| **Search engines may treat hundreds of short machine-written summaries of other sites as thin content** and rank them poorly or not at all. This is the largest risk to the traffic goal. | Each gist adds what the source lacks (the HN discussion, the open-issue themes, the stats in one place); `brief` gists are marked `noindex`; watch indexed-page counts from week one before relying on search. |
| A gist states something the source does not say, and nobody reads it before it is public. | "Only what was read", fatal contract checks, the rehearsal checkpoint, and `hide.py` as the fast way to pull one. |
| The run gets slower and costlier: about 30 longer pieces a day on top of 30 summaries, plus four kinds of extra fetching. | Gists are a separate step with its own timeout, after the edition is safe; repeats are not rewritten. |
| Sites block the fetch (paywalls, bot checks, rate limits on GitHub and HN). | `brief` gists; per-source limits in the fetchers; the share of `brief` gists is reported in Slack. |
| Readers of the newsletter get an extra click before the source. | The source button sits at the top of the gist; the switch happens only after a week of live gists; click-through to sources is measured. |
| Reactions on a public page attract abuse. | Sign-in required, a fixed emoji set, one per person, rules tested on the emulator. |
| `content/` and the build grow by about 900 files a month. | Fine for the first year; noted so the build time is watched. |

## Answered on 2026-11-12

1. **Stars** keep today's behaviour: no account needed, synced after sign-in.
   Only reactions require sign-in.
2. **Analytics** is a free tool and part of this ticket.
3. **X posts** get a preview gist so they can be shared and starred.
4. **Newsletter links** point to gists, and the template is updated. A
   "source" link beside them is evaluated in the design step.
5. **`brief` gists** are published and kept out of search indexes.
6. **One gist per source item** is confirmed.
7. **X post previews** are kept out of search indexes.
8. **Official Announcements** are treated like X posts for now: a preview
   gist, not indexed.
9. **HN front-page status** is carried; the fetcher keeps the tag it drops
   today.

## Open questions

None.
