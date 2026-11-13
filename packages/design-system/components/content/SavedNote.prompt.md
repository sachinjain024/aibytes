The confirmation under the save control, shown after a save on a gist: "Added to your Saved items. View here". It is a `role="status"` paragraph, so it is announced; "View here" links to `/saved`.

```jsx
{saved && <SavedNote />}
```

It sits in the `actions` slot of a `GistView`, under the star and the reactions. A separate component so the feed card can use the same line later.
