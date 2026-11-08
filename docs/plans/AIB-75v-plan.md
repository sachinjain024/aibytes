# Implementation Plan: AIB-75v, module 1 `ledger-saves-ui`

Spec: `docs/specs/AIB-75v-ledger-saves-ui.md`. Map:
`docs/specs/AIB-75v-capability-map.md`. Ticket:
`.longclaw/tickets/AIB-75v/ticket.md`. Task list: `docs/plans/AIB-75v-todo.md`.

This plan covers all four modules. Module 1 merged in #55 (`e5fa1ab`),
module 2 in #56 (`c3fad8d`), module 3 in #57 (`95a71bc`). The newsletter
prompt after sign-in is a separate fast follow-up, AIB-140p.

## Overview

Five tasks on one branch, `aib-75v-ledger-saves-ui`, from an up-to-date
`main`: one commit per task, each passing the full check list, in one PR that
is squash-merged to `main` when the module is done:

1. **T1 `starPos`** on `FeedItem` / `Card` / `ListRow`
2. **T2 the Saved entry** in `Sidebar`
3. **T3 Sign in and the account menu** in `AppHeader`
4. **T4 the sticky `SaveBanner`** and the `--redesign-top` offset
5. **T5 the UI kit screens** and the readme

Every task adds optional props with today's output as the default, so each
commit leaves aibytes.io unchanged and is useful on its own: the option
exists, is typed, is documented, and is tested. Any commit is a clean point to
revert to inside the PR; the squash gives `main` one commit for the module.

## Dependency graph

```
T1 starPos ─────────┐
T2 Sidebar Saved ───┤
T3 AppHeader auth ──┼──> T5 UI kit screens 12-14, kit README, readme.md
T4 sticky banner ───┘
```

T1 to T4 touch separate components and could land in any order; they are
listed smallest and least risky first. T4 is the only one that changes a
shared layout rule (the top offset every sticky and fixed piece reads), so it
goes after the self-contained ones. T5 needs all four, because its screens
show them together.

## Architecture decisions (from the spec)

- **Off unless passed.** Each task's first test pins today's markup for the
  component with none of the new props, taken from `main` before the change.
- **The shell stays in Ledger.** `apps/web` is not touched by any task here;
  `tests/test_design_system.py` already fails if the app draws shell markup.
- **`--redesign-header` stays the masthead's height.** T4 adds
  `--redesign-banner` (set by the sticky banner on the root while mounted)
  and `--redesign-top`, their sum. Everything that clears the top bar moves to
  `--redesign-top`; `ToolbarTests` follow.
- **The account menu reuses `CardMenu`'s popover** classes and dismissal, so
  there is one popover pattern in Ledger.
- **No new colour token.** New pairs are added to `tokens/contrast.test.js`.
- **The avatar photo loads with `referrerpolicy="no-referrer"`** and falls
  back to the initial on error for the rest of the session.

## Risks

| Risk | Mitigation |
|---|---|
| T4's offset breaks the sticky toolbar, rail or drawer at some width | `--redesign-banner` defaults to `0px`, so with no banner every offset equals today's. Check 1280, 900 and 390px with and without the banner, and on dismissal, in both themes. |
| Two sticky siblings (masthead, banner) stack wrongly, or the banner slides under the rail | Python tests pin the z-index order masthead 40 > banner 38 > rail 35 > toolbar 30 and the banner's `top`. |
| `ResizeObserver` writes to the root on every resize and causes jank | Write only when the rounded height changes; remove the property on unmount. |
| The "unchanged markup" snapshot drifts with an unrelated change on `main` | Take the snapshot in each task's first commit, from that task's starting point, and keep it in the component's own test file. |
| Google's photo host refuses the image, leaving a broken avatar | `referrerpolicy="no-referrer"` plus `onError` swapping to the initial; checked in the preview with a bad URL. |
| `_ds_bundle.js` falls further behind the sources | Not edited, per the spec. The preview server compiles a fresh bundle, so the kit screens are checked through `npm run preview:design-system`. |

## Verification checkpoint (every task)

```bash
npm test -w @aibytes/design-system
npm test -w @aibytes/web
npm run build:web
python3 -m unittest discover -s tests -p test_design_system.py
git diff --check
```

plus the task's browser checks in `npm run preview:design-system`. Then the
task is committed, its boxes are ticked in the task list in the same commit,
and the branch is pushed. When T5 is committed the PR is ready for review;
once it is squash-merged, the ticket's `ledger-saves-ui … (PR merged)` item is
ticked and module 2's spec starts.

---

# Module 2: `app-local-saves`

Spec: `docs/specs/AIB-75v-app-local-saves.md` (approved 7 Nov 2026).

