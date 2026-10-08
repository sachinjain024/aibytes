---
format: longclaw.ticket/v1
id: 6ef6489e-6e94-477f-947d-f4964ff401e2
key: AIB-75v
title: Saves and Google sign-in for the web app
status: backlog
priority: p2
labels:
  - app
type: feature
created_at: 2026-10-08T06:08:19.592Z
updated_at: 2026-10-08T06:08:19.592Z
---

Saving items (the ☆ on every card and row) and signing in with Google, split out of AIB-8h on 2026-10-08. AIB-8h ships the web app without them: no star, no Saved chip, no Sign in button. This ticket brings them in.

## What is true today

- `apps/web` renders editions with Ledger's `Card` and `ListRow`. Neither shows a star unless it is given `onToggleSave`, and the header shows no Sign in button unless it is given `onSignIn`, so nothing dead is on screen.
- Ledger already has every piece: `SaveStar`, `SaveBanner`, the header's Saved chip and avatar, and the UI kit screens `06-saved.html` and `09-headers-auth.html` showing them in use.
- `apps/web/src/prefs.js` is how the app keeps validated preferences in local storage. Anonymous saves can follow the same pattern.

## The plan (product spec §8)

1. **Anonymous saves.** Clicking ☆ saves to local storage at once, with no sign-in and no modal. Store `item_id` plus `edition_date`, so the Saved view can render from the edition JSON with no content database. Once anything is saved, the header shows a Saved chip and Ledger's `SaveBanner` offers sign-in to keep saves across devices.
2. **Accounts.** Firebase Auth with the Google provider and Firestore, client SDK only, with no server code in the repo. Saves live at `users/{uid}/saves/{itemId}` with `edition_date` and `created_at`. The Firebase config is public by design. The security rules are what protect the data, so review them explicitly.
3. **Merge on first sign-in.** Batch-write the local saves into the account (a union), then clear local storage and drop the banner.
4. **The Saved view**, grouped by edition date, rendered from the editions the saves point at.

## Notes

- The Chrome extension (AIB-8h, phase 7) is read-only in v1 and has no saves, so this is web only.
- A save names an item id, and `hide.py` can hide an item later. Decide whether the Saved view skips hidden items or shows them greyed.

## Checklist

- [ ] Anonymous saves in local storage, plus the save banner <!-- longclaw:item=ck_d5ac2437 -->
- [ ] Firebase Auth with the Google provider, client SDK only <!-- longclaw:item=ck_1f32b91e -->
- [ ] Firestore `users/{uid}/saves/{itemId}`, with security rules reviewed <!-- longclaw:item=ck_4661cf94 -->
- [ ] Merge local saves into the account on first sign-in, then clear local storage <!-- longclaw:item=ck_75ad990d -->
- [ ] Saved view, grouped by edition date <!-- longclaw:item=ck_92ac9854 -->

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
