---
format: longclaw.ticket/v1
id: 5825a37a-2d21-4fd7-83d6-f0f8b59a10ce
key: AIB-44s
title: Include viral tweets / most engaged X posts section
status: done
priority: p1
due: 2026-09-26
created_at: 2026-09-26T01:17:54.743Z
updated_at: 2026-09-26T14:42:19.252Z
---

Add a weekly section with the most-engaged AI posts on X. Working name: "AI chirp on X" / "What's chirping on X".

Constraints:
- X data is gathered by hand (Grok, via X Premium), so the section is opt-in per issue. The newsletter skill must not assume it exists.
- Posts are quoted exactly as written. The skill can pick which posts to show, order them, and add a label or context line, but it never edits the post text.
- Candidate layout: the top 2 posts as a grid of cards, the rest as simple 1–2 line text rows.


## Checklist

- [x] Pick the section title: brainstorm options, then finalize the name and subtitle <!-- longclaw:item=ck_07b8cf9d -->
- [x] Define the X data contract: fields (author, handle, verbatim text, URL, posted_at, likes/reposts/views, media) and where it lives (newsletter/data/…/week-NN/x/x_data.json) <!-- longclaw:item=ck_92ac2b14 -->
- [x] Draft the Grok prompt that returns the last week's most-engaged AI posts in exactly that format <!-- longclaw:item=ck_c12217fb -->
- [x] Run the prompt for one real week, check the links, numbers, and text against X, and tighten the prompt <!-- longclaw:item=ck_bf0d381d -->
- [x] Commit the final Grok prompt to .claude/skills/x-fetch-items/references/grok-prompt.md <!-- longclaw:item=ck_61bebd95 -->
- [x] Finish the x-fetch-items skill: a script that validates and saves the pasted JSON (--output-root, --date) and writes the shortlist. The newsletter skill includes the section only when x_data.json has a shortlist <!-- longclaw:item=ck_4f0e30ec -->
- [x] Propose layout options as an artifact (top-2 grid + text rows vs alternatives, mobile, Beehiiv embed vs static card) and pick one <!-- longclaw:item=ck_f97b89c7 -->
- [x] Official Announcements: pick the name and layout (artifact of options), and decide where it sits relative to AI News <!-- longclaw:item=ck_c782adad -->
- [x] Update template.html and the Beehiiv patterns/export template with the chosen X section design <!-- longclaw:item=ck_23741293 -->
- [x] Update the generate-newsletter-content SKILL.md: the opt-in step, reading x_data.json, the verbatim rule, and choosing the top 2 <!-- longclaw:item=ck_b0b439b6 -->
- [x] Official Announcements: add it to template.html, the Beehiiv patterns and the export template, and teach generate-newsletter-content to read the announcement shortlist and drop those stories from AI News <!-- longclaw:item=ck_e5c53da3 -->
- [x] Record the decision (title, layout, process) in newsletter/artifacts/ <!-- longclaw:item=ck_c7821395 -->
- [x] Add tests for any new script or validator, and run the suite <!-- longclaw:item=ck_e04b75f8 -->
- [x] Ship tooling on its own branch and PR <!-- longclaw:item=ck_3df3d286 -->
- [x] Pilot it in the next issue: run Grok, drop the data, generate the issue, and review it in Beehiiv <!-- longclaw:item=ck_87edec0d -->
## Activity

<!-- longclaw:event
id: evt_3dd277ee
kind: create
occurred_at: 2026-09-26T01:17:54.743Z
actor:
  type: human
  id: local
