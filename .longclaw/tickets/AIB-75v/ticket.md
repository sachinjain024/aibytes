---
format: longclaw.ticket/v1
id: 6ef6489e-6e94-477f-947d-f4964ff401e2
key: AIB-75v
title: Saves and Google sign-in for the web app
status: in_progress
priority: p1
rank: a0
labels:
  - app
type: feature
created_at: 2026-10-08T06:08:19.592Z
updated_at: 2026-11-09T22:06:57.738Z
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
- [x] ledger-saves-ui: spec approved <!-- longclaw:item=ck_eafa6b6e -->
- [x] T1: star position on cards and rows <!-- longclaw:item=ck_f34fbba2 -->
- [x] T2: the Saved entry in the sidebar <!-- longclaw:item=ck_6500736c -->
- [x] T3: Sign in and the account menu in the header <!-- longclaw:item=ck_b91cc873 -->
- [x] T4: the sticky save banner <!-- longclaw:item=ck_3e692f5c -->
- [x] T5: UI kit screens and docs <!-- longclaw:item=ck_2ee982e4 -->
- [x] ledger-saves-ui: Saved entry in Sidebar, Sign in and account menu in AppHeader, sticky SaveBanner with icon, star position on FeedItem / Card / ListRow (PR merged) <!-- longclaw:item=ck_bbf07bb8 -->
- [x] app-local-saves: spec approved <!-- longclaw:item=ck_e869ea35 -->
- [x] T6: the saves store <!-- longclaw:item=ck_1c92eda5 -->
- [x] T7: the star on edition and weekly pages <!-- longclaw:item=ck_5edd6b32 -->
- [x] app-local-saves: the ☆ on edition and weekly issue pages saves to local storage at once (PR merged) <!-- longclaw:item=ck_d5ac2437 -->
- [x] app-saved-view: spec approved <!-- longclaw:item=ck_1b4555b9 -->
- [x] T8: the grouping <!-- longclaw:item=ck_05ca07da -->
- [x] T9: the address <!-- longclaw:item=ck_c49fa709 -->
- [x] T10: the page and the entry <!-- longclaw:item=ck_522b50f3 -->
- [x] app-saved-view: Saved entry and count in the sidebar, /saved page grouped by edition date and weekly issue, rank order inside each, hidden items left out with a note, empty state (PR merged) <!-- longclaw:item=ck_92ac9854 -->
- [x] Firebase project created for aibytes.io (publisher): Google sign-in on, aibytes.io authorised <!-- longclaw:item=ck_af2bb5f2 -->
- [x] app-accounts: spec approved <!-- longclaw:item=ck_f3d1ec1d -->
- [x] T11: the privacy page <!-- longclaw:item=ck_071c6456 -->
- [x] T12: the pure parts <!-- longclaw:item=ck_5c71b7c7 -->
- [x] T13: the rules <!-- longclaw:item=ck_120354e4 -->
- [x] T14: signing in and the account store (needs the Firebase project) <!-- longclaw:item=ck_304c9fdc -->
- [x] T15: the banner and the signed-in lines <!-- longclaw:item=ck_ddb505c3 -->
- [ ] app-accounts: Firebase Auth with the Google provider, client SDK only; Sign in, account menu and the sticky banner <!-- longclaw:item=ck_1f32b91e -->
- [x] app-accounts: Firestore users/{uid}/saves/{itemId}; firestore.rules reviewed and deployed by hand with the Firebase CLI <!-- longclaw:item=ck_4661cf94 -->
- [ ] app-accounts: merge local saves into the account on first sign-in, then clear local storage (PR merged) <!-- longclaw:item=ck_75ad990d -->
- [x] After the PR: the publisher reviews firestore.rules and deploys it (firebase deploy --only firestore:rules) <!-- longclaw:item=ck_0a4eed5e -->
- [ ] After the PR: one sign-in on aibytes.io after Pages deploys <!-- longclaw:item=ck_dc744d05 -->
- [x] Ledger: links in body text visible without hover (link colour + underline, WCAG 1.4.1) <!-- longclaw:item=ck_ec5f97c2 -->

## Ticket References

