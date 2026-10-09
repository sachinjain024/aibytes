---
format: longclaw.ticket/v1
id: d92917c2-b046-4d4c-b6f2-7f31d52b9878
key: AIB-77u
title: "Home screen: gaps between the prototype and apps/web"
status: in_progress
priority: urgent
labels:
  - app
type: feature
created_at: 2026-10-09T08:28:26.821Z
updated_at: 2026-10-09T10:17:04.828Z
---

A comparison of the home-screen prototype `docs/ux/prototypes/aiBytes_app_home.html` against the running web app (`apps/web`, `http://localhost:5173/`, edition 2026-10-09). This is an audit only; no code was changed.

## References

- **Prototype:** `docs/ux/prototypes/aiBytes_app_home.html`
- **Capability map:** `docs/specs/AIB-77u-capability-map.md`
- **Specs:**
  - `docs/specs/AIB-77u-edition-rank.md` (module 1)
  - `docs/specs/AIB-77u-app-side-nav.md` (module 2)
  - `docs/specs/AIB-77u-app-feed-order.md` (module 3)
- **Plan:** `docs/plans/AIB-77u-plan.md`
- **Task list:** `docs/plans/AIB-77u-todo.md` (T1-T9; the checklist below mirrors it)
- **Related tickets:**
  - AIB-78z: phone-width navigation
  - AIB-79t: rank backfill
  - AIB-75v: saves and sign-in

## Decisions (2026-10-09)

1. **Side nav.** The app adopts the prototype's side-nav layout: Ledger's `SideNav` carries the date block, the inline date list, categories with counts, and (once AIB-75v lands) My Starred. Header category chips and the edition bar go away at desktop width.
2. **Phone width: hide the side nav for now.** Below 900px the rail stays hidden, as Ledger already does. The narrow-width fallback is its own ticket, **AIB-78z**.
3. **Rank comes from curation.** `packages/curate` writes a rank onto each item when it builds the edition; the app sorts by it in Ranked mode. The field is additive to the published contract (`packages/feed-schema`, `feed.d.ts`, `validate.py`; see `.claude/rules/feed-schema.md`), so editions without it must still render. **The TOP-today marker is out of scope for now.**

## How this was checked

- **Prototype.** It is a bundled Claude Design export. I unpacked it and read the screen source (`AiBytesApp` plus its tweak defaults) and the bundled Ledger components, then drove it in Chrome at 1440px. It renders with its own tweak defaults: **Side nav** for categories, card signals in the **Bottom row**, **Dots** for tags, and the tagline "today's AI, in one byte".
- **Implementation.** I read `apps/web/src/App.jsx` and `app.css`, then inspected the live page in Chrome: DOM, computed grid, fonts, and console.
- **Ledger parity.** The prototype's bundled `SideNav`, `EditionBar`, `CardMenu`, `SaveStar`, `SaveBanner`, `EndCard` and `SourceMark` are byte-identical (sha256) to `packages/design-system`. `Card`, `Header`, `ListRow`, `Chip`, `Footer` and `EmptyState` differ only because the repo is newer: an optional star and sign-in, `expanded` on chips, `onClear`, and plain-text footer links. Every design token is identical; the repo only adds `--hot-text`. **So every gap below is in how the app composes Ledger, not in Ledger itself.**
- **Console.** No errors or warnings from the app.
- **Not verified live.** Phone width (375-390px): the Chrome extension disconnected during the resize, so mobile findings come from the code.

## Prototype, section by section

### 1. Header (sticky)
- **Features:** ⚡ aiBytes_ wordmark plus the tagline; a **Ranked / Grouped** segmented control (Feed order); Tags ▾ and Sources ▾ dropdown chips with a count badge; a Grid/List segmented control; a theme toggle; a **Sign in** primary button, which becomes an initial avatar once signed in. In side-nav mode the header has **no category chips**.
- **Design:** full-bleed (`app-shell--full`, no 1200px cap), 10px/20px padding, a `--bg` background with a bottom border, and the tools pushed right.

### 2. Save banner (under the header)
- **Features:** appears once something is starred while signed out: "Saved items are stored in this browser only. **Sign in with Google** to keep them across devices."
- **Design:** a `--surface-2` strip, 13px text, a bold accent link.

