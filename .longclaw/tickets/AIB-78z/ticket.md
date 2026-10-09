---
format: longclaw.ticket/v1
id: f91e7bd8-b9e2-4f53-8c31-facfe722caed
key: AIB-78z
title: Phone-width navigation when the side nav is hidden
status: backlog
priority: p2
labels:
  - app
type: feature
created_at: 2026-10-09T08:44:13.828Z
updated_at: 2026-10-09T08:44:13.828Z
---

Phone-width navigation for the side-nav layout. Split out of AIB-77u on 2026-10-09.

## Why

AIB-77u adopts the prototype's side nav (`docs/ux/prototypes/aiBytes_app_home.html`). Ledger's `.ldg-sidenav` is `display:none` below 900px, and in side-nav mode the prototype also drops the header category chips and the edition bar. So at phone and narrow-tablet width a reader gets **no category navigation and no date paging at all**. For now AIB-77u ships with the rail simply hidden below 900px; this ticket designs the narrow-width fallback.

## Options to weigh

- **Header chips plus the edition bar below 900px.** This is the layout `apps/web` has today, so it is already built and tested; switch on the same breakpoint as the rail.
- **A drawer.** A menu button in the header opens `SideNav` as an overlay. Needs focus trap, Escape, and return focus (`hooks.js` already has `useDismiss` and `useReturnFocus`).
- **A compact date strip** with "← Yesterday · Today · Pick a date" over the chips.

Propose the variations as an artifact before building (per the project's taste-decision practice).

## Done when

- Below 900px a reader can switch category, page to older and newer editions, and pick a date.
- No horizontal scroll at 320px, 375px, or 768px; checked in a browser at each.
- Keyboard and screen-reader paths work for whichever control replaces the rail.

## Checklist

- [ ] Pick the narrow-width pattern (variations artifact first) <!-- longclaw:item=ck_442bd85a -->
- [ ] Build it below 900px <!-- longclaw:item=ck_22fd1b16 -->
- [ ] Verify at 320, 375 and 768px: categories, paging, date picker, keyboard <!-- longclaw:item=ck_a1a55e1d -->

## Activity

<!-- longclaw:event
id: evt_59f2b9bf
kind: create
occurred_at: 2026-10-09T08:44:13.828Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
-->
### Claude Code created this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_1e8c87e5
kind: comment
occurred_at: 2026-10-09T09:16:24.440Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
-->
### Claude Code commented

Interim decided 2026-10-09 (docs/specs/AIB-77u-capability-map.md): until this ticket ships, below 900px keeps today's header category chips and edition bar, swapping with the side nav at the same breakpoint. So phones are not left without navigation; this ticket is about whether a better pattern replaces that.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_64bad912
kind: comment
occurred_at: 2026-10-09T10:00:04.668Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
-->
### Claude Code commented

From the app-feed-order spec (docs/specs/AIB-77u-app-feed-order.md), decided 2026-10-09: the Ranked | Grouped control is hidden below 700px because the compact header has no room (about 418px needed at 375px). Phone readers get their stored order, Ranked by default. A phone home for that control is part of this ticket.
<!-- /longclaw:event -->
