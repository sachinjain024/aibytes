The gist panel: the right-hand panel that opens beside the feed when a card's title is clicked. The feed narrows and stays usable, so a reader can go from card to card with the panel open. It holds the width, the focus and the keys; what is inside is the caller's, usually a `GistView`.

```jsx
{open && (
  <GistPanel gist={gist} pageHref={"/gists/" + gist.slug} width={savedWidth} onWidthChange={saveWidth} onClose={close}>
    <GistView gist={gist} as="panel" actions={…} />
  </GistPanel>
)}
```

- **Bar.** A link reading `aibytes.io/gists/<slug>` (to the gist's own page) and a close button.
- **Width.** 460px by default, never under 360px, never so wide that the feed drops under about 440px (250px rail, 440px feed, 760px ceiling). The left edge is a `role="separator"` with `aria-valuenow`, `aria-valuemin` and `aria-valuemax`: drag it, or focus it and use the arrow keys (the left arrow widens; Shift takes bigger steps; Home is the widest and End the narrowest); double-click resets. Each change goes to `onWidthChange`; the app stores it, like layout and density. Ledger stores nothing.
- **Keyboard.** Escape calls `onClose`. Focus moves into the panel on open and returns to the card that opened it on close. A new gist scrolls back to the top.
- **Room for the feed.** While mounted, the panel writes its width to `--gist-panel-w` on the root (removed on close and on a phone), so the feed can leave that much room on the right.
- **Phone.** At 760px and under it is a full-screen `dialog` with `aria-modal`, clear of the safe-area insets, with no resize edge.

Server-renderable. A server assumes a 1440px viewport; the browser corrects it on mount.
