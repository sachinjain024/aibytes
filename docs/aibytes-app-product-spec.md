# aiBytes_ App - Product Spec (Draft v0.2)

**Status:** Draft for review
**Owner:** Sachin
**Last updated:** 2026-08-27 (v0.2.2: iMac runner, Firebase)
**Changes from v0.1:** static JSON architecture, daily editions with date navigation, card images per source, expanded tags, v1 sources aligned with the newsletter, Reddit and YC tag deferred, fresh design system, fetch at 13:30 IST.

---

## 1. Summary

aiBytes_ is a curated daily feed of AI resources for developers, published at `aibytes.io`. Think daily.dev, but only AI, and only from trusted sources. Each day is an **edition**: a dated snapshot of what launched, trended, and got discussed. Readers scan today's edition and can page back through previous days.

The weekly newsletter and the Chrome extension are companion surfaces built on the same content. The app is the always-on version of the same curation.

**One-liner:** *The latest in AI for developers - launches, repos, threads, and news in one daily edition.*

## 2. Goals and non-goals

**Goals**
- One place to scan what's new in AI without wading through general tech noise
- Show where each item comes from and why it matters (upvotes, stars, comments) so readers can judge signal fast
- Let readers save items with zero friction; no sign-in required to start
- Reuse the newsletter pipeline so one daily run feeds the app, the newsletter, and later the extension
- Keep infra near zero: static hosting, content as JSON

**Non-goals (v1)**
- Reddit as a source (v1.1)
- YC tag (v1.1)
- User submissions, comments, or personalization
- Full-text hosting of articles (we link out)
- Search (v1.1)
- Any auth provider other than Google

## 3. Target audience

Developers interested in AI: indie hackers, ML engineers, full-stack devs building with LLMs, founders shipping AI products. Same audience as the newsletter.

Jobs to be done:
1. "What launched today that I should try?"
2. "What repo is everyone starring right now?"
3. "What's the HN discussion I'll hear about tomorrow?"
4. "Save this so I can read it properly on the weekend."

## 4. Sources

**v1 - same as the newsletter**

| Source | What we pull | Signal shown | Card image | Category |
|---|---|---|---|---|
| Product Hunt | AI-tagged launches | Upvotes, comments | Product logo (from PH) | Launches |
| Hacker News | Front-page stories with AI relevance; Show HN | Points, comments | None; text badge "HN" | HN Threads (Show HN -> Launches) |
| GitHub Trending | AI/ML repos, daily | Stars gained, total stars, language | Org/owner avatar; Octocat fallback | Repos |
| TechCrunch | AI category | Publish date | og:image from the article | News |

**v1.1 - add**
- Reddit (r/MachineLearning, r/LocalLLaMA, r/artificial, r/ClaudeAI, r/ChatGPTCoding - final list TBD) -> Discussions
- Company blogs (OpenAI, Anthropic, Google DeepMind, Nvidia, Hugging Face, Meta AI) -> Releases / Research
- More news (The Verge AI, Ars Technica AI, VentureBeat AI) -> News

### Categories and tags

**Category** (exactly one per item, primary filter chips):
All · Launches · Repos · News · HN Threads · *(v1.1: Discussions · Releases · Research)*

**Tags** (zero or more per item, assigned by the Claude curation step, secondary multi-select filter):

| Group | Tags |
|---|---|
| What it is | Model Release · Open Source · Paper · Benchmark · Dataset · Framework · Library · Dev Tool · CLI · SDK · API |
| Domain | LLM · Agents · RAG · Fine-tuning · Inference · Local LLM · Vision · Voice / Speech · Video · Image Gen · Code Gen · Embeddings · Eval |
| Ecosystem | OpenAI · Anthropic · Google · Meta · Nvidia · Hugging Face · Mistral · xAI · Apple · Microsoft · Claude Code · Cursor · MCP |
| Business | Funding · Acquisition · Launch · Pricing · Policy · Legal · Security · Privacy |
| Format | Show HN · Tutorial · Deep Dive · Opinion · Interview · Hot Take |

