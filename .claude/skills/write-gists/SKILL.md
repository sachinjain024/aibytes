---
name: write-gists
description: Write the gists for one aiBytes_ daily edition - the lede and sections of a summary page per new item - from the material in .cache/gists/DATE/draft.json, into .cache/gists/DATE/gists.json. The daily runner's Claude step follows this skill between `gists draft` and `gists build`. Use when asked to write gists, write-gists, or the gist prose for an edition date.
---

# Write gists (aiBytes_)

A gist is one page per edition item: a lede, three to five key points and the
sections its source can support, then buttons to the source. The script has
already decided every fact (slug, title, links, stats, tags, dates). **You
write only the prose: `lede` and `sections`.** You may lower `depth` from
`full` to `brief`; never raise it.

Spec: `docs/specs/AIB-145y-gist-generate.md`. The caps and keys are in
`packages/feed-schema/gist_contract.py`, the block from `TITLE_MAX` to
`WHATS_OPEN_TEXT_MAX`. **Read that block before you start**; this file names
the constants rather than copying their numbers, so it never drifts from the
contract.

## The run

1. Read `.cache/gists/DATE/draft.json`. Work only from its `new` list.
   `repeats` and `skipped` are not yours: the script updates repeats itself.
2. For each entry, write one gist from that entry's `material` and nothing
   else. Not from memory, not from another item, not from the title alone.
3. Write `.cache/gists/DATE/gists.json` (shape below), one key per `item_id`.
   Leave out an item rather than guess: it ships without a gist and the run
   warns.
4. Stop. `gists build` checks everything and publishes.

You have Read, Write and Edit only. Do not fetch anything; if the material is
thin, write `brief`.

## Output shape

```json
{
  "date": "2026-11-11",
  "gists": {
    "<item_id>": { "depth": "full", "lede": "...", "sections": [ ... ] }
  }
}
```

Every entry has `depth`, `lede` and `sections`. A `brief` gist has
`"sections": []`.

## What each depth gets

**`brief`** (the draft says so, or you decide the material cannot carry a
full page): a lede only, written from the entry's `title` and `summary`. Two
sentences at most, nothing the summary does not support.

**`full`**: a lede, then the sections for its `kind`, in the order of
`SECTION_KEYS`. A section with nothing in the material to support it is left
out, never padded. Only `key_points` is required (`KEY_POINTS_MIN` to
`KEY_POINTS_MAX` bullets).

| `kind` | Material you get | Sections allowed (`SECTION_KINDS`) |
|---|---|---|
| `news` | `article` (title, byline, text) | `key_points`, `why_it_matters` |
| `hn` | `article` for a link post, or `self_text`; `comments` (`c1`...) with the first reply | `key_points`, `discussion` |
| `repo` | `description`, `topics`, `readme`, `issues` (`i1`...) | `key_points`, `try_it`, `whats_open` |
| `launch` | `tagline`, `description`, `topics`, `comments` (`c1` is the launch comment), sometimes `site` | `key_points`, `who_its_for`, `pricing` |

Section shapes:

- `key_points`: `{"key": "key_points", "points": ["...", "..."]}`. Each point
  at most `POINT_MAX` characters. What the item is and what is new.
- `why_it_matters` (news): `{"key": "why_it_matters", "text": "..."}`, at most
  `TEXT_CAPS["why_it_matters"]`. One or two sentences for a developer: what
  changes for someone who builds with AI. Only if the article supports it.
- `discussion` (hn): `{"key": "discussion", "points": [{"stance": "...", "text": "...", "comment": "c3"}]}`,
  `DISCUSSION_MIN` to `DISCUSSION_MAX` points, `text` at most
  `DISCUSSION_TEXT_MAX`. `stance` is one of `STANCES`: `agreed` (where
  commenters converge), `disputed` (where they split), `counterpoint` (the
  strongest pushback), `theme` (a recurring topic). Each point names the
  comment that best shows it by its id; the script turns it into the link.
  Describe the thread, not the article. Fewer than `DISCUSSION_MIN` usable
  comments means no `discussion` section.
- `try_it` (repo): `{"key": "try_it", "command": "..."}`, one line, at most
  `TRY_IT_MAX`. Copy the install or run command exactly as the README gives
  it. No README command, no section. This is the one place copying is right.
- `whats_open` (repo): `{"key": "whats_open", "points": [{"text": "...", "issue": "i2"}]}`,
  `WHATS_OPEN_MIN` to `WHATS_OPEN_MAX` points, `text` at most
  `WHATS_OPEN_TEXT_MAX`. Themes across the open issues (a platform gap, a
  requested feature), each naming the issue that shows it best.
