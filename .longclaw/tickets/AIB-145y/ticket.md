---
format: longclaw.ticket/v1
id: 0a6fe125-a398-4acf-8ad3-9df499b0924a
key: AIB-145y
title: "Gists: a summary page for each item"
status: in_progress
priority: p1
rank: a0
labels:
  - app
type: feature
created_at: 2026-11-11T17:57:27.265Z
updated_at: 2026-11-13T06:55:16.570Z
---

Every item aiBytes_ covers gets a gist: a short page on aibytes.io that explains the item at a glance. The same content also opens in the right panel from the daily and weekly pages.

## Statement of intent

Confirmed with the publisher on 2026-11-12.

- **Outcome.** Every item gets a gist: a short page on aibytes.io that explains the item at a glance, lists its sources in a references section, and links back to the edition it ran in. The same content opens in the right panel on card click on daily and weekly pages. Same content, two views.
- **User.** The publisher, who links to gists from the newsletter and social posts instead of to the sources. And the reader, who understands a repo, HN thread or story in a minute without digging through the original.
- **Why now.** Clicks from the newsletter and social posts go to other sites today. Gists bring that traffic to aibytes.io, some visitors sign up, and the audience is what gets monetized later.
- **Success.** Traffic on gist pages is visible (visits per gist and where they came from) and growing.
- **Content.** Structure varies by item type and is defined in the spec. It covers the article and the discussion where both exist, and stays consistent across types where possible. The publisher's reference sketch, not to be taken literally:
  - HN thread: summary, stats (upvotes, comments, front page or not), discussion summary.
  - News: summary only.
  - GitHub repo: summary, stats (age, contributors, open issues, commits), summary of open issues.
- **Coverage.** The daily run writes a gist for every daily item, unattended. The weekly pull writes one for any newsletter item still missing one. Gists start on launch day.
- **First release.** Gist pages built for search at a readable-slug URL (`aibytes.io/gists/<readable-title>`), the side panel, stars, emoji reactions, and traffic measurement. Stars and reactions need Google sign-in; reading never does.
- **Constraint.** Gists publish with nobody reading them first, so generation must be reliable enough that a link never has to be swapped back to the source.
- **Out of scope.** Comments (a later release), backfill for editions already published, and monetization work.

## Original rough thoughts

Kept as first recorded on 2026-11-11.

- It should be an independent page and backlink / reference to the daily / weekly edition in the UI.
- When we pull the weekly content, at that time we generate the summary / gist.
- Define the URL structure. One possible solution: `aibytes.io/gists/<item>`.
- Add support for commenting, similar to GitHub gists.
- Add support for adding emojis, similar to GitHub gists.
- Make sure the page we generate is SEO optimized.
- Gists have a references section that points to the actual sources.
- The newsletter content will use these links instead of the actual references.
- On the daily and weekly pages on aibytes.io, the summary / gist view also opens on card click in the right panel. So the gist comes as an independent URL as well as in the side panel: same content, two different views.
- A user can star an item from the gist page / view, apart from adding an emoji.

## Ticket References

<!-- longclaw:reference
id: ref_e1a019f1
path: docs/specs/AIB-145y-gists.md
added_at: 2026-11-12T05:37:34.000Z
added_by:
  type: agent
  id: claude-code
  name: Claude Code
-->
[AIB-145y-gists.md](docs/specs/AIB-145y-gists.md)
<!-- /longclaw:reference -->


## Checklist

