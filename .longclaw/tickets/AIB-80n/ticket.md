---
format: longclaw.ticket/v1
id: b1252dac-4dc9-48e3-aaa9-bc7a99dacd1d
key: AIB-80n
title: "Iterate the edition card: hide tags, move the menu and upvotes"
status: backlog
priority: p2
labels:
  - app
type: feature
created_at: 2026-10-09T12:21:51.547Z
updated_at: 2026-10-09T16:02:28.332Z
---

Iterate the grid card in Ledger. The app renders it from `apps/web/src/App.jsx` with `signalsPos="bottom"`. Today that card is:

```
[image]  Product Hunt                         ★
         Title
  ▲776   One-line summary
         Video · Dev Tool                  ⋮
```

Upvotes sit under the 40px image. Tags and the ⋮ menu (`CardMenu`) share the bottom meta row (`.ldg-card__meta`). The star is absolute at the top-right.

## Decisions

1. **Hide tags on the card.** Tag names (`Video · Dev Tool`, pills, and `#tags`) do not render. Tag data and the header tag filter stay. The GitHub language dot currently rides inside the tags element — keep it, on the top row with the source name, unless the brainstorm says otherwise.
2. **Move upvotes off the image column.** Do not pick a placement while implementing. Brainstorm first and stop for a choice. Candidates, given the new rows:
   - After the source name on the top row (existing `signalsPos="source"`). Competes with the star and the menu.
   - End of the title line.
   - Its own row between the summary and the bottom (existing `signalsPos="row"`). That spends a row the bottom is meant to give to content.
   - Bottom row, trailing the summary, in the slot the menu leaves.
   - Stay under the image (`signalsPos="bottom"` or `"logo"`). This is the current app layout, and the one to leave.
   Comments already never render on cards. Stars-gained follows whatever placement upvotes get. Numbers stay mono with tabular numerals.
3. **Move the ⋮ menu to the top row.** It leaves `.ldg-card__meta` and sits on `.ldg-card__srcrow`, with the source name (and the star, which is already top-right). The menu still opens upward only when it would clip; from the top row it should open downward.
4. **The bottom row is for the content.** Once tags and the menu are gone, the summary is the bottom of the card body. Do not put chrome back on that row unless the chosen upvote placement explicitly uses it.

## Where it lands

Ledger only, then the app. List rows are out of this ticket: `ListRow` keeps its own meta.

- `packages/design-system/components/content/Card.jsx`, `Card.d.ts`, and `Card.prompt.md` move together.
- `packages/design-system/components/components.css` for the row.
- `apps/web` grid, which passes `signalsPos="bottom"`.
- The app screens in `packages/design-system/ui_kits/aibytes-app/`.

After the component change, update the design system with **design-sync**. `_ds_bundle.js`, `_ds_manifest.json`, and the `<!-- @dsCard -->` preview cards are generated. Do not hand-edit them.

Check the grid in light and dark, at desktop and at 375px. Same layout in both themes.

## Checklist

- [ ] Brainstorm upvote placements against the new rows and pick one before moving them <!-- longclaw:item=ck_d25a7bee -->
- [ ] Hide tag names on the card; keep the GitHub language dot <!-- longclaw:item=ck_96a38279 -->
- [ ] Move the ⋮ menu onto the top source row; menu opens downward <!-- longclaw:item=ck_acbd22db -->
- [ ] Leave the bottom row for the summary <!-- longclaw:item=ck_e4dfa4f4 -->
- [ ] Apply the chosen upvote placement in Card, the app grid, and the ui kit <!-- longclaw:item=ck_64c1ad4b -->
- [ ] Update Card.jsx, Card.d.ts, Card.prompt.md, and components.css together <!-- longclaw:item=ck_bdddfb4c -->
- [ ] design-sync the design system; do not hand-edit the generated bundle <!-- longclaw:item=ck_55375375 -->

## Activity

<!-- longclaw:event
id: evt_e3611dcd
kind: create
occurred_at: 2026-10-09T12:21:51.547Z
actor:
  type: agent
  id: grok
  name: Grok
-->
### Grok created this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_97aa51c0
kind: update
occurred_at: 2026-10-09T12:28:02.287Z
actor:
  type: agent
  id: grok
  name: Grok
changes:
  - field: status
    from: backlog
    to: in_progress
-->
### Grok updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_38f3e9cb
kind: update
occurred_at: 2026-10-09T16:02:28.332Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: status
    from: in_progress
    to: backlog
-->
### Claude Code updated this ticket

Parked for now. The upvote-placement brainstorm is published at https://claude.ai/artifact/ENdNqr4RrSQeiVKu5r7bzG (five numbered options; no pick yet). The prototype is uncommitted at docs/ux/prototypes/aib-80n-card.html in the aib-80n-card-design worktree.
<!-- /longclaw:event -->
