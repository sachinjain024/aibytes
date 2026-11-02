The sidebar: categories with counts on the left of the feed, the footer links and Subscribe at its foot. On desktop the selected category carries a faint gradient and soft shadow, the one sanctioned exception to Ledger's flat, shadowless surfaces; do not reuse that treatment elsewhere. It replaced `SideNav` and `Footer`; it has no date picker, because the date picker is in the `Toolbar`.

```jsx
<Sidebar categories={[{ key: "launches", label: "New Products", count: 3 }]} count={32} active="all" onCategory={setCategory}
  open={menuOpen} onClose={() => setMenuOpen(false)}
  links={[{ label: "X", href: "https://x.com/…" }, { label: "Advertise", href: "mailto:…" }, { label: "Chrome Extension (soon)" }]}
  subscribeUrl="https://newsletter.aibytes.io/subscribe" />
```

On phones it is the drawer the `AppHeader` menu button opens (pass the same open state to both); it renders its own backdrop. Put live links first and not-yet-live ones (no `href`) last. Leave GitHub out when the AppHeader already links it.
