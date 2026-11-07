# Spec: AIB-75v, module 2 `app-local-saves`

Status: **draft, revised 7 Nov 2026 with the answers below, awaiting review.** Module 2 of 4 in
`docs/specs/AIB-75v-capability-map.md`. Builds on `ledger-saves-ui` (#55,
merged as `e5fa1ab`). Design: `docs/decisions/product/AIB-75v-saves-and-sign-in-design.md`;
prototype: `docs/ux/prototypes/AIB-75v-saves/`.

## Objective

Readers can save an item on aibytes.io with one click and no account. This is
the first module readers see: every card and row on a daily edition and on a
weekly issue page gets the ☆ under its source icon (E2), and a click saves at
once to this browser.

Who: any reader of a daily edition or a weekly issue. Why: product spec §8, "Clicking ☆ saves
immediately to local storage. No modal, no interruption."

Success looks like:

- Clicking ☆ fills it (`--save`), with no network request and no reload.
  Clicking again unsaves.
- Saves survive a reload, a new tab, and a different edition or issue page; a save made
  in one tab shows in the others without a reload.
- A store that is empty, corrupt, hand-edited, full, or blocked (private mode,
  site data off) never breaks a render: the app behaves as if nothing is saved,
  and saving still works for the current page view.
- The saves module has the interface the account store (module 4) implements,
  so the components never learn where saves live.

### Not in this module

- **The Saved page** (`/saved`) **and the Sidebar's Saved entry and count**:
  module 3, `app-saved-view` (decision 1). They ship together, so there is no
  entry pointing at a page that does not exist yet.
- **The sticky banner, Sign in, the avatar menu:** module 4, `app-accounts`
  (map assumption 1). Until then there is nothing to sign in to.
- **The Chrome extension:** read-only in v1.

## What gets stored

One local storage key, `aibytes-saves`, holding a JSON array, newest first.
Each save names its item and the one file that item lives in: an edition's
date, or a weekly issue's slug (decision 2).

```json
[
  { "item_id": "ph-glasshand-2026-11-06", "edition_date": "2026-11-06", "created_at": "2026-11-07T09:30:00.000Z" },
  { "item_id": "hn-researchers-link-the-rubygems-attack-to-openai-a-issue-9", "issue_slug": "issue-9", "created_at": "2026-11-07T09:31:00.000Z" }
]
```

- `item_id` is the item's `id`. Ids are unique across every edition and every
  weekly issue (871 and 376 today, no overlap), because edition ids end in the
  edition date and weekly ids in the issue slug.