### 3. Side nav (left rail, 216px, sticky under the header)
- **Date block:** "**Today** (Wed, Aug 27)" on the latest edition. An older edition shows "Aug 26" with "Wed, Aug 26 · 1 day ago". Links: "← Yesterday" (or the previous short date), "Latest →" when not on the latest, and "Pick a date ▾", which expands an **inline** list of editions with item counts, the current one highlighted.
- **CATEGORIES:** All (with total), New Products, Trending Dev Projects, AI News, HN Threads, each with a count. The active row gets a `--surface-2` fill and a 2px accent inset bar.
- **LIBRARY:** "☆ My Starred" with the saved count; it opens the Saved view.
- **Design:** an 11px uppercase mono group label, 13px items, a right border; hidden below 900px.
- **No edition bar** in this mode: the date and paging live in the rail.

### 4. Feed body
- **Ranked (default):** one flat grid sorted by `rank`, then by signal (max of upvotes, points, stars/8), so sources interleave (PH, GH, HN, PH, HN …).
- **Grouped:** one section per category in edition order, each with a `SectionHeading` ("New Products · 4", Bricolage 20/700 plus a mono count) and a 40px section gap.
- **Grid:** `repeat(auto-fill, minmax(360px, 1fr))` in the side-nav layout, which gives **4 columns at 1440px**, with 20px/28px main padding.
- **List view:** `ListRow`s with a ☆ and a ⋮ on every row.
- **Saved view:** starred items grouped by edition date, or "Nothing saved yet. Tap ☆ on any card to keep it here."
- **Empty state:** in Grouped mode, a single-category filter with no items links to the most recent earlier edition that had that category.

### 5. Card
- **Features:** the source row (link to the source page); the title (2-line clamp, h3); the summary (2-line clamp); signals bottom-left under the logo (▲ upvotes or +stars ★); dot-separated tags with a language dot for repos; a ⋮ CardMenu (share/copy); a **☆ SaveStar** top-right; a **TOP marker** on the day's top item (a hot-orange "TOP" label in the source row plus a 2px `--hot` left-edge stripe).
- **Design:** a 40px logo or SourceMark slot (circle for GitHub/avatars), 16px padding, 10px radius, and on hover an accent border plus a 1px lift.

### 6. End card
- "Thank you for reading. That's it for today. View Yesterday's bites" on a mono 13px bordered card. Hidden in the Saved view.

### 7. Footer (sticky bottom)
- Chrome Extension · GitHub · X · Advertise | "Join 1K+ developers reading aiBytes_ weekly" + **Subscribe**.

## Missed features (in the prototype, not in the app)

1. **Side nav with the date block and inline date list.** The app uses the header-chip and edition-bar layout instead. Ledger's `SideNav` is already in the package and identical to the prototype's, but `App.jsx` never renders it.
2. **Ranked / Grouped feed-order toggle.** `Header` supports `mode`/`onMode`; the app does not pass them, so the control is absent.
3. **Ranked ordering.** The app renders items in file order (all PH, then GH, then TC, then HN). The edition JSON has no `rank` or `top` field (`content/editions/2026-10-09.json` keys: id, title, summary, url, source, source_url, category, tags, image, signals, published_at, hidden, meta), so ranking needs either a client-side signal sort or an additive schema field set by `curate`. Per `.claude/rules/feed-schema.md`, add fields, never rename them.
4. **Grouped view with section headings.** The app renders one flat grid with no `SectionHeading`s. Product spec §6 (line 154) calls for "Items grouped by category in edition order … each with a section heading and count", so today the app matches neither the spec nor either prototype mode.
5. **TOP-today marker.** `Card` takes `topToday`; the app never passes it, and the data has nothing to drive it.
6. **Save star on cards and rows, the save banner, the My Starred / Saved view, and Sign in plus avatar.** All are absent by design: deferred to **AIB-75v** (Saves and Google sign-in). Listed here for completeness, not as new scope.
7. **Category-level empty state with "← <date> had N".** The prototype finds the last edition that *had that category*. The app's `EmptyState` looks only at the immediately older edition and otherwise offers "Clear filters." That is a different (arguably better) rule; confirm which you want.

## Design gaps (present in both, but different)

