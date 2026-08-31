# aiBytes_ Design System Brief

**For:** Claude Design
**Deliverable:** A complete design system ("Ledger") plus the core screens of the aiBytes_ app, ready to hand to a developer building in Astro
**Owner:** Sachin
**Source spec:** aiBytes_ App Product Spec v0.2.2

---

## 1. What we're designing

aiBytes_ is a curated daily feed of AI resources for developers at `aibytes.io`. Think daily.dev, but only AI, and only from trusted sources. Each day is an **edition**: a dated snapshot of what launched, trended, and got discussed. Readers scan today's edition and can page back through previous days.

**One-liner:** The latest in AI for developers - launches, repos, threads, and news in one daily edition.

The app is one of three surfaces on the same content: the app (daily), the weekly Beehiiv newsletter, and a later Chrome new-tab extension. The design system must work across all three, so tokens and components should be portable, not page-specific.

**The single job of the main page:** let a developer scan 30 to 50 items in under three minutes and know, from the card alone, where each came from and whether it's worth a click.

## 2. Audience and tone

Developers building with AI: indie hackers, ML engineers, full-stack devs, founders shipping AI products. They live in terminals, GitHub, and Hacker News. They distrust marketing polish and respect density, precision, and honesty about signal.

**Tone words:** dense, calm, honest, technical, quietly opinionated.
**Not:** playful startup, glassmorphism, gradient hero, "AI-generated dashboard" look, marketing landing page.

The existing brand voice is already set by the newsletter: a wordmark `⚡ AI Bites_` with the trailing underscore in cobalt, hex-numbered sections (`0x01`, `0x02`), mono for stats, and a black "TL;DR" block with a clipped corner. Ledger is a fresh system for the app, but it should feel like the same publisher.

## 3. Design principles (non-negotiable)

1. **Text is the interface.** Images are 40px accents in a fixed slot, never heroes or banners.
2. **One accent, one hot.** Cobalt for anything interactive; hot orange only for "top today" and the HN tile. Everything else is neutral.
3. **Mono for numbers and metadata** so signals (upvotes, stars, comments) line up in a column across cards.
4. **Same layout in light and dark.** Only the palette flips; no structural differences between themes.
5. **Numbering and structure must encode something true.** Editions are dated because dates carry meaning. Sections are ordered (Launches, Repos, News, HN Threads) because that's edition order. Don't add decorative numbering elsewhere.
6. **No shadows at rest.** 1px borders; hover is a border-color change plus a subtle lift.

## 4. Tokens

Use these exactly. Extend where needed (spacing, z-index, states) but do not replace them.

### Color

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#F7F7F4` | `#0F1115` | page |
| `--surface` | `#FFFFFF` | `#171A21` | cards |
| `--surface-2` | `#F0F0EB` | `#1F232C` | chips, hover, inputs |
| `--border` | `#E3E3DC` | `#2A2F3A` | card borders, dividers |
| `--text` | `#15171C` | `#ECEDF0` | primary text |
| `--text-2` | `#5E6370` | `#9AA0AD` | summaries, meta |
| `--accent` | `#2B4EF0` | `#6C86FF` | links, active chip, focus ring |
| `--hot` | `#FF5C1A` | `#FF7A45` | "top today" marker, HN tile |
| `--save` | `#FFB800` | `#FFC94D` | filled star only |

Notes:
- Cobalt is inherited from the newsletter's Bitmark system and is the brand carry-over. Do not change it.
- The newsletter's signal yellow (`#FFD338`) is retired as a highlight. In the app, yellow lives only in the filled save star.
- Dark accent is lifted deliberately to pass contrast on dark surfaces; check all text-on-accent and accent-on-surface pairs at AA minimum.
- Define hover, active, focus, and disabled states for `--accent` and for chips. Define a `--hot` tint for the "top today" background if one is needed.

### Type

| Role | Face | Notes |
|---|---|---|
| Logo, headings, section titles | **Bricolage Grotesque** | Brand voice; keep. Weights 500 / 700 / 800 |
| Body, UI, card text | **Inter** | Swapped from Instrument Sans for tighter rendering at 14px in dense lists |
| Meta, signals, tags, dates, edition bar | **JetBrains Mono** | Keep. Weights 400 / 500 / 700 |

**Scale:** 13 / 14 / 16 / 20 / 28.
Card title 16/600. Summary 14/400. Meta 12 mono. Section heading 20/700. Page-level wordmark 28/800.

Set line-heights, letter-spacing (headings slightly tight, mono slightly loose), and tabular numerals on all mono usage so counts align.

### Shape and motion

- Radius: 10px cards, 6px chips, 8px images, 2px focus ring offset
- Borders: 1px everywhere; hover swaps `--border` for `--accent`
- Transitions: 120ms ease; respect `prefers-reduced-motion` (drop the hover lift, keep the color change)
- Spacing: define a 4px base scale; card padding 16px, grid gap 16px, section gap 40px

### Per-source marks

Tiny inline SVGs for the 40px image slot when no image exists. Must work offline and in both themes:
- Product Hunt: orange P on white
- Hacker News: orange Y tile (in `--hot`)
- GitHub: Octocat mark
- TechCrunch: green TC

## 5. Components

Design each component in light and dark, with all states listed.

### Wordmark
`⚡ aiBytes_` in Bricolage Grotesque 800, trailing underscore in `--accent`. Provide a compact version for the header and a favicon/extension icon version.

### Header
Logo · category chips · tag filter · source filter · view toggle (grid / list) · theme toggle · Sign in / avatar. Sticky. Collapses gracefully on mobile (chips become a horizontal scroll row).

### Edition bar
Always visible directly under the header. This is the **signature element** of the product: a dated, pageable ledger of days.

