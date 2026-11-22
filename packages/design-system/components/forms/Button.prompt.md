Ledger button: `primary` (accent fill, `--accent-fg` text), `secondary` (1px border), `ghost`, `google` (sign-in with G logo).

```jsx
<Button variant="primary">Subscribe</Button>
<Button variant="google">Sign in with Google</Button>
```

Disabled uses `--surface-2` + `--disabled`. Height 32px, radius 6px, no shadows.

`size="lg"` makes a 48px, 16px semibold button, full width up to 360px, with a 20px Google mark. Use it for the one primary sign-in on a page, like "Sign in with Google" on the extension's onboarding: `<Button variant="google" size="lg">Sign in with Google</Button>`. Without `size`, the button is unchanged.
