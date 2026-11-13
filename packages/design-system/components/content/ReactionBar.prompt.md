The reaction bar at the end of a gist, after the source buttons and "Appeared in", where a reaction answers what was just read.

```jsx
<ReactionBar counts={counts} mine={mine} onToggle={(emoji) => (user ? react(emoji) : askToSignIn())} />
```

Eight emoji in one fixed order (👍 👎 😄 🎉 😕 ❤️ 🚀 👀), each a toggle button with `aria-pressed` and a spoken name ("Thumbs up, 3"). A count shows only when it is above zero (1.2k for a thousand or more). `counts` is everyone else's; the reader's own press is added on top, so it shows at once. Pressed buttons get the link-coloured border; ones with a count get a faint fill. The bar does not know whether the reader is signed in: that, and what a press does, is the app's.