```
← Aug 26   |   Wed, Aug 27, 2026  ·  39 items  ·  updated 4h ago   |   Aug 28 →
```

- Prev/next arrows page between editions; the right arrow is disabled on the latest.
- Clicking the date opens a small calendar popover listing available editions.
- Mobile: date centered, arrows at the edges, one line.
- Set in JetBrains Mono. Give it enough presence that a reader always knows *which day* they're looking at.

### Card (grid view)

```
┌──────────────────────────────────────────────┐
│ [img]  Product Hunt                      ☆   │   img = 40px, rounded per source
│        ChatCut                               │   title = link, opens new tab
│        AI video editor inside ChatGPT with   │
│        a real timeline and XML export.       │
│        Video · Dev Tool          ▲776  💬42  │   tags mono, signals right
└──────────────────────────────────────────────┘
```

Image rules by source:
- Product Hunt: product logo, 40px, rounded 8px
- GitHub: owner avatar, 40px, circle; repo language as a small colored dot + name in the meta row
- TechCrunch: og:image cropped square, 40px, rounded 8px
- Hacker News: no image; the "HN" tile fills the same 40px footprint so cards align

Details:
- Source name links to the source page; title links to the destination
- Signals render only when present, in order: upvotes/points, stars gained, comments
- Star: outline at rest, `--save` fill when saved; tap target at least 32px
- A "top today" variant with a `--hot` marker (a left edge, dot, or label - pick one)
- States: default, hover, focus-visible, saved, top-today, no-image, long-title (2-line clamp), no-signals

### Card (list view)

```
[img 24px]  Title  -  summary            source · ▲776 · 💬42   ☆
```

Dense, one row per item, borders between rows, summary truncated to one line.

### Section heading
Category name + count (`Repos · 9`). Bricolage 20/700. Sits at the top of each category group in edition order.

### Filter chips
Category: single-select, one active at a time. Tag filter: multi-select dropdown grouped by tag group (What it is / Domain / Ecosystem / Business / Format). Source filter: small multi-select. States: default, hover, active, focus, disabled, with count badges.

### Tags
Mono 12, `--text-2`, separated by `·` on cards. When used as filter chips they take chip styling.

### Save banner
Appears once anything is saved, dismissible per session:
> Saved items are stored in this browser only. **Sign in with Google** to keep them across devices.

Quiet, inline, not a toast. Should not push the edition bar.

### Empty and end states
- Filter empty state: "No Repos in this edition. ← Aug 26 had 9."
- End of edition footer card: "That's Aug 27. ← Read Aug 26"
- Both are invitations to act, not mood. Same card language as content cards.

### Buttons and inputs
Primary (accent fill), secondary (border), ghost. One text input style (used for the newsletter subscribe field in the footer). Google sign-in button per Google's brand rules but tuned to the token set.

### Calendar popover
Lists available edition dates from the index. Missing days are simply absent, not greyed - there are no fake editions.

### Footer
Links to Newsletter, Chrome Extension (or "coming soon + notify me"), GitHub, X, Suggest a link. Inline subscribe field.

## 6. Screens to produce

1. **Latest edition, grid view, light** - the hero screen (desktop 1280)
2. **Latest edition, grid view, dark**
3. **List view, desktop**
4. **Mobile edition view** (375 wide): header collapsed, edition bar one line, single column
5. **Filtered state** with one category active and two tags selected, URL-reflected
6. **Saved view** (items across editions, grouped by edition date)
7. **Empty filter state** and **end-of-edition footer**
8. **Calendar popover open**
9. **Signed-out vs signed-in header**, with the save banner visible in the signed-out state

Use real-feeling content from the newsletter's world: ChatCut (PH, ▲776), OfficeCLI (GitHub, +6.4k ★), an Apple vs OpenAI story (TechCrunch), a "Claude Code sends 33k tokens" thread (HN, 699 pts). No lorem ipsum.

## 7. Grid and breakpoints

- Grid view: 3 columns at 1200px+, 2 on tablet, 1 on mobile
- Content max-width 1200px, centered; gutters 20px on mobile
- List view: full content width
- Header and edition bar are sticky together

## 8. Accessibility floor

- AA contrast on all text in both themes, including `--text-2` on `--surface-2`
- Visible focus ring (`--accent`, 2px, 2px offset) on every interactive element
- Keyboard-navigable chips, star, edition arrows, and calendar
- Fixed image dimensions to prevent layout shift; lazy-load images
- `prefers-reduced-motion` respected
- Star has an accessible label that changes with state ("Save" / "Saved")

## 9. What not to do

- No gradient hero, no big-number stat blocks, no illustration
- No shadows at rest, no glass effects
- No decorative numbering beyond what the newsletter already uses (hex section numbers are a newsletter device; the app uses dates and counts instead)
- No hotlinked images without a fallback mark
- No infinite scroll or "Load more" patterns anywhere
- Don't reuse the terracotta/cream or acid-green-on-black defaults; the palette is fixed above

## 10. Handoff format

- Token file (CSS custom properties, light and dark) ready to drop into an Astro project
- Component library with every state shown, annotated with token names
- Type specimen showing all three faces at the five sizes
- The nine screens above, exported at 1x and 2x
- Per-source SVG marks as standalone assets
- A one-page "how to extend Ledger" note covering new sources, new categories (Discussions, Releases, Research in v1.1), and the extension new-tab surface

## 11. Open decisions (make a recommendation, don't block on them)

1. "Top today" marker treatment: left edge stripe, dot, or mono label?
2. Whether the edition bar date should also act as the page H1
3. Repo language dot: full GitHub language color set or a reduced palette that respects the neutral system?
4. How the newsletter's hex-numbered sections should echo (if at all) in the app's section headings
