Per-source fallback mark for the fixed 40px image slot (PH orange P, HN Y-tile in `--hot`, GitHub Octocat in `--text`, TechCrunch green TC, the X logo in `--text`). X items are weekly Viral on X and Official Announcements rows; they are never feed cards, so the X mark only shows on /saved.

```jsx
<SourceMark source="hackernews" size={40} />
```

HN items ALWAYS use this (they never have images). Use `size={24}` in list rows. Standalone SVG files: `assets/marks/*.svg`.
