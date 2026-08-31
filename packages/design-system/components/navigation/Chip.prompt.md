Filter chip — categories (single-select), tags and sources (multi-select), dropdown triggers ("Tags ▾").

```jsx
<Chip label="Repos" count={9} active={cat === "repos"} onClick={() => setCat("repos")} />
```

Active = accent border + text on `--accent-tint`. Inter 13 / 500, 28px tall, radius 6.
