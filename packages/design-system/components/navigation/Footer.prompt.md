**Deprecated.** The shipped app moved the footer links and Subscribe into the bottom of the sidebar and mobile drawer (RedesignSidebar in apps/web/src/Redesign.jsx). Kept only so the ui_kits screens still render; do not use it in new UI. It is removed once those screens are redrawn on the new shell (AIB-133k).

App footer: nav links left, subscribe blurb + button right.

```jsx
<Footer onSubscribe={subscribe} />
```

Default links: Chrome Extension · GitHub · X · Advertise (mailto). Default blurb: "Join 1K+ developers reading aiBytes_ weekly". In the app shell the footer is sticky at the viewport bottom (screen-level CSS, background `--bg`).

A link without `href` renders as plain text, for something not live yet ("Chrome Extension (soon)").
