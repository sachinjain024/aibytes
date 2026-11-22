# Implementation Plan: AIB-76n, the Chrome extension

Map: `docs/specs/AIB-76n-capability-map.md`. Module specs:
`docs/specs/AIB-76n-{ledger-extension-ui,app-core,extension-popup,extension-auth,site-extension,store-listing}.md`.
Task list: `docs/plans/AIB-76n-todo.md`. Ticket: `.longclaw/tickets/AIB-76n/ticket.md`,
where each task is a numbered checklist item (T1 = 3.1 … T21 = 3.21; the store
tasks reuse items 4, 4.1, 4.2 and 5).

## Overview

Six modules, built in the map's order, as 24 tasks on branch
`aib-76n-chrome-extension`, one commit per task, in PR #73. Nothing a reader
sees changes until Phase 4, and Phase 4 is behind `EXTENSION_LIVE`. The flag
turns on in a small follow-up PR once Chrome approves the store update (T24).

## Dependency graph

```
T1 app-core display ─► T2 app-core account ─────────────────┐
T3 icon ─► T4 popup UI ─┐                                   │
           T5 onboarding UI ─┐                              │
           T6 promo UI ──────┼──────────────────────────┐   │
                             │                          │   │
T7 extension scaffold ◄──────┴── T3, T4                 │   │
  └─► T8 sign-in gate (needs 2.1, 2.2) ──► frozen permissions
       └─► T9 Today ◄── T1
            └─► T10 saves + Saved ◄── T2 ─► T11 gist view ─► T12 package
  │
T13 callable (needs 2.5 IAM) ──► publisher deploys (3.22)
T14 contract + internal sign-out ◄── T8, T10
  └─► T15 popup signed in ◄── T2, T4
        └─► T16 bridge ◄── T13 deployed
              ├─► T17 subscriber source ─► publisher deploys rules (3.23)
              ├─► T18 onboarding shell, EXTENSION_LIVE ◄── T5 ─► T19 onboarding steps ◄── T17
              └─► T20 install box ◄── T6, T18
T21 screenshots ◄── T5, T15 ─► T22 promo images (4.2) ─► T23 listing, /privacy, zip (4)
                          └─► publisher submits (4, 4.1) ─► T24 flag + footer (5), follow-up PR
```

## Architecture decisions (from the specs)

- **Shared code moves to `packages/app-core`** before the extension exists
  (T1, T2), with no shims, so the popup and the site rank, filter and save the
  same way. The test count must be the same before and after.
- **Ledger first** (T3 to T6). The apps write no styles of their own. New
  options are off by default, so aibytes.io's markup is unchanged.
- **The sign-in gate comes early** (T8, right after the scaffold) rather than at
  the start of Phase 3. It decides the frozen permission set and whether the
  merge runs in the worker or the popup. It needs only ticket items 2.1 and 2.2
  and a token minted by hand, so if it fails, it fails before the popup is
  built on top of it.
- **Sign-in only on aibytes.io**: a custom token from `aibytesExtensionToken`
  (Google sign-ins only), sent through `externally_connectable`. The site
  reconciles on every load. Sign out in the popup goes through
  `signoutPending`, so a plain GET signs nobody out.
- **Content stays read-only and append-only**: the popup reads contract fields
  only and refuses any `schema_version` but 1.
- **`EXTENSION_LIVE` stays false until the store update is approved**. No
  public link points at `/extension-onboarding` before then.

## Task list

### Phase 0: before the build
- [ ] Ticket 2.3: understand Chrome's Build with AI guidance.
- [ ] Ticket 2.4: install the Modern Web Guidance skills and
  chrome-devtools-mcp, and set up `CHROMEWEBSTORE.md`.

### Phase 1: foundations (no visible change)
- [ ] T1 (3.1): `packages/app-core` with the display modules
- [ ] T2 (3.2): app-core's account modules
- [ ] T3 (3.3): Ledger's `ExtensionIcon` and the Chrome PNGs
- [ ] T4 (3.4): Ledger's popup components and kit page 19
- [ ] T5 (3.5): Ledger's onboarding components, `Button size="lg"`, kit page 20
- [ ] T6 (3.6): Ledger's `ExtensionPromo`, `Sidebar promo`, kit page 21, guideline

