# Spec: `ledger-gist-ui`, the gist components in Ledger

- **Ticket:** AIB-145y, task T18
- **Parent spec:** `docs/specs/AIB-145y-gists.md`, module `ledger-gist-ui`
- **Design:** `docs/decisions/product/AIB-145y-gists-design.md` (picks A1, B2,
  C2, D2, E2, F2) and the prototype in `docs/ux/prototypes/AIB-145y-gists/`
- **Contract:** `docs/specs/AIB-145y-gist-contract.md`; types in
  `packages/feed-schema/feed.d.ts` (`Gist`, `GistSection`, `GistStats`)
- **Status:** approved 13 Nov 2026, with the three answers under "Settled at approval"

## Objective

Say what Ledger gets, and what each piece takes in and shows, so T19 to T22
build against one list. Everything is additive: no existing component changes
its props or look, except the `SaveBanner` line, which the parent spec already
changes everywhere.

The publisher reviewed the real gists on 13 Nov 2026 (the rehearsal page) and
the choices below that come from that review are marked *(review)*.

## Components

| New or changed | Task | What it is |
|---|---|---|
| `GistView` | T19 | The one view the panel and the page both render. Server-renderable. |
| `GistPanel` | T20 | The beside panel (A1), a full-screen sheet at 760px and under. |
| `ReactionBar` | T21 | Eight emoji with counts. |
| `Card`, `ListRow`: `front` | T21 | The "Front page" label. |
| Saved line | T21 | "Added to your Saved items. View here". |
| `SaveBanner` | T21 | New copy, everywhere it is quoted. |
| Kit screens | T22 | The feed with the panel open; the gist page. |

Tokens only, from `tokens/token.css`. Both themes pass the contrast test. No
new token is needed: the badge uses `--hot-tint` and `--hot-text`, the stats
grid `--line`, the code block `--soft`.

## `GistView`

```ts
interface GistViewProps {
  gist: Gist;                        // content/gists/<slug>.json, as is
  as: "panel" | "page";              // h2 or h1; page type sizes are larger
  onEdition?: (edition_date: string) => void;   // "Appeared in" links
  actions?: React.ReactNode;         // the save + reaction bar, rendered at the end (D2)
}
```

It takes the gist file and nothing else, so the page can render it without an
edition. Top to bottom:

1. **Kicker:** the source name, "First covered <date>", the `HN front page`
   badge when `front_page` is set, and a `brief` label when `depth` is
   `brief` (never `full`).
2. **Image and title:** the item's image just before the title in one row.
   It is the gist's own `image`, drawn by `ItemImage`, so a Product Hunt logo,
   a repo's owner avatar (a circle) and a TechCrunch thumbnail (square crop)
   match the feed card, and an item with no image, or one that fails to load,
   gets the source mark. That is the orange "Y" for Hacker News. *(review)*
3. **Lede**, then a one-line note under a `brief` lede: "This is the short
   gist. The source could not be read when the edition was built."
4. **Stats:** the grid (C2), below.
5. **Sections** in contract order: key points, why it matters, who it's for,
   pricing, try it (a code block), the discussion (each point a stance tag,
   the text and a "comment" link), what's open (each point with an "issue"
   link when it has a URL).
6. **Closing buttons:** the `destination` link, filled, then the `discussion`
   link, outlined. Small. Each button label is worked out from the role and
   host, never the page's own title (the title is the button's `title`
   attribute): `destination` is "Source"; `discussion` is "HN Discussion" on
   news.ycombinator.com, "Product Hunt" on producthunt.com, and "Discussion"
   otherwise. Every button ends with a small arrow in its top right corner
   that marks a link to another site, and opens in a new tab. *(review)*
7. **Appeared in:** the editions and issues in `appearances`, as links.
8. **`actions`**, if given.

The `x_post` kind has no sections: it draws the post (author, handle, date,
text, counts, a link) from `preview` and its stats, with no written summary.

### Stats

A grid of labelled cells that wraps to fit the column (C2). Its heading and its
date share one line: **STATS (As of 6 Nov 2026)**. The date only, no time of
day. *(review)*

- **Date:** the day in the viewer's own time zone. A server cannot know it, so
  the server markup holds the UTC day and the client replaces it after it
  mounts. This must not cause a hydration warning.
- **Short counts:** 1,000 or more is short: `1.2k` under 10,000, `140k` up to a
  million, `1.2M` above. Below 1,000 the number is shown whole. This applies
  to every count except Hacker News, whose points and comments are always
  shown whole.