## Overview

Two tasks on branch `aib-75v-app-local-saves`, from `main` after #55: one
commit per task, one PR, squash-merged.

1. **T6 the saves store**: `apps/web/src/saves.js` and its tests. Pure, no UI,
   so it lands and is fully tested before anything renders a star.
2. **T7 the star on every page**: `useSaves`, the store created once in `App`,
   and `saved` / `onToggleSave` / `starPos="visual"` on every `Card` and
   `ListRow`, on edition pages (`edition_date`) and weekly issue pages
   (`issue_slug`).

Task numbers continue from module 1 so the ticket and commits never reuse one.

## Dependency graph

```
T6 saves.js (store, validation, cross-tab) ──> T7 useSaves + stars on edition and weekly pages
```

T7 is one task rather than two because the weekly pages share `FeedShell`
and `ItemSections` with editions: the only difference is the `from` object
passed down, a one-line change once the edition path works.

## Architecture decisions (from the spec)

- **The store knows nothing about React.** `localSaves(storage)` returns
  `list`, `has`, `toggle`, `subscribe`; module 4's account store returns the
  same, and `App` picks one.
- **`list()` returns the same array until something changes,** so
  `useSyncExternalStore` can use it as the snapshot without re-rendering on
  every call.
- **Validated on read, every time the key changes,** never trusted from
  storage. A failed write keeps the change in memory for the page view.
- **Exactly one source field per save**: `edition_date` or `issue_slug`.
- **No Ledger change and no new dependency.** The Sidebar is untouched until
  module 3.

## Risks

