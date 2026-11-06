# Spec: publish the weekly issue on aibytes.io/weekly (AIB-105j)

Status: **implemented 2026-11-06** (PR #51).
Ticket: `.longclaw/tickets/AIB-105j/ticket.md`.

## Objective

Publish each weekly aiBytes_ issue on our own site at
`https://aibytes.io/weekly/<slug>` **before** the Substack send, and make that
URL the issue's home on the app domain.

- Substack keeps sending the email from `newsletter.aibytes.io` (AIB-134j).
- Social posts and any "read the full issue" link use
  `https://aibytes.io/weekly/<slug>` as `ISSUE_URL`. The Substack post URL is
  secondary (archive / email permalink).
- Search engines index the weekly archive on `aibytes.io` as well as on
  Substack.
- We control the page: subscribe CTA, archive index, the same filters and
  views as the daily edition, without Substack's editor limits.

### Who sees it

Readers who open a weekly link from social, the newsletter footer, or the
`/weekly` archive. Daily-edition readers stay on `/` and `/YYYY-MM-DD`; weekly
is a sibling surface on the same host.

## Decisions

| Question | Decision |
|---|---|
| Slug format | **`issue-{N}`**, e.g. `/weekly/issue-16`. Stable, back-fillable from the `week-*-Issue-N` folders, short enough for X. The page's `<title>` and meta description carry the SEO hooks; a descriptive vanity slug is deferred. |
| Page source | **Ledger app shell**, the same one the daily edition uses, fed by `content/weekly/issues/issue-N.json`. That file is built from the issue HTML: AI News, New AI Products, Trending GitHub and HN. The intro, Official Announcements and Viral on X are not carried for now. |
| `/weekly` index | **Yes.** A Ledger page lists every published issue, newest first. |
| Canonical URL | `https://aibytes.io/weekly/issue-{N}`, written into each issue's built page with its own title, description and Open Graph tags. |
| Default view | List + Grouped, on weekly pages **and** on the daily edition. A stored preference still wins. Approved by the publisher in review of PR #51. |

### Why the Ledger shell, not the issue HTML as-is

The issue HTML is a newsletter document with its own fonts and CSS. Serving it
as-is would give a second visual language on aibytes.io and no filters. In the
shell, an issue reads like a long edition: the same sidebar categories, search,
tag and source filters, and list/grid and ranked/grouped controls. The
newsletter HTML stays the source of truth: the JSON is derived from it and
rebuilt on demand.

### Why `issue-{N}` over a date or a hook slug

- Daily editions already own `/YYYY-MM-DD`. A date path for weekly would mean
  the same thing as an edition date and confuse routing.
- Hook-based slugs (`issue-14-claude-ecdsa-meta-muse`) need a naming step on
  every issue and make the back-fill a judgement call. `issue-{N}` comes from
  the folder name already on disk.
- A later ticket can add vanity aliases that redirect to `issue-{N}` without
  changing `ISSUE_URL`.

## What ships

### 1. Published contract: `content/weekly/`

Types are in `packages/feed-schema/feed.d.ts` (`WeeklyIndex`,
`WeeklyIssueRef`, `WeeklyIssue`). Append-only, like the daily contract: add
keys, never rename or remove them.

`content/weekly/index.json`, newest first:

```json
{
  "schema_version": 1,
  "issues": [
    {
      "number": 16,
      "slug": "issue-16",
      "title": "🪤 A backdoored Claude Code extension and Anthropic's S-1",
      "description": "Plus Google's Genie 4 world model, …",
      "published_on": "2026-11-02",
      "source": "newsletter/issues/2026/week-45-Issue-16/aiBytes-issue-16.html",
      "path": "weekly/issues/issue-16.json"
    }
  ]
}
```

- `slug` is always `issue-{number}`.
- `published_on` is the Monday send date.
- `source` is the repo-relative issue HTML that `path` is built from.
- `path` is relative to `content/`.

`content/weekly/issues/issue-N.json` is edition-shaped: `schema_version`,
`number`, `slug`, `title`, `description`, `published_on`, `generated_at`,
`counts`, and `items`. Items follow the edition item contract (`EditionItem`),
with two differences:

- `id` ends in `-issue-{N}` instead of an edition date, with the same source
  prefixes (`ph-`, `gh-`, `hn-`, `tc-`), e.g. `gh-jetbrains-thinkrail-issue-16`.
- `rank` is the issue's reading order.

`validate.py` checks all of it whenever `content/weekly/` exists; an absent
directory is fine. The index must be strictly descending by number, slugs must
match numbers, every `source` must exist inside the repo, and every `path`
must be `weekly/issues/{slug}.json`. Each issue file is validated like an
edition (items, counts, ranks, unique ids) and must agree with its index
entry.

### 2. Builder: `packages/feed-schema/build_weekly_issues.py`

Reads `content/weekly/index.json`, scrapes each issue's `source` HTML, writes
`content/weekly/issues/{slug}.json`, and fills in `path`.

- HTML comments are stripped first: the template keeps example rows in them.
- A summary is the text after the title, without the source label, badges or
  stat. An HN story with no context line gets a factual stand-in naming the
  linked site ("A post on lynchlab.net, discussed on Hacker News.").
- Signals come from the stat: `▲ 776` → upvotes, `+6.4k ★` → stars_gained
  6400, `699 pts · 312 💬` → points and comments.
- An issue whose content has not changed keeps its `generated_at`, so a re-run
  only touches the issues that moved. A missing `source` fails the run.

Covered by `tests/test_build_weekly_issues.py`.

### 3. Routes in `apps/web`

| Path | Kind | Behaviour |
|---|---|---|
| `/weekly`, `/weekly/` | `weekly_index` | The archive (Ledger), from `content/weekly/index.json`. Issue links are plain hrefs. |
| `/weekly/issue-{N}` | `weekly_issue` | The issue in the shared feed shell. List + Grouped by default; the sidebar, search, filters and views work as on an edition. The toolbar's date control reads `Issue #N` and opens the archive; the end card pages to the previous issue. |
| `/p/<slug>` | `issue` (existing) | Still redirects to `https://newsletter.aibytes.io/p/<slug>`. |

The daily edition and the weekly issue share one `FeedShell` component in
`App.jsx`; each route only resolves which document to load and renders its own
empty and error states.

### 4. Build: real pages on GitHub Pages

`editionPages()` in `apps/web/vite.config.js` writes `dist/weekly/index.html`
and `dist/weekly/{slug}/index.html` for every index entry. Each carries its
own `<title>`, meta description, `<link rel="canonical">` and Open Graph tags,
generated by `apps/web/src/pageMeta.js` (tested by `pageMeta.test.js`), so the
pages are indexable and share with a real preview before any script runs.

### 5. Substack subscribe CTA

- A compact bar at the top of every issue feed: "Get aiBytes_ every Monday."
  plus a primary **Subscribe** button to `SUBSCRIBE_URL`
  (`https://newsletter.aibytes.io/subscribe`). It stacks on mobile, where the
  sidebar's Subscribe is behind the menu.
- The archive's lede and the sidebar carry the existing Subscribe link.
- Ledger tokens only (`packages/design-system/styles.css`, `.weekly-*`).
- The in-page Substack iframe embed is AIB-134n.

### 6. Generate-newsletter-content publish step

After the issue HTML (and Substack export) are written, and **before** the
publisher pastes into Substack:

1. Upsert the entry at the front of `content/weekly/index.json`.
2. Run `build_weekly_issues.py`, then `validate.py`.
3. Tell the publisher that merging the issue PR deploys
   `aibytes.io/weekly/issue-{N}`.
4. Hand over `ISSUE_URL=https://aibytes.io/weekly/issue-{N}` for social posts.

### 7. Back-fill

Issues 1–16, from every `newsletter/issues/2026/week-*-Issue-*` folder with an
`aiBytes-issue-N.html`. Titles and descriptions come from each issue's subject
and description; `published_on` is the Monday of that issue's send week.

## Out of scope

- Serving the newsletter HTML itself on aibytes.io.
- The intro, Official Announcements and Viral on X on the issue page.
- Changing the `/p/` → newsletter redirect target.
- Removing Beehiiv tooling (AIB-135b).
- Vanity slugs and redirect aliases.
- Related daily editions on the issue page.
- The Substack iframe embed (AIB-134n).

## Testing

```bash
npm test -w @aibytes/web                        # routes + page <head>
npm test -w @aibytes/design-system
npm run build:web                               # dist/weekly/issue-N/index.html with canonical
python3 packages/feed-schema/build_weekly_issues.py   # idempotent: no diff on a clean tree
python3 packages/feed-schema/validate.py
AIBYTES_SKIP_LIVE=1 python3 -m unittest discover -s tests -v
```

Browser checks: `/weekly` lists 16 issues newest first; `/weekly/issue-16`
renders with the subscribe bar, `?c=hn` filters to HN, and the end card pages
to issue 15; `/weekly/issue-2` shows no template placeholders; `/` and an
edition date are unchanged apart from the approved defaults; a 375px viewport
stacks the subscribe bar.

## Risks

| Risk | Mitigation |
|---|---|
| Regex scraping is brittle across old issue markup | Builder tests cover each trap the real issues hold; `validate.py` rejects a bad item (non-http URL, empty summary, stray stat) before commit. |
| `content/weekly/` is a published contract | Types in `feed.d.ts`, append-only, validated on every run. |
| Pages deploy only on push | The issue PR must include `content/weekly/`; merging publishes the page before the Substack send. |

## Open follow-ups (not this ticket)

- Vanity slugs / aliases.
- Related daily editions on the issue page.
- A "view on Substack" link once the Substack permalink is stored on the entry.
- The intro and Viral on X sections on the issue page.
