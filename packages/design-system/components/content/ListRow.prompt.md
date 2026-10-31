Current visual specification: see `../../readme.md`, `../../styles.css` and `../../tokens/token.css`. `Card` and `ListRow` share `FeedItem.jsx`; preserve source/destination links, image fallbacks, signals and optional save actions. The legacy specification below is historical.

Shared metadata helpers live in `signals.jsx` and are consumed by `FeedItem.jsx`. Existing helper imports from `Card.jsx` remain supported through re-exports; do not import `Card` into the helper module.

List-view row, two text lines: title over a one-line summary, `[img 24px]` at the left, mono meta (source · ▲776 · 42) + star + ⋮ menu at the right, borders between rows.

```jsx
<ListRow item={item} saved={saved.has(item.id)} onToggleSave={toggle} />
```

Both lines truncate with ellipsis. Wrap consecutive rows in a bordered, rounded container.
