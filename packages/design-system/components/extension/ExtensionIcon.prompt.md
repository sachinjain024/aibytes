The aiBytes_ Chrome extension's icon: the same rounded cobalt tile and white bolt as aibytes.io's favicon (`apps/web/public/favicon.svg`). Use it wherever the UI points at the extension: the onboarding page's "Select [icon] in the toolbar to open today's edition", the pin animation's toolbar, and the install box in the sidebar.

```jsx
<span>Select <ExtensionIcon size={20} /> in the toolbar</span>
<ExtensionIcon size={24} title="aiBytes_ for Chrome" />
```

It is a logo, not a themed mark: the colours are fixed and the same in light and dark, and it is never recoloured with tokens. Without `title` it is `aria-hidden`, because the text beside it names it. It is not the Wordmark's `icon` variant.

Chrome's toolbar and the store take PNGs, not SVG: `assets/extension/icon-{16,32,48,128}.png`, made from the favicon by `node scripts/extension-icons.mjs`. Rerun that only if the favicon changes.
