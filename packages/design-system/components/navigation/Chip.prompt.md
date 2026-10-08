Filter chip — categories (single-select), tags and sources (multi-select), dropdown triggers ("Tags ▾").

```jsx
<Chip label="Repos" count={9} active={cat === "repos"} onClick={() => setCat("repos")} />
```

Active = accent border + text on `--accent-tint`. Inter 13 / 500, 28px tall, radius 6.

A chip that opens a panel passes `expanded`, so it is announced as a disclosure (aria-expanded) rather than a toggle; `active` still styles it when the panel holds a selection.
