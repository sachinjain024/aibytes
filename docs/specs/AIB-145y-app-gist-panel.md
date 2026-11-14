# Spec: `app-gist-panel`, a card opens its gist beside the feed

- **Ticket:** AIB-145y, task T27 (builds in T28 and T29)
- **Parent spec:** `docs/specs/AIB-145y-gists.md`, module `app-gist-panel`
- **Builds on:** `AIB-145y-app-gist-pages.md` (the page, `GistPage`, `loadGistPage`),
  `AIB-145y-ledger-gist-ui.md` (`GistPanel`, `GistView`), `AIB-145y-gist-analytics.md`
  (the one event), the design record (A1 and B2)
- **Status:** approved 14 Nov 2026. Decide 1 and 2 as recommended; Decide 3 the
  publisher's way (the panel is on `/saved` too), settled below.

## Objective

On a daily or weekly page, a plain click on the title of a card that has a
gist opens that gist in the right-hand panel, beside the feed. The open gist is
in the URL (`?gist=<slug>`), so Back closes the panel, a reload keeps it, and a
shared link opens it. A card with no gist behaves exactly as today.

This spec covers T28 (daily pages, the URL, the width) and T29 (weekly pages,
the event). The panel component and the page are done; this is the wiring.

## What a card does

| Card | Title | Source name |
|---|---|---|
| Has `item.gist` | A real link to `/gists/<slug>`, same tab. A plain click opens the panel. A modified click (Cmd, Ctrl, Shift, Alt, middle button) follows the link to the page. | Unchanged: opens the source (`source_url`) in a new tab, as design choice B2 says. |
| No `item.gist` (every pre-launch card, a gist that failed to write, a hidden gist) | Unchanged: the item's own URL in a new tab. | Unchanged. |

The destination link the title used to carry is now the gist's Source button, in
the panel and on the page. That is the intended trade (B2); the spec records it so
nobody is surprised.

**Ledger change, additive.** `Card` and `ListRow` take three optional props:
`gistHref` (the title's `href`, and with it no `target`), `onOpenGist(item)`
(called on a plain click, which then calls `preventDefault`) and `open`
(marks the card whose gist is showing: `aria-current="true"` and a class with an
accent edge, tokens only, no new token). With none of them set nothing changes.
Each gets a `.d.ts` line, a `.prompt.md` line and a test, and the Design System
Artifact is synced after the PR (`.design-sync/NOTES.md`).

## The URL

`/<edition>` or `/weekly/issue-N`, plus `?gist=<slug>`.

- **Parsing.** `route.js` gets `gistParam(search)`: the slug when it matches
  `^[a-z0-9][a-z0-9-]*$`, else `null`. `parseRoute` is unchanged: the panel is
  state on a page, not a route. A new pure module `gistPanel.js` builds the
  next URL (`withGist(location, slug)`, `withoutGist(location)`), so filters,
  `?gist=` and the path never overwrite each other.
- **Filters.** `?c=`, `?t=`, `?s=` and `?q=` keep working. A filter change
  keeps `?gist=`; today it rewrites the whole query, so `setFilters` must
  merge instead.
- **Leaving the page.** Moving to another edition, issue or route drops
  `?gist=` (the open gist is not carried across days). `/gists/<slug>` never
  shows the panel; `/saved?gist=<slug>` does (see "The Saved page").
- **Not a canonical.** The head of an edition page does not change when the
  panel opens: same title, same canonical (no `?gist=`), no `noindex` needed
  because `?gist=` is client-only state that the static HTML never contains.
  The panel's content is reached by search through `/gists/<slug>`.

## History

| Action | History |
|---|---|
| Open from a card, panel closed | `pushState`: Back closes it. |
| Open another card, panel already open | `replaceState`: Back still closes the panel, rather than stepping through every gist read. **(Decide 1)** |
| Close (button, Escape) | If this panel was opened by a push in this page view, `history.back()`; otherwise (a reload or shared link landed on it) `replaceState` without `?gist=`. The pushed entry is remembered in `history.state`. |
| Back / Forward | The panel follows the URL, through the existing `popstate` handler. |
| Reload with `?gist=` | The panel opens on load. |

## Loading, and a slug that does not resolve

The panel reads the gist with `loadGistPage(slug)` (the same function the page
uses), so it sees the gist and "More from" nothing: the panel needs the gist
only. While loading it shows the panel frame with "Loading the gist…"; a slug
with no file, or a gist that is hidden, drops `?gist=` with `replaceState` and
shows no panel, no error: the card list is still there and the reader loses
nothing. A network failure shows "Could not load this gist. Try again." with
the close button. An unknown value in `?gist=` is treated as no panel.

A card whose `gist` slug has no file (a stale edition) behaves like a card with
a gist until its click fails to load; it then drops the panel as above. That
case is a bug in the content, and `validate.py` already refuses it.

## The panel's content

`GistPanel` wraps `GistView as="panel"`, with `pageHref` set to `/gists/<slug>`
and the same save row the page uses. The page's row is today built inside
`GistPage`; T28 moves it to a small shared `GistActions` component in
`apps/web/src`, used by both, so they cannot drift. Saving from the panel saves
the card's own item (`item_id` of the card that was clicked), and after a
reload the first appearance in the gist is used, the same rule the page follows.
"Appeared in" links are ordinary links (a full page load, as on the page).
Reactions are not here until T32; the `actions` slot holds the save row only.

## Width, and the feed beside it

- **Kept in the browser.** `prefs.js` gets a number preference
  `aibytes-gist-panel-w` with `readWidth` / `writeWidth`: an integer from 360
  to 1200, anything else reads as "not set" (460). `GistPanel` already clamps
  to what the viewport allows. Not synced to the account, like layout and density.
- **The feed keeps working.** On screens wider than 760px the feed's column
  narrows by the panel's width (the `--gist-panel-w` padding the kit already
  uses); filters, saving, the edition bar and the scroll position are
  untouched. The open card has `open` set. On 760px and under the panel is the
  full-screen sheet and the feed is behind it.