- [x] 1. Design: prototype and decision record (docs/decisions/product/AIB-145y-gists-design.md) <!-- longclaw:item=ck_cc2a35dc -->
- [x] 2. Spec approved (docs/specs/AIB-145y-gists.md) <!-- longclaw:item=ck_06938354 -->
- [x] 3. Plan approved (docs/plans/AIB-145y-plan.md, docs/plans/AIB-145y-todo.md) <!-- longclaw:item=ck_90955f2e -->
- [x] 4. gist-analytics <!-- longclaw:item=ck_7d988433 -->
- [x] 4.1 T1: analytics spec and tool shortlist <!-- longclaw:item=ck_14c18929 -->
- [x] 4.2 P1: publisher picks the analytics tool and creates the site <!-- longclaw:item=ck_ee37c311 -->
- [x] 4.3 T2: the script on every page, and the panel event helper <!-- longclaw:item=ck_a0e44d91 -->
- [x] 4.4 T3: the privacy page <!-- longclaw:item=ck_352c4191 -->
- [x] 4.5 P2: publisher approves the privacy wording <!-- longclaw:item=ck_b3c0615a -->
- [x] 4.6 Checkpoint A: analytics live <!-- longclaw:item=ck_1e04c4b9 -->
- [x] 5. gist-contract <!-- longclaw:item=ck_c5e68811 -->
- [x] 5.1 T4: contract spec <!-- longclaw:item=ck_dcf06745 -->
- [x] 5.2 T5: the gist schema and validator <!-- longclaw:item=ck_8798d947 -->
- [x] 5.3 T6: the index and the item's gist field <!-- longclaw:item=ck_7f614f86 -->
- [x] 5.4 T7: hidden items withdraw their gist <!-- longclaw:item=ck_286beccc -->
- [x] 5.5 T8: HN front page on the item <!-- longclaw:item=ck_d6d37a06 -->
- [x] 5.6 Checkpoint B: contract reviewed <!-- longclaw:item=ck_d47601d3 -->
- [ ] 13. Outbound links tagged (added 12 Nov; next after Checkpoint B, before T9) <!-- longclaw:item=ck_645fc91b -->
- [x] 13.1 T38: links to a source item's own page carry ref=aiBytes_ <!-- longclaw:item=ck_68b5c65c -->
- [ ] 6. gist-generate <!-- longclaw:item=ck_e24b8093 -->
- [x] 6.1 T9: generation spec <!-- longclaw:item=ck_0389ed70 -->
- [x] 6.2 T10: HN thread and article text fetchers <!-- longclaw:item=ck_112675a4 -->
- [x] 6.3 T11: GitHub repo fetchers <!-- longclaw:item=ck_49396094 -->
- [x] 6.4 T12: Product Hunt launch material <!-- longclaw:item=ck_427f19be -->
- [x] 6.5 T13: gists draft <!-- longclaw:item=ck_c31ad84c -->
- [x] 6.6 T14: the write-gists skill <!-- longclaw:item=ck_7c7c828a -->
- [x] 6.7 T15: gists build <!-- longclaw:item=ck_74279798 -->
- [x] 6.8 P3: publisher approves GITHUB_TOKEN in edition.yml <!-- longclaw:item=ck_0b27e6bd -->
- [x] 6.9 T16: the runner's gists step <!-- longclaw:item=ck_070cf04c -->
- [ ] 6.10 T17: rehearsal on seven editions <!-- longclaw:item=ck_eb097e0a -->
- [ ] 6.11 P4: publisher reads the rehearsed gists and would link to them unedited <!-- longclaw:item=ck_50869fec -->
- [ ] 6.12 Checkpoint C: generation proven <!-- longclaw:item=ck_4db29f6f -->
- [ ] 7. ledger-gist-ui <!-- longclaw:item=ck_329daaee -->
- [ ] 7.1 T18: Ledger spec <!-- longclaw:item=ck_8fef693d -->
- [ ] 7.2 T19: GistView <!-- longclaw:item=ck_45ced086 -->
- [ ] 7.3 T20: GistPanel, resizable <!-- longclaw:item=ck_b573c191 -->
- [ ] 7.4 T21: reactions bar, front-page badge, saved line, banner copy <!-- longclaw:item=ck_77f4b374 -->
- [ ] 7.5 T22: UI kit screens and Design System Artifact sync <!-- longclaw:item=ck_f8e04426 -->
- [ ] 7.6 Checkpoint D: kit screens reviewed <!-- longclaw:item=ck_87ea0fa7 -->
- [ ] 8. app-gist-pages <!-- longclaw:item=ck_9da86e57 -->
- [ ] 8.1 T23: pages spec <!-- longclaw:item=ck_2bd561ec -->
- [ ] 8.2 T24: route and page head <!-- longclaw:item=ck_888ec84a -->
- [ ] 8.3 T25: static gist pages, sitemap, robots <!-- longclaw:item=ck_6752a869 -->
- [ ] 8.4 T26: the gist page in the app <!-- longclaw:item=ck_a4ea4223 -->
- [ ] 8.5 P8: publisher verifies aibytes.io in Google Search Console (DNS TXT) and submits sitemap.xml <!-- longclaw:item=ck_556cd1e6 -->
- [ ] 9. app-gist-panel <!-- longclaw:item=ck_5670b0bb -->
- [ ] 9.1 T27: panel spec <!-- longclaw:item=ck_68012185 -->
- [ ] 9.2 T28: a card's title opens the panel <!-- longclaw:item=ck_7f55640b -->
- [ ] 9.3 T29: weekly pages and the panel event <!-- longclaw:item=ck_5577bc09 -->
- [ ] 9.4 Checkpoint E: launch-ready; squash-merge PR #65 (launch) <!-- longclaw:item=ck_fc76f81a -->
- [ ] 10. app-reactions (second PR) <!-- longclaw:item=ck_6684cc60 -->
- [ ] 10.1 T30: reactions spec <!-- longclaw:item=ck_30babd49 -->
- [ ] 10.2 T31: rules and emulator tests <!-- longclaw:item=ck_6d757e54 -->
- [ ] 10.3 P5: publisher deploys the Firestore rules <!-- longclaw:item=ck_7173a9bc -->
- [ ] 10.4 T32: reactions in the app <!-- longclaw:item=ck_759600ee -->
- [ ] 11. newsletter-gist-links (second PR) <!-- longclaw:item=ck_ca91f71f -->
- [ ] 11.1 T33: newsletter spec <!-- longclaw:item=ck_ba3092dd -->
- [ ] 11.2 T34: the weekly pull writes gists <!-- longclaw:item=ck_04b7fc12 -->
- [ ] 11.3 T35: the template and the skill <!-- longclaw:item=ck_16780ddc -->
- [ ] 11.4 P6: publisher approves the first issue linking to gists <!-- longclaw:item=ck_e757a406 -->
- [ ] 11.5 T36: weekly issue pages read gist links <!-- longclaw:item=ck_be9e1656 -->
- [ ] 11.6 Checkpoint F: newsletter <!-- longclaw:item=ck_8604cbbe -->
- [ ] 12. Wrap-up <!-- longclaw:item=ck_ffffb380 -->
- [ ] 12.1 T37: docs, ticket, by-hand checks <!-- longclaw:item=ck_946eab34 -->
- [ ] 12.2 P7: publisher's browser checks on aibytes.io <!-- longclaw:item=ck_497e916a -->
## Activity

