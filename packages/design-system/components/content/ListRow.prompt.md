List-view row, two text lines: title over a one-line summary, `[img 24px]` at the left, mono meta (source · ▲776 · 42) + star + ⋮ menu at the right, borders between rows.

```jsx
<ListRow item={item} saved={saved.has(item.id)} onToggleSave={toggle} />
```

Both lines truncate with ellipsis. Wrap consecutive rows in a bordered, rounded container.
