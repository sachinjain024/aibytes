Per-source fallback mark for the fixed 40px image slot (PH orange P, HN Y-tile in `--hot`, GitHub Octocat in `--text`, TechCrunch green TC).

```jsx
<SourceMark source="hackernews" size={40} />
```

HN items ALWAYS use this (they never have images). Use `size={24}` in list rows. Standalone SVG files: `assets/marks/*.svg`.