<!-- longclaw:event
id: evt_335d7bd2
kind: create
occurred_at: 2026-11-11T17:57:27.265Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
-->
### Claude Code created this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_726d71e8
kind: update
occurred_at: 2026-11-11T17:57:31.729Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: status
    from: todo
    to: in_progress
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_7139a4a9
kind: update
occurred_at: 2026-11-11T18:27:13.175Z
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
id: evt_67579553
kind: update
occurred_at: 2026-11-11T18:41:14.521Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: description
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_b5051c13
kind: comment
occurred_at: 2026-11-11T18:44:20.190Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
-->
### Claude Code commented

Spec drafted at docs/specs/AIB-145y-gists.md (product spec and capability map, eight modules). Awaiting review; five open questions at the end.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_6fbea788
kind: comment
occurred_at: 2026-11-12T05:36:22.845Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
-->
### Claude Code commented

Spec approved by the publisher on 2026-11-12. Next: the plan and the module specs.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_8f7b7cee
kind: update
occurred_at: 2026-11-12T10:55:25.071Z
actor:
  type: human
  id: local
changes:
  - field: priority
    from: none
    to: p1
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_7353cd46
kind: update
occurred_at: 2026-11-12T11:04:09.171Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_cc2a35dc.added
    to: "1. Design: prototype and decision record (docs/decisions/product/AIB-145y-gists-design.md)"
  - field: checklist.ck_06938354.added
    to: 2. Spec approved (docs/specs/AIB-145y-gists.md)
  - field: checklist.ck_90955f2e.added
    to: 3. Plan approved (docs/plans/AIB-145y-plan.md, docs/plans/AIB-145y-todo.md)
  - field: checklist.ck_7d988433.added
    to: 4. gist-analytics
  - field: checklist.ck_14c18929.added
    to: "4.1 T1: analytics spec and tool shortlist"
  - field: checklist.ck_ee37c311.added
    to: "4.2 P1: publisher picks the analytics tool and creates the site"
  - field: checklist.ck_a0e44d91.added
    to: "4.3 T2: the script on every page, and the panel event helper"
  - field: checklist.ck_352c4191.added
    to: "4.4 T3: the privacy page"
  - field: checklist.ck_b3c0615a.added
    to: "4.5 P2: publisher approves the privacy wording"
  - field: checklist.ck_1e04c4b9.added
    to: "4.6 Checkpoint A: analytics live"
  - field: checklist.ck_c5e68811.added
    to: 5. gist-contract
  - field: checklist.ck_dcf06745.added
    to: "5.1 T4: contract spec"
  - field: checklist.ck_8798d947.added
    to: "5.2 T5: the gist schema and validator"
  - field: checklist.ck_7f614f86.added
    to: "5.3 T6: the index and the item's gist field"
  - field: checklist.ck_286beccc.added
    to: "5.4 T7: hiding an item moves its gist"
  - field: checklist.ck_d6d37a06.added
    to: "5.5 T8: HN front page on the item"
  - field: checklist.ck_d47601d3.added
    to: "5.6 Checkpoint B: contract reviewed"
  - field: checklist.ck_e24b8093.added
    to: 6. gist-generate
  - field: checklist.ck_0389ed70.added
    to: "6.1 T9: generation spec"
  - field: checklist.ck_112675a4.added
    to: "6.2 T10: HN thread and article text fetchers"
  - field: checklist.ck_49396094.added
    to: "6.3 T11: GitHub repo fetchers"
  - field: checklist.ck_427f19be.added
    to: "6.4 T12: Product Hunt launch material"
  - field: checklist.ck_c31ad84c.added
    to: "6.5 T13: gists draft"
  - field: checklist.ck_7c7c828a.added
    to: "6.6 T14: the write-gists skill"
  - field: checklist.ck_74279798.added
    to: "6.7 T15: gists build"
  - field: checklist.ck_0b27e6bd.added
    to: "6.8 P3: publisher approves GITHUB_TOKEN in edition.yml"
  - field: checklist.ck_070cf04c.added
    to: "6.9 T16: the runner's gists step"
  - field: checklist.ck_eb097e0a.added
    to: "6.10 T17: rehearsal on seven editions"
  - field: checklist.ck_50869fec.added
    to: "6.11 P4: publisher reads the rehearsed gists and would link to them unedited"
  - field: checklist.ck_4db29f6f.added
    to: "6.12 Checkpoint C: generation proven"
  - field: checklist.ck_329daaee.added
    to: 7. ledger-gist-ui
  - field: checklist.ck_8fef693d.added
    to: "7.1 T18: Ledger spec"
  - field: checklist.ck_45ced086.added
    to: "7.2 T19: GistView"
  - field: checklist.ck_b573c191.added
    to: "7.3 T20: GistPanel, resizable"
  - field: checklist.ck_77f4b374.added
    to: "7.4 T21: reactions bar, front-page badge, saved line, banner copy"
  - field: checklist.ck_f8e04426.added
    to: "7.5 T22: UI kit screens and Design System Artifact sync"
  - field: checklist.ck_87ea0fa7.added
    to: "7.6 Checkpoint D: kit screens reviewed"
  - field: checklist.ck_9da86e57.added
    to: 8. app-gist-pages
  - field: checklist.ck_2bd561ec.added
    to: "8.1 T23: pages spec"
  - field: checklist.ck_888ec84a.added
    to: "8.2 T24: route and page head"
  - field: checklist.ck_6752a869.added
    to: "8.3 T25: static gist pages, sitemap, robots"
  - field: checklist.ck_a4ea4223.added
    to: "8.4 T26: the gist page in the app"
  - field: checklist.ck_5670b0bb.added
    to: 9. app-gist-panel
  - field: checklist.ck_68012185.added
    to: "9.1 T27: panel spec"
  - field: checklist.ck_7f55640b.added
    to: "9.2 T28: a card's title opens the panel"
  - field: checklist.ck_5577bc09.added
    to: "9.3 T29: weekly pages and the panel event"
  - field: checklist.ck_fc76f81a.added
    to: "9.4 Checkpoint E: launch-ready; squash-merge PR #65 (launch)"
  - field: checklist.ck_6684cc60.added
    to: 10. app-reactions (second PR)
  - field: checklist.ck_30babd49.added
    to: "10.1 T30: reactions spec"
  - field: checklist.ck_6d757e54.added
    to: "10.2 T31: rules and emulator tests"
  - field: checklist.ck_7173a9bc.added
    to: "10.3 P5: publisher deploys the Firestore rules"
  - field: checklist.ck_759600ee.added
    to: "10.4 T32: reactions in the app"
  - field: checklist.ck_ca91f71f.added
    to: 11. newsletter-gist-links (second PR)
  - field: checklist.ck_ba3092dd.added
    to: "11.1 T33: newsletter spec"
  - field: checklist.ck_04b7fc12.added
    to: "11.2 T34: the weekly pull writes gists"
  - field: checklist.ck_16780ddc.added
    to: "11.3 T35: the template and the skill"
  - field: checklist.ck_e757a406.added
    to: "11.4 P6: publisher approves the first issue linking to gists"
  - field: checklist.ck_be9e1656.added
    to: "11.5 T36: weekly issue pages read gist links"
  - field: checklist.ck_8604cbbe.added
    to: "11.6 Checkpoint F: newsletter"
  - field: checklist.ck_ffffb380.added
    to: 12. Wrap-up
  - field: checklist.ck_946eab34.added
    to: "12.1 T37: docs, ticket, by-hand checks"
  - field: checklist.ck_497e916a.added
    to: "12.2 P7: publisher's browser checks on aibytes.io"
