---
format: longclaw.ticket/v1
id: 0a6fe125-a398-4acf-8ad3-9df499b0924a
key: AIB-145y
title: "Gists: a summary page for each item"
status: in_progress
priority: none
rank: a0
labels:
  - app
type: feature
created_at: 2026-11-11T17:57:27.265Z
updated_at: 2026-11-11T18:41:14.521Z
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
