Step 1's animation on the extension's onboarding page (AIB-76n, pick F1). Drawn in code with tokens, so it follows the theme; no video or GIF.

```jsx
<PinAnimation captions={["Look at the top right of Chrome", "Select the puzzle icon", "Find aiBytes_ in the list", "Select the pin", "aiBytes_ is in your toolbar"]} />
```

Frames change every 1.1s; the pinned frame holds for two. The caption is not a live region, so a screen reader is not interrupted every second; the drawing has one accessible name. Readers who ask for reduced motion see the pinned frame still and the five captions as a numbered list. `reducedMotion` forces either form, for screenshots and tests.