Rule of thumb: 1 to 4 tags per item. Claude picks from this fixed list only (no free-form tags) so filters stay clean. The list lives in `tags.json` and can grow without a deploy of the pipeline logic. Ecosystem tags are auto-suggested from URL/domain and org name; Claude confirms.

## 5. Content pipeline and architecture

### Principle: static site, JSON as the database

Content is produced by the existing fetchers and skills, written to plain JSON files, committed to the repo, and served statically. No app server, no database for content. The only dynamic piece is auth + saves.

```
launchd on iMac (13:30 IST daily)
  -> existing Python fetchers (PH, HN, GitHub, TechCrunch) -> data/YYYY-MM-DD/*.json (raw, as today)
  -> curation skill (tweaked): dedup, relevance filter, category, tags, 1-line summary, image_url
  -> content/editions/YYYY-MM-DD.json  +  content/index.json (list of editions, counts)
  -> git commit + push from the iMac -> static host rebuilds/deploys -> aibytes.io shows today's edition
```

**Runner:** a local iMac, scheduled via `launchd` (preferred on macOS over plain cron: it runs missed jobs after sleep/wake and logs cleanly) at 13:30 IST daily. The job runs the same scripts and skill logic used for the newsletter, then `git commit && git push`; the static host deploys on push. Secrets live in a local `.env` (git-ignored) or the macOS Keychain.

