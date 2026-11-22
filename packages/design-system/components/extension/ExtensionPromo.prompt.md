The extension's install box (AIB-76n, pick H3): a small bordered card at the top of the rail's footer. It is the only place aibytes.io advertises the extension, and it is quiet on purpose: no banner, nothing in the feed.

```jsx
<Sidebar … promo={showPromo && <ExtensionPromo href={STORE_URL} onDismiss={dismissPromo} />} />
```

- "Add to Chrome" is a link styled as the primary button, opening the store in a new tab.
- "Not now" calls `onDismiss`; the app hides the box and remembers that. Leave `onDismiss` out and there is no Not now.
- Show it only in a desktop Chromium browser that can install from the store, while the extension isn't installed. The app decides; the box has no logic of its own.
