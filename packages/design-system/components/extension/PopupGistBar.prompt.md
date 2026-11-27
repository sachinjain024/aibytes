The bar above a gist in the popup (AIB-76n, pick D2): one back button to the list the gist came from. The save and the site link are at the bottom, in `PopupActionBar`.

```jsx
<PopupGistBar backLabel={from === "saved" ? "← Saved" : "← Today"} onBack={closeGist} />
```

Back returns the list to where it was scrolled.
