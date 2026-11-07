The save banner, for signed-out readers with at least one save: "Saved items are stored in this browser only. Sign in with Google to keep them across devices." A warning icon leads the centred message; the dismiss button sits at the right. Dismissible per session, never a toast.

```jsx
<AppHeader … onSignIn={signIn} />
{showBanner && <SaveBanner sticky onSignIn={signIn} onDismiss={dismiss} />}
<Sidebar … />
```

The app uses it `sticky` (AIB-75v): rendered straight after `AppHeader`, it sticks under the masthead at full width, over the `Sidebar`, and does not scroll with the feed. While it is mounted it publishes its height as `--redesign-banner`; the rail, the phone drawer, its backdrop and the sticky toolbar are all offset by `--redesign-top` (masthead plus banner), so they clear it and move back up when it is dismissed. Without `sticky` it is a plain strip in the flow.
