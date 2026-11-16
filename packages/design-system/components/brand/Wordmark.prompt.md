The aiBytes_ wordmark: `⚡ aiBytes_` in Bricolage Grotesque 800 with the trailing underscore in `--accent`.

```jsx
<Wordmark variant="compact" href="/" />
```

Variants: `full` (28px, page level), `compact` (20px, header), `icon` (40px tile for the extension). Never redraw the wordmark as SVG; it is typographic by design.

The site favicon is not this component. It is the wordmark's ⚡ alone, a white bolt on a cobalt (`--accent`, #285ed1) tile, in `apps/web/public/` as `favicon.svg`, `favicon.ico` and `apple-touch-icon.png` (GitHub #38, picked 16 Nov 2026). The `aB_` letters were too small to read at 16px, and a favicon cannot load Bricolage. The bolt is a vector path, not the ⚡ emoji, so it looks the same on every OS.