| Risk | Mitigation |
|---|---|
| A snapshot that changes identity on every read makes `useSyncExternalStore` loop | T6 tests that two `list()` calls with no change return the same array, and a toggle returns a new one |
| Another tab writes a corrupt value | The `storage` event re-reads through the same validation; T6 tests a corrupt write from "another tab" |
| A blocked store throws on every call | Every storage call is wrapped; T6 runs the whole interface against the throwing storage from `prefs.test.js` |
| Re-rendering every card on each toggle feels slow on a 30-item edition | One context value per toggle is cheap at this size; checked by hand in T7 at 390px. Memoising is left until it is measured |
| A weekly item saved with an edition date, or the reverse | `toggle` rejects a `from` without exactly one valid field (a bug, like `writeChoice`'s unknown value); T7 passes `from` from the page kind, never from the item |

## Verification checkpoint (every task)

The module 1 check list, plus `python3 packages/feed-schema/validate.py` to
confirm `content/` is untouched. T7 adds the browser checks in
`npm run dev:web` listed in the task. Once T7 is committed the PR is ready for
review; once it is squash-merged, the ticket's `app-local-saves` item is
ticked and module 3's spec starts.

---

# Module 3: `app-saved-view`

Spec: `docs/specs/AIB-75v-app-saved-view.md`.

## Overview

Three tasks on branch `aib-75v-app-saved-view`, from `main` after #56: one
commit per task, one PR, squash-merged.

1. **T8 the grouping**: `apps/web/src/saved.js`. Pure: which files to load,
   saves into sections in order, what is left out and the note. All the
   page's rules, tested without a browser.
2. **T9 the address**: the `saved` route, `SAVED_HEAD` with `noindex`, and
   `dist/saved/index.html` in the build. `/saved` becomes a real page that
   renders today's not-found message until T10.
3. **T10 the page and the entry**: `SavedApp` in `App.jsx`, and the Sidebar's
   Saved entry and count on every edition and weekly page.

## Dependency graph

```
T8 saved.js ─────────┐
                     ├──> T10 SavedApp + Sidebar Saved entry
T9 route + build ────┘
```

T8 and T9 are independent. T10 needs both. The Sidebar entry lands in T10,
not earlier, so no build has an entry pointing at an unfinished page
(decision 1 of module 2).

## Architecture decisions (from the spec)

- **`saved.js` holds every rule**: order, interleaving, rank inside a
  section, the left-out cases and the note's wording. `SavedApp` only loads
  and renders.
- **Load only what the saves name**: the two indexes, then the referenced
  editions and issues in parallel, through `content.js`'s existing loaders.
- **The Sidebar count is the stored count**; no page but `/saved` loads files
  for it.
- **No toolbar on `/saved`**, and the view comes from the stored VIEW choice
  (grid at one column, as everywhere).
- **No Ledger change, no new dependency.**

## Risks

| Risk | Mitigation |
|---|---|
| A reader with many saves across many editions waits on many requests | Requests go out in parallel and each section renders as its file lands; at one file per edition saved from, this stays small. Measured by hand in T10 |
| One failed file blanks the page | Each file's load is independent; T8 models a failed file as a section error, T10 checks it by blocking one URL in DevTools |
| Hidden items shift the rank order of what is shown | T8 ranks the whole file, hidden included, then filters, as the feed does; tested with a hidden item between two saved ones |
| `/saved` gets indexed | `noindex` in its built head; T9 tests the built file |
| The Sidebar entry needs a route the weekly pages do not share | `FeedShell` gets `navigate`, already passed in; T10 checks Saved from an edition, a weekly issue and the drawer |

## Verification checkpoint (every task)

The module 2 check list. T9 also checks `dist/saved/index.html`; T10 adds the
browser checks in its task. Once T10 is in, the PR is ready for review; once
it is squash-merged, the ticket's `app-saved-view` item is ticked and module
4's spec starts.

---

# Module 4: `app-accounts`

Spec: `docs/specs/AIB-75v-app-accounts.md` (approved 8 Nov 2026).

## Overview

Five tasks on branch `aib-75v-app-accounts`, from `main` after #57: one commit
per task, one PR, squash-merged. The first three need nothing from the
Firebase project, so they can start now; the last two need its config.

1. **T11 the privacy page**: `/privacy`, a real indexable page in the shell,
   linked from the Sidebar. First, because the consent screen needs its URL
   before the app can be published to all Google users.
2. **T12 the pure parts**: `accountData.js` (Firestore document ⇄ save),
   `merge.js` (what to add, the line's wording) and the banner's show rule.
   All `node --test`, no Firebase import.
3. **T13 the rules**: `firestore.rules`, `firebase.json`, and
   `rules.test.js` against the Firestore emulator with a `demo-aibytes`
   project id, so no real project is touched. `@firebase/rules-unit-testing`
   as an `apps/web` dev dependency.
4. **T14 signing in and the account store** *(needs the project)*: `firebase`
   in `apps/web`, `firebase-config.js`, `account.js`, `accountSaves.js`, the
   store switch in `App`, Sign in and the avatar menu, the merge on sign-in,
   and `.firebaserc` with the real project id.
5. **T15 the banner and the signed-in lines**: the sticky `SaveBanner` (C2),
   the `/saved` lines for signed out and signed in, the empty state's last
   line, and the merge line.

Then, outside the PR's code: **the publisher deploys the rules** with the
command in the spec, after review, and signs in once on aibytes.io.

## Dependency graph

```
T11 /privacy ───────────────────────────────┐
T12 pure parts ──┬──> T14 sign in + store ──┼──> T15 banner + lines ──> PR
T13 rules ───────┘          ▲               │
              Firebase project config ──────┘ (T14 waits for it)
```

## Architecture decisions (from the spec)

- **One Firebase entry point.** Only `account.js` and `accountSaves.js`
  import Firebase; components get a store and a user, never the SDK.
- **The store follows the user**: `localSaves` signed out,
  `accountSaves(uid)` signed in, the same interface, so `useSaves` and every
  page are unchanged.
- **Merge, then clear**: local storage is cleared only after the batch
  commits; a failure leaves it for the next sign-in.
- **Firebase loads on every page** (decision 1); its size is recorded in T14.
- **Rules tested on the emulator** (decision 2) with a demo project id;
  deployed by hand, never from CI.
- **No new Ledger work**: every control already exists from module 1.

## Risks

| Risk | Mitigation |
|---|---|
| A rules mistake exposes saves or lets anyone write | T13's emulator tests cover owner, other user, signed out, bad shape, extra fields and other paths; the publisher reviews the rules before deploying them |
| A failed merge loses local saves | Clear only after the batch commits; T12 tests the plan, T14 checks a forced failure by hand |
| The returning reader sees Sign in flash | The header shows neither control until Firebase reports the restored user; checked by reload in T14 |
| Firebase's size slows every page | Measured in T14's build check (gzipped); if it is far above the estimate, revisit decision 1 before T15 |
| The popup is blocked (some mobile browsers, strict settings) | Sign in is a direct click, which browsers allow; a blocked popup shows the "Could not sign in" line. Checked on Safari and Chrome at 390px |
| The stray root `firebase` dependency (uncommitted, not from this work) gets committed by accident | Never staged; the publisher reverts it before T14 adds `firebase` to `apps/web` |

## Verification checkpoint (every task)

The module 3 check list, plus `npm run test:rules -w @aibytes/web` from T13
on (it skips when the emulator is missing). T14 and T15 add the browser checks
in their tasks, on localhost with a real Google account. Once T15 is in, the
PR is ready for review; once it is squash-merged and the rules are deployed,
the ticket's module 4 items are ticked and AIB-140p can start.
