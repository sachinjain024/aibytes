# Spec: AIB-75v, module 3 `app-saved-view`

Status: **approved 7 Nov 2026**, with the answers under Decisions. **Amended
10 Nov** (AIB-75v T16, the publisher): `/saved` is now a category view. It has
the Toolbar without the date picker; search, Filters, the Sidebar's categories
and Ranked | Grouped work over the saves (Grouped by category, as on the feed;
order newest file first, rank inside); the heading and the "Stored in this
browser" / "Synced" line are gone (the sticky banner now shows here too); rows
do not show their edition. "No toolbar" and the fixed order below are
superseded. Module 3 of 4 in
`docs/specs/AIB-75v-capability-map.md`. Builds on `app-local-saves` (#56,
merged as `c3fad8d`). Design: A1 and D2 in
`docs/decisions/product/AIB-75v-saves-and-sign-in-design.md`; prototype:
`SavedView` in `docs/ux/prototypes/AIB-75v-saves/App.jsx`.

## Objective

Saves become useful: there is somewhere to read them. The Sidebar gets its
`LIBRARY` section with **Saved** and a count, on every edition and weekly
issue page, and Saved opens **`/saved`**: every saved item, from every
edition and weekly issue, in one page.

Who: a reader who has starred something. Why: product spec §8, "it shows saved
items across all editions"; the ticket's Saved view.

Success looks like:

- Saved is in the Sidebar (the drawer on phones) on every edition and weekly
  issue page, with its count, `0` included (A1).
- `/saved` is a real page in the static build, like `/2026-11-06`.
- It loads only the files the saves point at: `index.json`,
  `weekly/index.json`, and the editions and issues named by the saves, nothing
  else.
- One section per edition or issue, newest first, each with its date or issue
  number and count; inside a section, the items in the feed's rank order
  (map decision 3).
- Items render as `Card` or `ListRow` in the reader's grid or list choice,
  star filled, under the source icon. Unstarring removes the item from the page.
- Hidden items are left out, with a note at the end (D2).
- With no saves, the empty state from the design record.

### Not in this module