<!-- longclaw:reference
id: ref_d61ca8a8
path: docs/decisions/product/AIB-75v-saves-and-sign-in-design.md
added_at: 2026-11-08T00:58:24.000Z
added_by:
  type: agent
  id: claude-code
  name: Claude Code
-->
[AIB-75v-saves-and-sign-in-design.md](docs/decisions/product/AIB-75v-saves-and-sign-in-design.md)
<!-- /longclaw:reference -->

<!-- longclaw:reference
id: ref_17dbf81b
path: docs/ux/prototypes/AIB-75v-saves/aib-75v-saves.html
added_at: 2026-11-08T00:58:24.000Z
added_by:
  type: agent
  id: claude-code
  name: Claude Code
-->
[aib-75v-saves.html](docs/ux/prototypes/AIB-75v-saves/aib-75v-saves.html)
<!-- /longclaw:reference -->

<!-- longclaw:reference
id: ref_2f0a3070
path: packages/design-system/ui_kits/aibytes-app/12-saves-signed-out.html
added_at: 2026-11-08T00:58:24.000Z
added_by:
  type: agent
  id: claude-code
  name: Claude Code
-->
[12-saves-signed-out.html](packages/design-system/ui_kits/aibytes-app/12-saves-signed-out.html)
<!-- /longclaw:reference -->

<!-- longclaw:reference
id: ref_d303cf37
path: packages/design-system/ui_kits/aibytes-app/13-signed-in-menu.html
added_at: 2026-11-08T00:58:24.000Z
added_by:
  type: agent
  id: claude-code
  name: Claude Code
-->
[13-signed-in-menu.html](packages/design-system/ui_kits/aibytes-app/13-signed-in-menu.html)
<!-- /longclaw:reference -->

<!-- longclaw:reference
id: ref_6dc51df4
path: packages/design-system/ui_kits/aibytes-app/14-mobile-banner.html
added_at: 2026-11-08T00:58:24.000Z
added_by:
  type: agent
  id: claude-code
  name: Claude Code
-->
[14-mobile-banner.html](packages/design-system/ui_kits/aibytes-app/14-mobile-banner.html)
<!-- /longclaw:reference -->

<!-- longclaw:reference
id: ref_a1ac708b
path: docs/aibytes-app-product-spec.md
added_at: 2026-11-08T00:58:24.000Z
added_by:
  type: agent
  id: claude-code
  name: Claude Code
-->
[aibytes-app-product-spec.md](docs/aibytes-app-product-spec.md)
<!-- /longclaw:reference -->

<!-- longclaw:reference
id: ref_d846d331
path: docs/specs/AIB-75v-capability-map.md
added_at: 2026-11-08T00:58:24.000Z
added_by:
  type: agent
  id: claude-code
  name: Claude Code
-->
[AIB-75v-capability-map.md](docs/specs/AIB-75v-capability-map.md)
<!-- /longclaw:reference -->

<!-- longclaw:reference
id: ref_d6919c8e
path: docs/specs/AIB-75v-ledger-saves-ui.md
added_at: 2026-11-08T00:58:24.000Z
added_by:
  type: agent
  id: claude-code
  name: Claude Code
-->
[AIB-75v-ledger-saves-ui.md](docs/specs/AIB-75v-ledger-saves-ui.md)
<!-- /longclaw:reference -->

<!-- longclaw:reference
id: ref_651be514
path: docs/specs/AIB-75v-app-local-saves.md
added_at: 2026-11-08T00:58:24.000Z
added_by:
  type: agent
  id: claude-code
  name: Claude Code
-->
[AIB-75v-app-local-saves.md](docs/specs/AIB-75v-app-local-saves.md)
<!-- /longclaw:reference -->

<!-- longclaw:reference
id: ref_ba2f2f94
path: docs/specs/AIB-75v-app-saved-view.md
added_at: 2026-11-08T00:58:24.000Z
added_by:
  type: agent
  id: claude-code
  name: Claude Code
-->
[AIB-75v-app-saved-view.md](docs/specs/AIB-75v-app-saved-view.md)
<!-- /longclaw:reference -->

<!-- longclaw:reference
id: ref_a3eb6bd3
path: docs/specs/AIB-75v-app-accounts.md
added_at: 2026-11-08T00:58:24.000Z
added_by:
  type: agent
  id: claude-code
  name: Claude Code
