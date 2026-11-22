# @aibytes/app-core

Logic that aibytes.io (`apps/web`) and the Chrome extension (`apps/extension`)
share, so both rank, filter and save the same way (spec
`docs/specs/AIB-76n-app-core.md`).

| Module | What |
|---|---|
| `order.js` | `rankedItems` and `TIE_ORDER` (must equal `rank.py`'s) |
| `visibility.js` | `inFeed`: rank the whole file first, then filter with it |
| `format.js` | Date labels for an edition day, in UTC |
| `dates.js` | `isRealDate` for a `YYYY-MM-DD` |
| `storage.js` | `browserStorage`: `localStorage`, or null where reading it throws |
| `blocked-storage.js` | A test helper: run code with site data blocked |

The rule: pure modules, no React, nothing imported from `apps/`. Import a file
by path, for example `import { rankedItems } from "@aibytes/app-core/order.js"`.

```bash
npm test -w @aibytes/app-core
```
