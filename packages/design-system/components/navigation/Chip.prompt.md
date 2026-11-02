**Deprecated.** The shipped app has no chips: categories live in the sidebar rail, and tags and sources are checkboxes in the filter panel (RedesignFilters in apps/web/src/Redesign.jsx). Header still renders it internally. Kept only so the ui_kits screens still render; do not use it in new UI. It is removed once those screens are redrawn on the new shell (AIB-133k).

Filter chip — categories (single-select), tags and sources (multi-select), dropdown triggers ("Tags ▾").

```jsx
<Chip label="Repos" count={9} active={cat === "repos"} onClick={() => setCat("repos")} />
```

Active = accent border + text on `--accent-tint`. Inter 13 / 500, 28px tall, radius 6.

A chip that opens a panel passes `expanded`, so it is announced as a disclosure (aria-expanded) rather than a toggle; `active` still styles it when the panel holds a selection.
