The app header: one quiet 52px row that belongs to the page, not a banner. Menu button (phones only) · wordmark · GitHub and theme toggle at the right.

```jsx
<AppHeader theme={theme} onToggleTheme={flip} menuOpen={menuOpen} onMenu={() => setMenuOpen(o => !o)} githubUrl="https://github.com/sachinjain024/aibytes" />
```

The menu button controls the `Sidebar` (it carries `aria-controls="mobileSidebar"`), so render the two together. It shows only below 761px, where the Sidebar becomes a drawer. The page's actions for the current screen do not go here; they go in the `Toolbar` under it.
