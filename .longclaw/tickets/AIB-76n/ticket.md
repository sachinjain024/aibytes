---
format: longclaw.ticket/v1
id: 47295eb2-ad1d-4023-895a-a972bd8061e2
key: AIB-76n
title: "Chrome extension: a new-tab page on the daily edition"
status: backlog
priority: p2
labels:
  - app
type: feature
created_at: 2026-10-08T10:23:17.730Z
updated_at: 2026-10-08T10:23:17.730Z
---

The aiBytes_ Chrome extension: a new-tab page showing the latest daily edition, split out of AIB-8h (phase 7) on 2026-10-08. AIB-8h ships the web app at aibytes.io; this ticket ships the extension on the same data.

## What is true today

- The web app is live at `https://aibytes.io`, built from `apps/web` and deployed by `.github/workflows/pages.yml` on every push to `main` that touches `content/`, so the daily runner's push keeps it current.
- The data is public and fetchable from an extension: `https://aibytes.io/content/index.json` and `editions/YYYY-MM-DD.json`, served with `access-control-allow-origin: *` and `cache-control: max-age=600`. The contract is `packages/feed-schema` (`feed.d.ts`, the JSON schemas, `validate.py`).
- Ledger (`packages/design-system`) is the shared UI: `Card`, `ListRow`, `Header`, `EditionBar`, `EndCard`, `ItemImage`, the source marks. Dark mode already follows `prefers-color-scheme` with no `data-theme` needed (fixed in AIB-8h phase 4).
- The web app's footer shows "Chrome Extension (soon)" as plain text, with no link.

## The plan (product spec §9)

1. **Scaffold `apps/extension`**: Manifest V3, a `chrome_url_overrides.newtab` page built with Vite + React from the same workspace, Ledger imported directly. No backend, no background worker unless one turns out to be needed.
2. **The new-tab page** fetches the latest edition from `aibytes.io/content/` and renders it with Ledger: grid or list, the theme following the OS. Keep the last good edition in `chrome.storage.local` so a new tab is never blank offline.
3. **Ledger's `:host` gap**, only if anything is injected into other sites' pages. A new-tab override is the extension's own page, where `:root` tokens work as they are; a content script's shadow root is not, and needs the same declarations on `:host` plus a reset. Fix it in the package, not with a fork in the extension.
4. **Package and publish** to the Chrome Web Store, then point the web app's footer link at the listing.

## Notes

- Read-only in v1: no saves and no sign-in. Those are AIB-75v, web only.
- The extension is a shipped client that cannot be hotfixed, so it reads only fields the contract guarantees and tolerates fields it does not know. The contract rule (add, never rename or remove) is in `.claude/rules/feed-schema.md`.
- Permissions: host permission for `https://aibytes.io/*` only. Nothing else, so the store review stays simple.

## Checklist

- [ ] Scaffold `apps/extension` (Manifest V3, new-tab override, Vite + React, Ledger) <!-- longclaw:item=ck_cc395d9b -->
- [ ] New-tab page rendering the latest edition from aibytes.io/content/, cached for offline <!-- longclaw:item=ck_019d540e -->
- [ ] Emit Ledger tokens on `:host` as well as `:root`, if anything is injected into other sites' pages <!-- longclaw:item=ck_89c9ab9b -->
- [ ] Package and submit to the Chrome Web Store <!-- longclaw:item=ck_a7dacce3 -->
- [ ] Point the web app's footer "Chrome Extension" link at the store listing <!-- longclaw:item=ck_f68f9eec -->

## Activity

<!-- longclaw:event
id: evt_4911ffc4
kind: create
occurred_at: 2026-10-08T10:23:17.730Z
actor:
  type: agent
  id: claude-code
-->
### claude-code created this ticket
<!-- /longclaw:event -->