- Exactly one of `edition_date` (the edition's `date`, `YYYY-MM-DD`) or
  `issue_slug` (the issue's `slug`, `issue-N`). The Saved page loads only the
  files its saves point at, with no content database (§8). Product spec §8
  names `edition_date` only; `issue_slug` extends it for weekly items, and
  module 4 stores the same two fields in Firestore.
- `created_at` is an ISO 8601 UTC timestamp. Firestore's `created_at`
  (module 4) takes the same value when local saves merge.
- On read, each entry is validated: `item_id` a non-empty string,
  exactly one of `edition_date` (a real `YYYY-MM-DD` date) or `issue_slug`
  (`issue-` and digits), `created_at` a parseable date.
  Invalid entries are dropped and duplicates of an `item_id` keep the first.
  JSON that does not parse, or is not an array, reads as no saves.
- A save is kept while its item is hidden (map assumption 3). The feed skips
  hidden items as today, so their stars simply do not render.

## The saves interface

`apps/web/src/saves.js`, beside `prefs.js` and in its style (pure functions,
`storage` injectable for the tests):

```js
// A store of saves. Local storage now; module 4 adds an account store with
// the same shape, and the app picks one, so components never know which.
export function localSaves(storage = globalThis.localStorage) {
  return {
    list(),                      // validated saves, newest first
    has(itemId),                 // boolean
    toggle(item, from),          // from: { edition_date } or { issue_slug }; save or unsave; returns { saved, kept }
    subscribe(listener),         // called on every change, this tab or another; returns unsubscribe
  };
}
```

- `kept` is `false` when the write failed (quota, blocked). The change still
  applies for this page view, exactly like `writeChoice`; nothing is shown to
  the reader in this module.
- Other tabs: `subscribe` listens to the `storage` event for `aibytes-saves`.
- A hook in `hooks.js`, `useSaves(store)`, gives components `{ saves, has,
  toggle }` and re-renders on change (`useSyncExternalStore`).

## App changes (`apps/web/src/App.jsx`)

- `App` creates the store once and passes it to `EditionApp` and
  `WeeklyIssueApp`. `ItemSections` passes `saved`, `onToggleSave` and
  `starPos="visual"` to every `Card` and `ListRow`, with `{ edition_date }` on
  an edition page and `{ issue_slug }` on a weekly issue page.
- `Sidebar` is unchanged here: no `onSaved`, so no `LIBRARY` section yet.
- The weekly archive (`/weekly`, the list of issues) has no items and is
  unchanged.
- No Ledger changes. Everything needed shipped in `ledger-saves-ui`;
  `tests/test_design_system.py` still fails if the app draws shell markup.

## Tech stack

Unchanged: Vite 7 + React 18 in `apps/web`, Ledger from
`@aibytes/design-system`. No new dependency. `node --test` for the tests.

## Commands

```bash
npm test -w @aibytes/web                                 # node --test: saves.js, router, the rest
npm run build:web                                        # static build in apps/web/dist
npm run dev:web                                          # http://localhost:5173/
python3 -m unittest discover -s tests -p test_design_system.py
python3 packages/feed-schema/validate.py                 # content/ unchanged, still valid
git diff --check
```

## Project structure

```
apps/web/src/
  saves.js          the store: localSaves, validation (new)
  saves.test.js     its tests (new)
  hooks.js          + useSaves
  App.jsx           store wiring; star props on Card / ListRow; Sidebar props
docs/plans/         AIB-75v-plan.md and -todo.md gain module 2's tasks
```

## Code style

As `prefs.js`: a short header comment on what the module guarantees, small
exported functions, `try`/`catch` around every storage call, no classes.

```js
export const SAVES_KEY = "aibytes-saves";

export function readSaves(storage = globalThis.localStorage) {
  try {
    const parsed = JSON.parse(storage.getItem(SAVES_KEY) ?? "[]");
    return Array.isArray(parsed) ? dedupe(parsed.filter(isSave)) : [];
  } catch {
    return [];
  }
}
```

## Testing strategy

- **`saves.test.js`** (`node --test`, with the `memory` and `broken` storages
  from `prefs.test.js`):
  - save, unsave and `has` round-trip for an edition item and a weekly item;
    newest first; `created_at` is ISO; each entry carries only its one source
    field.
  - corrupt JSON, a non-array, bad entries (both or neither source field, a
    bad date or slug) and duplicates read as described.
  - a throwing storage reads as empty and `toggle` returns `kept: false` but
    the store still reports the change for this page view.
  - `subscribe` fires on a local toggle and on a `storage` event for the key,
    not for other keys, and stops after unsubscribe.
- **No Ledger or Python test changes** beyond running them.
- **Browser check** in `npm run dev:web` at 1280 and 390px, both themes:
  save and unsave on grid and list, on an edition and a weekly issue, a
  reload, two tabs, a hidden item, and local storage blocked in DevTools.

## Boundaries

- **Always:** validate on read; wrap every storage call; keep the store
  interface free of React; run the full check list before each commit; one
  commit per task on `aib-75v-app-local-saves`, one PR, squash-merged.
- **Ask first:** any new dependency; any Ledger change (it would mean module 1
  missed something); any change to `content/` or the feed schema; storing
  anything beyond the three fields.
- **Never:** a network request on save; the banner, Sign in or the Sidebar's
  Saved entry in this module; personal data in storage; a cookie.

## Success criteria

1. On an edition page and a weekly issue page, every visible card and row
   shows the ☆ under its source icon; a click toggles it at once.
2. `aibytes-saves` holds exactly the documented shape after saving from both.
3. Saves survive reloads and page changes and sync across tabs.
4. Corrupt, blocked or full storage never breaks the page; `saves.test.js`
   covers each case.
5. No network request is made by saving (checked in DevTools).
6. Apart from the star, edition and weekly issue pages look as before; the
   Sidebar and the weekly archive are unchanged.
7. The full check list passes.

## Decisions (answered 7 Nov 2026)

1. **The Sidebar's Saved entry moves to module 3** (option a). This module is
   the star and the store; `app-saved-view` adds the entry, its count and the
   page together, so there is never a dead link.
2. **Weekly issues get the star too.** A weekly save stores `issue_slug` in
   place of `edition_date`; the Saved page (module 3) loads weekly issues
   through `content/weekly/index.json` the same way it loads editions.

## Open questions

None.