- **Grid or list while open. (Decide 2)** The reader's grid or list choice stays.
  The grid already wraps to fewer columns as the feed narrows, and a single
  column is always cards, as it is today (`layout.js`). The design record left
  open whether to force list rows while the panel is open; that is judged on
  the real editions in T28's browser check, and the spec is changed first if
  the grid looks wrong there.
- **Focus.** Opening from a card returns focus to that card's title on close
  (the component does it). A reload or a shared link has no card to return to;
  focus goes to the page heading.

## The event

One event, listed in `AIB-145y-gist-analytics.md`:

`track("gist-panel-open", { slug, page })`, `page` is `daily` or `weekly`.
Sent when a click on a card opens the panel, and when a click switches it to
another gist. Not sent on a reload, on Back or Forward, or for a shared link:
those are page views of the URL (Umami counts the `?gist=` view on its own).
The plan's T29 says `gist_panel_open` with `{ slug }`; the analytics spec
(names are kebab-case, data includes `page`) wins.

## The Saved page

`/saved` opens the panel the same way. Nothing new is stored: the page already
loads each saved item's edition or issue file, so the item, and with it
`item.gist`, is in hand, and the save document (`item_id`, the file it came
from, `created_at`) and `firestore.rules` stay as they are. The panel's save
row there unsaves the item (the star is on), and a saved item whose gist has
no file behaves like any card whose gist cannot be found. `Saved` is
`noindex` already, so `?gist=` there changes nothing for search.

## Weekly pages

The same behaviour on `/weekly/issue-N` for issue items that carry `gist`. Issue
items get `gist` from the newsletter module (`newsletter-gist-links`), which is
a later task; until then most issue items carry none and open the source as
today, and T29 is verified on a fixture issue with a gist (the same rehearsal
content the page was checked with). The code path is one `ItemList`, so the weekly
page needs no second implementation.

## Boundaries

- **Always:** a plain click opens the panel; a modified click follows the real link;
  the panel state lives in the URL only; every gist string stays React text;
  `track()` is the only way to send the event.
- **Ask first:** a second event or any more event data; storing anything new
  in a save (its fields are pinned by `firestore.rules`, a publisher deploy);
  forcing list rows while the panel is open; a new dependency.
- **Never:** change the edition's head when the panel opens; add `?gist=` to the
  sitemap or a canonical; send the event on a reload; take a panel's width from
  the server.

## Commands

```bash
npm test -w @aibytes/web                      # route.test.js, prefs.test.js, gistPanel.test.js
npm test -w @aibytes/design-system            # Card and ListRow props
npm run dev:web                               # http://localhost:5173/
npm run build:web && npx vite preview --outDir apps/web/dist   # the built site
```

## Testing

| Task | Tests |
|---|---|
| T28 | `route.test.js`: `gistParam` accepts a slug and rejects empty, upper case, `../x`, a long junk value, and more than one `gist=`. `gistPanel.test.js`: `withGist` keeps `c`, `t`, `s`, `q` and the path; `withoutGist` removes only `gist`; a filter change keeps `gist`; an edition change drops it. `prefs.test.js`: the width reads 460 when absent, unparsable, below 360 or above 1200, and round-trips. Ledger: `Card` and `ListRow` with `gistHref`/`onOpenGist`/`open` and without them, a modified click not intercepted. |
| T28 browser | On `/saved` too: a card's title opens its gist and `/saved?gist=<slug>` reloads it. A plain click opens the panel and pushes `?gist=`; Back closes it; Forward reopens; reload keeps it; a Cmd-click opens `/gists/<slug>`; a source-name click opens the source; a card with no gist opens its source; a bad slug drops the param; switching card to card with the panel open keeps one history step; Escape and the close button; saving from the panel shows on the card and on `/saved`. 1440px and 375px, both themes. |
| T29 | A fixture weekly page: the same. The event appears in the analytics tool (or its `track` call, when the script is blocked locally), once per click, not on reload. |

## Success criteria

1. On a daily page, a plain click on a card title with a `gist` opens the panel
   and shows `/<date>?gist=<slug>`; Back closes it; a reload keeps it.
2. A new-tab or modified click opens `/gists/<slug>`.
3. A card with no `gist` opens its source as before; the source name always does.
4. Filters and `?gist=` coexist in either order; changing day drops `?gist=`.
5. A gist that cannot be found leaves no panel and no `?gist=`, with no error.
6. The width a reader picks is kept across reloads and days.
7. One `gist-panel-open` event per opening click, none on reload or Back.
8. Both themes and 375px pass; the edition's `<head>` is the same open or closed.

## Decide

1. **Switching gists with the panel open.** Recommended: replace the history
   entry, so Back closes the panel in one step. The alternative pushes each
   switch, so Back walks back through every gist, which is the browser's
   default but a long trip after a minute of browsing.
2. **Grid while the panel is open.** Recommended: keep the reader's choice and
   look at it on real editions in T28. The alternative is to switch to list
   rows whenever the panel is open and restore the choice on close.
3. **The saved page.** Settled: the panel is on `/saved` too. The publisher's
   instinct was to store the gist slug with the save; it is not needed, because
   the Saved page reads each item from its edition or issue file, which already
   carries `gist`. No schema, rules or account-data change.