-->
### Claude Code updated this ticket

12 Nov 2026: plan approved (docs/plans/AIB-145y-plan.md, docs/plans/AIB-145y-todo.md). Two PRs: PR #65 holds T1-T29 and is squash-merged at Checkpoint E for launch; T30-T37 follow in a second PR. The Design System Artifact is synced in T22. Checklist built as numbered items, one per task, publisher step and checkpoint, ticked as each lands.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_cf863d79
kind: update
occurred_at: 2026-11-12T11:04:20.861Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_cc2a35dc.checked
    from: "false"
    to: "true"
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_2e0fca89
kind: update
occurred_at: 2026-11-12T11:04:20.883Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_06938354.checked
    from: "false"
    to: "true"
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_13fc4fe6
kind: update
occurred_at: 2026-11-12T11:04:20.906Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_90955f2e.checked
    from: "false"
    to: "true"
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_fd6cd228
kind: update
occurred_at: 2026-11-12T12:09:15.665Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_14c18929.checked
    from: "false"
    to: "true"
-->
### claude-code updated this ticket

12 Nov 2026: T1 done. Analytics tool picked: Umami Cloud (Hobby). Google Search Console added for search traffic as P8, after T25 publishes sitemap.xml; no Google Analytics (cookies would need a consent banner). Spec: docs/specs/AIB-145y-gist-analytics.md. P1 stays open until the Umami site exists and its website id is shared.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_59d205e6
kind: update
occurred_at: 2026-11-12T12:09:20.465Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_556cd1e6.added
    to: "8.5 P8: publisher verifies aibytes.io in Google Search Console (DNS TXT) and submits sitemap.xml"
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_643e5fb6
kind: update
occurred_at: 2026-11-12T12:09:24.162Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_556cd1e6.moved
    from: "63"
    to: "43"
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_2537f90a
kind: update
occurred_at: 2026-11-12T12:18:45.447Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_ee37c311.checked
    from: "false"
    to: "true"
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_16498255
kind: update
occurred_at: 2026-11-12T12:18:45.469Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_a0e44d91.checked
    from: "false"
    to: "true"
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_96bfd8cc
kind: update
occurred_at: 2026-11-12T12:32:10.748Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_352c4191.checked
    from: "false"
    to: "true"
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_108a26fb
kind: update
occurred_at: 2026-11-12T13:12:47.091Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_b3c0615a.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_06b7f70b
kind: update
occurred_at: 2026-11-12T13:19:07.799Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_1e04c4b9.checked
    from: "false"
    to: "true"
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_cfc8979d
kind: update
occurred_at: 2026-11-12T13:19:07.841Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_7d988433.checked
    from: "false"
    to: "true"
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_52c8c52d
kind: update
occurred_at: 2026-11-12T13:47:09.452Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_dcf06745.checked
    from: "false"
    to: "true"
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_f5dd5315
kind: update
occurred_at: 2026-11-12T13:47:09.504Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_286beccc.text
    from: "5.4 T7: hiding an item moves its gist"
    to: "5.4 T7: hidden items withdraw their gist"
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_d2770c2d
kind: update
occurred_at: 2026-11-12T13:47:09.558Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_645fc91b.added
    to: 13. Outbound links tagged (added 12 Nov)
  - field: checklist.ck_68b5c65c.added
    to: "13.1 T38: links to a source item's own page carry ref=aiBytes_"
