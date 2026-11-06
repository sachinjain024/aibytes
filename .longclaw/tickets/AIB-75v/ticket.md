---
format: longclaw.ticket/v1
id: 6ef6489e-6e94-477f-947d-f4964ff401e2
key: AIB-75v
title: Saves and Google sign-in for the web app
status: in_progress
priority: p2
rank: a0
labels:
  - app
type: feature
created_at: 2026-10-08T06:08:19.592Z
updated_at: 2026-11-06T12:19:09.840Z
---

Saving items (the ☆ on every card and row) and signing in with Google, split out of AIB-8h on 2026-10-08. AIB-8h shipped the web app without them: no star, no Saved entry, no Sign in. This ticket brings them in.

## Where things are

- **Design, decided 6 Nov 2026:** `docs/decisions/product/AIB-75v-saves-and-sign-in-design.md`. A1 Saved in the sidebar, always shown, with an empty state · B2 Sign in always in the header · C2 a sticky full-width banner with a warning icon · D2 hidden saves left out, with a note · E2 the star under the source icon.
- **Prototype:** `docs/ux/prototypes/AIB-75v-saves/` (open `aib-75v-saves.html`).
- **Capability map, approved 6 Nov 2026:** `docs/specs/AIB-75v-capability-map.md`.
- **Product spec:** §8 of `docs/aibytes-app-product-spec.md`.

## What is true today

- `apps/web` renders editions with Ledger's `Card` and `ListRow`. Neither shows a star unless it is given `onToggleSave`, so nothing dead is on screen.
- Ledger has `SaveStar` and `SaveBanner`. The redesign removed the header's Saved chip and avatar and the old `06-saved` / `09-headers-auth` UI kit screens, so `Sidebar` and `AppHeader` have no place yet for Saved, Sign in or the account menu.
- `apps/web/src/prefs.js` is how the app keeps validated preferences in local storage. Local saves follow the same pattern.

## The plan

Four modules, one PR each, each merged to `main` before the next starts. Each gets its own spec, `docs/specs/AIB-75v-<module-id>.md`, approved before it is built.

1. **`ledger-saves-ui`:** the Ledger options the design needs: a Saved entry in `Sidebar`, Sign in and the account menu in `AppHeader`, the sticky `SaveBanner` with its icon, and a star position on `FeedItem` / `Card` / `ListRow`. All off by default, so aibytes.io does not change.
2. **`app-local-saves`:** the ☆ in the app, saving at once to local storage as `item_id` + `edition_date` + `created_at`, and the sidebar's Saved entry and count.
3. **`app-saved-view`:** the `/saved` page, grouped by edition date, newest edition first, items in the edition's rank order. Hidden items left out with a note. The empty state.
4. **`app-accounts`:** Firebase Auth (Google) and Firestore, client SDK only. Saves at `users/{uid}/saves/{itemId}`. `firestore.rules` in the repo, reviewed, deployed by hand with the Firebase CLI. Merge local saves on first sign-in (a union), then clear local storage. The Sign in control, the account menu and the banner land here.

Decisions on the map: the publisher creates a new Firebase project for aibytes.io (Google sign-in on, `aibytes.io` authorised) before `app-accounts` starts; the rules are deployed by hand, not from CI; the `firebase` package is the one new dependency, added in `app-accounts`.

## Notes

- The Chrome extension (AIB-8h, phase 7) is read-only in v1 and has no saves, so this is web only.
- The Firebase web config is public by design. The security rules are what protect the data, so they get an explicit review.

## Checklist

- [x] Design decided: decision record and prototype <!-- longclaw:item=ck_9f53b82f -->
- [x] Capability map approved (docs/specs/AIB-75v-capability-map.md) <!-- longclaw:item=ck_74b4e788 -->
- [ ] ledger-saves-ui: spec approved <!-- longclaw:item=ck_eafa6b6e -->
- [ ] ledger-saves-ui: Saved entry in Sidebar, Sign in and account menu in AppHeader, sticky SaveBanner with icon, star position on FeedItem / Card / ListRow (PR merged) <!-- longclaw:item=ck_bbf07bb8 -->
- [ ] app-local-saves: spec approved <!-- longclaw:item=ck_e869ea35 -->
- [ ] app-local-saves: the ☆ saves to local storage at once, Saved entry and count in the sidebar (PR merged) <!-- longclaw:item=ck_d5ac2437 -->
- [ ] app-saved-view: spec approved <!-- longclaw:item=ck_1b4555b9 -->
- [ ] app-saved-view: /saved page grouped by edition date, rank order inside each, hidden items left out with a note, empty state (PR merged) <!-- longclaw:item=ck_92ac9854 -->
- [ ] Firebase project created for aibytes.io (publisher): Google sign-in on, aibytes.io authorised <!-- longclaw:item=ck_af2bb5f2 -->
- [ ] app-accounts: spec approved <!-- longclaw:item=ck_f3d1ec1d -->
- [ ] app-accounts: Firebase Auth with the Google provider, client SDK only; Sign in, account menu and the sticky banner <!-- longclaw:item=ck_1f32b91e -->
- [ ] app-accounts: Firestore users/{uid}/saves/{itemId}; firestore.rules reviewed and deployed by hand with the Firebase CLI <!-- longclaw:item=ck_4661cf94 -->
- [ ] app-accounts: merge local saves into the account on first sign-in, then clear local storage (PR merged) <!-- longclaw:item=ck_75ad990d -->

## Activity

<!-- longclaw:event
id: evt_ba8862be
kind: create
occurred_at: 2026-10-08T06:08:19.592Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
-->
### Claude Code created this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_7c92b730
kind: update
occurred_at: 2026-11-06T10:44:41.750Z
actor:
  type: human
  id: local
