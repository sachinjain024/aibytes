---
format: longclaw.ticket/v1
id: a3395be9-06a8-44ad-8936-ef78d4206b1c
key: AIB-156p
title: Claude Skills tab on aibytes.io, with skill gists from daily and weekly pulls
status: todo
priority: p2
labels:
  - app
type: feature
created_at: 2026-11-27T11:47:34.571Z
updated_at: 2026-11-27T11:47:34.571Z
---

Add a **Claude Skills** tab on aibytes.io: a discovery place for the best Claude / Agent Skills (`SKILL.md`), each with its own gist. The tab is filled only from the **daily** and **weekly** pulls. A card looks like today's repo card, shows how to install the skill, and lets a reader star or share it. The gist shape is tuned for a skill (install commands, when to use it) rather than reused from `repo`.

This is a new category, not a filter on Trending Dev Projects. Adding a category is a conscious contract change (`.claude/rules/feed-schema.md`): schema, `counts`, side-nav chips, weekly pages, and every consumer that lists categories.

## Goal

- **Outcome.** aibytes.io has a fifth category, Claude Skills. Opening it shows that day's (or that week's) skills, ranked. Clicking a card opens a gist that says what the skill does and how to install it. The star is the existing save; share copies or shares the gist URL.
- **Who.** Builders who already read aiBytes_ and want a short list of skills worth installing, without browsing GitHub or plugin marketplaces.
- **Why now.** Agent Skills are a real format (`SKILL.md`, [agentskills.io](https://agentskills.io)). They already show up in our GitHub filter as ordinary repos. A dedicated tab and gist make them discoverable and installable.
- **Success.** A reader can go All → Claude Skills, understand a skill from its gist, copy an install command, star it, and share the gist link. Daily and weekly runs keep the list fresh without a hand-built catalogue.

## What is true today

- Categories on the site and in the contract are exactly four: `launches`, `repos`, `news`, `hn` (`packages/feed-schema/validate.py`, `apps/web/src/filters.js`). v1.1 names (`discussions`, `releases`, `research`) were left out on purpose.
- Sources are Product Hunt, Hacker News, TechCrunch, GitHub trending. GitHub already matches `agents? skills?` in repo text and files those hits as `category: "repos"`.
- Gist kinds are `news`, `hn`, `repo`, `launch`, `x_post`. A repo gist has `key_points`, `try_it` (one README command) and `whats_open`. That is the wrong shape for a skill: the useful artefact is `SKILL.md` plus install paths for Claude Code (and Codex / Grok via `.agents/skills`), not open issues.
- Stars already exist (AIB-75v SaveStar on the card and on the gist). There is no share-the-gist-URL control; CardMenu is "Open in ChatGPT / Claude / Gemini".
- Daily runner and weekly `fetch-weekly-items` share `packages/fetchers`. Cadence is daily | weekly | monthly. The user wants **daily and weekly only** for this source: no monthly window, no one-shot backfill of every `SKILL.md` on GitHub, no user submissions.

## Product choices (decide before building)

### 1. Where the rows come from

Recommended: a **new fetcher** (`skills` / `claude-skills`) that runs on daily and weekly cadences, plus a curate rule so a GitHub-trending repo that *is* a skill is filed here instead of under Repos (dedup by repo URL).

Spike the pull in the spec. Candidates, in likely order:

- GitHub search for `SKILL.md` / Agent Skills repos that gained stars (or were pushed) inside the window, ranked by stars gained then total stars.
- Known marketplaces that are themselves GitHub repos (for example `anthropics/skills`, `anthropics/claude-plugins-official`, Addy Osmani's `agent-skills`) when those repos move.
- Do **not** scrape a complete directory or skills.sh-style catalogue into the edition. The tab is "what is moving," like the other four.

A skill is a repo (or a path in a repo) that has a `SKILL.md` with name + description frontmatter. Claude-first; the open Agent Skills format is enough so the same card is useful in Codex and Grok. MCP servers are out of this ticket.

### 2. Category and source keys

Recommended:

- Category `skills`, label **Claude Skills** (side nav, grouped heading, `?c=skills`).
- Source `github` when the row is a GitHub repo, **or** a new source key if the fetcher is not GitHub trending. `SOURCES` must equal `registry.names()`; a new fetcher means both lists, `feed.d.ts`, the app filter list, and a source mark.
- Do **not** bump `schema_version`. The category is additive. The shipped Chrome extension has no category chips in the popup; unknown categories still render in the ranked list. Confirm that in the spec so an old popup does not refuse the edition.

### 3. Card

Same Ledger card as a repo: 40px owner avatar, title, one-line summary, stars (and stars gained), language optional. Source line reads Claude Skills (or GitHub). Star on the card. Share on the card and on the gist: copy the gist URL (`https://aibytes.io/gists/<slug>`), with a Web Share sheet where the browser has one. Install is on the gist, not a second button on the compact card, unless the prototype shows it earns the space.

### 4. Gist kind `skill`

New kind, new sections. Do not reuse `repo` / `try_it`.

| Piece | Role |
|---|---|
| Material | `SKILL.md` (frontmatter + body), README, the install snippets those files actually contain |
| `lede` | What it does, one or two sentences |
| `key_points` | What it covers, when to invoke it, what it will not do |
| `install` | Copyable command(s) taken from the files: Claude Code plugin / `npx skills add` / copy into `.claude/skills` or `.agents/skills`. No command in the material means no `install` section, never an invented one |
| `who_its_for` | Optional, only if the skill states an audience |

`whats_open` stays off this kind. `depth` may still drop to `brief` when `SKILL.md` is thin.

Voice lives in `.claude/skills/write-gists/SKILL.md`; caps in `gist_contract.py`. Fetch of `SKILL.md` belongs in `packages/fetchers`, arranged by `packages/gists`, same split as README-for-repos.

### 5. Weekly

Weekly fetch writes the same snapshot shape under `newsletter/data/.../weeks/week-NN/`. The weekly issue can grow a Claude Skills section (ranked list, gist title links) once the daily tab is real. Weekly `/weekly/issue-N` JSON and its side nav pick up `skills` in the same pass as the daily edition. A week with no skill rows omits the section.

## How we get there

Same flow as a new source + AIB-145y:

1. Prototype the tab, the card (star + share), and the skill gist (install block) on Ledger; record picks in `docs/decisions/product/`.
2. Capability map and module specs under `docs/specs/AIB-…-*.md` (fetch, contract, gist, app, weekly).
3. Fetcher in `packages/fetchers`, thin skill wrapper, `fetch-weekly-items` SkillSpec, daily runner picks it up through the registry.
4. Curate adapter; category in schemas, `validate.py`, `feed.d.ts`, `counts`, hide.py.
5. Gist kind + `install` section + write-gists rules + tests.
6. App: `CATEGORIES`, Sidebar, grouped headings, empty state, share control, weekly builder.
7. Newsletter template / Substack export only after the daily tab ships, or in the same PR if the section is cheap.

## Not in this ticket

- A searchable full catalogue of every published skill.
- Monthly cadence, or backfill of historical skills into old editions.
- User-submitted skills, comments, or ratings beyond star (save) and gist reactions.
- Running a skill in the browser, or a one-click install into the reader's Claude account.
- MCP servers, Cursor rules, or non-`SKILL.md` prompt packs.
- Rewriting the Chrome extension popup to add category chips (AIB-76n froze that surface). Skills still appear in its ranked list.

## Depends on

- Gists (AIB-145y) and saves (AIB-75v), both shipped.
- Daily runner and weekly fetch remaining the only writers of edition / weekly snapshots.

## Checklist

- [ ] Decide fetch source, category/source keys, and skill gist sections (install, key_points, who_its_for) <!-- longclaw:item=ck_d2917654 -->
- [ ] Prototype the Skills tab, card (star + share), and skill gist install block on Ledger; record the picks in a product decision <!-- longclaw:item=ck_daff89c0 -->
- [ ] Capability map and module specs (fetch, contract, gist, app, weekly) <!-- longclaw:item=ck_5a82c082 -->
- [ ] New fetcher in packages/fetchers: daily and weekly cadence only, tests, registry + fetch-weekly-items SkillSpec <!-- longclaw:item=ck_86aa9bcb -->
- [ ] Curate adapter; file GitHub-trending repos that are skills under skills, not repos <!-- longclaw:item=ck_88703595 -->
- [ ] Add category skills (and source if new) to schemas, validate.py, feed.d.ts, counts, hide.py; do not bump schema_version <!-- longclaw:item=ck_31f628af -->
- [ ] Gist kind skill: fetch SKILL.md, install section, write-gists voice, gist_contract tests <!-- longclaw:item=ck_3e4a3e5f -->
- [ ] App: Claude Skills tab, grouped heading, empty state, share gist URL on card and gist <!-- longclaw:item=ck_b3dd4f60 -->
- [ ] Weekly issue JSON, weekly side nav, and newsletter section once the daily tab ships <!-- longclaw:item=ck_e40d02b0 -->
- [ ] Confirm the shipped Chrome extension still renders skill items in the ranked list <!-- longclaw:item=ck_5aff8bf4 -->

## Activity

<!-- longclaw:event
id: evt_681f3e32
kind: create
occurred_at: 2026-11-27T11:47:34.571Z
actor:
  type: agent
  id: grok
  name: grok
-->
### grok created this ticket
<!-- /longclaw:event -->