-->
[AIB-75v-app-accounts.md](docs/specs/AIB-75v-app-accounts.md)
<!-- /longclaw:reference -->

<!-- longclaw:reference
id: ref_6750a930
path: docs/plans/AIB-75v-plan.md
added_at: 2026-11-08T00:58:24.000Z
added_by:
  type: agent
  id: claude-code
  name: Claude Code
-->
[AIB-75v-plan.md](docs/plans/AIB-75v-plan.md)
<!-- /longclaw:reference -->

<!-- longclaw:reference
id: ref_6d416700
path: docs/plans/AIB-75v-todo.md
added_at: 2026-11-08T00:58:24.000Z
added_by:
  type: agent
  id: claude-code
  name: Claude Code
-->
[AIB-75v-todo.md](docs/plans/AIB-75v-todo.md)
<!-- /longclaw:reference -->

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

<!-- longclaw:event
id: evt_c6653687
kind: comment
occurred_at: 2026-11-06T22:21:49.066Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
-->
### Claude Code commented

Spec drafted for ledger-saves-ui: docs/specs/AIB-75v-ledger-saves-ui.md. Awaiting review; two open questions (avatar photo, the YOURS label).
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_b5b94528
kind: update
occurred_at: 2026-11-06T22:26:27.698Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_eafa6b6e.checked
    from: "false"
    to: "true"
-->
### Claude Code updated this ticket

ledger-saves-ui spec reviewed: the avatar shows the Google profile photo with the initial as fallback, and the sidebar label is LIBRARY. Spec: docs/specs/AIB-75v-ledger-saves-ui.md. Next: break the module into tasks.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_bc7cddac
kind: comment
occurred_at: 2026-11-06T22:37:07.568Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
-->
### Claude Code commented

Plan approved for ledger-saves-ui: docs/plans/AIB-75v-plan.md and docs/plans/AIB-75v-todo.md. Five tasks (T1-T5) on one branch, aib-75v-ledger-saves-ui, one commit per task, one PR squash-merged to main.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_cb09a84c
kind: update
occurred_at: 2026-11-07T09:19:19.808Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_bbf07bb8.checked
    from: "false"
    to: "true"
-->
### You updated this ticket

Module 1 ledger-saves-ui squash-merged to main in #55 (e5fa1ab): starPos, the Sidebar Saved entry, Sign in and the account menu, the sticky SaveBanner with --redesign-top, and UI kit screens 12-14. #54 was superseded by #55. Next: the app-local-saves spec.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_94e8d15d
kind: comment
occurred_at: 2026-11-07T09:19:33.679Z
actor:
  type: human
  id: local
-->
### You commented

## Firebase Project Details

- This is an existing Firebase project with Firestore and Functions defined
- We can leave existing things as-is
- Project is https://console.firebase.google.com/u/0/project/ai-bytes-b42d2/overview
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_91a5a804
kind: comment
occurred_at: 2026-11-07T09:21:36.232Z
actor:
  type: human
  id: local
-->
### You commented

Module 2 spec drafted, awaiting review: docs/specs/AIB-75v-app-local-saves.md (branch aib-75v-app-local-saves).
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_883f6601
kind: update
occurred_at: 2026-11-07T09:35:17.385Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_e869ea35.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_bbd7df27
kind: update
occurred_at: 2026-11-07T09:35:57.682Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_d5ac2437.text
    from: "app-local-saves: the ☆ saves to local storage at once, Saved entry and count in the sidebar (PR merged)"
    to: "app-local-saves: the ☆ on edition and weekly issue pages saves to local storage at once (PR merged)"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_fdfaf180
kind: update
occurred_at: 2026-11-07T09:35:57.757Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_92ac9854.text
    from: "app-saved-view: /saved page grouped by edition date, rank order inside each, hidden items left out with a note, empty state (PR merged)"
    to: "app-saved-view: Saved entry and count in the sidebar, /saved page grouped by edition date and weekly issue, rank order inside each, hidden items left out with a note, empty state (PR merged)"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_b826e396
kind: comment
occurred_at: 2026-11-07T09:35:57.810Z
actor:
  type: human
  id: local
