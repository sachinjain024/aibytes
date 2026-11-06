# Spec: publish the weekly issue on aibytes.io/weekly (AIB-105j)

Status: **draft 2026-11-06.**
Ticket: `.longclaw/tickets/AIB-105j/ticket.md`.

## Objective

Publish each weekly aiBytes_ issue on our own site at
`https://aibytes.io/weekly/<slug>` **before** the Substack send, and make that
URL the issue's home on the app domain.

- Substack keeps sending the email from `newsletter.aibytes.io` (AIB-134j).
- The newsletter HTML, social posts, and any "read the full issue" link use
  `https://aibytes.io/weekly/<slug>` as `ISSUE_URL`. The Substack post URL is
  secondary (archive / email permalink).
- Search engines index the weekly archive on `aibytes.io` as well as on
  Substack.
- We control the page: subscribe CTA, archive index, links into daily
  editions, without Substack's editor limits.

### Who sees it

Readers who open a weekly link from social, the newsletter footer, or the
`/weekly` archive. Daily-edition readers of the app stay on `/` and
`/YYYY-MM-DD`; weekly is a sibling surface on the same host.

## Decisions (ticket open questions)

| Question | Decision |
|---|---|
| Slug format | **`issue-{N}`** — e.g. `/weekly/issue-16`. Stable, back-fillable from the existing `week-*-Issue-N` folders, short enough for X. The issue `<title>` and meta description carry the SEO hooks; a descriptive vanity slug is deferred. |
| Page source | **Ledger app shell**, same as the daily edition (`list` + `grouped` by default). Items come from `content/weekly/issues/issue-N.json` (extracted from the issue HTML: AI News, Products, Repos, HN). Intro, Official Announcements, and Viral on X are omitted for now. |
| `/weekly` index | **Yes.** A Ledger React page lists every published issue, newest first. |
| Canonical URL | `https://aibytes.io/weekly/issue-{N}`. Injected into each published page at build time. |

### Why not re-render in React

`aiBytes-issue-N.html` is a self-contained document with its own fonts, CSS, and
measure. Wrapping it in Ledger would either fight that CSS or discard the
newsletter design the issue was written for. The product need is a durable URL
and a subscribe CTA, not a redesign of the weekly layout.

### Why `issue-{N}` over a date or a hook slug

- Daily editions already own `/YYYY-MM-DD`. A date path for weekly would
  collide in meaning and confuse routing.
- Hook-based slugs (`issue-14-claude-ecdsa-meta-muse`) need a naming step on
  every issue and make back-fill a judgement call. `issue-{N}` is determined by
  the folder name already on disk.
- A later ticket can add vanity aliases that 302 to `issue-{N}` without
  changing `ISSUE_URL`.

## What ships

### 1. Published contract: `content/weekly/index.json`

Newest first. One entry per published issue:

```json
{
  "schema_version": "1.0",
  "issues": [
    {
      "number": 16,
      "slug": "issue-16",
      "title": "A backdoored Claude Code extension and Anthropic's S-1",
      "description": "Plus Google's Genie 4 world model, …",
      "published_on": "2026-11-03",
      "source": "newsletter/issues/2026/week-45-Issue-16/aiBytes-issue-16.html"
    }
  ]
}
```

- `slug` is always `issue-{number}` in v1.
- `source` is repo-relative; the Vite build reads that file. The HTML is **not**
  duplicated under `content/` (the newsletter issue folder remains the source of
  truth; `content/weekly/` only indexes what is live on the site).
- `published_on` is the Monday send date (ISO date).
- Append-only for fields, same discipline as the daily feed contract: add keys,
  do not rename or remove them.

`validate.py` gains a check that every `source` exists, every `slug` matches
`issue-{number}`, and numbers are unique. Weekly is optional for the daily
runner; a missing `content/weekly/` is fine until the first back-fill lands.

### 2. Routes in `apps/web`

| Path | Kind | Behaviour |
|---|---|---|
| `/weekly` | `weekly_index` | React page (Ledger): list from `content/weekly/index.json`. |
| `/weekly/` | same | trailing slash accepted. |
| `/weekly/issue-{N}` | `weekly_issue` | Served as the static issue HTML at build time (see below). Client-side, a hit on this path inside the SPA is a full navigation to the static page (or a soft not-found if the build has no such page). |
| `/p/<slug>` | `issue` (existing) | Keep redirecting to `https://newsletter.aibytes.io/p/<slug>` — old Beehiiv links and any residual `/p/` bookmarks. Do not retarget `/p/` at `/weekly`. |

`parseRoute` gains the two weekly kinds. Edition date paths and `/` are
unchanged. `NEWSLETTER_ORIGIN` and `SUBSCRIBE_URL` keep pointing at
`https://newsletter.aibytes.io` / `…/subscribe` (Substack after AIB-134j).

### 3. Build: real pages on GitHub Pages

Mirror `editionPages` in `apps/web/vite.config.js`:

1. Read `content/weekly/index.json` (skip cleanly if absent).
2. For each issue, read `source`, inject before `</head>`:
   - `<link rel="canonical" href="https://aibytes.io/weekly/{slug}">`
   - optional OG URL matching the canonical
3. Inject a **subscribe CTA** into the body (see §4).
4. Write `dist/weekly/{slug}/index.html`.
5. Write `dist/weekly/index.html` as a copy of the app `index.html` (SPA shell
   for the archive route), same pattern as edition date folders.

Dev server: serve each issue HTML at `/weekly/{slug}/` from the `source` path
(with the same injections), and let the SPA handle `/weekly`.

