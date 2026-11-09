# Saves and Google sign-in: where they sit in the app

- **Status:** decided, build not started
- **Decided:** 6 Nov 2026, from a clickable prototype of the five open choices
- **Ticket:** AIB-75v
- **Spec:** product spec §8 (`docs/aibytes-app-product-spec.md`)

## Decision

The redesigned app shell (AIB-8h) dropped the Saved chip and avatar that the
older Ledger screens had, so the spec's save flow needed new homes. The
prototype put each open choice side by side on the real Ledger components.
These are the picks:

| | Choice | Picked | Not picked |
|---|---|---|---|
| A | Where Saved lives | **A1 · a Saved entry in the sidebar**, under a `LIBRARY` label below the categories | A2 · a Saved chip in the header |
| B | Sign in in the header | **B2 · always shown** while signed out | B1 · shown only after the first save |
| C | Save banner | **C2 · a full-width strip** under the header | C1 · a box above the feed |
| D | Saved items that were later hidden | **D2 · left out, with a note** | D1 · shown greyed, unsave only |
| E | Star on cards and rows | **E2 · under the source icon**, in the visual column | E1 · after the ⋮ menu (what shipped) · E3 · before the ⋮ menu |

## How each one behaves

**A1 · Saved in the sidebar.** The entry is always there, with its count,
including `0` before anything is saved. Selecting it opens the Saved view
and marks the entry as current, the way a category is. On phones it is in
the drawer with the categories.

**Saved view.** A `Saved` heading with the count, then one section per
edition, newest edition first, each headed by the edition's date and count.
It uses the reader's grid or list choice. Under the heading, signed out:
"Stored in this browser only. Sign in with Google to keep them across
devices." Signed in: "Synced to your Google account." Right after the first
sign-in, one line says how many saves from this browser were added.

**Empty Saved view.** In place of the sections, one end card:

> **No saved items yet.**
> Select the ☆ on any card or row to save it. Saved items from every edition
> collect here, newest edition first.
> Saves stay in this browser until you sign in with Google. *(signed in: Your
> saves sync to your Google account.)*
> ← Back to the latest edition

The "stored in this browser" line under the heading is left out while the
list is empty, because the empty state already says it.

**B2 · Sign in.** A `Sign in` control sits at the right end of the header
whenever the reader is signed out. Signed in, it becomes an avatar with the
reader's Google profile photo (their initial when there is none, or it fails
to load), opening a menu with their name, "Signed in with Google",
`Saved` and `Sign out`.

**C2 · The banner.** It shows while the reader is signed out and has at least
one save. *(Amended 10 Nov: it cannot be dismissed; the dismiss button and the
per-session dismissal below were dropped in `app-accounts`. Ledger's
`SaveBanner` still offers `onDismiss`; the app does not pass it. It shows on
the Saved view too since that view became a category view, with no line of
its own.)* It sits directly under the
header and sticks with it, so it does not scroll with the items, and it runs
the full width, over the sidebar. The sidebar, the phone drawer and the
sticky toolbar start below the header plus the banner, and move back up when
it is dismissed. The message is centred, with a 1.5px-stroke warning icon in
front of it, in the text colour. The dismiss button is pinned to the right.
At phone width the message wraps and is left-aligned. It is not shown on the
Saved view, whose own line already offers sign-in.

**D2 · Hidden items.** `hide.py` keeps a hidden item in its edition with
`hidden: true`, so a save can point at one. The Saved view leaves those out
and ends with a note: "1 saved item was removed from its edition and is not
shown." The save itself is kept, so the item comes back if it is unhidden.
The Saved count leaves hidden items out too.

**E2 · The star.** On both cards and rows, the star moves out of the action
cluster and sits under the source icon, sized to that column (28px target,
16px glyph). The ⋮ menu stays where it is.

## What Ledger needs

The picks need options Ledger's components do not have yet. Each change also
updates the component's `.d.ts` and `.prompt.md`, and the UI kit.

- `Sidebar`: a Saved entry with a count and an active state.
- `AppHeader`: a Sign in control, and the signed-in avatar and menu.
- `SaveBanner`: the warning icon, centred message, and a sticky placement
  that offsets the sidebar and toolbar.
- `FeedItem`, `Card`, `ListRow`: a star position option for E2, covered in
  `Card.test.js`.

## Why

- **A1:** the redesign moved navigation into the sidebar, so a view of the
  reader's own items belongs there next to the categories, and the header
  stays quiet. Showing it from the start tells readers saving exists.
- **B2:** sign-in is findable before the first save, for a reader coming back
  on a second device to find saves they already have.
- **C2:** a strip that stays put is noticed once and then out of the way of
  the feed, and it cannot be scrolled past and missed.
- **D2:** the Saved list shows only items a reader can open. The note keeps
  the count honest without showing an item that has no links.
- **E2:** the star lines up down the left edge, so a reader can see what they
  saved at a glance in list view and on cards.

The prototype is checked in at `docs/ux/prototypes/AIB-75v-saves/`: open
`aib-75v-saves.html`, or rebuild it from the live Ledger sources with
`node docs/ux/prototypes/AIB-75v-saves/build.mjs`. It opens on the picks
above; its options panel still switches between all of them. The capability
map for the build is `docs/specs/AIB-75v-capability-map.md`.
