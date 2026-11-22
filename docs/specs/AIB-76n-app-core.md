# Spec: AIB-76n, module 2 `app-core`

Status: **draft, 22 Nov 2026, for review.** Module 2 of 6 in
`docs/specs/AIB-76n-capability-map.md` (answer 6 approved the package). No
design input: this is a refactor with no visible change.

## Objective

Move the pure logic the extension shares with aibytes.io out of `apps/web/src`
into a workspace package, `packages/app-core` (`@aibytes/app-core`), so the
extension imports one tested copy instead of reaching into another app or
forking it. The web app then imports the same files from the package.

Who: `extension-popup` and `extension-auth`, which need ranking, saves, the
Saved list and the merge exactly as the site does them. Why: the ticket's "reuse
existing components", and the review's rule that the extension never imports
`apps/web/src`.

Success looks like:

- `packages/app-core/src/` holds the modules below, moved with `git mv` so
  their history follows, and their tests beside them.
- `apps/web` imports them from `@aibytes/app-core/...`; its build, its tests and
  aibytes.io are unchanged.
- Nothing in `packages/app-core` imports from `apps/`, React, or the DOM beyond
  `globalThis.localStorage` behind `browserStorage()`.

### Not in this module

Any behaviour change. Any new function the extension needs (the
`chrome.storage.local` adapter, the edition cache): those are written in
`extension-popup` and `extension-auth` against these modules.

## What moves

| From `apps/web/src/` | To `packages/app-core/src/` | What, exactly |
|---|---|---|
| `order.js` | `order.js` | `rankedItems`, its fallback, `TIE_ORDER`. `groupedItems` and `X_GROUP` stay in `apps/web/src/order.js`, which keeps importing `CATEGORIES` from `filters.js`, so `CATEGORIES` does not move |
| `filters.js` | `visibility.js` | `inFeed` alone (not hidden, not an X row). The rest of `filters.js` stays |
| `saves.js` | `saves.js` | All of it: `SAVES_KEY`, `sourceOf`, `asSave`, `readSaves`, `clearSaves`, `localSaves` |
| `accountData.js` | `accountData.js` | All of it |
| `accountSaves.js` | `accountSaves.js` | All of it, with `mergeInto` |
| `merge.js` | `merge.js` | All of it (`toAdd`, `mergedLine`) |
| `saved.js` | `saved.js` | All of it: `filesToLoad`, `savedGroups`, `leftOutNote`, `savedFeed` |
| `format.js` | `format.js` | All of it (dates; `saved.js` uses `midDate` and `shortDate`) |
| `firebase-config.js` | `firebase-config.js` | All of it |
| `prefs.js` | `storage.js` | `browserStorage` alone. The preference keys stay in `prefs.js`, which imports it |
| `route.js` | `dates.js` | `isRealDate` alone. `route.js` imports it from there |

Tests move or split the same way: `order.test.js` (the `rankedItems` and
fallback cases), `saves.test.js` with its `blocked-storage.js` helper,
`accountData.test.js`, `accountSaves.test.js`, `merge.test.js`,
`saved.test.js`, `format.test.js`, and the `inFeed`, `browserStorage` and
`isRealDate` cases out of `filters.test.js`, `prefs.test.js` and
`route.test.js`. Cases for what stays behind stay behind.

### Importers updated

`App.jsx`, `account.js`, `gistSite.js`, `hooks.js` (indirectly through
`prefs.js`), `route.js`, `prefs.js`, `filters.js` and the web's remaining
`order.js`: each import of a moved name points at the package, for example
`import { rankedItems } from "@aibytes/app-core/order.js"`. No re-export shims
in `apps/web/src`: one path per name.

### Outside `apps/web`

- `tests/test_curate_edition.py` reads `TIE_ORDER` from
  `apps/web/src/order.js` to check it equals `rank.py`'s. Point it at
  `packages/app-core/src/order.js`.
- `apps/web`'s `test:rules` script lists `src/accountSaves.test.js` for the
  emulator run. It moves to `packages/app-core`'s own `test:rules`, with the
  same guard (skipped without the Firebase CLI and Java), and `accountSaves`'s
  test finds `firestore.rules` from its new depth.
- Comments that name a moved file's old path (`rank.py`, specs are history and
  are not rewritten) are updated where they are instructions, not history.

## The package

```json
{
  "name": "@aibytes/app-core",
  "private": true,
  "version": "0.0.0",
  "description": "Logic aibytes.io and the Chrome extension share: ranking, saves, the Saved list, the account store and merge. Pure modules; no React.",
  "type": "module",
  "exports": { "./*": "./src/*" },
  "scripts": {
    "test": "node --test",
    "test:rules": "<the emulator guard from apps/web, running src/accountSaves.test.js>"
  },
  "peerDependencies": { "firebase": "^13.2.0" },
  "devDependencies": { "@firebase/rules-unit-testing": "^6.0.0" }
}
```

`firebase` is a peer dependency: `accountSaves.js` and `accountData.js` import
`firebase/firestore`, and each app supplies the one copy it bundles. The
workspace's root `package.json` already globs `packages/*`.

## Commands

```bash
npm install                                  # links @aibytes/app-core into the workspace
npm test -w @aibytes/app-core
npm run test:rules -w @aibytes/app-core      # emulator; skipped without the Firebase CLI and Java
npm test -w @aibytes/web
npm run test:rules -w @aibytes/web
npm run build:web
python3 -m unittest tests.test_curate_edition -v
```

## Project structure

```
packages/app-core/
  package.json
  README.md          what lives here and the rule: pure, no React, no apps/ imports
  src/
    order.js  visibility.js  saves.js  accountData.js  accountSaves.js
    merge.js  saved.js  format.js  firebase-config.js  storage.js  dates.js
    *.test.js  blocked-storage.js
```

## Code style

Files keep their code and header comments as they are; only the first line of
each header gains where it now lives. A split file says what stayed behind:

```js
// The edition's ranked order (spec AIB-77u app-feed-order), shared by
// aibytes.io and the Chrome extension (AIB-76n app-core). groupedItems, which
// needs the site's categories, stays in apps/web/src/order.js.
```

## Testing strategy

The moved tests are the test of this module: every case that passed before
passes after, in its new package, with no assertion changed. A count of test
cases before and after (web + core) must match. `npm run build:web` must
produce the same pages (`dist/` file list and sizes within a few bytes of the
same build on `main`), and the site checked by eye on the dev server: feed,
`/saved`, sign-in, a gist.

## Boundaries

- *Always:* `git mv` so history follows; one import path per name; run the
  web's whole suite, the emulator suite and `test_curate_edition` before the
  commit.
- *Ask first:* any change to a moved function's behaviour or signature; adding
  anything to the package that the extension does not need.
- *Never:* re-export shims left in `apps/web/src`; React or JSX in
  `app-core`; an import from `apps/` inside `packages/`.

## Success criteria

1. `npm test -w @aibytes/app-core`, `npm test -w @aibytes/web`, both
   `test:rules` runs (where the emulator is available) and
   `tests.test_curate_edition` pass, with the same number of cases as before.
2. `grep -r "apps/web" packages/app-core` finds nothing.
3. `npm run build:web` succeeds and the site behaves as before (feed, ranking,
   saves signed out and in, the merge, `/saved`, gists).
4. `packages/app-core` has no React import and no DOM use beyond
   `browserStorage`.

## Open questions

None. The package and its name were approved with the map (answer 6).