-->
### claude-code updated this ticket

12 Nov 2026: T4 done, contract spec approved (docs/specs/AIB-145y-gist-contract.md) with D2-D4: announcements are X posts, links keep every source, hiding is derived so hide.py is unchanged (T7 reshaped). Added T38: outbound links get ref=aiBytes_ at render time.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_00b7afe7
kind: update
occurred_at: 2026-11-12T14:28:46.755Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_8798d947.checked
    from: "false"
    to: "true"
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_e6258df3
kind: update
occurred_at: 2026-11-12T14:34:26.864Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_7f614f86.checked
    from: "false"
    to: "true"
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_ccc5570b
kind: update
occurred_at: 2026-11-12T14:35:17.877Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_286beccc.checked
    from: "false"
    to: "true"
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_8a54da39
kind: update
occurred_at: 2026-11-12T14:38:30.435Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_d6d37a06.checked
    from: "false"
    to: "true"
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_5f9b5021
kind: update
occurred_at: 2026-11-12T14:45:02.744Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_d47601d3.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_8c5768a5
kind: update
occurred_at: 2026-11-12T14:45:03.859Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_c5e68811.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_46f78e15
kind: update
occurred_at: 2026-11-12T14:45:05.300Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_645fc91b.moved
    from: "64"
    to: "18"
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_cd2374e2
kind: update
occurred_at: 2026-11-12T14:45:05.320Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_68b5c65c.moved
    from: "65"
    to: "19"
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_d30b7b28
kind: update
occurred_at: 2026-11-12T14:45:05.344Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_645fc91b.text
    from: 13. Outbound links tagged (added 12 Nov)
    to: 13. Outbound links tagged (added 12 Nov; next after Checkpoint B, before T9)
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_6cdddaaa
kind: comment
occurred_at: 2026-11-13T04:16:01.072Z
actor:
  type: agent
  id: claude-code
