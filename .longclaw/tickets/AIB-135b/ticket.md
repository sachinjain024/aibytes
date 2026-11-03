---
format: longclaw.ticket/v1
id: 295a9ae2-b16f-4473-887b-4f89c8af95ba
key: AIB-135b
title: Remove Beehiiv-specific tooling from the repo (recoverable)
status: todo
priority: p2
labels:
  - marketing
type: chore
created_at: 2026-11-03T07:58:59.954Z
updated_at: 2026-11-03T07:58:59.954Z
---

Remove the Beehiiv-specific skills, templates, code paths, and docs from the repo once the Substack migration (AIB-134j) is done, and keep them recoverable in case we go back to Beehiiv.

Parent: **AIB-134j** (Migrate the newsletter from Beehiiv to Substack). Start this after Issue #17 has gone out from Substack, so nothing the live send still needs is removed.

**Preserve first, then remove.** Tag the last commit that still has the full Beehiiv tooling (`beehiiv-final`) and push the tag, so `git checkout beehiiv-final -- <path>` brings any piece back. The decision record lists what was removed and where it lived.

**Keep as history, don't edit:** past issues under `newsletter/issues/` (their Beehiiv exports included) and the taste decision records in `newsletter/artifacts/` that mention Beehiiv.

Beehiiv references at the time of writing (`git grep -il beehiiv`, history excluded):
- `.claude/skills/generate-newsletter-content/` - `SKILL.md`, `assets/beehiiv-export-template.html`, `references/beehiiv-patterns.html`
- `.claude/skills/generate-followup-thumbnail/` - `SKILL.md`, `assets/thumbnail.html`, `scripts/generate_thumbnail.py`
- `.claude/skills/x-fetch-items/` - `SKILL.md`, `scripts/x_items.py`
- `packages/fetchers/aibytes_fetchers/x_render.py`
- `.claude/rules/newsletter.md`, `.claude/rules/fetchers.md`
- `tests/test_thumbnail.py`, `tests/test_x_fetch_items.py`
- `apps/web/src/route.js`
- `README.md`, `docs/aibytes-app-product-spec.md`, `docs/aibytes-design-system-brief.md`, `packages/design-system/readme.md`

## Checklist

- [ ] Tag the last commit with the full Beehiiv tooling as beehiiv-final and push the tag <!-- longclaw:item=ck_751c3f6d -->
- [ ] Write a decision record in newsletter/artifacts/ listing every removed Beehiiv file and how to restore it from the tag <!-- longclaw:item=ck_55fad5b3 -->
- [ ] generate-newsletter-content: remove the Beehiiv export template, the Beehiiv patterns reference, and the Beehiiv steps in SKILL.md <!-- longclaw:item=ck_ccd65516 -->
- [ ] generate-followup-thumbnail: drop the Beehiiv upload wording and any Beehiiv-only sizing from SKILL.md, the template, and the script <!-- longclaw:item=ck_bdd1a119 -->
- [ ] x-fetch-items and packages/fetchers x_render.py: remove the Beehiiv-specific rendering <!-- longclaw:item=ck_88b133b9 -->
- [ ] Update tests/test_thumbnail.py and tests/test_x_fetch_items.py to match; full suite passes <!-- longclaw:item=ck_3fddfb9b -->
- [ ] Update .claude/rules/newsletter.md and .claude/rules/fetchers.md <!-- longclaw:item=ck_fed86d62 -->
- [ ] Swap the Beehiiv links in apps/web/src/route.js for Substack <!-- longclaw:item=ck_cc3b8d6f -->
- [ ] Update README.md, docs/, and packages/design-system/readme.md <!-- longclaw:item=ck_9f3330b1 -->
- [ ] Remove Beehiiv keys from .env.template and any Requestly environment, if present <!-- longclaw:item=ck_142cec28 -->
- [ ] Check for Beehiiv automations outside the repo (launchd agents, cron, webhooks, Zapier) and turn them off <!-- longclaw:item=ck_64a4f84d -->
- [ ] Final git grep -i beehiiv shows only history (past issues and decision records) <!-- longclaw:item=ck_d27b84a9 -->

## Activity

<!-- longclaw:event
id: evt_da4cd30d
kind: create
occurred_at: 2026-11-03T07:58:59.954Z
actor:
  type: agent
  id: claude-code
-->
### claude-code created this ticket
<!-- /longclaw:event -->
