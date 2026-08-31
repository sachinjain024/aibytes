Card context menu — ⋮ kebab trigger, bottom-right of cards / right of list rows.

```jsx
<CardMenu item={item} />           // cards (panel opens upward)
<CardMenu item={item} up={false} />// list rows
```

One item for now: "Open in" with ChatGPT / Claude / Gemini icon buttons (ChatGPT and Claude get a prefilled prompt; Gemini has no public prefill URL). Designed to take more items later. Already built into `Card` and `ListRow`.
