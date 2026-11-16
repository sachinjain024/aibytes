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
updated_at: 2026-11-16T08:40:13.181Z
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

<!-- longclaw:reference
id: ref_t33n11
path: docs/specs/AIB-145y-newsletter-gist-links.md
added_at: 2026-11-16T12:00:00.000Z
added_by:
  type: agent
  id: grok-build
  name: Grok Build
-->
[AIB-145y-newsletter-gist-links.md](docs/specs/AIB-145y-newsletter-gist-links.md)
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
- [x] 13. Outbound links tagged (added 12 Nov; next after Checkpoint B, before T9) <!-- longclaw:item=ck_645fc91b -->
- [x] 13.1 T38: links to a source item's own page carry ref=aiBytes_ <!-- longclaw:item=ck_68b5c65c -->
- [x] 6. gist-generate <!-- longclaw:item=ck_e24b8093 -->
- [x] 6.1 T9: generation spec <!-- longclaw:item=ck_0389ed70 -->
- [x] 6.2 T10: HN thread and article text fetchers <!-- longclaw:item=ck_112675a4 -->
- [x] 6.3 T11: GitHub repo fetchers <!-- longclaw:item=ck_49396094 -->
- [x] 6.4 T12: Product Hunt launch material <!-- longclaw:item=ck_427f19be -->
- [x] 6.5 T13: gists draft <!-- longclaw:item=ck_c31ad84c -->
- [x] 6.6 T14: the write-gists skill <!-- longclaw:item=ck_7c7c828a -->
- [x] 6.7 T15: gists build <!-- longclaw:item=ck_74279798 -->
- [x] 6.8 P3: publisher approves GITHUB_TOKEN in edition.yml <!-- longclaw:item=ck_0b27e6bd -->
- [x] 6.9 T16: the runner's gists step <!-- longclaw:item=ck_070cf04c -->
- [x] 6.10 T17: rehearsal on seven editions <!-- longclaw:item=ck_eb097e0a -->
- [x] 6.11 P4: publisher reads the rehearsed gists and would link to them unedited <!-- longclaw:item=ck_50869fec -->
- [x] 6.12 Checkpoint C: generation proven <!-- longclaw:item=ck_4db29f6f -->
- [x] 7. ledger-gist-ui <!-- longclaw:item=ck_329daaee -->
- [x] 7.1 T18: Ledger spec <!-- longclaw:item=ck_8fef693d -->
- [x] 7.2 T19: GistView <!-- longclaw:item=ck_45ced086 -->
- [x] 7.3 T20: GistPanel, resizable <!-- longclaw:item=ck_b573c191 -->
- [x] 7.4 T21: reactions bar, front-page badge, saved line, banner copy <!-- longclaw:item=ck_77f4b374 -->
- [x] 7.5 T22: UI kit screens and Design System Artifact sync <!-- longclaw:item=ck_f8e04426 -->
- [x] 7.6 Checkpoint D: kit screens reviewed <!-- longclaw:item=ck_87ea0fa7 -->
- [x] 8. app-gist-pages <!-- longclaw:item=ck_9da86e57 -->
- [x] 8.1 T23: pages spec <!-- longclaw:item=ck_2bd561ec -->
- [x] 8.2 T24: route and page head <!-- longclaw:item=ck_888ec84a -->
- [x] 8.3 T25: static gist pages, sitemap, robots <!-- longclaw:item=ck_6752a869 -->
- [x] 8.4 T26: the gist page in the app <!-- longclaw:item=ck_a4ea4223 -->
- [x] 8.5 P8: publisher verifies aibytes.io in Google Search Console (DNS TXT) and submits sitemap.xml <!-- longclaw:item=ck_556cd1e6 -->
- [x] 9. app-gist-panel <!-- longclaw:item=ck_5670b0bb -->
- [x] 9.1 T27: panel spec <!-- longclaw:item=ck_68012185 -->
- [x] 9.2 T28: a card's title opens the panel <!-- longclaw:item=ck_7f55640b -->
- [x] 9.3 T29: weekly pages and the panel event <!-- longclaw:item=ck_5577bc09 -->
- [x] 9.4 Checkpoint E: launch-ready; PR #65 squash-merged 13 Nov (gists live in the daily run), PR #68 (panel, T27-T29) still to squash-merge <!-- longclaw:item=ck_fc76f81a -->
- [x] 10. app-reactions (second PR) <!-- longclaw:item=ck_6684cc60 -->
- [x] 10.1 T30: reactions spec <!-- longclaw:item=ck_30babd49 -->
- [x] 10.2 T31: rules and emulator tests <!-- longclaw:item=ck_6d757e54 -->
- [x] 10.3 P5: publisher deploys the Firestore rules <!-- longclaw:item=ck_7173a9bc -->
- [x] 10.4 T32: reactions in the app <!-- longclaw:item=ck_759600ee -->
- [x] 10.5 Design sync: the Design System Artifact gets the reaction row beside Save, the sign-in line and its link (components.css) <!-- longclaw:item=ck_6f3d7376 -->
- [x] 11. newsletter-gist-links (second PR) <!-- longclaw:item=ck_ca91f71f -->
- [x] 11.1 T33: newsletter spec <!-- longclaw:item=ck_ba3092dd -->
- [x] 11.2 T34: the weekly pull writes gists <!-- longclaw:item=ck_04b7fc12 -->
- [x] 11.3 T35: the template and the skill <!-- longclaw:item=ck_16780ddc -->
- [x] 11.4 P6: publisher approves the first issue linking to gists <!-- longclaw:item=ck_e757a406 -->
- [x] 11.5 T36: weekly issue pages read gist links <!-- longclaw:item=ck_be9e1656 -->
- [x] 11.6 Checkpoint F: newsletter <!-- longclaw:item=ck_8604cbbe -->
- [x] 12. Wrap-up <!-- longclaw:item=ck_ffffb380 -->
- [x] 12.1 T37: docs, ticket, by-hand checks <!-- longclaw:item=ck_946eab34 -->
- [x] 12.2 P7: publisher's browser checks on aibytes.io <!-- longclaw:item=ck_497e916a -->
- [x] 14. favicon (GitHub issue #38, on this branch) <!-- longclaw:item=ck_15e5e8ee -->
- [x] 14.1 Favicon: white bolt on cobalt (option 1) as favicon.svg, favicon.ico and apple-touch-icon.png, linked from every built page, with a build test <!-- longclaw:item=ck_b64903c5 -->
- [x] 14.2 Wordmark.prompt.md names the bolt tile as the favicon (was the aB_ tile) <!-- longclaw:item=ck_6adde97b -->
- [ ] 14.3 P9: publisher checks the tab and bookmark icon on aibytes.io after deploy, then closes #38 <!-- longclaw:item=ck_4e9be923 -->
- [ ] 15. Issue 18 backfill: gists on /weekly/issue-18 (publisher's request, 16 Nov; an exception to the spec's no-backfill rule) <!-- longclaw:item=ck_c2c05c92 -->
- [x] 15.1 gists build --issue sets gist on an existing weekly issue file; build_weekly_issues.py keeps that link from the gist's appearances when the HTML has no gist href <!-- longclaw:item=ck_61485e93 -->
- [x] 15.2 Issue 18 gists: items.json from issue-18.json, gists draft --issue issue-18, gists.json written per the write-gists skill, gists build --issue issue-18 <!-- longclaw:item=ck_0e1ed05c -->
- [x] 15.3 issue-18.json: 18 of 22 items carry a gist (10 new, 8 repeats); validate.py and the test suites pass <!-- longclaw:item=ck_368e0757 -->
- [ ] 15.4 P10: publisher validates the gists on /weekly/issue-18, then the ticket closes <!-- longclaw:item=ck_6886892a -->
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

<!-- longclaw:event
id: evt_a13dbe88
kind: comment
occurred_at: 2026-11-13T09:17:18.266Z
actor:
  type: agent
  id: claude-code
-->
### claude-code commented

T17 rehearsal done: 149 gists for the 5-11 Nov editions, 0 failed, 13 brief (9%), 13 warnings, about 4 min per run. Review page for P4: https://claude.ai/artifact/EuUXX4AvMW9dDAZicnyaMw (private). Nothing under content/ was changed.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_556acbc1
kind: update
occurred_at: 2026-11-13T10:43:22.047Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_4db29f6f.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_21e59d7c
kind: update
occurred_at: 2026-11-13T10:43:32.016Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_50869fec.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_d736f833
kind: comment
occurred_at: 2026-11-13T10:47:14.226Z
actor:
  type: agent
  id: claude-code
-->
### claude-code commented

T18 spec drafted for approval: docs/specs/AIB-145y-ledger-gist-ui.md (components, props, and the 13 Nov review choices). Three open questions at its end.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_c0877138
kind: update
occurred_at: 2026-11-13T10:58:57.672Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_645fc91b.checked
    from: "false"
    to: "true"
  - field: checklist.ck_eb097e0a.checked
    from: "false"
    to: "true"
  - field: checklist.ck_e24b8093.checked
    from: "false"
    to: "true"
  - field: checklist.ck_8fef693d.checked
    from: "false"
    to: "true"
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_64ad8fa1
kind: update
occurred_at: 2026-11-13T11:03:27.480Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_45ced086.checked
    from: "false"
    to: "true"
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_04119e9d
kind: update
occurred_at: 2026-11-13T11:04:59.839Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_b573c191.checked
    from: "false"
    to: "true"
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_ac9593ce
kind: update
occurred_at: 2026-11-13T11:05:07.675Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_b573c191.checked
    from: "true"
    to: "false"
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_5fd7ad18
kind: update
occurred_at: 2026-11-13T11:06:55.026Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_77f4b374.checked
    from: "false"
    to: "true"
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_3bbeca72
kind: update
occurred_at: 2026-11-13T11:14:01.496Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_b573c191.checked
    from: "false"
    to: "true"
  - field: checklist.ck_f8e04426.checked
    from: "false"
    to: "true"
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_d6d9b9b6
kind: update
occurred_at: 2026-11-13T11:43:34.736Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_87ea0fa7.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_892233b6
kind: update
occurred_at: 2026-11-13T11:48:48.195Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_2bd561ec.checked
    from: "false"
    to: "true"
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_a7a9a87c
kind: update
occurred_at: 2026-11-13T11:49:33.238Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_888ec84a.checked
    from: "false"
    to: "true"
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_23bb055d
kind: update
occurred_at: 2026-11-13T11:53:17.525Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_6752a869.checked
    from: "false"
    to: "true"
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_3a49a959
kind: update
occurred_at: 2026-11-13T11:59:26.093Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_a4ea4223.checked
    from: "false"
    to: "true"
-->
### claude-code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_47c3a8f5
kind: update
occurred_at: 2026-11-14T05:49:17.440Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_68012185.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_771119b1
kind: update
occurred_at: 2026-11-14T06:02:40.591Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_7f55640b.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_ba1c9b79
kind: update
occurred_at: 2026-11-14T06:02:45.442Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_5577bc09.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_7a0aa99b
kind: update
occurred_at: 2026-11-14T23:03:15.326Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_329daaee.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_6cd3bab3
kind: update
occurred_at: 2026-11-14T23:03:15.360Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_fc76f81a.text
    from: "9.4 Checkpoint E: launch-ready; squash-merge PR #65 (launch)"
    to: "Checkpoint E: launch-ready; PR #65 squash-merged 13 Nov (gists live in the daily run), PR #68 (panel, T27-T29) still to squash-merge"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_f0f41756
kind: update
occurred_at: 2026-11-14T23:03:27.449Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_fc76f81a.text
    from: "Checkpoint E: launch-ready; PR #65 squash-merged 13 Nov (gists live in the daily run), PR #68 (panel, T27-T29) still to squash-merge"
    to: "9.4 Checkpoint E: launch-ready; PR #65 squash-merged 13 Nov (gists live in the daily run), PR #68 (panel, T27-T29) still to squash-merge"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_f7078146
kind: update
occurred_at: 2026-11-15T12:54:59.929Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_30babd49.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_ad7a12ed
kind: update
occurred_at: 2026-11-15T12:54:59.953Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_6684cc60.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_c3e2a1b1
kind: update
occurred_at: 2026-11-15T12:55:07.103Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_6684cc60.checked
    from: "true"
    to: "false"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_09c29867
kind: update
occurred_at: 2026-11-15T14:54:07.856Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_6d757e54.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_aa90e3ea
kind: update
occurred_at: 2026-11-15T16:07:31.735Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_7173a9bc.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_64f2b8f8
kind: update
occurred_at: 2026-11-16T02:58:49.481Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_6f3d7376.added
    to: "10.5 Design sync: the Design System Artifact gets the reaction row beside Save, the sign-in line and its link (components.css)"
-->
### Claude Code updated this ticket

16 Nov 2026, design change (the publisher, after trying T32): (1) a signed-out press no longer opens Google. It shows 'Please sign in to add your reaction. Sign in' under the row, in the style of the saved line, and the Sign in link opens the prompt. (2) The Save button and the reaction bar share one row. The spec (Decide 2, Display, Pressing signed out) and the T32 plan note are updated. The Design System Artifact needs a sync for it: item 10.5.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_573c2037
kind: update
occurred_at: 2026-11-16T02:58:49.529Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_6f3d7376.moved
    from: "66"
    to: "56"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_b2cae5b7
kind: update
occurred_at: 2026-11-16T03:12:07.528Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_6f3d7376.checked
    from: "false"
    to: "true"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_0231b5dd
kind: comment
occurred_at: 2026-11-16T03:41:53.066Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
-->
### Claude Code commented

16 Nov 2026, PR #70 review round (Grok 4.6 on 98482b3, plus Antigravity on b507e46): addressed in b3116ab, report at https://github.com/sachinjain024/aibytes/pull/70#issuecomment-6906643410. Fixed: public totals kept across sign-in/out; two new rules tests (two keys in one write, a swap), mutation-checked against firestore.rules:117; GistActions markup tests and a tested pure planPress; the Ledger REACTIONS test no longer compares the table with itself; signed-out store test reads a real count; spec T32 browser row follows the sign-in line. Not changed: the PR title and body (needs the publisher's go-ahead) and a visible 'counts unavailable' state (a spec decision). Tests: web 195, emulator 69, design-system 90, build ok. Still open on T32 (item 10.4): the signed-in browser pass (press, reload, second browser, panel, 375px, dark). Pushed 4630774 (design-sync log, Artifact version 14) with it.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_26e2d8dc
kind: comment
occurred_at: 2026-11-16T04:57:45.908Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
-->
### Claude Code commented

16 Nov 2026, T32 browser pass on localhost against the real project (signed in with Google, gist hn-nvidia-allegedly-engineered-scarcity-by-funding). Passed: a press shows at once and survives a reload (panel and /gists page); add a second emoji, remove one, remove the last (reader document deleted); public counts read with no auth show the right numbers and returned to all zeros after cleanup; unauthenticated list of counts, list of readers and get of a reader document are all 403; no error line; Save and the bar share one row at 1872px, and in a 371px frame the panel is a full sheet with no horizontal overflow and the eight emoji wrap under Save (also dark theme, by eye). Not checked: the signed-out press and its sign-in line (needs the reader signed out), a second real browser (replaced by the unauthenticated read), the panel opened by a card click, the sign-out transition keeping public counts. The window resize tool did not resize the window, so 375px was checked in an iframe. Item 10.4 stays open for the signed-out check.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_b50a4699
kind: update
occurred_at: 2026-11-16T05:00:52.928Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_759600ee.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_3fcbbd4b
kind: update
occurred_at: 2026-11-16T05:00:54.474Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_6684cc60.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_27712eae
kind: update
occurred_at: 2026-11-16T05:00:59.818Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_fc76f81a.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_01744ca4
kind: update
occurred_at: 2026-11-16T05:01:06.089Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_5670b0bb.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_37e087a1
kind: update
occurred_at: 2026-11-16T05:01:09.757Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_9da86e57.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_ee8b0d3e
kind: update
occurred_at: 2026-11-16T05:21:24.816Z
actor:
  type: agent
  id: grok-build
  name: Grok Build
changes:
  - field: checklist.ck_ba3092dd.checked
    from: "false"
    to: "true"
-->
### Grok Build updated this ticket

16 Nov 2026, T33 newsletter spec approved with all three recommendations (two orange Substack links, source/category x on weekly items, HN Deep title linked to the gist). Spec: docs/specs/AIB-145y-newsletter-gist-links.md. PR #71.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_a999015b
kind: update
occurred_at: 2026-11-16T06:18:11.173Z
actor:
  type: agent
  id: claude-code
changes:
  - field: checklist.ck_556cd1e6.checked
    from: "false"
    to: "true"
-->
### claude-code updated this ticket

P8 done 16 Nov 2026: aibytes.io verified in Search Console; sitemap.xml submitted, status Success, 125 pages discovered.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_e9e66dd3
kind: update
occurred_at: 2026-11-16T06:49:54.789Z
actor:
  type: agent
  id: grok-build
  name: Grok Build
changes:
  - field: checklist.ck_04b7fc12.checked
    from: "false"
    to: "true"
  - field: checklist.ck_16780ddc.checked
    from: "false"
    to: "true"
  - field: checklist.ck_be9e1656.checked
    from: "false"
    to: "true"
  - field: checklist.ck_946eab34.checked
    from: "false"
    to: "true"
-->
### Grok Build updated this ticket

T34–T36 landed on aib-145y-newsletter-gist-links (PR #71). T37 docs: CLAUDE.md, packages/gists README and rules, success criteria recorded with how. P6, P7, Checkpoint A and Checkpoint F stay open for the publisher.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_30a3de7e
kind: update
occurred_at: 2026-11-16T07:19:51.588Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_15e5e8ee.added
    to: "13. favicon (GitHub issue #38, on this branch)"
  - field: checklist.ck_b64903c5.added
    to: "13.1 Favicon: white bolt on cobalt (option 1) as favicon.svg, favicon.ico and apple-touch-icon.png, linked from every built page, with a build test"
  - field: checklist.ck_6adde97b.added
    to: 13.2 Wordmark.prompt.md names the bolt tile as the favicon (was the aB_ tile)
  - field: checklist.ck_4e9be923.added
    to: "13.3 P9: publisher checks the tab and bookmark icon on aibytes.io after deploy, then closes #38"
-->
### Claude Code updated this ticket

Added item 13: the aibytes.io favicon from GitHub issue #38, which asks for the ⚡ from the wordmark. It ships on this branch at the publisher's request, as its own commit. Options were compared in an artifact; the publisher picked 1, a white bolt on a cobalt tile, drawn as a vector path so it does not depend on each OS's emoji font.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_1a543bc3
kind: update
occurred_at: 2026-11-16T07:20:03.838Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_15e5e8ee.text
    from: "13. favicon (GitHub issue #38, on this branch)"
    to: "14. favicon (GitHub issue #38, on this branch)"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_8c8c2bd0
kind: update
occurred_at: 2026-11-16T07:20:03.870Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_b64903c5.text
    from: "13.1 Favicon: white bolt on cobalt (option 1) as favicon.svg, favicon.ico and apple-touch-icon.png, linked from every built page, with a build test"
    to: "14.1 Favicon: white bolt on cobalt (option 1) as favicon.svg, favicon.ico and apple-touch-icon.png, linked from every built page, with a build test"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_5518d375
kind: update
occurred_at: 2026-11-16T07:20:03.919Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_6adde97b.text
    from: 13.2 Wordmark.prompt.md names the bolt tile as the favicon (was the aB_ tile)
    to: 14.2 Wordmark.prompt.md names the bolt tile as the favicon (was the aB_ tile)
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_30d1433b
kind: update
occurred_at: 2026-11-16T07:20:03.950Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_4e9be923.text
    from: "13.3 P9: publisher checks the tab and bookmark icon on aibytes.io after deploy, then closes #38"
    to: "14.3 P9: publisher checks the tab and bookmark icon on aibytes.io after deploy, then closes #38"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_9dc4d716
kind: update
occurred_at: 2026-11-16T07:20:50.180Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_b64903c5.checked
    from: "false"
    to: "true"
  - field: checklist.ck_6adde97b.checked
    from: "false"
    to: "true"
-->
### Claude Code updated this ticket

Renumbered the favicon items to 14 (13 was already Outbound links). 14.1 and 14.2 done: the icons are in apps/web/public, linked from every built page and covered by the build test. 14 stays open until P9, the publisher's check on aibytes.io.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_3f0391c6
kind: update
occurred_at: 2026-11-16T08:28:20.458Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_c2c05c92.added
    to: "15. Issue 18 backfill: gists on /weekly/issue-18 (publisher's request, 16 Nov; an exception to the spec's no-backfill rule)"
  - field: checklist.ck_61485e93.added
    to: 15.1 gists build --issue sets gist on an existing weekly issue file; build_weekly_issues.py keeps that link from the gist's appearances when the HTML has no gist href
  - field: checklist.ck_0e1ed05c.added
    to: "15.2 Issue 18 gists: items.json from issue-18.json, gists draft --issue issue-18, gists.json written per the write-gists skill, gists build --issue issue-18"
  - field: checklist.ck_368e0757.added
    to: 15.3 issue-18.json carries a gist on every item; validate.py and the test suites pass
  - field: checklist.ck_6886892a.added
    to: "15.4 P10: publisher validates the gists on /weekly/issue-18, then the ticket closes"
-->
### Claude Code updated this ticket

Added item 15 at the publisher's request: backfill Issue 18 so /weekly/issue-18 opens each item's gist. This is an exception to the spec's no-backfill rule. The sent issue's HTML stays as it was; only the weekly page gains gists. 7 of its 22 items already have gists from the daily runs (they get an issue-18 appearance), and 15 need new ones. Issue 18 has no X rows in its weekly file, so no X previews.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_8fbed3df
kind: update
occurred_at: 2026-11-16T08:29:42.164Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_15e5e8ee.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_e3589525
kind: update
occurred_at: 2026-11-16T08:29:46.671Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_497e916a.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_8ee3ee08
kind: update
occurred_at: 2026-11-16T08:29:50.613Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_ffffb380.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_2cf29072
kind: update
occurred_at: 2026-11-16T08:29:53.953Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_8604cbbe.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_99fb53db
kind: update
occurred_at: 2026-11-16T08:29:57.372Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_ca91f71f.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_6c6b3b41
kind: update
occurred_at: 2026-11-16T08:29:58.297Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_e757a406.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_719ccb48
kind: update
occurred_at: 2026-11-16T08:40:13.154Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_368e0757.text
    from: 15.3 issue-18.json carries a gist on every item; validate.py and the test suites pass
    to: "15.3 issue-18.json: 18 of 22 items carry a gist (10 new, 8 repeats); validate.py and the test suites pass"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_5c1859d9
kind: update
occurred_at: 2026-11-16T08:40:13.181Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_61485e93.checked
    from: "false"
    to: "true"
  - field: checklist.ck_0e1ed05c.checked
    from: "false"
    to: "true"
  - field: checklist.ck_368e0757.checked
    from: "false"
    to: "true"
-->
### Claude Code updated this ticket

Issue 18 backfill done on this branch: 18 of 22 items on /weekly/issue-18 now open a gist. 10 are new (9 full, 1 brief: Product Hunt MCP had no snapshot post), and 8 reuse gists from the daily runs, which now list an issue-18 appearance. The other four are AI News articles credited (HackerNews) with no HN thread: Nvidia scarcity, Goldman Sachs and Claude Code, United Airlines, Apple Harbor. An hn gist needs a thread and a news gist must come from TechCrunch, so the contract has no kind for them, and they ship without a gist. The sent issue's HTML is unchanged. Left open: 15.4 (P10), the publisher's check of /weekly/issue-18.
<!-- /longclaw:event -->