- **Sign in, the banner, the signed-in lines** ("Synced to your Google
  account", the merge line): module 4, `app-accounts`. Until then the Saved
  page's copy leaves sign-in out (see Copy).
- **Search, filters, Ranked/Grouped on `/saved`.** The page has no toolbar,
  as in the prototype; its order is fixed (newest first, rank inside).
- **The Chrome extension.**

## The page

```
[AppHeader]
[Sidebar: categories (no counts) · LIBRARY · ★ Saved 4 (current)]   Saved 4
                                                                    Stored in this browser only.
                                                                    ── Fri, Nov 6 ─────────── 2
                                                                    [card] [card]
                                                                    ── Issue #9 · Nov 2 ───── 1
                                                                    [card]
                                                                    ── Wed, Nov 4 ─────────── 1
                                                                    [card]
                                                                    1 saved item was removed from its edition and is not shown.
```

- **Route:** `parseRoute("/saved")` is `{ kind: "saved" }`; `savedPath()` is
  `/saved`. `vite.config.js` writes `dist/saved/index.html`, with
  `<title>aiBytes_ · Saved</title>` and `<meta name="robots"
  content="noindex">`: the page is personal and has nothing to index.
- **Shell:** `AppHeader` and `Sidebar` as on every page, with `savedActive`,
  so Saved is current and no category is. A category in the Sidebar opens the
  latest edition filtered to it (`/?c=<key>`); the categories show no counts
  here, since there is no edition open. No toolbar.
- **Heading:** an `h1` "Saved" with the count of items shown, then "Stored in
  this browser only." while the list is not empty.
- **Sections:** an edition section is headed by its date (`Fri, Nov 6`), a
  weekly one by `Issue #9 · Nov 2` (its `published_on`). Editions and issues
  are interleaved by date, newest first (decision 2).
- **Order inside a section:** the source file's items through `rankedItems`,
  hidden ones included, then filtered to the saved ones: exactly the order the
  feed shows them in.
- **Unstarring** calls the store's `toggle`, and `useSaves` re-renders: the
  item leaves the page at once and the counts drop (decision 3). An
  emptied section goes too.
- **Loading:** "Loading your saves..." while the indexes and files load. A
  file that fails to load turns its section into a one-line error ("Could not
  load the Nov 6 edition."); the rest of the page still renders.

## What counts and what is left out (D2)

A save is **shown** when its file is in the index, loads, and has the item
with `hidden` not true. Otherwise it is **left out** and counted for the note:

- the item is `hidden: true` (`hide.py`): the usual case;
- the item is no longer in its file, or the file is no longer in the index
  (an edition withdrawn by hand).

The note at the end reads "1 saved item was removed from its edition and is
not shown." / "3 saved items were removed from their editions and are not
shown.", with "issue" / "issues" when every left-out save is a weekly one, and
"edition or issue" when they are mixed. Nothing is deleted from storage, so an
unhidden item comes back (map assumption 3).

The **Sidebar count** is the number of stored saves (decision 1); the `/saved`
heading counts only what it shows. They differ only while a saved item is
hidden or withdrawn.

## Copy

| Where | Text |
|---|---|
| Heading line, not empty | Stored in this browser only. |
| Empty state (`StatusMessage`) | **No saved items yet.** Select the ☆ on any card or row to save it. Saved items from every edition collect here, newest edition first. ← Back to the latest edition |
| Loading | Loading your saves... |
| Note | as above |

The design record's sign-in sentences ("Sign in with Google to keep them
across devices.", "Saves stay in this browser until you sign in with
Google.") are added by `app-accounts`, when there is a sign-in to point at.

## Code

- **`apps/web/src/saved.js`** (new, pure): `savedGroups(saves, { editions,
  issues, files })` turns the saves and the loaded indexes and files into
  `{ groups: [{ key, kind, label, date, items }], leftOut: { count, kinds } }`,
  and `leftOutNote(leftOut)` gives the note's text. `filesToLoad(saves,
  editions, issues)` names the refs to fetch. No React, so `node --test`
  covers it all.
- **`route.js`**: the `saved` route and `savedPath`.
- **`pageMeta.js`**: `SAVED_HEAD` and a `robots` option on `withHead`.
- **`vite.config.js`**: writes `saved/index.html`.
- **`App.jsx`**: `SavedApp` (loads, renders `ItemSections`-style sections
  with `SectionHeading`, the note and the empty state); `FeedShell` passes
  `onSaved`, `savedCount` and `savedActive={false}` to `Sidebar`.
- **No Ledger change.** `Sidebar`, `SectionHeading`, `Card`, `ListRow` and
  `StatusMessage` already cover it.

## Tech stack

Unchanged. No new dependency.

## Commands

```bash
npm test -w @aibytes/web
npm test -w @aibytes/design-system
npm run build:web                    # dist/saved/index.html must exist
npm run dev:web                      # http://localhost:5173/saved
python3 -m unittest discover -s tests -p test_design_system.py
python3 packages/feed-schema/validate.py
git diff --check
```

## Project structure

```
apps/web/src/saved.js, saved.test.js     new
apps/web/src/route.js, route.test.js     the saved route
apps/web/src/pageMeta.js, pageMeta.test.js   SAVED_HEAD, robots
apps/web/vite.config.js                  the saved page in the build
apps/web/src/App.jsx                     SavedApp; Sidebar props in FeedShell
```

## Code style

As the rest of `apps/web/src`: pure modules with a header comment and
`node --test` tests; React only in `App.jsx` and `hooks.js`.

## Testing strategy

- **`saved.test.js`:** groups and order (editions and issues interleaved by
  date, rank inside, hidden items placed by rank but not shown), each left-out
  case, the three note wordings and the singular, `filesToLoad` naming only
  referenced files, and an empty saves list.
- **`route.test.js`:** `/saved` and `/saved/` route; `savedPath`.
- **`pageMeta.test.js`:** `SAVED_HEAD` gives the title and `noindex`.
- **Build:** `dist/saved/index.html` exists with `noindex`.
- **Browser** (`npm run dev:web`, 1280 and 390px, both themes): Saved in the
  Sidebar and the drawer with the right count; `/saved` with edition and
  weekly saves in grid and list; unstarring; a left-out save and the note (a
  save written for an id not in its edition, since nothing is hidden today and
  `content/` is never edited for a test); the empty state; Network shows only the referenced files.

## Boundaries

- **Always:** load only what the saves name; keep `saved.js` pure; leave
  storage untouched on the Saved page except through `toggle`.
- **Ask first:** a toolbar, search or filters on `/saved`; any Ledger change;
  any change to `content/`.
- **Never:** sign-in copy or controls in this module; deleting saves the
  reader did not unstar; indexing `/saved`.

## Success criteria

1. Saved and its count show in the Sidebar and drawer on every edition and
   weekly issue page; it opens `/saved`, where it is the current entry.
2. `/saved` is a real 200 page in the build, `noindex`.
3. Sections, order, the hidden note and the empty state behave as above, in
   grid and list.
4. Only the referenced files load.
5. Unstarring on `/saved` removes the item at once.
6. The full check list passes.

## Decisions (answered 7 Nov 2026)

1. **The Sidebar count is the number of stored saves.** No page but `/saved`
   loads the files saves point at. This relaxes D2's "the Saved count leaves
   hidden items out too" for the Sidebar; the `/saved` heading still does.
2. **Weekly issues are interleaved with editions by date,** newest first.
3. **Unstarring on `/saved` removes the item at once,** as in the prototype.

## Open questions

None.
