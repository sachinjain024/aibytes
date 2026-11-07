The app header: one quiet 52px row that belongs to the page, not a banner. Menu button (phones only) · wordmark · GitHub and theme toggle at the right.

```jsx
<AppHeader theme={theme} onToggleTheme={flip} menuOpen={menuOpen} onMenu={() => setMenuOpen(o => !o)} githubUrl="https://github.com/sachinjain024/aibytes" />
```

Accounts: pass `onSignIn` and a `Sign in` control appears after the theme toggle. Once the reader is signed in, pass `user` and `onSignOut` instead: the control becomes a 30px avatar showing their Google profile photo, or their initial when there is no photo or it fails to load (the photo is requested with no referrer, which Google's image host needs). The avatar opens a menu, built on the card menu's panel, with their name, "Signed in with Google", `Saved` (with `onSaved`) and `Sign out`. Escape closes it and returns focus to the avatar; a click outside closes it.

```jsx
<AppHeader … onSignIn={signIn} user={user && { name: user.displayName, photoUrl: user.photoURL }} onSignOut={signOut} onSaved={openSaved} />
```

The menu button controls the `Sidebar` (it carries `aria-controls="mobileSidebar"`), so render the two together. It shows only below 761px, where the Sidebar becomes a drawer. The page's actions for the current screen do not go here; they go in the `Toolbar` under it.
