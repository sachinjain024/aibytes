---
format: longclaw.ticket/v1
id: 2ab3ddbd-5f02-4068-95fe-5554b32199dc
key: AIB-147t
title: "Issue #18: 15 Nov 2026"
status: done
priority: urgent
rank: Zz
type: newsletter
due: 2026-11-15
created_at: 2026-11-14T23:08:21.425Z
updated_at: 2026-11-15T11:05:00.830Z
---

Weekly aiBytes_ Issue #18.

- Send date: Monday 16 Nov 2026 (ISO week 47)
- Branch: `issue-18-15-nov-weekly-newsletter` → PR against `main`
- Source data: `newsletter/data/2026/11/weeks/week-46/` (ProductHunt, HackerNews, TechCrunch, GitHub, X)
- Output: `newsletter/issues/2026/week-47-Issue-18/` (issue HTML, Substack export, thumbnails)

Checklist copied from Issue #17 (AIB-140m).

## Checklist

- [x] Fetch weekly sources (ProductHunt, HackerNews, TechCrunch, GitHub) <!-- longclaw:item=ck_5be0d4ac -->
- [x] Shortlist X posts for Viral on X <!-- longclaw:item=ck_d966c569 -->
- [x] Decide whether to include the Official Announcements section from X <!-- longclaw:item=ck_493978f4 -->
- [x] Generate Weekly Content <!-- longclaw:item=ck_ffbbf6cb -->
- [x] Update the Content <!-- longclaw:item=ck_956955f9 -->
- [x] Finalize Title & Description <!-- longclaw:item=ck_84dae7ea -->
- [x] Update Intro Content <!-- longclaw:item=ck_b568236a -->
- [x] Generate Thumbnail <!-- longclaw:item=ck_8461b316 -->
- [x] Send the newsletter <!-- longclaw:item=ck_b590a548 -->
- [x] Create the LC Tickets for AI Learning Backlog <!-- longclaw:item=ck_361860b0 -->
- [x] Commit the issue output and open a PR against main <!-- longclaw:item=ck_6522a211 -->

## Activity

<!-- longclaw:event
id: evt_6c9287a5
kind: create
occurred_at: 2026-11-14T23:08:21.425Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
-->
### Claude Code created this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_5e8ffae7
kind: update
occurred_at: 2026-11-14T23:08:44.082Z
actor:
  type: human
  id: local
changes:
  - field: status
    from: todo
    to: in_progress
  - field: rank
    to: Zz
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_cccae391
kind: comment
occurred_at: 2026-11-14T23:11:04.792Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
-->
### Claude Code commented

Fetched week-46 into newsletter/data/2026/11/weeks/week-46/: ProductHunt, HackerNews (10), TechCrunch (10 of 72), GitHub. The default GitHub pull gave only 8 repos and OpenMausBot ran in #16, so gh_data.json holds the top 10 never-featured repos from a deeper pull (40 of 59, language pages merged). Left out as #13-#17 repeats: cloudflare/security-audit-skill, NVIDIA/auto-ontology (#17), OpenMausBot (#16), Leonxlnx/taste-skill (#15), ranxianglei/billion-context (#13). Fetch item stays unchecked until the publisher settles the GitHub list.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_44ff8dc8
kind: update
occurred_at: 2026-11-14T23:19:25.427Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_5be0d4ac.checked
    from: "false"
    to: "true"
-->
### Claude Code updated this ticket

Publisher settled the GitHub list at 6 repos: pingdotgg/t3code, google/elephant-goldfish-model, vercel-labs/agent-desktop, ZhuLinsen/daily_stock_analysis, GoogleChrome/modern-web-guidance-src, herdrdev/herdr. Dropped: anthropics/skills, vercel-labs/agent-browser, homeassistant-ai/ha-mcp, JuliusBrussee/caveman.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_58da878b
kind: update
occurred_at: 2026-11-15T04:49:50.774Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_d966c569.checked
    from: "false"
    to: "true"
  - field: checklist.ck_493978f4.checked
    from: "false"
    to: "true"
-->
### Claude Code updated this ticket

