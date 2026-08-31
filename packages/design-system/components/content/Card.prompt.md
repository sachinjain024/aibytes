Grid-view feed card — the core unit of an edition.

```jsx
<Card item={{ id: "ph-chatcut", title: "ChatCut", summary: "AI video editor inside ChatGPT with a real timeline and XML export.", url: "#", source: "producthunt", source_url: "#", tags: ["Video", "Dev Tool"], signals: { upvotes: 776, comments: 42 } }} topToday saved={false} onToggleSave={toggle} />
```

Image rules: PH logo rounded 8px, GitHub avatar circle (+ language dot in meta), TC og:image square, HN always the HN tile. Signals order: upvotes/points → stars gained → comments; only rendered when present. `topToday` adds the `--hot` left edge + mono `TOP` label (open decision #1). The meta row ends with the `CardMenu` kebab (⋮ → "Open in" ChatGPT / Claude / Gemini) automatically.

Layout variants: `signalsPos` places upvotes — "logo" stacked under the image, "source" inline after the source name, "bottom" bottom-aligned under the image (default in the app), "row" own row between summary and tags; comments never show on cards. `tagStyle`: "dots" mono ·-separated (default), "pills" bordered chips, "hash" accent #tags. `maxTags` caps tags (default 3). With `signalsPos` ≠ "bottom" the menu + star move to the top-right corner cluster.