-->
### You commented

Module 2 spec approved (docs/specs/AIB-75v-app-local-saves.md). Decisions: the Sidebar's Saved entry moves to module 3; weekly issue items get the star and store issue_slug. Plan and tasks T6-T7 in docs/plans/AIB-75v-plan.md and -todo.md, awaiting approval.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_6efb01db
kind: update
occurred_at: 2026-11-07T10:27:09.160Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_d5ac2437.checked
    from: "false"
    to: "true"
-->
### You updated this ticket

Module 2 app-local-saves squash-merged to main in #56 (c3fad8d): the star on edition and weekly pages saves to local storage; also fixed a blank page when site data is blocked. Next: the app-saved-view spec.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_86417f9c
kind: comment
occurred_at: 2026-11-07T10:28:20.011Z
actor:
  type: human
  id: local
-->
### You commented

Module 3 spec drafted, awaiting review: docs/specs/AIB-75v-app-saved-view.md (branch aib-75v-app-saved-view).
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_25599cf8
kind: update
occurred_at: 2026-11-07T10:34:55.495Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_1b4555b9.checked
    from: "false"
    to: "true"
-->
### You updated this ticket

Module 3 spec approved (docs/specs/AIB-75v-app-saved-view.md): Sidebar count is the stored count, weekly issues interleaved by date, unstarring on /saved removes at once. Tasks T8-T10 in docs/plans/AIB-75v-todo.md.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_f34cf7a0
kind: update
occurred_at: 2026-11-07T10:47:10.438Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_92ac9854.checked
    from: "false"
    to: "true"
-->
### You updated this ticket

Module 3 app-saved-view squash-merged to main in #57 (95a71bc): Saved and its count in every Sidebar, and /saved grouped by edition and weekly issue. Open for module 4 or a follow-up: category counts show '–' on /saved, and the page title uses the section-heading style. Next: app-accounts, waiting on the Firebase project.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_84f2a7ed
kind: comment
occurred_at: 2026-11-07T10:49:18.913Z
actor:
  type: human
  id: local
-->
### You commented

Module 4 spec drafted, awaiting review: docs/specs/AIB-75v-app-accounts.md (branch aib-75v-app-accounts).
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_605175d2
kind: comment
occurred_at: 2026-11-07T18:34:52.954Z
actor:
  type: human
  id: local
-->
### You commented

The newsletter prompt after sign-in is split out as a fast follow-up: AIB-140p.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_e3b8c42d
kind: update
occurred_at: 2026-11-08T00:57:00.865Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_f3d1ec1d.checked
    from: "false"
    to: "true"
-->
### You updated this ticket

Module 4 spec approved 8 Nov 2026 (docs/specs/AIB-75v-app-accounts.md): Firebase on every page, rules tested on the emulator, a /privacy page. Tasks T11-T15 in docs/plans/AIB-75v-todo.md; T11-T13 need no Firebase project, T14-T15 do.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_e869e59a
kind: update
occurred_at: 2026-11-08T01:01:05.233Z
actor:
  type: human
  id: local
changes:
  - field: priority
    from: p2
    to: p1
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_e779d48f
kind: update
occurred_at: 2026-11-08T01:01:49.658Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_f34fbba2.added
    to: "T1: star position on cards and rows"
  - field: checklist.ck_6500736c.added
    to: "T2: the Saved entry in the sidebar"
  - field: checklist.ck_b91cc873.added
    to: "T3: Sign in and the account menu in the header"
  - field: checklist.ck_3e692f5c.added
    to: "T4: the sticky save banner"
  - field: checklist.ck_2ee982e4.added
    to: "T5: UI kit screens and docs"
  - field: checklist.ck_1c92eda5.added
    to: "T6: the saves store"
  - field: checklist.ck_5edd6b32.added
    to: "T7: the star on edition and weekly pages"
  - field: checklist.ck_05ca07da.added
    to: "T8: the grouping"
  - field: checklist.ck_c49fa709.added
    to: "T9: the address"
  - field: checklist.ck_522b50f3.added
    to: "T10: the page and the entry"
  - field: checklist.ck_071c6456.added
    to: "T11: the privacy page"
  - field: checklist.ck_5c71b7c7.added
    to: "T12: the pure parts"
  - field: checklist.ck_120354e4.added
    to: "T13: the rules"
  - field: checklist.ck_304c9fdc.added
    to: "T14: signing in and the account store (needs the Firebase project)"
  - field: checklist.ck_ddb505c3.added
    to: "T15: the banner and the signed-in lines"
  - field: checklist.ck_0a4eed5e.added
    to: "After the PR: the publisher reviews firestore.rules and deploys it (firebase deploy --only firestore:rules)"
  - field: checklist.ck_dc744d05.added
    to: "After the PR: one sign-in on aibytes.io after Pages deploys"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_8e0f3f0b