1. **Page width.** The prototype is full-bleed (header, banner, and footer content span the viewport). The app caps everything at `--content-max` 1200px and centres it, which leaves wide side margins at 1440px.
2. **Grid density.** The prototype has 4 columns of ~382px at 1440px (`minmax(360px,1fr)` beside the rail). The app has 3 columns of ~389px (`minmax(min(300px,100%),1fr)` inside 1200px). Item count above the fold differs noticeably.
3. **Main padding.** The prototype uses 20px 28px beside the rail; the app uses 20px all round.
4. **Category navigation placement.** The prototype puts the categories in the rail, with an **All** row carrying the total count and an accent inset bar on the active row. The app puts them in header chips; the All chip has **no count**.
5. **Date and paging presentation.** The prototype's rail shows "Today (Wed, Aug 27)", "← Yesterday", "Latest →" and relative "N days ago" text. The app's edition bar shows "← Oct 8", "Fri, Oct 9, 2026 · 28 items · updated 25m ago" and "→". "Yesterday", "Today" and "Latest" wording is absent, and the date picker is a popover, not an inline list.
6. **Default theme.** The prototype opens in light mode; the app follows the OS (dark here). This is likely intentional (`hooks.js useTheme`). Flagging only so the prototype and the decision record agree.
7. **Footer links.** The app adds "Suggest a link" and "Chrome Extension (soon)" as plain text, from spec §6 via `apps/web/src/footer.js`. This is a deliberate deviation; no action unless the prototype is meant to win.

Everything else matches: wordmark with ⚡, tagline, Tags/Sources popovers (grouped chips, 540px/300px), grid/list toggle, theme toggle, card anatomy (bottom signals, dot tags, language dot, ⋮ menu, clamps), the end-card copy, the sticky header and footer, tokens, and fonts (Bricolage 800, Inter 400–700, JetBrains Mono 400–700 all loaded).

## Open questions

All three are resolved; see **Decisions** at the top. Recorded as asked:

- ~~Side nav or header chips?~~ Side nav.
- ~~Phone with the side nav.~~ Hidden below 900px for now; fallback in AIB-78z.
- ~~Ranking source.~~ A rank field written at curation. TOP marker skipped.

## Checklist

- [x] Decide: side nav or header chips - side nav; phone fallback split to AIB-78z <!-- longclaw:item=ck_24c49daa -->
- [x] Decide ranking source - a rank field written at curation; TOP marker skipped <!-- longclaw:item=ck_c9b3e4a8 -->
- [x] T1 Contract: rank in edition.schema.json, validate.py, feed.d.ts (all-or-none, 1..N) <!-- longclaw:item=ck_7c87ab48 -->
- [ ] T2 Curate writes rank at build (rank.py, TIE_ORDER GitHub / HN / TechCrunch / PH) <!-- longclaw:item=ck_1977fc3a -->
- [ ] T3 Ledger SideNav fixes: date-list ARIA, footer overlap, landmark name <!-- longclaw:item=ck_0e92b55d -->
- [ ] T4 rail.js: calendar-true Today / Yesterday / Latest labels, node --test <!-- longclaw:item=ck_f703ec20 -->
- [ ] T5 Rail in apps/web at 900px+ (counts incl. All, full-bleed, 300px grid, hidden h1); today's chips + bar below 900px; product spec §6 amendment <!-- longclaw:item=ck_6bbfa9e0 -->
- [ ] T7 order.js: rank order, with the rank.py fallback for rank-less editions; TIE_ORDER drift guard <!-- longclaw:item=ck_221ae1ac -->
- [ ] T8 Ranked default: aibytes-order pref, Ranked | Grouped control at 700px+, ranked rendering <!-- longclaw:item=ck_8d4e9fd4 -->
- [ ] T9 Grouped: a SectionHeading per category (product spec §6); §6 amendment <!-- longclaw:item=ck_066c6df9 -->

## Activity

<!-- longclaw:event
id: evt_6973f789
kind: create
occurred_at: 2026-10-09T08:28:26.821Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
-->
### Claude Code created this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_7b170dfb
kind: update
occurred_at: 2026-10-09T08:31:47.611Z
actor:
  type: human
  id: local
changes:
  - field: status
    from: todo
    to: in_progress
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_bd144691
kind: update
occurred_at: 2026-10-09T08:31:49.709Z
actor:
  type: human
  id: local
changes:
  - field: priority
    from: p2
    to: urgent
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_be3f78f1
kind: update
occurred_at: 2026-10-09T08:44:23.522Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: description
  - field: checklist.ck_24c49daa.checked
    from: "false"
    to: "true"
  - field: checklist.ck_c9b3e4a8.checked
    from: "false"
    to: "true"
  - field: checklist.ck_24c49daa.text
    from: "Decide: side nav or header chips (plus a phone fallback for the side nav)"
    to: "Decide: side nav or header chips - side nav; phone fallback split to AIB-78z"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_f78657b2
kind: update
occurred_at: 2026-10-09T08:44:33.181Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_c9b3e4a8.text
    from: "Decide ranking source: client-side signal sort or a rank/top field from curate"
    to: Decide ranking source - a rank field written at curation; TOP marker skipped
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_e14514c4
kind: update
occurred_at: 2026-10-09T08:44:33.203Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_2a31eed3.removed
    from: TOP-today marker on the top item
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_22c1430e
kind: update
occurred_at: 2026-10-09T08:44:33.222Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_e288d94c.text
    from: "Layout: full-bleed width, 4-column grid at 1440, rail padding (if side nav is chosen)"
    to: "Layout: full-bleed width, 4-column grid at 1440, rail padding 20px/28px"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_978e00bc