changes:
  - field: status
    from: backlog
    to: in_progress
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_fb1b62f0
kind: update
occurred_at: 2026-11-06T11:14:37.149Z
actor:
  type: human
  id: local
changes:
  - field: rank
    to: a0
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_00c86a89
kind: update
occurred_at: 2026-11-06T12:01:20.147Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_bbf07bb8.added
    to: "Ledger: Saved entry in Sidebar, Sign in and account menu in AppHeader, sticky SaveBanner with icon, star position option on FeedItem"
-->
### Claude Code updated this ticket

Design decided from the prototype: A1 Saved in the sidebar (always shown, with an empty state), B2 Sign in always in the header, C2 sticky full-width banner with a warning icon, D2 hidden saves left out with a note, E2 star under the source icon. Decision record: docs/decisions/product/AIB-75v-saves-and-sign-in-design.md
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_46f9780b
kind: update
occurred_at: 2026-11-06T12:18:58.012Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: description
  - field: checklist.ck_9f53b82f.added
    to: "Design decided: decision record and prototype"
  - field: checklist.ck_74b4e788.added
    to: Capability map approved (docs/specs/AIB-75v-capability-map.md)
  - field: checklist.ck_eafa6b6e.added
    to: "ledger-saves-ui: spec approved"
  - field: checklist.ck_e869ea35.added
    to: "app-local-saves: spec approved"
  - field: checklist.ck_1b4555b9.added
    to: "app-saved-view: spec approved"
  - field: checklist.ck_af2bb5f2.added
    to: "Firebase project created for aibytes.io (publisher): Google sign-in on, aibytes.io authorised"
  - field: checklist.ck_f3d1ec1d.added
    to: "app-accounts: spec approved"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_37ce6ce0
kind: update
occurred_at: 2026-11-06T12:19:09.481Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_bbf07bb8.text
    from: "Ledger: Saved entry in Sidebar, Sign in and account menu in AppHeader, sticky SaveBanner with icon, star position option on FeedItem"
    to: "ledger-saves-ui: Saved entry in Sidebar, Sign in and account menu in AppHeader, sticky SaveBanner with icon, star position on FeedItem / Card / ListRow (PR merged)"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_12529136
kind: update
occurred_at: 2026-11-06T12:19:09.508Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_d5ac2437.text
    from: Anonymous saves in local storage, plus the save banner
    to: "app-local-saves: the ☆ saves to local storage at once, Saved entry and count in the sidebar (PR merged)"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_5724b681
kind: update
occurred_at: 2026-11-06T12:19:09.530Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_92ac9854.text
    from: Saved view, grouped by edition date
    to: "app-saved-view: /saved page grouped by edition date, rank order inside each, hidden items left out with a note, empty state (PR merged)"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_7834c6ee
kind: update
occurred_at: 2026-11-06T12:19:09.553Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_1f32b91e.text
    from: Firebase Auth with the Google provider, client SDK only
    to: "app-accounts: Firebase Auth with the Google provider, client SDK only; Sign in, account menu and the sticky banner"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_fab14e3d
kind: update
occurred_at: 2026-11-06T12:19:09.570Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_4661cf94.text
    from: Firestore `users/{uid}/saves/{itemId}`, with security rules reviewed
    to: "app-accounts: Firestore users/{uid}/saves/{itemId}; firestore.rules reviewed and deployed by hand with the Firebase CLI"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_f22f1aba
kind: update
occurred_at: 2026-11-06T12:19:09.588Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_75ad990d.text
    from: Merge local saves into the account on first sign-in, then clear local storage
    to: "app-accounts: merge local saves into the account on first sign-in, then clear local storage (PR merged)"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_c7cfe686
kind: update
occurred_at: 2026-11-06T12:19:09.606Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_9f53b82f.moved
    from: "7"
    to: "1"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_ec76fc94
kind: update
occurred_at: 2026-11-06T12:19:09.627Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_74b4e788.moved
    from: "8"
    to: "2"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_a3ae5bef
kind: update
occurred_at: 2026-11-06T12:19:09.645Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_eafa6b6e.moved
    from: "9"
    to: "3"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_8e8764ca
kind: update
occurred_at: 2026-11-06T12:19:09.663Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_bbf07bb8.moved
    from: "9"
    to: "4"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_9dd8a784
kind: update
occurred_at: 2026-11-06T12:19:09.683Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_e869ea35.moved
    from: "10"
    to: "5"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_8c616e11
kind: update
occurred_at: 2026-11-06T12:19:09.724Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_1b4555b9.moved
    from: "11"
    to: "7"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_db12e64d
kind: update
occurred_at: 2026-11-06T12:19:09.745Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_92ac9854.moved
    from: "11"
    to: "8"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_9d0ccefd
kind: update
occurred_at: 2026-11-06T12:19:09.762Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_af2bb5f2.moved
    from: "12"
    to: "9"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_ea899d16
kind: update
occurred_at: 2026-11-06T12:19:09.782Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_f3d1ec1d.moved
    from: "13"
    to: "10"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_4601a8a9
kind: update
occurred_at: 2026-11-06T12:19:09.840Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_9f53b82f.checked
    from: "false"
    to: "true"
  - field: checklist.ck_74b4e788.checked
    from: "false"
    to: "true"
-->
### Claude Code updated this ticket

Plan set: capability map approved with four modules (ledger-saves-ui, app-local-saves, app-saved-view, app-accounts), one PR each in that order, each with its own approved spec. Answers: new Firebase project created by the publisher; rules deployed by hand; Saved lists items in the edition's rank order; prototype checked in at docs/ux/prototypes/AIB-75v-saves/. The checklist now tracks each module's spec and PR. Next: the ledger-saves-ui spec.
<!-- /longclaw:event -->
