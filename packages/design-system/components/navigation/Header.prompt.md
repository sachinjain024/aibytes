Sticky app header. Categories are single-select chips; Saved chip appears only when savedCount > 0.

```jsx
<Header categories={[{ key: "launches", label: "Launches", count: 12 }]} activeCategory="all" onCategory={setCat} mode="ranked" onMode={setMode} tagline="today's AI, in one byte" view="grid" onView={setView} theme="light" onToggleTheme={flip} signedIn={false} onSignIn={signIn} />
```

`tagline` renders in small mono under the wordmark. `onMode` adds the Ranked | Grouped segmented control to the tools cluster. `showCategories={false}` hides the chip row when categories live in a `SideNav` instead. Header + EditionBar stick together — wrap both in `position:sticky; top:0`.

Every tools-cluster control is opt-in by handler: omit `onView`, `onToggleTheme`, `onSignIn`, `onOpenTags` or `onOpenSources` and that control does not render. A surface without accounts or filters (the Chrome extension, an early app build) shows nothing it cannot do.