kind: update
occurred_at: 2026-10-09T08:44:33.237Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_221ae1ac.text
    from: Ranked ordering of the flat grid
    to: "Ranked ordering: sort by the curated rank, falling back to signals when an edition has none"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_d4bc7026
kind: update
occurred_at: 2026-10-09T08:44:33.254Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_7c87ab48.added
    to: "Rank field: feed-schema (feed.d.ts, validate.py), written by packages/curate, with tests"
  - field: checklist.ck_6bbfa9e0.added
    to: Render Ledger SideNav in apps/web; drop header chips and the edition bar at desktop width
  - field: checklist.ck_fdb390c8.added
    to: Side nav hidden below 900px (phone fallback is AIB-78z)
-->
### Claude Code updated this ticket

Decisions from Sachin, 2026-10-09: (1) adopt the side nav; (2) hide it below 900px for now, phone-width navigation split to AIB-78z; (3) add a rank field to the edition data at curation time, and skip the TOP-today marker for now. Description and checklist updated to match.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_ccf32ce1
kind: comment
occurred_at: 2026-10-09T09:16:20.091Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
-->
### Claude Code commented

Spec work started (spec-driven development, Phase 0). Capability map: docs/specs/AIB-77u-capability-map.md, with three modules (edition-rank, app-side-nav, app-feed-order) and their build order. Decided 2026-10-09: below 900px keep today's header chips and edition bar until AIB-78z; rank is a deterministic score in curate; the default order is Ranked, remembered in local storage; backfill rank into both published editions. Module specs will follow at docs/specs/AIB-77u-<module-id>.md once the map is approved.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_037a02f0
kind: comment
occurred_at: 2026-10-09T09:20:27.507Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
-->
### Claude Code commented

Spec for module edition-rank (1 of 3) drafted: docs/specs/AIB-77u-edition-rank.md. Optional all-or-none rank 1..N per edition (hidden items included), computed in curate from each item's standing within its own source, interleaved by adapters.ORDER. Backfill through a new curate.py rank --date subcommand that changes only rank. Awaiting review; open questions are listed at the end of the spec.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_b5713f0c
kind: comment
occurred_at: 2026-10-09T09:51:21.551Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
-->
### Claude Code commented

edition-rank spec revised 2026-10-09: the backfill moved to its own ticket, AIB-79t (route chosen there), so this module changes no published file; ties at equal standing break GitHub, Hacker News, TechCrunch, Product Hunt via a rank-only TIE_ORDER, leaving the file's reading order (adapters.ORDER) unchanged.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_20510290
kind: comment
occurred_at: 2026-10-09T09:56:15.244Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
-->
### Claude Code commented

Spec for module app-side-nav (2 of 3) drafted: docs/specs/AIB-77u-app-side-nav.md. Decided 2026-10-09: calendar-true Today/Yesterday for the reader's local date; no item count or updated-ago in the rail (as in the prototype); 'Latest →' as the forward link; Ledger's SideNav date-list ARIA, footer overlap, and landmark name fixed in this module as their own commit. Open question: 900-1008px shows one column with the prototype's 360px minimum (recommend 300px). Awaiting review.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_310c037f
kind: comment
occurred_at: 2026-10-09T09:59:13.283Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
-->
### Claude Code commented

Specs complete for all three modules (2026-10-09): app-side-nav updated to a 300px grid minimum beside the rail (two columns at 900px, four at 1440px); app-feed-order drafted at docs/specs/AIB-77u-app-feed-order.md (Ranked default, remembered as aibytes-order; Grouped with a SectionHeading per category; a client-side fallback matching rank.py for rank-less editions, with a TIE_ORDER drift test; control hidden below 700px pending review). Awaiting review.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_d1d131cd
kind: update
occurred_at: 2026-10-09T10:05:42.584Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: description
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_1dad9950
kind: update
occurred_at: 2026-10-09T10:05:42.601Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_7c87ab48.text
    from: "Rank field: feed-schema (feed.d.ts, validate.py), written by packages/curate, with tests"
    to: "T1 Contract: rank in edition.schema.json, validate.py, feed.d.ts (all-or-none, 1..N)"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_57042fa9
