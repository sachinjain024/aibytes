The gist view: what the panel beside the feed and the gist page both show for one item. It takes the gist file (`content/gists/<slug>.json`) as `gist` and nothing else, so the page can render it without loading an edition, and it renders on a server with no `window`.

```jsx
<GistView gist={gist} as="panel" actions={<><SavedNote … /><ReactionBar … /></>} />
<GistView gist={gist} as="page" />
```

Top to bottom: the kicker (source name, "First covered 5 Nov 2026", the "HN front page" label, a `brief` label on a short gist); the item's image just before the title (the item's own `image`, drawn by `ItemImage`, so a launch logo, a repo's circular avatar or a news thumbnail match the feed card; no image, or one that fails, shows the source mark, the orange "Y" for Hacker News); a small Source button; the lede; the stats grid; the sections for the kind; the closing buttons; "Appeared in"; then `actions`.

- **Stats.** One line: "STATS (As of 6 Nov 2026)", the date only. The server writes the UTC day and the browser swaps in the reader's own day after it mounts. Cells by kind: Hacker News points, comments, submitted by, posted (an age such as 19h); repo stars, forks, contributors, open issues, created, language, licence; launch upvotes, comments; X post likes, reposts, replies, views; a news gist has none. `stars_gained` and `last_release` stay in the file and are not shown. Counts of 1,000 or more are short (1.2k, 140k, 1.2M), except Hacker News points and comments, which stay whole.
- **Buttons.** Labelled by the link's role and host, never by the page's own title (that is the button's tooltip): "Source", then "HN Discussion", "Product Hunt" or "Discussion". The first, the destination, is filled; each ends with a small arrow that marks a link to another site, and opens in a new tab. A gist with only a discussion link has one filled button.
- **An X post** has no sections: the post (author, handle, date, text) and its counts, with no written summary.
- **`appearanceHref`** overrides where "Appeared in" links go.

Tokens only; both themes. The stats, buttons and sections are styled by `.gist-*` classes in `components.css`.
