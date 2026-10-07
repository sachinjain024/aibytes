---
format: longclaw.ticket/v1
id: a0c37303-7411-425b-9e09-9d01a4e52cc4
key: AIB-74u
title: Viral on X in the daily edition
status: backlog
priority: p3
labels:
  - app
type: feature
created_at: 2026-10-07T13:42:55.104Z
updated_at: 2026-10-07T13:42:55.104Z
---

The daily edition does not show Viral on X posts. That is a decision, recorded on AIB-8h, and this ticket is the later work. The weekly newsletter keeps the section.

## What is true today

The daily job fetches and curates four sources: Product Hunt, Hacker News, TechCrunch, and GitHub. `packages/fetchers` has no X source, `curate-edition` does not read one, and the edition JSON has no viral-posts section.

Viral on X is a weekly newsletter section. `/x-fetch-items` saves a hand-pasted Grok snapshot to `newsletter/data/{yyyy}/{mm}/weeks/week-NN/x/x_data.json`, the publisher shortlists five insights, and `/generate-newsletter-content` prints those posts verbatim. The same file also feeds Official Announcements. The daily runner never opens it.

## What this ticket is

Bring viral X posts into the daily edition. Do not do it by pointing the 13:30 runner at `/x-fetch-items`. That skill stops and waits for a paste, and the daily run has to finish unattended.

Settle these before writing code:

- Where a day's posts come from, given X has no fetch script.
- Whether the daily edition shows the weekly shortlist, a fresher one-day set, or something else.
- How an item is shaped in the edition contract. Adding a field is allowed; renaming or removing one is not.
- Official Announcements stay a newsletter section unless this ticket is explicitly widened.

The weekly path stays as it is: same snapshot, same shortlist, same verbatim render.

## Checklist

- [ ] Decide how the daily run gets X posts without waiting on a paste <!-- longclaw:item=ck_dbe65596 -->
- [ ] Add viral posts to the edition contract without breaking shipped readers <!-- longclaw:item=ck_e7b4ab8b -->
- [ ] Curate viral posts into the daily edition <!-- longclaw:item=ck_765035f5 -->
- [ ] Show them in the app <!-- longclaw:item=ck_f4da9498 -->
- [ ] Leave the weekly newsletter Viral on X section unchanged <!-- longclaw:item=ck_dec26802 -->

## Activity

<!-- longclaw:event
id: evt_0017d199
kind: create
occurred_at: 2026-10-07T13:42:55.104Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
-->
### Claude Code created this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_56d5c6d3
kind: comment
occurred_at: 2026-10-07T13:43:02.545Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
-->
### Claude Code commented

Re-keyed from AIB-60g, which Grok created on 2026-10-07. That key was already taken on main by the Issue #12 ticket.
<!-- /longclaw:event -->