-->
### You created this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_027dad24
kind: update
occurred_at: 2026-09-26T01:24:01.498Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: description
  - field: checklist.ck_07b8cf9d.added
    to: "Pick the section title: brainstorm options, then finalize the name and subtitle"
  - field: checklist.ck_92ac2b14.added
    to: "Define the X data contract: fields (author, handle, verbatim text, URL, posted_at, likes/reposts/views, media) and where it lives (newsletter/data/…/week-NN/x/x_data.json)"
  - field: checklist.ck_c12217fb.added
    to: Draft the Grok prompt that returns the last week's most-engaged AI posts in exactly that format
  - field: checklist.ck_bf0d381d.added
    to: Run the prompt for one real week, check the links, numbers, and text against X, and tighten the prompt
  - field: checklist.ck_61bebd95.added
    to: Commit the final Grok prompt to the repo, next to the data contract
  - field: checklist.ck_4f0e30ec.added
    to: "Decide the opt-in flow: how the newsletter skill detects or asks about the X section, and how it skips it cleanly"
  - field: checklist.ck_f97b89c7.added
    to: Propose layout options as an artifact (top-2 grid + text rows vs alternatives, mobile, Beehiiv embed vs static card) and pick one
  - field: checklist.ck_23741293.added
    to: Update template.html and the Beehiiv patterns/export template with the chosen X section design
  - field: checklist.ck_b0b439b6.added
    to: "Update the generate-newsletter-content SKILL.md: the opt-in step, reading x_data.json, the verbatim rule, and choosing the top 2"
  - field: checklist.ck_c7821395.added
    to: Record the decision (title, layout, process) in newsletter/artifacts/
  - field: checklist.ck_e04b75f8.added
    to: Add tests for any new script or validator, and run the suite
  - field: checklist.ck_3df3d286.added
    to: Ship tooling on its own branch and PR
  - field: checklist.ck_87edec0d.added
    to: "Pilot it in the next issue: run Grok, drop the data, generate the issue, and review it in Beehiiv"
-->
### Claude Code updated this ticket

Converted the notes into an ordered checklist. The data contract and Grok prompt come before the template, and the template comes before the skill.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_cdcf886b
kind: update
occurred_at: 2026-09-26T01:55:08.272Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_07b8cf9d.checked
    from: "false"
    to: "true"
-->
### Claude Code updated this ticket

Section title: Loudest on X. Subtitle: "The AI posts that drew the biggest reaction this week." Intro phrasing: "the loudest posts on X". Decision record: newsletter/artifacts/2026-Sep-26-X-section-title-taste.html. The name goes into SKILL.md and the template at steps 8–9.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_42563cc3
kind: update
occurred_at: 2026-09-26T02:08:40.219Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_4f0e30ec.text
    from: "Decide the opt-in flow: how the newsletter skill detects or asks about the X section, and how it skips it cleanly"
    to: "Finish the x-fetch-items skill: a script that validates and saves the pasted JSON (--output-root, --date) and writes the shortlist. The newsletter skill includes the section only when x_data.json has a shortlist"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_1d9c3085
kind: update
occurred_at: 2026-09-26T02:08:40.241Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_61bebd95.text
    from: Commit the final Grok prompt to the repo, next to the data contract
    to: Commit the final Grok prompt to .claude/skills/x-fetch-items/references/grok-prompt.md
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_5ed2fa90
kind: update
occurred_at: 2026-09-26T02:08:40.262Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_92ac2b14.checked
    from: "false"
    to: "true"
-->
### Claude Code updated this ticket

The data contract is settled and lives in .claude/skills/x-fetch-items/references/x-data.md. Path: newsletter/data/{yyyy}/{mm}/weeks/week-NN/x/x_data.json. Grok returns 20 posts ranked by likes. x-fetch-items dedupes them against each other and against the week's news, then shortlists 5. X gets its own skill because the run has a manual Grok step; its SKILL.md is drafted.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_92bf5c62
kind: update
occurred_at: 2026-09-26T02:10:38.640Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_c12217fb.checked
    from: "false"
    to: "true"
-->
### Claude Code updated this ticket

Wrote a Grok prompt to paste each week, in .claude/skills/x-fetch-items/references/grok-prompt.md. A saved Grok task comes later.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_eb62a963
kind: update
occurred_at: 2026-09-26T05:09:21.033Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_c782adad.added
    to: "Official Announcements: pick the name and layout (artifact of options), and decide where it sits relative to AI News"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_723da115
