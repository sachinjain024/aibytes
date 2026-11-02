Current visual specification: see `../../readme.md`, `../../styles.css` and `../../tokens/token.css`. `Card` and `ListRow` share `FeedItem.jsx`; preserve source/destination links, image fallbacks, signals and optional save actions. The legacy specification below is historical.

Shared metadata helpers live in `signals.jsx` and are consumed by `FeedItem.jsx`. Existing helper imports from `Card.jsx` remain supported through re-exports; do not import `Card` into the helper module.

List-view row, two text lines: title over a one-line summary, the source image at the left, borders between rows. The meta lays out by the row's own width, not the window's: from 560px it is a right-hand column with the source on the title line (⋮ menu beside it) and its counts (▲776 · 💬42) under it on the summary line; narrower rows put source and counts on a third line under the summary.

```jsx
<ListRow item={item} saved={saved.has(item.id)} onToggleSave={toggle} />
```

Both lines truncate with ellipsis. Wrap consecutive rows in a bordered, rounded container.
