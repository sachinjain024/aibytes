# Chrome extension: the popup, onboarding and the install box

- **Status:** final, build not started
- **Decided:** 20–21 Nov 2026, from a clickable prototype of eight open
  choices, with review comments and copy changes on the prototype
- **Ticket:** AIB-76n (new tab split out to AIB-151m, launch posts to AIB-152d)
- **Prototype:** `docs/ux/prototypes/AIB-76n-extension/`, built on the live
  Ledger components with `node docs/ux/prototypes/AIB-76n-extension/build.mjs`.
  Its strings live in `copy.js` there, and they are the agreed copy.

## Decision

| | Choice | Picked | Not picked |
|---|---|---|---|
| A | Popup: getting to Saved | **A2 · a star in the header** | A1 · Today and Saved tabs |
| B | Popup: the rows | **B1 · as on aibytes.io** | B2 · compact, ranked |
| C | Popup: signed out | **C1 · Sign in always shown** | C2 · a prompt after the first star |
| D | Popup: the gist view | **D2 · actions pinned at the bottom** | D1 · actions in the top bar |
| E | Onboarding: the steps | **E2 · one at a time** | E1 · both on one page |
| F | Onboarding: the pin animation | **F1 · in the step card** | F2 · plus an arrow to the toolbar |
| G | Onboarding: the newsletter box | **G1 · ticked by default** | G2 · unticked |
| H | aibytes.io: the install banner | **H3 · a box in the sidebar** | H1 · a sticky strip · H2 · a row in the feed |

## How it behaves

**The icon.** The extension's toolbar and store icon is the aibytes.io
favicon (`apps/web/public/favicon.svg`): the wordmark's bolt, white on a
cobalt tile, the same in both themes.

**A2 · Saved.** The popup's header carries the wordmark, the edition date, a
star button with the saved count, and Sign in (or the avatar). Pressing the
star swaps the list for the saved items and marks the button pressed; pressing
it again returns to today's edition. Its screen-reader label is "Saved items".
An empty Saved list says "Use the ☆ to save an item. Saved items appear here."

**B1 · Rows.** Ledger's `ListRow` unchanged, in its narrow layout at the
popup's 400px: title, one-line summary, then source and signals, with the star
under the source icon. The list is today's edition in ranked order. A sticky
footer in `--surface-2` shows "{date} · {count} items" and "View on Web".

**C1 · Signed out.** A Sign in link in the header whenever the reader is
signed out, as on aibytes.io. It opens aibytes.io to sign in; the site hands
the extension a Firebase custom token (see the ticket). Stars made while signed
out are kept in the browser.

**D2 · The gist.** Selecting a row opens its gist full size inside the popup.
"← Today" (or "← Saved") sits alone at the top; the star and "View on Web" stay
in a bar at the bottom while the gist scrolls. An item without a gist opens
its source in a new tab.

**E2 · Onboarding** at `aibytes.io/extension-onboarding`, opened on install.
A green check and "aiBytes_ extension is successfully installed.", then
"A couple of quick steps to help you get the most out of it." One step shows
at a time, "Step 1 of 2" then "Step 2 of 2", each with Skip, then a done card.

**F1 · Pin.** Step 1 shows a looping animation of the puzzle icon → Pin inside
the step card, and ticks itself when Chrome reports the extension is on the
toolbar (`chrome.action.getUserSettings`). No pointer outside the card.

**G1 · Sign in.** Step 2, "Sign in to save & bookmark items", is optional and
centred: two lines on where saved items are kept, a large "Sign in with
Google" button, then "Also subscribe me to the weekly newsletter", ticked by
default, then "Skip for now".

**H3 · The install box.** A small box at the top of the sidebar's footer,
above the links: the icon, "aiBytes_ for Chrome", one line, "Add to Chrome"
and "Not now". It never sits in the reading column, and it shows on desktop
Chrome only: a phone can't install extensions. It shows only while the extension isn't installed: the site
asks the extension (through `externally_connectable`, which sign-in already
needs) and the box disappears the moment the extension answers. Ledger's
`Sidebar` has no slot for it today; the build adds an optional one.

## Copy

The strings in the prototype's `copy.js` are the agreed copy, with the
publisher's changes of 21 Nov 2026 (the empty Saved body, "View on Web" for
the link to the site, and the shorter onboarding sub-heading). The build takes
them from there.
