---
format: longclaw.ticket/v1
id: 4086688c-7a20-4322-ba46-3c708f280c46
key: AIB-82y
title: Match the grid card width beside the rail to the home prototype (360px minimum)
status: in_progress
priority: p1
labels:
  - app
type: feature
created_at: 2026-10-09T16:05:02.074Z
updated_at: 2026-10-09T16:15:44.138Z
---

Match the grid card width beside the SideNav rail to the home-screen prototype, `docs/ux/prototypes/aiBytes_app_home.html`.

## What differs

The card itself already matches the prototype. Both put the image and upvotes on the left, source, title and summary in the body, tags and ⋮ on the bottom row, and the star top-right. The difference is the grid that sizes the card, and only in the wide layout (≥900px, with the rail):

| | Prototype | App (`apps/web/src/app.css`) |
|---|---|---|
| Grid beside the rail | `.app-cols .app-grid{grid-template-columns:repeat(auto-fill,minmax(360px,1fr))}` | `minmax(272px,1fr)` |
| Main padding | `20px 28px` | `20px 28px 60px` (footer margin moved in; keep) |
| Rail | 241px rendered | 241px |
| Narrow (<900px) grid | `minmax(300px,1fr)` | `minmax(min(300px,100%),1fr)` (keep; it stops overflow at 375px) |

Measured in the prototype at 1440×900: three columns, each card **370px** wide. The app gives four columns of about 274px.

Columns beside the rail (the grid gets the viewport less 297px, with a 16px gap):

| Viewport | Prototype, 360px | App today, 272px |
|---|---|---|
| 900 | 1 | 2 |
| 1024 | 1 | 2 |
| 1280 | 2 | 3 |
| 1440 | 3 (370px) | 4 (~274px) |
| 1920 | 4 | 5 |

## This reverses a decision

`docs/specs/AIB-77u-app-side-nav.md` chose 272px on 2026-10-09 (Open questions; Grid row in the layout table; T5 note) so that 900px gets two columns and 1440px gets four. Matching the prototype gives that up: from 900px to about 1032px the feed is a **single column** beside the rail. Amend the spec rather than leaving it saying 272px.

## Where it lands

- `apps/web/src/app.css`: the `.app-cols .app-grid` minimum goes 272px → 360px. Rewrite the comment above `.app-shell--full`, which explains the 272px arithmetic.
- `docs/specs/AIB-77u-app-side-nav.md`: a dated amendment pointing to this ticket.
- The ui kit (`packages/design-system/ui_kits/aibytes-app/app.css`) already uses 360px; confirm and leave it.
- Card internals are out of scope (AIB-80n, parked).

Check in the browser beside the rail at 900, 1024, 1280, 1440 and 1920, and at 375px. Light and dark.

## Checklist

- [ ] Set the .app-cols .app-grid minimum to 360px in apps/web/src/app.css and rewrite its comment <!-- longclaw:item=ck_51bee62b -->
- [ ] Confirm the ui kit already uses 360px beside the rail; leave it <!-- longclaw:item=ck_cef73912 -->
- [ ] Amend docs/specs/AIB-77u-app-side-nav.md: dated note that 360px replaces 272px <!-- longclaw:item=ck_8644a9f1 -->
- [ ] Check columns at 900, 1024, 1280, 1440 (370px cards) and 1920, and at 375px, light and dark <!-- longclaw:item=ck_9af2e20c -->

## Activity

<!-- longclaw:event
id: evt_97ed8e82
kind: create
occurred_at: 2026-10-09T16:05:02.074Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
-->
### Claude Code created this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_38bc59d1
kind: comment
occurred_at: 2026-10-09T16:07:23.279Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
-->
### Claude Code commented

Spec: docs/specs/AIB-82y-card-width.md (draft, awaiting review).
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_8a6dd26d
kind: comment
occurred_at: 2026-10-09T16:11:11.863Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
-->
### Claude Code commented

Spec reviewed 2026-10-09: match the prototype, one column at 900–1032px accepted. Plan: docs/plans/AIB-82y-plan.md; tasks: docs/plans/AIB-82y-todo.md (one task, T1).
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_ec591b3e
kind: update
occurred_at: 2026-10-09T16:15:42.719Z
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
id: evt_e4a1d515
kind: update
occurred_at: 2026-10-09T16:15:44.138Z
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