kind: update
occurred_at: 2026-11-08T01:01:57.783Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_f34fbba2.checked
    from: "false"
    to: "true"
  - field: checklist.ck_6500736c.checked
    from: "false"
    to: "true"
  - field: checklist.ck_b91cc873.checked
    from: "false"
    to: "true"
  - field: checklist.ck_3e692f5c.checked
    from: "false"
    to: "true"
  - field: checklist.ck_2ee982e4.checked
    from: "false"
    to: "true"
  - field: checklist.ck_1c92eda5.checked
    from: "false"
    to: "true"
  - field: checklist.ck_5edd6b32.checked
    from: "false"
    to: "true"
  - field: checklist.ck_05ca07da.checked
    from: "false"
    to: "true"
  - field: checklist.ck_c49fa709.checked
    from: "false"
    to: "true"
  - field: checklist.ck_522b50f3.checked
    from: "false"
    to: "true"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_289e63a1
kind: update
occurred_at: 2026-11-08T01:01:57.813Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_f34fbba2.moved
    from: "14"
    to: "4"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_054390a3
kind: update
occurred_at: 2026-11-08T01:01:57.838Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_6500736c.moved
    from: "15"
    to: "5"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_9965602d
kind: update
occurred_at: 2026-11-08T01:01:57.862Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_b91cc873.moved
    from: "16"
    to: "6"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_457020c0
kind: update
occurred_at: 2026-11-08T01:01:57.885Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_3e692f5c.moved
    from: "17"
    to: "7"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_786fb80a
kind: update
occurred_at: 2026-11-08T01:01:57.908Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_2ee982e4.moved
    from: "18"
    to: "8"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_b9f8fba4
kind: update
occurred_at: 2026-11-08T01:01:57.934Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_1c92eda5.moved
    from: "19"
    to: "11"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_a68d4cf8
kind: update
occurred_at: 2026-11-08T01:01:57.958Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_5edd6b32.moved
    from: "20"
    to: "12"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_5492aff4
kind: update
occurred_at: 2026-11-08T01:01:57.981Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_05ca07da.moved
    from: "21"
    to: "15"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_725b9b22
kind: update
occurred_at: 2026-11-08T01:01:58.004Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_c49fa709.moved
    from: "22"
    to: "16"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_78ed496e
kind: update
occurred_at: 2026-11-08T01:01:58.028Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_522b50f3.moved
    from: "23"
    to: "17"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_b0fd8604
kind: update
occurred_at: 2026-11-08T01:01:58.055Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_071c6456.moved
    from: "24"
    to: "21"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_910a29ca
kind: update
occurred_at: 2026-11-08T01:01:58.078Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_5c71b7c7.moved
    from: "25"
    to: "22"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_0b8b45c9
kind: update
occurred_at: 2026-11-08T01:01:58.101Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_120354e4.moved
    from: "26"
    to: "23"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_183c42c7
kind: update
occurred_at: 2026-11-08T01:01:58.125Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_304c9fdc.moved
    from: "27"
    to: "24"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_f97edf8e
kind: update
occurred_at: 2026-11-08T01:01:58.147Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_ddb505c3.moved
    from: "28"
    to: "25"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_3440515f
kind: update
occurred_at: 2026-11-09T07:26:02.139Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_ec5f97c2.added
    to: "Ledger: links in body text visible without hover (link colour + underline, WCAG 1.4.1)"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_eecf3a65
kind: comment
occurred_at: 2026-11-09T07:26:02.170Z
actor:
  type: human
  id: local
-->
### You commented

