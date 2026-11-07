# Capability map: AIB-75v, saves and Google sign-in

Status: **approved 6 Nov 2026, with the answers below.** Module specs follow
in build order. Progress is tracked in the ticket's checklist.

Source of the work: `.longclaw/tickets/AIB-75v/ticket.md`, product spec §8
(`docs/aibytes-app-product-spec.md`), and the design decided on 6 Nov 2026 in
`docs/decisions/product/AIB-75v-saves-and-sign-in-design.md` (A1 Saved in the
sidebar, B2 Sign in always shown, C2 sticky banner, D2 hidden saves left out,
E2 star under the source icon).

## Why a map rather than one spec

The ticket bundles four groups of work. Each has its own code, its own tests,
and can ship and be checked without the others:

- **Component changes in Ledger** (`packages/design-system`), checked in the
  UI kit and `Card.test.js` with no app wiring
- **Saving in the browser** (`apps/web`, local storage), usable with no
  account at all
- **A new page**, the Saved view, with its own URL and its own build output
- **Accounts** (Firebase Auth and Firestore), the only part with a new
  dependency, a third-party service, and security rules to review

## Modules

| Module id | Responsibility | Depends on |
|---|---|---|
| `ledger-saves-ui` | Ledger options the design needs, all off by default so today's app is unchanged: a Saved entry in `Sidebar` (count, active state, always shown when given a handler); a Sign in control and signed-in avatar menu in `AppHeader`; `SaveBanner` with the warning icon, centred message, and a sticky placement that offsets the rail, drawer and toolbar; a star-position option on `FeedItem` / `Card` / `ListRow` for E2. `.d.ts`, `.prompt.md`, UI kit screens, `Card.test.js`, and the contrast tests | — |
| `app-local-saves` | The ☆ on every card and row in `apps/web`, on edition and weekly issue pages, saving at once to local storage as `{ item_id, edition_date \| issue_slug, created_at }`. A saves module beside `prefs.js`, validated on read so a bad or blocked store behaves like an empty one, and the same interface the account store will implement later | `ledger-saves-ui` |
| `app-saved-view` | The rail's Saved entry and count, and the Saved page at `/saved`: a real page in the static build, loading only the editions and weekly issues the saves point at, grouped by edition date, newest first, in the reader's grid or list choice; hidden items left out with a note (D2); the empty state; unsaving from the page | `app-local-saves` |
| `app-accounts` | Firebase Auth (Google provider) and Firestore, client SDK only. Saves at `users/{uid}/saves/{itemId}` with `edition_date` or `issue_slug`, and `created_at`; `firestore.rules` in the repo, reviewed; the Sign in control and avatar menu; the sticky banner; merge on first sign-in (union, then clear local storage); the "added from this browser" line | `app-local-saves`, `app-saved-view` (the merged line shows there) |

Out of scope, per the ticket and spec: saves in the Chrome extension (read-only
in v1); save counts or "most saved" (`stats/{editionDate}`, spec §8, later);
any sign-in provider but Google; analytics on save rate and sign-in.

## Build order

```
ledger-saves-ui ──► app-local-saves ──► app-saved-view ──► app-accounts
```

1. `ledger-saves-ui` first. Every option is off by default, so it ships with
   no visible change to aibytes.io.
2. `app-local-saves`. Readers can save from this point, with no account.
3. `app-saved-view`. Saves become useful: there is somewhere to read them.
4. `app-accounts` last. It is the riskiest (a new dependency, a hosted service,
   rules guarding user data), and everything it builds on is already live.

Four PRs, one per module, each merged to `main` before the next starts. Specs
will be saved beside this file as `docs/specs/AIB-75v-<module-id>.md`.

## Assumptions

Correct any of these now; otherwise the module specs are written on them.

1. The banner and the Sign in control ship with `app-accounts`, not before.
   Until then there is nothing to sign in to, so the first three modules show
   the star and the Saved entry and no sign-in prompt.
2. The Saved view lives at `/saved`, a path, matching the app's routes
   (`route.js`), and `vite.config.js` emits it as a real page like an edition.
3. A save is kept while its item is hidden. D2 changes what the Saved view
   shows, not what is stored, so `hide.py --unhide` brings the item back.
4. Saves made in local storage before `app-accounts` ships are merged into the
   account on first sign-in, exactly like saves made after it.
5. Adding the `firebase` package to `apps/web` is approved as part of
   `app-accounts`. It is the only new runtime dependency in the map.

## Decisions (answered 6 Nov 2026)

1. **Firebase project:** the publisher creates a new Firebase project for
   aibytes.io, with Google sign-in on and `aibytes.io` as an authorised
   domain. `app-accounts` waits for it. *Module: `app-accounts`.*
2. **Deploying the rules:** by hand from the dev machine with the Firebase
   CLI. No deploy token in GitHub, no workflow. The spec records the exact
   command. *Module: `app-accounts`.*
3. **Order inside an edition on the Saved page:** the edition's own rank
   order, the same order the feed uses. *Module: `app-saved-view`.*
4. **The prototype:** checked in at `docs/ux/prototypes/AIB-75v-saves/`, so
   the module specs can cite it.

## Changes from module 2's review (7 Nov 2026)

1. **The rail's Saved entry and count move from `app-local-saves` to
   `app-saved-view`,** so the entry ships with the page it opens.
2. **Weekly issue items can be saved too.** A save names its item's file by
   `edition_date` or `issue_slug`; `app-saved-view` loads both kinds and
   `app-accounts` stores the same fields.