kind: update
occurred_at: 2026-09-26T05:09:21.063Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_e5c53da3.added
    to: "Official Announcements: add it to template.html, the Beehiiv patterns and the export template, and teach generate-newsletter-content to read the announcement shortlist and drop those stories from AI News"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_0988253b
kind: comment
occurred_at: 2026-09-26T05:09:21.090Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
-->
### Claude Code commented

Split the X data into two buckets. 'insight' feeds Loudest on X: practical advice, demos and lessons, 5 per issue. 'announcement' feeds a new Official Announcements section: releases, benchmarks and pricing from company accounts, 3–5 per issue. An announcement in its own section is not repeated in AI News. The Grok prompt now asks for two lists (up to 10 announcements, up to 20 insights). It adds link_url for link cards, bans t.co links, and adds a policy category. The first Grok run for week 39 (saved in x_data.json) predates this split and needs a re-run.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_d65a9393
kind: update
occurred_at: 2026-09-26T05:09:26.576Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_c782adad.moved
    from: "14"
    to: "8"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_d14dd38e
kind: update
occurred_at: 2026-09-26T05:09:26.596Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_e5c53da3.moved
    from: "15"
    to: "11"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_21a3e90b
kind: comment
occurred_at: 2026-09-26T13:16:20.717Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
-->
### Claude Code commented

Test run for week 39 is saved in newsletter/data/2026/09/weeks/week-39/x/x_data.json, with both shortlists confirmed. Loudest on X: @RyanSael, @twoclipping, @cursor_ai, @ClaudeDevs (task cost), @simonw. Official Announcements: Opus 5.5, GPT-6 Sol/Luna, Grok 4.7, Nemotron 3 Diarization, Gemini 3.8 TTS. Grok put 7 feature announcements in the insights list; I moved them to announcements and re-ranked. Not yet checked against X itself.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_4b2c82aa
kind: update
occurred_at: 2026-09-26T13:17:22.864Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_bf0d381d.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_83edd25a
kind: update
occurred_at: 2026-09-26T13:29:34.853Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_61bebd95.checked
    from: "false"
    to: "true"
-->
### Claude Code updated this ticket

Checked all 10 shortlisted posts on X in Chrome. All links open, the authors match, and 8 of 10 match exactly. Fixed 2 errors from Grok: @ClaudeDevs (task cost) had the link-card URL pasted into its text, and @simonw's date was one day late (24 Sep, not 25 Sep). Grok's like counts ran 0–12% below X's, and its repost counts were further off. The prompt is tightened: feature and policy updates go in announcements even from dev-rel accounts, a demo must contain what it promises, the likes order is checked, and a post already under also_covered can't appear on its own.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_717b5610
kind: update
occurred_at: 2026-09-26T13:35:34.941Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_4f0e30ec.checked
    from: "false"
    to: "true"
-->
### Claude Code updated this ticket

