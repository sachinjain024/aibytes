The Chrome extension popup's header (AIB-76n, pick A2): the compact `Wordmark`, the edition's date, then at the right the theme toggle, the saved toggle and Sign in or the reader's avatar.

```jsx
<PopupHeader theme={theme} onToggleTheme={toggleTheme} savedCount={saves.length} savedActive={view === "saved"}
  onToggleSaved={() => setView(v => v === "saved" ? "today" : "saved")}
  user={user && { name: user.displayName, email: user.email, photoUrl: user.photoURL }}
  onSignIn={openSignIn} onSignOut={signOut} />
```

- The theme toggle comes first: a borderless icon button (a hover tint only) with the moon (light showing) or the sun (dark showing), the same icons as aibytes.io's header, named for the theme it switches to. It renders only with `onToggleTheme`; the popup keeps the choice.
- The saved toggle is a borderless button (a hover tint at rest) with an outline star and the count in mono, `aria-pressed` while Saved shows, named "Saved items". Pressed, it fills with `--text`. It is not the filled `--save` star: that means an item is saved.
- Signed in, the avatar is aibytes.io's own (`AccountMenu` from `AppHeader`): the photo or the initial, opening the menu with the name, the email and Sign out. Escape closes it and returns focus; a click outside closes it.
- The popup frame and its parts are classes in `components.css`: `.ldg-popup` (550 × 580), `.ldg-popup__scroll` (the list or the gist), `.ldg-popup__end` (the end line), `.ldg-popup__empty` with `.ldg-popup__empty-title`, `.ldg-popup__gist` (padding for `GistView as="panel"`), and `.ldg-popup-link` (the "View on Web" link, pushed to the right). Lay the popup out with them; don't write popup styles in the app.