Operational notes for the iMac runner:
- Set the machine to never sleep at the job window (Energy Saver / `pmset` schedule wake at 13:25 IST) or rely on launchd's catch-up on wake.
- `launchd` plist at `~/Library/LaunchAgents/io.aibytes.edition.plist` with `StartCalendarInterval` (Hour 13, Minute 30 local time; confirm the Mac's timezone is IST).
- The script logs to `logs/YYYY-MM-DD.log` and exits non-zero on failure; a simple failure hook (macOS notification or a message to yourself) so a silent miss is noticed.
- **Manual re-run:** `make edition` (or `./run.sh`) with an optional `--date` flag; the same entry point launchd calls.
- **Fallback:** keep a GitHub Actions workflow with `workflow_dispatch` only (no schedule) so an edition can be generated from anywhere if the iMac is off or away. Same script, same output.
- If a day is missed, the next run backfills only the current day; the edition bar shows the gap naturally (no fake editions).

**Skill changes needed**
- Split the current newsletter skill's "read data -> curate" step from its "render HTML" step. The curate step becomes a reusable `curate-edition` skill/script whose output is the edition JSON.
- The newsletter skill then reads the last 7 edition JSON files instead of raw `data/`, picks the week's best, and renders as today. Same curation, one code path.
- Add image resolution to the curate step (PH logo, GitHub avatar, TechCrunch og:image).
- Add a fixed-list tagging prompt (section 4).

**Relevance filter:** show **everything** that passes the filter; no per-category cap. The filter itself is the editorial line, so it should be strict rather than the cap. Log rejected items with reasons to `data/YYYY-MM-DD/rejected.json` for tuning.

### Edition JSON schema

```json
{
  "date": "2026-08-27",
  "generated_at": "2026-08-27T08:04:12Z",
  "counts": { "launches": 12, "repos": 9, "news": 7, "hn": 11 },
  "items": [
    {
      "id": "ph-chatcut-2026-08-27",
      "title": "ChatCut",
      "summary": "AI video editor inside ChatGPT with a real timeline and XML export.",
      "url": "https://chatcut.ai",
      "source": "producthunt",
      "source_url": "https://www.producthunt.com/products/chatcut-ai-video-editor",
      "category": "launches",
      "tags": ["Video", "Dev Tool", "Launch"],
      "image": { "type": "logo", "url": "https://ph-files.imgix.net/..." },
      "signals": { "upvotes": 776, "comments": 42 },
      "meta": { "language": null, "author": "..." },
      "published_at": "2026-08-26T15:02:00Z",
      "hidden": false,
      "rank": 4
    }
  ]
}
```

*Added 2026-10-09 (AIB-77u):* `rank` is the item's place in the day's one reading order across all sources, 1 first. It is optional but all-or-none per edition, `1..N` over every item including hidden ones, and written by curate at `build`. Editions published before it have none. See `docs/specs/AIB-77u-edition-rank.md`.

`image.type` is one of `logo | avatar | thumbnail | none`; the UI sizes each type differently (section 6).

**Admin hide:** flipping `hidden: true` in the edition JSON (a one-line commit, or a tiny admin script `hide.py <id>` that edits the file and pushes). The static site simply skips hidden items. Hidden IDs are also appended to `content/hidden.json` so the newsletter skill excludes them too.

## 6. Feed UI

### Layout

- Single page at `aibytes.io`, statically generated with one route per edition (`/`, `/2026-08-26`, `/2026-08-25`, ...). `/` always resolves to the latest edition.
- **Header:** logo · category chips · tag filter · view toggle (grid / list) · theme toggle · Sign in / avatar.
- **Edition bar** directly under the header, always visible:
  `← Aug 26   |   Wed, Aug 27, 2026  ·  39 items  ·  updated 4h ago   |   Aug 28 →`
  - Prev/next arrows page between editions; the right arrow is disabled on the latest.
  - Clicking the date opens a small calendar listing available editions (from `index.json`).
  - On mobile: date centered, arrows on the edges, one line.
- **No infinite scroll, no Load more.** The end of an edition shows a footer card: "That's Aug 27. ← Read Aug 26" so the path back is obvious.
- **Grid view** (default on desktop): 3 columns at 1200px+, 2 on tablet, 1 on mobile. **List view:** dense rows, one per item. Preference stored in local storage.
- Items grouped by category in edition order (Launches, Repos, News, HN Threads), each with a section heading and count; category chips scroll to the section, or filter to it when a single one is selected.

*Amended 2026-10-09 (AIB-77u):* the layout splits at **900px**. Below it, the header chips and the edition bar above stay as described. At 900px and wider, a **side nav rail** on the left replaces both, and the page goes full-bleed:
- **Date block:** "Today (Fri, Oct 9)", or the edition's date with "N days ago". "Today" and "Yesterday" are relative to the reader's local date.
- **Pager:** "← Yesterday" or the older edition's date, "Latest →" on older editions, and a "Pick a date" list of every edition with its count.
- **Categories:** All plus the four categories, each with its visible count.
- **Grid:** `minmax(272px, 1fr)` beside the rail, which gives two columns at 900px and four at 1440px.

Paging and categories keep the URL's filters, as the edition bar does. The h1 (the long date) is visually hidden when the edition bar is not shown. Phone navigation is AIB-78z. See `docs/specs/AIB-77u-app-side-nav.md`.

### Card anatomy

```
┌──────────────────────────────────────────────┐
│ [img]  Product Hunt                      ☆   │   img = 40px square, rounded 8px
│        ChatCut                               │   title = link, opens in new tab
│        AI video editor inside ChatGPT with   │
│        a real timeline and XML export.       │
│        Video · Dev Tool          ▲776  💬42  │   tags mono, signals right
└──────────────────────────────────────────────┘
```

**Image rules by source**
- Product Hunt: product logo, 40px, rounded. Fallback: PH mark.
- GitHub: owner avatar, 40px, circle. Fallback: Octocat mark. Repo language shown as a small dot + name in the meta row.
- TechCrunch: og:image as a 40px thumbnail cropped square (not a hero banner). Fallback: TechCrunch mark.
- Hacker News: no image. The source slot shows a compact "HN" tile in the source's orange, same 40px footprint so cards align.
- Images are lazy-loaded, sized with fixed dimensions to prevent layout shift, and proxied/cached at build time where the source permits so the page never hotlinks a broken image.

**List view row**
`[img 24px]  Title  -  summary            source · ▲776 · 💬42   ☆`

**Other card details**
- Source name links to the source page (PH page, HN thread, GitHub repo); title links to the destination (product site, article). For GitHub and HN these are often the same.
- Signals are only rendered when present. Order: upvotes/points, stars gained, comments.
- Hover: subtle lift + border color change; keyboard focus ring for accessibility.

### Filters

- Category chips: single select, reflected in URL (`/?c=repos`, `/2026-08-26?c=repos`) so views are shareable.
- Tag filter: multi-select dropdown grouped by the tag groups in section 4; also in URL (`&t=agents,open-source`).
- Source filter: multi-select, small.
- Filters apply within the current edition only. Cross-edition filtering ("all Agents items this month") is v1.1 and needs a search index.
- Empty state for a filter: "No Repos in this edition. ← Aug 26 had 9."

### Theme

Light and dark. Follows system by default, manual override persisted in local storage. Tokens in section 7.

### Navigation links

Header and footer both carry:
- **Newsletter** -> `aibytes.io/newsletter` (or `newsletter.aibytes.io`; final choice below). Also an inline subscribe field in the footer (Beehiiv embed).
- **Chrome Extension** -> Chrome Web Store listing. Until it ships, this links to a `/extension` "coming soon + notify me" page rather than being hidden, so the intent is visible from day one.
- GitHub (if the repo is public), X, Suggest a link (mailto or form).

## 7. Design system (fresh start)

Starting from scratch, optimized for a dense daily feed that has to be readable in both themes and calm enough to scan 40 cards. Working name: **Ledger**.

**Principles**
- Text is the interface. Images are 40px accents, never heroes.
- One accent color for interaction, one for "hot". Everything else is neutral.
- Mono for numbers and metadata so signals line up in a column.
- Same layout in light and dark; only the palette flips.

**Tokens**

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#F7F7F4` | `#0F1115` | page |
| `--surface` | `#FFFFFF` | `#171A21` | cards |
| `--surface-2` | `#F0F0EB` | `#1F232C` | chips, hover |
| `--border` | `#E3E3DC` | `#2A2F3A` | card borders, dividers |
| `--text` | `#15171C` | `#ECEDF0` | primary text |
| `--text-2` | `#5E6370` | `#9AA0AD` | summaries, meta |
| `--accent` | `#2B4EF0` | `#6C86FF` | links, active chip, focus |
| `--hot` | `#FF5C1A` | `#FF7A45` | "top today" marker, HN tile |
| `--save` | `#FFB800` | `#FFC94D` | filled star |

Cobalt survives from Bitmark as the accent because it already reads as aiBytes_ in the newsletter; the yellow moves from highlight to the star-only role. Dark accent is lifted so it passes contrast on dark surfaces.

**Type**
- Headings and logo: **Bricolage Grotesque** (keep; it is the brand voice)
- Body and UI: **Inter** (swap from Instrument Sans; tighter rendering at 14px in dense lists)
- Meta, signals, tags, dates: **JetBrains Mono** (keep)
- Scale: 13 / 14 / 16 / 20 / 28. Card title 16/600, summary 14/400, meta 12 mono.

**Shape and motion**
- Radius 10px cards, 6px chips, 8px images. 1px borders, no shadows at rest, 1px accent border on hover.
- Transitions 120ms. Respect `prefers-reduced-motion`.

**Per-source marks** (used in the 40px slot when no image): PH (orange P on white), HN (orange Y tile), GitHub (Octocat), TechCrunch (green TC). Each rendered as a tiny inline SVG so they work offline and in both themes.

## 8. Save / star

**Anonymous (default)**
- Clicking ☆ saves immediately to local storage. No modal, no interruption.
- A persistent banner appears once at least one item is saved, dismissible per session:
  > Saved items are stored in this browser only. **Sign in with Google** to keep them across devices.
- "Saved" chip appears in the header once anything is saved; it shows saved items across all editions (from local storage).

**Signed in**
- Google OAuth only.
- On first sign-in, local saves merge into the account (union), local storage is cleared, banner disappears.
- Saves store `item_id` + `edition_date` so the Saved view can render from the edition JSONs without a content DB.

**Where saves live on a static site**
**Firebase**: Firebase Auth (Google provider) + Firestore, client SDK only; no server code in the repo.

- Collection layout: `users/{uid}/saves/{itemId}` with fields `edition_date`, `created_at`. One document per save keeps writes and unsaves single-doc operations and lets the Saved view be one collection read.
- Security rules: `allow read, write: if request.auth.uid == uid` on `users/{uid}/{document=**}`.
- Merge on first sign-in: client batch-writes local saves into the user's collection, then clears local storage.
- Firestore free tier (50K reads / 20K writes per day) covers this comfortably; the Saved view reads one collection per session.
- Optional later: a scheduled Cloud Function to aggregate save counts per item into `stats/{editionDate}` so "most saved" can surface in the feed without exposing user data.

## 9. Newsletter and extension

- Newsletter moves under the brand domain: **`aibytes.io/newsletter`** (recommended; keeps one domain, better SEO) or `newsletter.aibytes.io`. Beehiiv supports custom domains and subdirectory hosting varies by plan, so check the plan before choosing; subdomain is the safe fallback.
- Weekly newsletter is generated from the last 7 edition JSONs (section 5). Each issue links back to the app editions it drew from.
- Chrome extension (later): new-tab page rendering the latest edition from the same `content/` JSON. Zero additional backend.

## 10. Hosting and stack

- **Framework:** Astro (static output, minimal JS, islands for the interactive bits: filters, star, theme, auth). Next.js static export is a fine alternative if you prefer React throughout.
- **Hosting:** Cloudflare Pages (DNS is already on Cloudflare; builds on push; free). Vercel or GitHub Pages also work.
- **Content:** `content/editions/*.json` in the repo, written by the daily job on the iMac and pushed to git.
- **Auth + saves:** Firebase Auth + Firestore (client SDK only).
- **Analytics:** Plausible or PostHog. Track outbound clicks per source and per category, save rate, sign-in conversion, edition back-navigation depth.
- **Images:** resolved and cached at build time into `public/img/` where licensing allows; otherwise hotlinked with fallback marks.

## 11. Metrics

- Daily and weekly active readers
- Outbound clicks per session; clicks per source (which sources earn their place)
- Save rate; anonymous -> Google sign-in conversion
- Editions viewed per session (does anyone page back?)
- Newsletter signups and extension "notify me" from the app

## 12. Phasing

**Phase 1 - Pipeline and static feed**
Refactor curate step out of the newsletter skill; edition JSON; launchd job on the iMac at 13:30 IST with a manual-trigger GitHub Actions fallback; Astro site with grid + list, category and tag filters, edition navigation, light/dark, per-source images, anonymous saves + banner, newsletter and extension links. Newsletter skill switched to consume edition JSON.

**Phase 2 - Accounts**
Firebase Google sign-in, saves sync and merge, Saved view, admin hide script.

**Phase 3 - v1.1**
Reddit source, company blogs, more news sites, YC tag, search and cross-edition filtering, RSS of the daily edition.

**Phase 4 - Extension**
New-tab Chrome extension on the same JSON.

## 13. Decisions log

- App at `aibytes.io` root; newsletter moves to `aibytes.io/newsletter` or `newsletter.aibytes.io`
- Daily editions, browsable by date; no Load more / infinite scroll
- Fetch runs at 13:30 IST (08:00 UTC), start of the US day, scheduled via launchd on Sachin's iMac; static host deploys on git push
- Fully automated publishing with admin hide
- Show everything that passes the relevance filter, no caps
- Static hosting; content is JSON produced by the existing fetchers/skills on cron
- v1 sources = newsletter sources (PH, HN, GitHub Trending, TechCrunch); Reddit and YC tag in v1.1
- Fresh design system (Ledger), cobalt retained as accent
- Card images: 40px, subtle, per-source rules
- Auth and saves on Firebase (existing familiarity)

## 14. Open questions

1. **Newsletter URL:** `/newsletter` path or `newsletter.` subdomain? Depends on what your Beehiiv plan supports for custom domains.
2. **Framework:** Astro (lighter, static-first) or Next.js static export (React everywhere, easier to share components with the extension later)?
3. **Repo visibility:** public repo (build in public, "Star on GitHub" link) or private? Public means the edition JSON and rejected-items log are public too.
4. **Tag list:** anything to add or cut from section 4 before it goes into the prompt?
5. **iMac availability:** is the iMac always on and online at 13:30 IST? If not, we need the `pmset` wake schedule and the Actions fallback from day one.
6. **Edition retention:** keep every edition forever (cheap, good for SEO) or archive after 90 days?
