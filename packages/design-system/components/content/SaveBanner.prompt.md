The save banner, for signed-out readers with at least one save: "Saved items are stored in this browser's local storage. Sign in with Google to sync them to your account." A warning icon leads the centred message; the dismiss button sits at the right. Dismissible per session, never a toast.

```jsx
<AppHeader … onSignIn={signIn} />
{showBanner && <SaveBanner sticky onSignIn={signIn} onDismiss={dismiss} />}
<Sidebar … />
```

The app uses it `sticky` (AIB-75v): rendered straight after `AppHeader`, it sticks under the masthead at full width, over the `Sidebar`, and does not scroll with the feed. While it is mounted it publishes its height as `--redesign-banner`; the rail, the phone drawer, its backdrop and the sticky toolbar are all offset by `--redesign-top` (masthead plus banner), so they clear it and move back up when it is dismissed. Without `sticky` it is a plain strip in the flow.

The extension popup (AIB-76n) uses it plain, under `PopupHeader`, with its own words through `copy`: "Saved items are kept in this extension. Sign in with Google to sync them to your account." Its saves live in the extension, not the browser's local storage, so the site's sentence would be wrong there.

```jsx
<SaveBanner onSignIn={signIn} onDismiss={dismiss} copy={{ before: "Saved items are kept in this extension.", link: "Sign in with Google", after: "to sync them to your account." }} />
```
