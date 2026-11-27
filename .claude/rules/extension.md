---
paths:
  - "apps/extension/**"
---

# The Chrome extension (AIB-76n)

`apps/extension` is the aiBytes_ Chrome extension: an MV3 popup and a module
service worker on the same `content/` editions, with its UI from Ledger. The
specs are `docs/specs/AIB-76n-*.md`; the store listing it replaces is
`faamldnehjdjdobapchedpmldfjjfife`.

## CHROMEWEBSTORE.md

Whenever you create or change the Chrome extension, create and maintain
`apps/extension/CHROMEWEBSTORE.md`: every permission and host permission with a
specific, plain-English justification, the data-use and privacy disclosures,
and a version history. It lives with the extension, not at the repo root (the
`chrome-extensions` skill's default), and stays out of the store zip.
`docs/specs/AIB-76n-store-listing.md` owns the listing copy; where the skill's
store guidance differs, the spec wins.

## Skills and tools

- `chrome-extensions` (Google's Modern Web Guidance) for Chrome APIs, MV3
  patterns and the store's review rules.
- `modern-web-guidance` for which web platform feature to use. Ledger
  (`packages/design-system`, see `design-system.md`) still decides how
  anything looks: tokens, no shadows at rest, the 2px focus ring.
- The project's `chrome-devtools` MCP server (`.mcp.json`) runs with
  `--categoryExtensions --autoConnect`, so it can load and inspect the unpacked
  extension in the publisher's own Chrome. Allow remote debugging at
  `chrome://inspect/#remote-debugging` at the start of each browser session.

## Never

- Add a permission beyond the set frozen at T8 without the publisher's yes: a
  permission with a warning disables the extension for existing users.
- Commit a key, token or `.pem`. The manifest's `key` is the public key that
  pins the extension's ID; it is not a secret, the `.pem` is.
