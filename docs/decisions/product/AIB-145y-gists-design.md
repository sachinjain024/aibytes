# Gists: the page, the panel and the newsletter row

- **Status:** final, build not started
- **Decided:** 12 Nov 2026, from a clickable prototype of six open choices,
  after a round of review comments on the prototype the same day
- **Ticket:** AIB-145y
- **Spec:** `docs/specs/AIB-145y-gists.md` (the `gist-design` module)
- **Prototype:** `docs/ux/prototypes/AIB-145y-gists/`, built on the live
  Ledger components with `node docs/ux/prototypes/AIB-145y-gists/build.mjs`

## Decision

| | Choice | Picked | Not picked |
|---|---|---|---|
| A | The panel on a wide screen | **A1 · beside the feed, resizable** | A2 · over a dimmed feed |
| B | The source name on a card | **B2 · still opens the source** | B1 · opens the gist too |
| C | Stats | **C2 · a grid** | C1 · one line |
| D | Star and reactions | **D2 · at the end** | D1 · under the title · D3 · pinned at the bottom |
| E | The gist page | **E2 · a reading page** (the prototype's default; not named in the picks) | E1 · in the app shell |
| F | The newsletter row | **F2 · gist, plus a source link** | F1 · title to the gist only |

## How it behaves

**A1 · The panel.** A card's title opens the gist in a right-hand panel
beside the feed. The feed narrows and stays usable, so a reader can click
from card to card with the panel open; the open card is marked. The panel
is resizable: drag its left edge, or focus the edge and use the arrow keys
(Shift for bigger steps, Home and End for the widest and narrowest);
double-click resets it. It is 460px by default, never under 360px, and never
so wide that the feed drops under about 440px. The width is kept in the
browser, like the feed's layout and density, and is not synced. Escape or the
close button closes it, and focus returns to the card. On a phone (760px and
under) the panel is a full-screen sheet with no resize edge. The bar at its
top links to the gist's own page.

**B2 · The card.** The title is a real link to `/gists/<slug>` and opens the
panel on a plain click. The small source name in the card's metadata (Hacker
News, GitHub, Product Hunt) keeps going straight to the source, as it does
today, for readers who want the original.

**C2 · Stats.** A grid of labelled cells, wrapping to fit the column. Under
it, in a small caption, "As of Aug 27, 2026, 1:34 PM IST" from the gist's
`stats_as_of`, because the numbers keep moving after the run reads them.

**D2 · Star and reactions.** At the end of the gist, after the source buttons
and "Appeared in", where a reaction answers what was just read. Saving shows
"Added to your Saved items. View here" under the control, linking to
`/saved`. Reacting while signed out asks for Google sign-in.

**E2 · The gist page.** The header only, no sidebar, and one centred reading
column of 720px with even side gutters (20px on a phone). A link back to the
edition it ran in sits above the title; the page's own address is not
repeated on it. Under the gist: more from the same edition as Ledger list
rows, then the weekly subscribe bar from the weekly issue pages.

**F2 · The newsletter row.** Each item's title links to its gist and a small
source link stays beside it, so a reader who wants the original is not forced
through aibytes.io. The prototype's email row is a stand-in: how the link
looks in the real template, with its inline palette and Substack's rule that
only links can be orange, is settled in `newsletter-gist-links`.

## Decided in review, before the picks

- **Front page is a badge.** HN front-page status is a label, not a stat:
  "Front page" on the card beside the existing TOP label, "HN front page" in
  the gist header. The edition item carries it as a new optional field.
- **The gist ends with buttons, not a References list.** Two buttons when the
  item has both an outbound link and a discussion page, the outbound one
  filled: the product's site and the Product Hunt launch, or the linked page
  and the HN thread. One button for a repo, a story or an Ask HN post. The
  source button under the title stays.
- **The save banner.** When a reader is signed out and has saved items, the
  sticky banner shows on gist pages too. Its copy changes app-wide to "Saved
  items are stored in this browser's local storage. Sign in with Google to
  sync them to your account.", a change to Ledger's `SaveBanner` made in
  `ledger-gist-ui`.
- **Ledger list rows for "More from".** The grid card's fixed height leaves a
  gap in one wide column, so the page uses `RowList` and `ListRow` rather
  than changing the shared card.

## Left to the build

- With the panel beside it, the feed's grid cards are narrower and some show
  empty space under the summary. Whether the feed switches to list rows while
  the panel is open is checked in `app-gist-panel` on real editions.
- The prototype's gist text is hand-written. Real gists, their length and
  their sections come from `gist-generate` and its rehearsal.
