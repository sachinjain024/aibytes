Current visual specification: see `../../readme.md`, `../../styles.css` and `../../tokens/token.css`. `Card` and `ListRow` share `FeedItem.jsx`; preserve source/destination links (both go through `withRef`, so they carry `ref=aiBytes_`, except on GitHub and Hacker News, while the item keeps its clean URL), image fallbacks, signals and optional save actions. The legacy specification below is historical.

Shared metadata helpers live in `signals.jsx` and are consumed by `FeedItem.jsx`. Existing helper imports from `Card.jsx` remain supported through re-exports; do not import `Card` into the helper module.

List-view row, two text lines: title over a one-line summary, the source image at the left, borders between rows. The meta lays out by the row's own width, not the window's: from 560px it is a right-hand column with the source on the title line (⋮ menu beside it) and its counts (▲776 · 💬42) under it on the summary line; narrower rows put source and counts on a third line under the summary.

```jsx
<ListRow item={item} saved={saved.has(item.id)} onToggleSave={toggle} />
```

`starPos="visual"` puts the save star under the source image instead of after the ⋮ menu, as on `Card`; the default is `"actions"`.

Both lines truncate with ellipsis. Wrap consecutive rows in a bordered, rounded container.

Gist link: pass `gistHref` (the gist page) and `onOpenGist` for an item that has a gist. The title then links to the gist in the same tab and a plain click calls `onOpenGist`; a modified click follows the link. `open` marks the card whose gist is showing. Without `gistHref` the title opens the item in a new tab, as before. With `onOpenGist` the whole card is a click target for it, except the links, buttons and menu inside; the title stays the real link.