X saved to week-46 x/x_data.json (6 announcements, 5 insights from Grok; Anthropic safety-evals post moved to insight). Official Announcements included: Claude Fable 5.2 / Mythos 5.2, Businesses in ChatGPT, Meta Muse Ember, Gemini 4 Hydrogen (Anthropic IPO left for AI News). Viral on X: simonw 'This codebase is yours', Anthropic safety evals, HyperFrames, Peak__Twilight (0 security harness, dated 8 Nov), 4n1rudh4 ByteAsk (emoji 🔑 🧪 🎬 🛡️ ⚙️). Dropped simonw's second post. Grok's links taken as correct.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_faeaf096
kind: update
occurred_at: 2026-11-15T04:55:31.502Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_ffbbf6cb.checked
    from: "false"
    to: "true"
-->
### Claude Code updated this ticket

Generated newsletter/issues/2026/week-47-Issue-18/ (issue + Substack export). AI News 8, Official Announcements 4 (Anthropic, OpenAI, Meta, Google), Viral on X 5, Products 5, GitHub 6, HN 5. HN snapshot replaced with a 30-story pull so deep cuts trace to committed data. @finkd added to x_render COMPANIES as Meta. Added issue 18 to content/weekly/index.json, rebuilt weekly issue JSON, validate passes; x_items verify passes on both files. Review artifact: https://claude.ai/artifact/GabqyMa3Hms3Ey3zGvwgFx (built from aiBytes-issue-18.html by issue_artifact.py; republish to this URL after every edit).
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_789d50c6
kind: comment
occurred_at: 2026-11-15T10:55:08.231Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
-->
### Claude Code commented

Substack draft created (not published, no email): https://newsletter.aibytes.io/publish/post/225018435 - title, subtitle and body pasted with formatting via the new create-substack-draft skill; sections and counts checked (AI News 6, Official Announcements 4, Viral on X 4, Products 5, GitHub 6, HN 5). Thumbnail, subscribe button and send left for the publisher.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_cc8903ca
kind: update
occurred_at: 2026-11-15T11:04:45.866Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_956955f9.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_104e9e7a
kind: update
occurred_at: 2026-11-15T11:04:46.976Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_84dae7ea.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_fa1f485a
kind: update
occurred_at: 2026-11-15T11:04:47.750Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_b568236a.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_bad970e8
kind: update
occurred_at: 2026-11-15T11:04:48.675Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_8461b316.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_03eea9a7
kind: update
occurred_at: 2026-11-15T11:04:49.401Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_b590a548.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_4981e897
kind: update
occurred_at: 2026-11-15T11:04:51.185Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_361860b0.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_416e7aeb
kind: update
occurred_at: 2026-11-15T11:04:56.835Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_6522a211.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_f58eccf6
kind: comment
occurred_at: 2026-11-15T11:04:59.135Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
-->
### Claude Code commented

Publisher published Issue #18 on Substack and sent it by email: https://newsletter.aibytes.io/p/jensen-huang-leaves-nvidia-and-anthropic (post 225018435, 15 Nov 2026 11:01 UTC). Title '👔 Jensen Huang leaves Nvidia and Anthropic files to go public'; social title '...files for IPO'. Review closed after ~25 artifact comment threads: greeting 'Hello, AI enthusiasts', hook rewritten with Nvidia's market-value loss, storyline on Anthropic's $1.75B founder sale + Goldman + United, Anthropic IPO and Gemini rows dropped from AI News (6), ByteAsk dropped from Viral on X (4), pull quote 'Nvidia didn't just sell the shovels...', sign-off 'Curated & Written with ❤️ for Engineers and Startup Founders.' Hero banner from Gemini (name-free prompt), watermark removed, saved as thumbnails/issue-18-hero.jpg (122KB). Learning backlog: AIB-148d (16 items); social post: AIB-149g.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_be5a2129
kind: update
occurred_at: 2026-11-15T11:05:00.830Z
actor:
  type: human
  id: local
changes:
  - field: status
    from: in_progress
    to: done
-->
### You updated this ticket
<!-- /longclaw:event -->
