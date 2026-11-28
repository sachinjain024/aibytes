---
name: proj-fetch-from-x
description: Grok only. Pull this week's AI posts from X with native X search, save x_data.json, and write Insights and Announcements markdown tables in x_review.md so the publisher can pick Viral on X and Official Announcements. Use when the user runs /proj-fetch-from-x, or asks to fetch X / Twitter items, tweets, Viral on X, or Official Announcements for the weekly newsletter. Other agents must not run this skill — they have no X search; send the publisher to Grok or to /proj-generate-prompt-x-items.
compatibility: grok
---

# proj-fetch-from-x

**Grok only.** This skill needs Grok's native X tools (`x_keyword_search`,
`x_semantic_search`, `x_thread_fetch`). If you do not have those tools, stop
and tell the publisher to run `/proj-fetch-from-x` in Grok, or to paste JSON
through `/proj-generate-prompt-x-items`.

Search X for the week, save the snapshot, and write markdown tables the
publisher reads to pick. Do not shortlist until they confirm both buckets.

The data contract is
`.claude/skills/proj-generate-prompt-x-items/references/x-data.md`.
The search rules (audience, buckets, 500 likes, originals only, verbatim
`text`, no invented URLs) are in
`.claude/skills/proj-generate-prompt-x-items/references/grok-prompt.md`.
Read both before searching. The CLI is the prompt skill's script:

```bash
S=.claude/skills/proj-generate-prompt-x-items/scripts/x_items.py
python3 $S prompt --date 2026-11-27          # prints the week's window
python3 $S save   --date 2026-11-27 --input /tmp/x-paste.json
python3 $S review --date 2026-11-27 --insight URL... --announcement URL...
python3 $S move   --date 2026-11-27 URL... --to announcement
python3 $S title  --date 2026-11-27 URL --text "A 2-line newsletter title"
python3 $S shortlist --date 2026-11-27 --insight URL... --announcement URL...
python3 $S emoji  --date 2026-11-27 URL EMOJI [URL EMOJI ...]
```

`--date` is the snapshot date (same as the week's other fetches). The files
land at `newsletter/data/{yyyy}/{mm}/weeks/week-NN/x/x_data.json` and
`x_review.md`.

## Workflow

1. **Confirm you are Grok with X tools.** If not, stop.
2. **Resolve the window.** Run `prompt --date` (or compute it): 7 days,
   `after` inclusive, `before` exclusive, ending on `--date`. Use the same
   date as `github/gh_data.json` for this issue.
3. **Search X.** Keyword search, Latest mode, `min_faves:500`,
   `-filter:replies`, `since:AFTER` `until:BEFORE`. Cover:
   - Official accounts named in the Grok prompt (OpenAI, Anthropic / Claude
     accounts, Google / Gemini, Meta, xAI / Grok, NVIDIA, Mistral, Cursor,
     Hugging Face, and similar staff/dev-rel accounts).
   - Builder posts: coding agents, evals, local models, cost/latency numbers,
     harness tips, open-source tools.
   Drop replies, quote-spam, engagement bait, crypto, profanity, consumer-only
   content. A launch belongs in announcements even when a staff account posted
   it. Rank each bucket by likes, cap at 10 announcements and 20 insights.
4. **Hydrate every post you will save.**
   - `x_thread_fetch` when the search snippet is truncated.
   - Expand every `t.co` (curl `-sI` / Location) to the destination URL.
     `text` never contains `t.co`.
   - If the post has a link card or ends in "Read more:" / ":", set
     `link_url`. Image-only photo cards with no article stay `null`.
   - Quote posts need `quoted_post`. Skip a post whose URL you did not
     retrieve. Never invent a URL or a like count.
5. **Write JSON and save.** Build `{announcements, insights}` exactly as
   `grok-prompt.md` specifies, write it to a scratch file, and run `save`.
   Report errors (nothing saved) or warnings (file written). Run `move` on
   anything in the wrong bucket.
6. **Title long posts.** Every post over 600 characters gets a 2-line
   `newsletter_title` — a headline the newsletter can print, not the tweet
   restated. Example: "A funny but realistic story of How PRs were merged in
   2022 vs 2026". Set with `title`. Never edit `text`.
7. **Hand over `x_review.md`.** `save` already wrote it. Point the publisher
   at that file: two tables (Insights, Announcements), columns Pick / # /
   Author + likes / What, full tweet in What. They pick from the tables.
   Tick in-progress picks with `review --insight URL... --announcement URL...`.
   Propose a shortlist only if they ask; their ranks win.
8. **After both buckets are confirmed**, run `shortlist` then `emoji` for
   the five insights. Do not generate the newsletter in this skill.

## X-tool pitfalls

- `from:grok` is mostly replies and spam; skip it.
- `filter:replies` in Latest mode on builder accounts returns replies —
  always negate it (`-filter:replies`).
- Semantic search returns low-engagement posts; it is a supplement, not the
  ranking.
- A 280-character search snippet is not `text`. Fetch the thread.
- NVIDIA / similar image-only posts with a photo `t.co` and no article are
  not announcements.

## After this skill

`/generate-newsletter-content` reads only `shortlist`. The review markdown is
for the publisher; it is not the issue.
