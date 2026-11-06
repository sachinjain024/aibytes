---
format: longclaw.ticket/v1
id: d684917c-49cb-46b3-b4aa-ceaf69d2fe77
key: AIB-134r
title: "Move the daily edition job from launchd to GitHub Actions"
status: todo
priority: none
created_at: 2026-11-06T08:06:12.838Z
updated_at: 2026-11-06T08:06:12.838Z
---

The daily edition (`io.aibytes.edition`, 13:30 IST) and its watchdog (`io.aibytes.watchdog`, 14:30 IST) run as launchd agents, so they only run while this Mac is on and awake. `.github/workflows/edition.yml` already runs the same `packages/runner/run.py` as a manual-only fallback; this ticket makes it the primary scheduler and replaces the watchdog.

Open questions: whether any fetcher is blocked from cloud IPs. The Claude credential is decided: CLAUDE_CODE_OAUTH_TOKEN.

## Checklist

- [ ] Read packages/runner/aibytes_runner/cli.py and check.py for anything that depends on the Mac (keychain, launchd paths, absolute interpreter paths, local-only tools) <!-- longclaw:item=ck_3ccee8f6 -->
- [x] Confirm every fetcher (HackerNews, TechCrunch, GitHub, Product Hunt) works from a GitHub-hosted runner IP; do a manual workflow_dispatch run with skip_fetch off <!-- longclaw:item=ck_d6f3fdc3 -->
- [x] Use CLAUDE_CODE_OAUTH_TOKEN (from `claude setup-token`), not ANTHROPIC_API_KEY: replace the API-key check and env in edition.yml with the token (cli.py already reads it from the environment) <!-- longclaw:item=ck_e16051cd -->
- [x] Add repo secrets CLAUDE_CODE_OAUTH_TOKEN, PH_API_KEY and AIBYTES_SLACK_WEBHOOK, with `gh secret set` from the local .env rather than pasting into the UI; drop PH_API_SECRET if unused <!-- longclaw:item=ck_9f52e74e -->
- [x] Check main branch protection allows the workflow's push (GITHUB_TOKEN with contents: write, or a PAT / deploy key if protected) <!-- longclaw:item=ck_b0c57249 -->
- [x] Check whether the Python 3.8 pin in edition.yml is deliberate, and align it with the version the runner is tested on <!-- longclaw:item=ck_7f4a5a53 -->
- [x] Add `schedule: cron "0 8 * * *"` (13:30 IST) to edition.yml and update its header comment, which says there is deliberately no schedule <!-- longclaw:item=ck_e56148ee -->
- [x] Add a concurrency group to edition.yml so a manual and a scheduled run cannot race to push the same edition <!-- longclaw:item=ck_882ded06 -->
- [x] Create a watchdog workflow that runs check.py at 09:00 UTC (14:30 IST) and posts to Slack if today's edition is missing <!-- longclaw:item=ck_7a4c0338 -->
- [ ] Dry-run the scheduled workflow with workflow_dispatch for a past --date and confirm the commit lands on main and Pages deploys <!-- longclaw:item=ck_9d6f5e11 -->
- [ ] Cut over: uninstall both launchd agents (io.aibytes.edition, io.aibytes.watchdog) so only one scheduler runs <!-- longclaw:item=ck_ac59fd0d -->
- [ ] Update CLAUDE.md, packages/runner/README.md and .claude/rules docs: the scheduler is now GitHub Actions; launchd/install.sh becomes a fallback or is removed <!-- longclaw:item=ck_78bd3bc9 -->
- [ ] Watch the first three scheduled runs (including start-time delay and any skipped run) before removing the launchd templates <!-- longclaw:item=ck_41b4eccb -->

## Activity

<!-- longclaw:event
id: evt_1b1c8c56
kind: create
occurred_at: 2026-11-06T08:06:12.838Z
actor:
  type: agent
  id: claude-code
-->
### claude-code created this ticket
<!-- /longclaw:event -->