Open item, deferred (9 Nov 2026): links inside body text are indistinguishable from the text around them until hover.

Where it shows: /privacy (T11, 815b6fd): the account-deletion and Questions email links and the Substack privacy-policy link. It will also hit T15's /saved lines ('Sign in with Google' inside the sentence) and any future prose page.

Cause: Ledger's base rule in packages/design-system/styles.css (around line 34) sets a { color: inherit; text-decoration: none; } and only a:hover adds color: var(--link) and an underline. Measured on /privacy: link and paragraph both rgb(23, 37, 61) in light; the same in dark. Fails WCAG 2.2 SC 1.4.1 (Use of Color) - here there is not even a colour difference - and the brief's AA bar.

Proposed fix (a Ledger change, so ask-first): a scoped rule for links in running text, e.g. .app-main p a, .ldg-prose a { color: var(--link); text-decoration: underline; text-underline-offset: 2px; } with :hover thickening the underline, leaving nav, card, row and button links as they are. Contrast of --link on --bg in both themes via the existing contrast tests; a TopOffset-style assertion in tests/test_design_system.py; note in readme.md and extending-ledger.md. Not changing the global a rule, which would restyle every card and nav link.

Until then nothing is broken functionally; the links work and are keyboard-focusable with the visible focus ring.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_074260c7
kind: update
occurred_at: 2026-11-09T21:54:07.829Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_071c6456.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_f325fd4e
kind: update
occurred_at: 2026-11-09T21:54:07.860Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_5c71b7c7.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_0243f4b7
kind: update
occurred_at: 2026-11-09T21:54:07.885Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_120354e4.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_b48f1c80
kind: update
occurred_at: 2026-11-09T21:54:07.911Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_304c9fdc.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_5663dcbf
kind: update
occurred_at: 2026-11-09T21:54:07.936Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_4661cf94.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_9cedff18
kind: update
occurred_at: 2026-11-09T21:54:07.961Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_0a4eed5e.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_362a8416
kind: comment
occurred_at: 2026-11-09T21:54:07.985Z
actor:
  type: human
  id: local
-->
### You commented

Progress, 10 Nov (PR #58, branch aib-75v-app-accounts):
- T11-T14 done. T11 /privacy (815b6fd, 75b18b7); T12 pure parts (b860a0b); T13 firestore.rules with 8 emulator tests (acb978e); T14 Google sign-in and the account store (08bb4c4).
- Saves live in their own Firestore database, aibytes (e350bcd); (default) is untouched.
- Bundle: Firebase took the page JS from 63.3 to 236.3 kB gzipped. Per the publisher's choice (option c) it now loads just after the first paint in its own chunks: page JS 64.9 kB (8ab7642). Spec decision 1 marked revised.
- Rules deployed by the publisher on 9 Nov (firebase deploy --only firestore:rules).
- Signed-in checks on localhost passed with a real account (9168edd): sign in and out, the avatar and its menu, no Sign in flash on reload, two local saves merged into the account and local storage cleared, a save syncing to a second browser without a reload.
- Open: the blocked-popup check (deferred by the publisher); dev-console AbortErrors from Firestore streams around reloads, harmless so far, to check on the production build; T15 the banner and signed-in lines on /saved (replaces 'Stored in this browser only.' when signed in); one sign-in on aibytes.io after merge; add https://aibytes.io/privacy to the OAuth consent screen.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_632327ad
kind: update
occurred_at: 2026-11-09T21:55:30.703Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_af2bb5f2.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_0735c85e
kind: update
occurred_at: 2026-11-09T22:02:32.382Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_ec5f97c2.checked
    from: "false"
    to: "true"
-->
### claude-code updated this ticket

Done in 78875c0: links in a paragraph of .app-main, or under the new opt-in .ldg-prose, take --link with a 1px underline (2px on hover); nav, card, row and button links keep the base rule. Covers /privacy now and the /saved 'Sign in with Google' line with no apps/web change. ProseLinkTests in tests/test_design_system.py; readme.md and extending-ledger.md updated. Checked on /privacy in both themes. Claude Design was not synced (the round-trip files are behind since 28 Oct regardless).
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_f9ddec11
kind: update
occurred_at: 2026-11-09T22:06:57.738Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_ddb505c3.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->