-->
### claude-code commented

T9: generation spec at docs/specs/AIB-145y-gist-generate.md, awaiting approval. T38 is PR #67 against main, awaiting merge.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_1b707d0b
kind: comment
occurred_at: 2026-11-13T05:54:26.196Z
actor:
  type: agent
  id: claude-code
-->
### claude-code commented

Spec Q4 (Product Hunt resolver gets a 403 on the runner, so launch cards link to producthunt.com) is out of scope here. Filed as AIB-146r.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_9313c4ee
kind: update
occurred_at: 2026-11-13T06:02:23.207Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_68b5c65c.checked
    from: "false"
    to: "true"
  - field: checklist.ck_0389ed70.checked
    from: "false"
    to: "true"
-->
### claude-code updated this ticket

Spec approved 13 Nov with: PH launches use the API's comments (launch comment found by time), full at 120 words; copying limits 20 fatal / 12 warning; edition job timeout-minutes 30, gist step capped at 22 min. T38 merged as PR #67. Building T10-T15.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_a2161591
kind: update
occurred_at: 2026-11-13T06:05:47.754Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_112675a4.checked
    from: "false"
    to: "true"
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_55ebbdbb
kind: update
occurred_at: 2026-11-13T06:09:14.496Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_49396094.checked
    from: "false"
    to: "true"
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_626aba8e
kind: update
occurred_at: 2026-11-13T06:10:39.330Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_427f19be.checked
    from: "false"
    to: "true"
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_f83bcbdc
kind: update
occurred_at: 2026-11-13T06:14:01.115Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_c31ad84c.checked
    from: "false"
    to: "true"
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_441a0ea6
kind: update
occurred_at: 2026-11-13T06:20:10.769Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_7c7c828a.checked
    from: "false"
    to: "true"
  - field: checklist.ck_74279798.checked
    from: "false"
    to: "true"
-->
### claude-code updated this ticket

T10-T15 built (one commit each). Live checks on the 11 Nov edition: draft reads all 30 new items as full in 54 s; four hand-written gists (one per kind) pass build and validate.py on a copy of content/. Real content/ untouched. Next: T16 (runner step, GITHUB_TOKEN, timeout-minutes 30).
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_bb9298f9
kind: update
occurred_at: 2026-11-13T06:55:16.570Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_0b27e6bd.checked
    from: "false"
    to: "true"
  - field: checklist.ck_070cf04c.checked
    from: "false"
    to: "true"
-->
### claude-code updated this ticket

T16 built: step_gists runs draft, claude (/write-gists, Read/Write/Edit, 80 turns) and build within 5+15+2 min; any failure restores content/gists/ and the edition and becomes a Slack warning. --skip-gists added. edition.yml: timeout-minutes 30, GITHUB_TOKEN on the publish step (P3, approved with the spec on 13 Nov); Claude's env never gets GITHUB_TOKEN. Next: T17 rehearsal.
<!-- /longclaw:event -->
