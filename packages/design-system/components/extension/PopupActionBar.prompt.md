The bar under a gist in the popup (AIB-76n, pick D2): the `SaveStar`, its label ("Save", or "Saved" once starred), and the link to the gist's page on aibytes.io at the right.

```jsx
<PopupActionBar saved={isSaved} onToggleSave={toggle}>
  <a className="ldg-popup-link" href={gistUrl}>View on Web</a>
</PopupActionBar>
```

Same height and tint as `PopupFooter`, so the bottom of the popup doesn't jump between the list and a gist.