### 4. Substack subscribe CTA

Covers AIB-134j checklist item "Embed a custom subscribe button in the weekly
pages" by landing it here once `/weekly` exists.

- Placement: a compact bar **above the issue masthead** (and a matching line in
  the issue footer if the template has one), so a cold visitor from social can
  subscribe without scrolling past the whole issue.
- Action: link (or Substack embed iframe if we adopt their button snippet) to
  `SUBSCRIBE_URL` (`https://newsletter.aibytes.io/subscribe`).
- Copy: short, Substack-native — e.g. "Get aiBytes_ every Monday" + "Subscribe".
- Styling: use the issue's own palette tokens (`--cobalt`, `--ink`, `--line`) so
  the bar matches the newsletter page; do not pull Ledger into the issue HTML.
- The `/weekly` archive page uses Ledger and the existing footer Subscribe
  control.

### 5. Generate-newsletter-content publish step

After the issue HTML (and Substack export) are written, and **before** the
human pastes into Substack:

1. Derive `number`, `title`, `description`, `published_on`, `source`, `slug`.
2. Upsert the entry at the front of `content/weekly/index.json`.
3. Tell the operator that merging the issue PR (or pushing `content/weekly/` +
   the issue HTML) deploys `aibytes.io/weekly/issue-{N}`.
4. Set `ISSUE_URL=https://aibytes.io/weekly/issue-{N}` for social posts and any
   in-issue "share this issue" link. The Substack editor URL is recorded
   separately when known; it is not `ISSUE_URL`.

### 6. Back-fill

One pass over `newsletter/issues/2026/week-*-Issue-*` (issues 1–16 today):

- Build `content/weekly/index.json` for every folder that has
  `aiBytes-issue-N.html`.
- `published_on`: Monday of that ISO week when known from the issue chrome;
  otherwise the Monday of `week-NN` in that year.
- Titles/descriptions: from each file's `<title>` and meta description
  (strip a leading `aiBytes_ #N - ` / `aiBytes_ 0N:` brand prefix for the
  index card title when present).
- No need to rewrite old social posts; new links use the new URLs.

## Out of scope

- Redesigning the weekly issue HTML in Ledger.
- Changing daily edition routes or the `/p/` → newsletter redirect target.
- Hosting the Substack email HTML on aibytes.io (email stays on Substack).
- Removing Beehiiv tooling (AIB-135b).
- Descriptive vanity slugs and 302 aliases.
- Related-daily-edition chips on the issue page (nice follow-up; the archive
  and canonical URL come first).

## Files expected to change

| Path | Role |
|---|---|
| `docs/specs/AIB-105j-weekly-publish.md` | this spec |
| `content/weekly/index.json` | published weekly index (back-fill + each new issue) |
| `apps/web/src/route.js` + `route.test.js` | `/weekly` and `/weekly/issue-N` |
| `apps/web/src/content.js` | `loadWeeklyIndex()` |
| `apps/web/src/App.jsx` (+ small CSS) | `/weekly` archive view |
| `apps/web/vite.config.js` | weekly static pages + CTA/canonical injection |
| `apps/web/src/main.jsx` | stop treating `/weekly/...` as a soft SPA miss; issue pages are static |
| `packages/feed-schema/validate.py` (+ tests) | weekly index invariants |
| `.claude/skills/generate-newsletter-content/SKILL.md` | publish step + `ISSUE_URL` |
| `.claude/skills/generate-followup-social-content/SKILL.md` | `ISSUE_URL` = aibytes.io/weekly |
| `docs/aibytes-app-product-spec.md` | note `/weekly` as the owned archive (short amendment) |

## Testing strategy

```bash
npm test -w @aibytes/web          # route + any new weekly helpers
npm run build:web                 # dist/weekly/issue-N/index.html exists; canonical + CTA present
python3 packages/feed-schema/validate.py
python3 -m unittest discover -s tests -v   # validate.py coverage for weekly
npm run dev:web                   # /weekly lists issues; /weekly/issue-16 serves the HTML
```

Browser checks before the PR is done:

1. `/weekly` — list, newest first, each row links to `/weekly/issue-N`.
2. `/weekly/issue-16` — full issue renders, canonical link present, subscribe
   CTA works (opens Substack subscribe).
3. `/` and `/2026-10-07` — daily app unchanged.
4. `/p/gemini-4-argon` — still redirects to `newsletter.aibytes.io`.
5. Narrow viewport on an issue page — CTA and masthead readable.

## Risks

| Risk | Mitigation |
|---|---|
| Issue HTML and SPA share a host; a client navigate to `/weekly/issue-N` from `/weekly` may stay in the SPA | Use a plain `<a href>` (full load) from the archive to issue pages, or `window.location.assign`. |
| Build breaks if `source` path is missing | validate.py + build fail loud with the slug named. |
| CTA injection is brittle across old issue markup | Prefer inserting as first child of `body` (or `.wrap` when present); cover issues 1 and 16 in the build test. |
| AIB-134j still open; subscribe URL must stay Substack | `SUBSCRIBE_URL` already uses `NEWSLETTER_ORIGIN`; do not hard-code beehiiv.com. |
| Pages deploy only on push | The generate skill states that the issue PR must include `content/weekly/index.json` so merge publishes the page before the Substack send. |

## Open follow-ups (not this ticket)

- Vanity slugs / aliases.
- Related daily editions on the issue page.
- Whether `/weekly/issue-N` should offer a "view on Substack" secondary link once the Substack permalink is stored on the index entry.