- `who_its_for` and `pricing` (launch): `{"key": "...", "text": "..."}`, at most
  `TEXT_CAPS["who_its_for"]` and `TEXT_CAPS["pricing"]`. Only if the
  description, a comment or the site says so. A launch that never mentions
  price gets no `pricing` section.

The lede is `LEDE_MIN` to `LEDE_MAX` characters, one or two sentences that
stand alone: it is also the page's search description and its share preview.

## Writing rules

- **Only what was read.** Every claim traces to this entry's material. No
  numbers, dates, prices, customers or comparisons that are not in it.
- **Summarize, don't copy.** Never reuse a run of twelve or more words from the
  material; `build` warns at that length and rejects the gist at twenty. Put
  it in your own words. A `discussion` point may quote one short sentence from
  its comment, inside quotation marks; prefer paraphrase.
- **Launch comments have no author.** The Product Hunt API hides who wrote
  them. Say "the launch comment" or "the team says"; never name a maker as its
  author. Treat launch copy as marketing: find the mechanism and write that.
- **Length.** A `full` gist is 150 to 300 words across the lede and every
  section. `build` warns outside 120 to 350.
- **The edition's voice.** The voice rules in
  `.claude/skills/curate-edition/SKILL.md` ("The summary") apply: dense,
  calm, technical; say what it does; name names; no hype words; single
  hyphens only, never an em or en dash. Do not restate the stats - the page
  shows them.
- **Don't restate the title as the lede.** The title sits right above it.

## Worked examples

These are invented items; the shapes are real. `build` checks them the same
way it checks yours.

**news, full**

```json
{
  "depth": "full",
  "lede": "Fixture Labs released Wren-3, a 9B open-weight model that runs on a single consumer GPU and matches its 70B predecessor on the company's coding benchmark.",
  "sections": [
    {"key": "key_points", "points": [
      "Wren-3 has 9 billion parameters and ships under the Apache 2.0 licence.",
      "Fixture Labs says it fits in 24 GB of VRAM at 8-bit precision.",
      "On the company's internal coding benchmark it scores within two points of Wren-2 70B.",
      "Weights are on Hugging Face today; a hosted API follows next month."
    ]},
    {"key": "why_it_matters", "text": "A coding model that fits on one consumer card makes local, offline code assistants practical for teams that cannot send source to a hosted API."}
  ]
}
```

**hn, full**

```json
{
  "depth": "full",
  "lede": "A developer's post argues that leaning on AI agents left their codebase harder to change, because nobody on the team fully understood the generated modules.",
  "sections": [
    {"key": "key_points", "points": [
      "The author's team shipped faster for three months, then slowed sharply.",
      "Generated modules duplicated logic that a human would have shared.",
      "The fix was reviewing agent output as strictly as a new hire's code."
    ]},
    {"key": "discussion", "points": [
      {"stance": "agreed", "text": "Most commenters recognise the pattern: speed early, then a costly cleanup once the code has to change.", "comment": "c1"},
      {"stance": "disputed", "text": "Commenters split on whether the tools or the review process are at fault.", "comment": "c3"},
      {"stance": "counterpoint", "text": "One commenter argues human-written code at the same speed would rot the same way.", "comment": "c2"}
    ]}
  ]
}
```

**repo, full**

```json
{
  "depth": "full",
  "lede": "agent-kit is a Python library that turns a test suite into small agents, each owning one failing test until it passes.",
  "sections": [
    {"key": "key_points", "points": [
      "Each agent gets one failing test, the files it touches, and a turn budget.",
      "Runs against any model with an OpenAI-compatible endpoint.",
      "Writes a patch per test rather than editing the tree in place."
    ]},
    {"key": "try_it", "command": "pip install agent-kit"},
    {"key": "whats_open", "points": [
      {"text": "Windows paths break the patch step, the most-discussed open bug.", "issue": "i1"},
      {"text": "Users want a v2 roadmap with parallel agents.", "issue": "i2"}
    ]}
  ]
}
```

**launch, full**

```json
{
  "depth": "full",
  "lede": "Fixture App scores sales leads against your ideal customer profile and drafts the first outreach email for each one.",
  "sections": [
    {"key": "key_points", "points": [
      "Scores companies on hiring, funding and ad-spend signals.",
      "Drafts a first email per lead from the signals that matched.",
      "Syncs scored leads into the CRM the team already uses."
    ]},
    {"key": "who_its_for", "text": "Small sales teams doing outbound without a dedicated research analyst."},
    {"key": "pricing", "text": "The launch comment says there is a free tier of 50 leads a month, with paid plans above it."}
  ]
}
```

**brief** (any kind)

```json
{
  "depth": "brief",
  "lede": "Fixture News reports that a coding-model startup raised a seed round to build evaluation tools for agent workflows.",
  "sections": []
}
```