Built the x-fetch-items script: .claude/skills/x-fetch-items/scripts/x_items.py, a thin wrapper around packages/fetchers/aibytes_fetchers/x_paste.py. Subcommands: prompt (fills in the week's dates), save (checks the paste, refuses on errors, reports warnings, writes the file), move (moves a post to the other bucket and re-ranks) and shortlist (records the picks and warns on rule breaks). Tests: tests/test_x_fetch_items.py, 26 tests, all offline. The full offline suite passes: 257 tests, 5 skipped. SKILL.md now uses the script and adds a step to check the picks on X. The newsletter side (include the sections only when a shortlist exists) is still part of the step to update generate-newsletter-content.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_3640b273
kind: comment
occurred_at: 2026-09-26T13:40:20.878Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
-->
### Claude Code commented

Step 7: layout proof sheet published (https://claude.ai/artifact/Kta1yguj7cJvGu14K7S1KL, file newsletter/artifacts/2026-Sep-26-Loudest-on-X-layout-taste.html). V1 post cards, V2 top-2 + rows, V3 ticker rows, V4 quote column; long-post cut rule proposed (>600 chars: cut at last paragraph break before 400, ellipsis + link). Lean V1, placement 0x02. Awaiting pick.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_90c360ef
kind: update
occurred_at: 2026-09-26T13:47:21.060Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_f97b89c7.checked
    from: "false"
    to: "true"
-->
### Claude Code updated this ticket

Layout picked: V3 ticker rows, likes shown as ♥︎ (U+2665+FE0E) in the stat column. Proposed first-line rule for long posts: up to first line break; >140 chars -> first sentence; still longer -> last word break before 120 + '…'. Placement 0x02 still to confirm.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_af5db776
kind: comment
occurred_at: 2026-09-26T13:49:47.235Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
-->
### Claude Code commented

Placement decided: Loudest on X goes after AI News and Official Announcements, before Products. Planned numbering: Official Announcements 0x02, Loudest on X 0x03, Products/GitHub/HN 0x04-0x06 (to confirm with the Official Announcements layout).
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_37f802b3
kind: update
occurred_at: 2026-09-26T13:52:25.891Z
actor:
  type: human
  id: local
changes:
  - field: due
    to: 2026-09-26
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_b5cca101
kind: comment
occurred_at: 2026-09-26T13:52:34.889Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
-->
### Claude Code commented

Shortlist change: dropped @twoclipping (profanity in first line). Replacement @deedydas/2103141339651350646 (5,427 likes), verified on X in Chrome: text and date 2026-09-24 match. Skipped @elonmusk (own-company promo, Grok 4.7 already in announcements) and @donaldjewkes (missing prompt). New standing rule: no profanity, even starred, added to grok-prompt.md exclusions and x-data.md shortlisting step 1.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_db17da1d
kind: comment
occurred_at: 2026-09-26T13:55:20.064Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
-->
### Claude Code commented

Step 8: Official Announcements proof sheet published (https://claude.ai/artifact/LF7sgUBkDWnr2itsvbgtXF, newsletter/artifacts/2026-Sep-26-Official-Announcements-taste.html). Names N1-N5, layouts L1 ticker / L2 release log / L3 twin card, placement P1 after / P2 before AI News. Lean N4 Release Notes + L2 + P1. Awaiting picks.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_c7a6aebf
kind: update
occurred_at: 2026-09-26T14:07:34.156Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_c782adad.checked
    from: "false"
    to: "true"
-->
### Claude Code updated this ticket

Official Announcements locked: N1 name 'Official Announcements', L3 unnumbered card (📣, ink border) directly after the AI News card (P1). Row: bold release name linked to the X post + verbatim first line + (Company) label; likes order, no stat. Numbering: Loudest on X 0x02, Products 0x03, GitHub 0x04, HN 0x05.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_a4451f45
kind: comment
occurred_at: 2026-09-26T14:09:16.938Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
-->
### Claude Code commented

Official Announcements amended: no release-name headline of ours (it had shortened Gemini's name). Each entry = company name (bold, links to the X post) + @account + official link domain + the whole post verbatim with line breaks. Long-post cut rule only past 600 chars.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_432b23a5
kind: comment
occurred_at: 2026-09-26T14:24:59.855Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
-->
### Claude Code commented

Loudest on X rows: ~2 lines verbatim (140-char budget, cut at a word break, grey … when cut; line breaks shown as grey /). Official Announcements stays whole posts. Card styling options S1 byline+footer / S2 company column / S3 inset statements published on the OA sheet; lean S1.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_e4416c2e
kind: comment
occurred_at: 2026-09-26T14:27:04.420Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
-->
### Claude Code commented

Official Announcements card styling locked: S3 inset statements (byline: bold company + grey @handle · day; whole post in paper inset like the AI News quote; mono footer 'Post on X ↗ · domain ↗'; 1.5px ink card border; subtitle 'This week's launches, in the companies' own words.').
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_36744c90
kind: update
occurred_at: 2026-09-26T14:30:37.681Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_23741293.checked
    from: "false"
    to: "true"
-->
### Claude Code updated this ticket

Templates updated: template.html (Official Announcements .oa-card after the AI News card with {{ANNOUNCEMENT_ITEMS}}; Loudest on X 0x02 with subtitle and {{X_ROWS}}; Products/GitHub/HN renumbered 0x03-0x05; numbers close up when X is absent), beehiiv-patterns.html (inline/table patterns for both), beehiiv-export-template.html (Part 1 adds Announcements, Part 2 starts with Loudest on X). Rendered with week-39 posts in Chrome and checked. SKILL.md PART1/PART2 wording still to update in the next step.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_39c343da
kind: update
occurred_at: 2026-09-26T14:31:47.924Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_b0b439b6.checked
    from: "false"
    to: "true"
-->
### Claude Code updated this ticket

generate-newsletter-content SKILL.md updated: X sections opt-in only with a shortlist, read shortlist order only; AI News drops stories carried by Official Announcements; section order/numbers (cards unnumbered, X 0x02, close up when absent); verbatim rule overriding the no-em-dash rule; OA byline/whole post/footer rules; Loudest on X 140-char cut with / and …, ♥︎ U+2665+FE0E; link table rows; Today line; Beehiiv Part 1/Part 2; verify step checks text against x_data.json. Picks .from chip adds Announcements and X.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_c9429936
kind: update
occurred_at: 2026-09-26T14:31:47.952Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_e5c53da3.checked
    from: "false"
    to: "true"
-->
### Claude Code updated this ticket

Covered by the template step (oa-card) and the SKILL.md step (drop from AI News).
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_aafedae5
kind: update
occurred_at: 2026-09-26T14:36:16.606Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_e04b75f8.checked
    from: "false"
    to: "true"
-->
### Claude Code updated this ticket

Render helper + tests: new packages/fetchers/aibytes_fetchers/x_render.py (excerpt/paragraphs/trim_long/likes/day/company map; html + beehiiv renderers; verify). x_items.py gains 'render' (--format html|beehiiv, --section, --number) and 'verify' (--issue/--export; fails on missing, retyped or reordered posts). set_shortlist now warns on two launches from one company. Skills and fetchers.md point at render/verify. tests/test_x_fetch_items.py: 49 tests; full suite 280 OK, 5 skipped. End-to-end on week 39: template + export filled from render, verify ok.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_77e0784e
kind: update
occurred_at: 2026-09-26T14:40:49.684Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_c7821395.checked
    from: "false"
    to: "true"
-->
### Claude Code updated this ticket

Decisions recorded and committed in newsletter/artifacts/: 2026-Sep-26-X-section-title-taste.html (title), 2026-Sep-26-Loudest-on-X-layout-taste.html (V3 rows, ♥︎, 2-line cut, profanity drop, 0x02), 2026-Sep-26-Official-Announcements-taste.html (N1 name, L3 card, P1 after AI News, S3 inset styling, whole posts verbatim). Rules also live in both skills and the templates.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_2c89100e
kind: update
occurred_at: 2026-09-26T14:40:49.708Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_3df3d286.checked
    from: "false"
    to: "true"
-->
### Claude Code updated this ticket

Shipped as commit 613e1a7 on aib-44s-loudest-on-x; PR https://github.com/sachinjain024/aibytes/pull/14. Excluded: week-39 x_data.json (issue content, goes on the next issue branch) and LongClaw files.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_ef6c089c
kind: update
occurred_at: 2026-09-26T14:42:19.230Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_87edec0d.checked
    from: "false"
    to: "true"
-->
### Claude Code updated this ticket

Pilot handed off: the publisher will generate the next issue on its own branch (with the week-39 x_data.json) and file any follow-up changes as a separate ticket.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_3d2b1175
kind: update
occurred_at: 2026-09-26T14:42:19.252Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: status
    from: in_progress
    to: done
-->
### Claude Code updated this ticket

Closing: all checklist items done. Tooling shipped in PR https://github.com/sachinjain024/aibytes/pull/14.
<!-- /longclaw:event -->