### Checkpoint 1
- [ ] Every package's tests pass, with the same count as before for the moved tests
- [ ] `npm run build:web` output is unchanged (diff of `dist/` HTML and CSS)
- [ ] The publisher reviews kit pages 19 to 21 against the prototype

### Phase 2: the popup, signed out
- [ ] T7 (3.7): `apps/extension` scaffold, manifest, fonts, onboarding on install
- [ ] T8 (3.8): the sign-in gate (needs 2.1, 2.2)
- [ ] T9 (3.9): Today's edition in the popup
- [ ] T10 (3.10): stars and Saved, signed out
- [ ] T11 (3.11): the gist view and new-tab links
- [ ] T12 (3.12): the store zip

### Checkpoint 2
- [ ] extension-popup's success criteria 1 to 5, 7 and 8, by hand in Chrome
  stable, and the permissions equal T8's frozen set (criterion 6 is T7's)
- [ ] The gate's result and the frozen permission set are written into extension-auth

### Phase 3: sign-in
- [ ] Ticket 2.5 (publisher): the IAM Token Creator grant
- [ ] T13 (3.13): the `aibytesExtensionToken` callable
- [ ] Ticket 3.22 (publisher): deploy the callable
- [ ] T14 (3.14): the site-to-extension contract and the internal sign-out
- [ ] T15 (3.15): the popup signed in

### Checkpoint 3
- [ ] From a dev page: sign in, merge, star syncs to `/saved`, worker restart,
  sign-out, all as in extension-auth's success criteria

### Phase 4: aibytes.io (behind the flag)
- [ ] T16 (3.16): the bridge
- [ ] T17 (3.17): the newsletter source
- [ ] Ticket 3.23 (publisher): deploy `firestore.rules` before PR #73 merges
- [ ] T18 (3.18): the onboarding page shell
- [ ] T19 (3.19): the onboarding steps
- [ ] T20 (3.20): the install box

### Checkpoint 4
- [ ] site-extension's success criteria 1 to 5 with the dev extension loaded
- [ ] With the flag off, aibytes.io shows nothing new outside `/extension-onboarding`
- [ ] All suites pass; PR #73 ready to merge once 3.22 and 3.23 are done

### Phase 5: the store
- [ ] T21 (3.21): the five screenshots
- [ ] T22 (4.2): the promo tile and marquee, generated and shortlisted
- [ ] T23 (4): listing text, `/privacy`, version and zip
- [ ] Publisher: category (4.1), upload and submit
- [ ] T24 (5): after approval, the flag and the footer link (follow-up PR)

### Checkpoint 5: complete
- [ ] store-listing's success criteria 1 to 5
- [ ] The map's success criteria

## Branches and PRs

Everything through T23 goes on `aib-76n-chrome-extension` in PR #73, one
commit per task. The PR merges after Checkpoint 4, T21 to T23, and the
publisher's 3.22 and 3.23. It can merge before the store approves: the site
code is behind the flag, and the extension is only on the store once it is
submitted. T24 is the store-listing spec's small PR after approval, branched
from `main`.

## Parallel work

T1 and T2 are independent of T3 to T6. T13 needs only the IAM grant and can be
built any time. Everything else is a chain. One session builds them in order;
no worktrees. A task that overflows one session (T4 is the likeliest: header
and footer, then the gist bars) is split at build time into two commits under
the same ticket item, and the todo records it.

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Signing in from the worker fails, or Firestore needs a host permission (CORS) | High | T8 runs it first. The fallback (`chrome.storage.session` and the popup signing in) is in extension-auth's Risks. A host permission is acceptable (answer 11) and frozen in T8 |
| A permission with a warning disables the extension for the 9 existing users | Med | Frozen at T8, checked by the manifest test in T14 and again before the zip in T23 |
| Moving code to app-core changes the site's ranking or saves | Med | No shims, same test count, a `build:web` diff at Checkpoint 1 |
| The rules ship after the site writes `extension-onboarding` | Med | Ticket 3.23 comes before the merge. The rules allow both values, so deploying them early is safe |
| Reddit in the short description gets the listing rejected | Med | The fallback line without Reddit is in store-listing's Risks |
| Store review takes days | Low | The flag keeps the site unchanged until approval; T24 is separate |

## Out of scope

The new-tab surface (AIB-151m), launch posts (AIB-152d), Reddit as a source,
gist reactions in the extension, and a theme toggle.

## Open questions

None. The specs' questions were answered on 22 Nov 2026.