- **Which cells, in order,** by kind. A cell is left out when its value is
  missing.

| Kind | Cells |
|---|---|
| `hn` | points, comments (both whole numbers), submitted by, posted (an age such as "19h", from `posted_at` against `stats_as_of`) |
| `repo` | stars, forks, contributors, open issues, created, language, licence |
| `launch` | upvotes, comments |
| `x_post` | likes, reposts, replies, views |
| `news` | no stats block |

`stars_gained` and `last_release` stay in the file, which the contract
requires, and are not shown. *(review)*

### Server rendering

No `window`, `document` or time-zone call during render. The one client-only
detail is the stats date above. A test renders every kind with
`renderToStaticMarkup` under `node --test`.

## `GistPanel`

```ts
interface GistPanelProps {
  gist: Gist;
  pageHref: string;                  // the bar's link to the gist's own page
  onClose: () => void;
  width?: number;                    // px; default 460
  onWidthChange?: (px: number) => void;   // the app saves it, like layout and density
  children?: React.ReactNode;        // a GistView
}
```

- **Shape:** a right-hand panel beside the feed; the feed keeps working and
  the open card is marked. A top bar holds the link to the page and a close
  button.
- **Width:** 460px by default, never under 360px, never so wide that the feed
  drops under about 440px. A separator on its left edge has `role="separator"`
  with `aria-valuenow`, `aria-valuemin` and `aria-valuemax`. Drag it, or focus
  it and use the arrow keys (Shift for bigger steps), Home for the widest and
  End for the narrowest. Double-click resets. The width goes to
  `onWidthChange`; Ledger does not store it.
- **Keyboard:** Escape calls `onClose`; focus returns to the card that opened
  it; the scroll area returns to the top when the gist changes.
- **Phone:** at 760px and under it is a full-screen sheet with no resize edge,
  `role="dialog"` and `aria-modal`, clear of the safe-area insets.

## `ReactionBar`

```ts
interface ReactionBarProps {
  counts: Record<string, number>;    // keyed by emoji
  mine: string[];                    // emoji this reader has pressed
  onToggle: (emoji: string) => void;
}
```

Eight emoji in one fixed order: 👍 👎 😄 🎉 😕 ❤️ 🚀 👀. Each is a toggle button with
`aria-pressed`; a count shows when it is above zero, and includes the reader's
own press. The bar knows nothing about sign-in: the app decides what a press
does for a signed-out reader (it asks for Google sign-in).

## `Card` and `ListRow`: `front`

An optional boolean. When set, the metadata row starts with "Front page" in the
same small caps style as the existing TOP label, and the two can sit together.
Default is off, so no existing card changes.

## The saved line and `SaveBanner`

- **Saved line:** under the save control, after a save: "Added to your Saved
  items. View here", with "View here" linking to `/saved`. It is a
  `role="status"` paragraph that `GistView`'s `actions` slot can hold; a small
  `SavedNote` component (`href`, default `/saved`) draws it.
- **`SaveBanner` copy:** "Saved items are stored in this browser's local storage.
  Sign in with Google to sync them to your account." Changed in the component,
  its test, its `.d.ts` and `.prompt.md`, the brand-tone card and the product
  spec, so none of them quotes the old line.

## Boundaries

- **Always:** a `.d.ts`, a `.prompt.md` and a test for each new component; tokens
  only; keyboard focus visible; both themes.
- **Ask first:** a new token; any change to an existing component's props or
  default look; adding a dependency.
- **Never:** reading the edition inside Ledger; storing anything (the app owns
  the panel width, saves and reactions); loading anything from another site; the
  newsletter, which keeps its own palette and never imports Ledger.

## Success criteria

- Each task's own acceptance criteria in `docs/plans/AIB-145y-todo.md` (T19 to
  T22) pass, and `npm test -w @aibytes/design-system` is green.
- A `GistView` of each kind renders from a gist file with no edition loaded.
- The review choices marked above appear in the component tests: the button
  labels per role and host, the short counts (and Hacker News counts whole), the repo cell order, the hidden
  `stars_gained` and `last_release`, the image or source mark before the title.

## Settled at approval

1. **Date on the server.** The server writes the UTC day and the client swaps in
   the local day. Search engines read the UTC day. Approved. The time of day is
   dropped, so only the date shows.
2. **Hacker News counts.** Points and comments stay whole, not `1.2k`.
3. **`SavedNote`.** A separate small component, so the feed card can reuse it
   later (the recommendation, approved).
