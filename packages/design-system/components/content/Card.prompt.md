Current visual specification: see `../../readme.md`, `../../styles.css` and `../../tokens/token.css`. `Card` and `ListRow` share `FeedItem.jsx`; preserve source/destination links (both go through `withRef`, so they carry `ref=aiBytes_`, except on GitHub and Hacker News, while the item keeps its clean URL), image fallbacks, signals and optional save actions. The legacy specification below is historical.

Shared metadata helpers live in `signals.jsx` and are consumed by `FeedItem.jsx`. Existing helper imports from `Card.jsx` remain supported through re-exports; do not import `Card` into the helper module.

Grid-view feed card — the core unit of an edition.

```jsx
<Card item={{ id: "ph-chatcut", title: "ChatCut", summary: "AI video editor inside ChatGPT with a real timeline and XML export.", url: "#", source: "producthunt", source_url: "#", tags: ["Video", "Dev Tool"], signals: { upvotes: 776, comments: 42 } }} topToday saved={false} onToggleSave={toggle} />
```

Image rules: PH logo rounded 8px, GitHub avatar circle (+ language dot in meta), TC og:image square, HN always the HN tile. Signals order: upvotes/points → stars gained → comments; only rendered when present. `topToday` adds the `--hot` left edge + mono `TOP` label (open decision #1). `front` adds a `Front page` label (same hot small caps) after `TOP` and before the source name, for a Hacker News story that was on the front page; `ListRow` takes it too. The meta row ends with the `CardMenu` kebab (⋮ → "Open in" ChatGPT / Claude / Gemini) automatically.

Default card: title, summary, then the source and its counts (`GitHub +1.5K ★`) in a row pinned to the bottom edge, so every card in a row ends on the same line. No tags. This is how the app shows it; use the defaults.

Layout variants: `signalsPos` places upvotes — "source" after the source name (default), "logo" stacked under the image, "bottom" bottom-aligned under the image, "row" own row between summary and tags; comments never show on cards. `tagStyle`: "dots" mono ·-separated (default), "pills" bordered chips, "hash" accent #tags. `maxTags` caps tags (default 0, no tags row; the language dot goes with it). Pass a number only for a surface that wants tags back. With `signalsPos` ≠ "bottom" the menu + star move to the top-right corner cluster.

Star position: `starPos="visual"` takes the save star out of that cluster and puts it under the source image, sized to the image column, so saved items line up down the left edge (the app's choice, AIB-75v). The default `"actions"` keeps it after the ⋮ menu. It renders only when `onToggleSave` is passed.

```jsx
<Card item={item} saved={saved.has(item.id)} onToggleSave={toggle} starPos="visual" />
```

Gist link: pass `gistHref` (the gist page) and `onOpenGist` for an item that has a gist. The title then links to the gist in the same tab and a plain click calls `onOpenGist`; a modified click follows the link. `open` marks the card whose gist is showing. Without `gistHref` the title opens the item in a new tab, as before. With `onOpenGist` the whole card is a click target for it, except the links, buttons and menu inside; the title stays the real link.