kind: update
occurred_at: 2026-10-09T10:05:42.623Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_f703ec20.text
    from: Today / Yesterday / Latest wording in date paging
    to: "T4 rail.js: calendar-true Today / Yesterday / Latest labels, node --test"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_76bfb13f
kind: update
occurred_at: 2026-10-09T10:05:42.648Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_6bbfa9e0.text
    from: Render Ledger SideNav in apps/web; drop header chips and the edition bar at desktop width
    to: T5 Rail in apps/web at 900px+ (counts incl. All, full-bleed, 300px grid, hidden h1); today's chips + bar below 900px; product spec §6 amendment
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_85effc48
kind: update
occurred_at: 2026-10-09T10:05:42.673Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_221ae1ac.text
    from: "Ranked ordering: sort by the curated rank, falling back to signals when an edition has none"
    to: "T7 order.js: rank order, with the rank.py fallback for rank-less editions; TIE_ORDER drift guard"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_13f329f5
kind: update
occurred_at: 2026-10-09T10:05:42.701Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_8d4e9fd4.text
    from: Ranked / Grouped feed-order toggle in the header
    to: "T8 Ranked default: aibytes-order pref, Ranked | Grouped control at 700px+, ranked rendering"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_b2d1b7f5
kind: update
occurred_at: 2026-10-09T10:05:42.722Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_066c6df9.text
    from: Grouped view with a SectionHeading per category (spec §5)
    to: "T9 Grouped: a SectionHeading per category (product spec §6); §6 amendment"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_654849a9
kind: update
occurred_at: 2026-10-09T10:05:42.742Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_e288d94c.removed
    from: "Layout: full-bleed width, 4-column grid at 1440, rail padding 20px/28px"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_d1a0202f
kind: update
occurred_at: 2026-10-09T10:05:42.760Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_ab77df4a.removed
    from: Count on the All category
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_6299a3a7
kind: update
occurred_at: 2026-10-09T10:05:42.779Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_fdb390c8.removed
    from: Side nav hidden below 900px (phone fallback is AIB-78z)
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_b46d44c0
kind: update
occurred_at: 2026-10-09T10:05:42.800Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_1977fc3a.added
    to: T2 Curate writes rank at build (rank.py, TIE_ORDER GitHub / HN / TechCrunch / PH)
  - field: checklist.ck_0e92b55d.added
    to: "T3 Ledger SideNav fixes: date-list ARIA, footer overlap, landmark name"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_7ee74728
kind: update
occurred_at: 2026-10-09T10:05:50.193Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_7c87ab48.moved
    from: "7"
    to: "3"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_959ab465
kind: update
occurred_at: 2026-10-09T10:05:50.214Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_1977fc3a.moved
    from: "9"
    to: "4"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_ab9ba85b
kind: update
occurred_at: 2026-10-09T10:05:50.235Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_0e92b55d.moved
    from: "10"
    to: "5"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_3db2e3b5
kind: update
occurred_at: 2026-10-09T10:05:50.253Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_f703ec20.moved
    from: "9"
    to: "6"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_99369e98
kind: update
occurred_at: 2026-10-09T10:05:50.276Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_6bbfa9e0.moved
    from: "10"
    to: "7"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_ac7cd57e
kind: update
occurred_at: 2026-10-09T10:05:50.296Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_221ae1ac.moved
    from: "10"
    to: "8"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_c459f149
kind: comment
occurred_at: 2026-10-09T10:05:50.341Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
-->
### Claude Code commented

Plan written (2026-10-09): docs/plans/AIB-77u-plan.md and docs/plans/AIB-77u-todo.md, nine tasks (T1-T9; T6 folded into Checkpoint 2) in three PRs, one per module. The checklist now mirrors the tasks: the layout, All-count and below-900px items folded into T5; T2 and T3 added; the ranked-fallback item now matches the spec (the rank.py calculation, not signals). Also fixed the audit's product-spec reference (§6, not §5) and added a References section to the description.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_118957d0
kind: update
occurred_at: 2026-10-09T10:17:04.828Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_7c87ab48.checked
    from: "false"
    to: "true"
-->
### Claude Code updated this ticket

T1 done: rank is in edition.schema.json, validate.py (ITEM_OPTIONAL, RANK_MIN, the all-or-none 1..N check) and feed.d.ts, with tests in test_feed_schema.py and test_hide.py. Suites green; published content still validates (no ranks yet, which is valid).
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_cfae3793
kind: comment
occurred_at: 2026-10-09T10:17:26.490Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
-->
### Claude Code commented

T1 PR opened: https://github.com/sachinjain024/aibytes/pull/24 (also carries the tickets, specs, and plan). T2 starts on a fresh branch from main once it merges.
<!-- /longclaw:event -->
