---
name: proj-generate-prompt-x-items
description: Print the Grok prompt for this week's Viral on X and Official Announcements posts, then save a pasted JSON snapshot, write the publisher's review tables, and shortlist their picks. Use when the user runs /proj-generate-prompt-x-items, wants the Grok paste prompt, or pastes Grok's X JSON. Prefer /proj-fetch-from-x when running as Grok with native X search.
---

# proj-generate-prompt-x-items

Print the Grok prompt, wait for a paste, save `x_data.json`, and write
`x_review.md` so the publisher can pick. Use this when you cannot search X
yourself. **Grok should run `/proj-fetch-from-x` instead**, which pulls the
posts and writes the same two files.

The data contract is `references/x-data.md`. Read it before touching the data.
The CLI is shared with `/proj-fetch-from-x`:

```bash
S=.claude/skills/proj-generate-prompt-x-items/scripts/x_items.py
python3 $S prompt    --date 2026-09-26
python3 $S save      --date 2026-09-26 --input paste.txt     # or --input - to read stdin
python3 $S review    --date 2026-09-26 --insight URL... --announcement URL...
python3 $S move      --date 2026-09-26 URL... --to announcement
python3 $S title     --date 2026-09-26 URL --text "A 2-line newsletter title"
python3 $S shortlist --date 2026-09-26 --insight URL... --announcement URL...
python3 $S emoji     --date 2026-09-26 URL EMOJI [URL EMOJI ...]
```

Every command also takes `--output-root DIR` (default `newsletter/data`).
`--date` is the snapshot date, the last day of the week covered, and decides
the `week-NN` folder. Use the same date as that issue's other snapshots.

## Workflow

1. **Hand over the prompt.** Run `prompt` and give the publisher its output.
   If they run `/proj-fetch-from-x` instead, stop here and follow that skill.
2. **Wait for the paste.** Don't guess or fetch X data any other way. If the
   publisher has no X data this week, stop here. The issue simply has neither
   section.
3. **Save it.** Write the paste to a scratch file exactly as given, fences and
   tables included, and run `save`. The script checks the paste against
   `references/x-data.md`:
   - **Errors** mean the paste breaks the contract's shape. Nothing is saved.
     Tell the publisher what's wrong and ask for a re-run or a fixed paste.
   - **Warnings** are content problems: dates outside the week, under 500
     likes, `t.co` links, text ending in ":" with no `link_url`, very long
     posts, a long post with no `newsletter_title`, lists out of likes order,
     or posts listed twice. The file is saved. Report each one.
     **Never edit `text`.**
   - `save` also writes `x_review.md` beside `x_data.json`.
4. **Re-file misplaced posts** with `move`. The script re-ranks both buckets
   and refreshes `x_review.md`.
5. **Title the long posts.** Any post over 600 characters needs a 2-line
   `newsletter_title` (a headline, not a paraphrase of the whole tweet). Set
   it with `title`. The newsletter row shows that title; `text` stays
   verbatim in the snapshot and the gist.
6. **Hand the publisher `x_review.md`.** They pick 5 insights (one per
   account, at most 2 company) and 3–5 announcements (one launch per
   company). Tick their in-progress picks with `review --insight URL...`
   `--announcement URL...` so the tables stay marked. Do not run `shortlist`
   until they confirm both buckets.
7. **Record the picks** with `shortlist`, then give each insight its emoji
   with `emoji`. The publisher's choice wins; a rule break is a warning.

`/generate-newsletter-content` reads only the `shortlist`ed posts. A file
with no `shortlist` has not been reviewed yet.

`render` / `verify` are unchanged: `--format html` for the issue template,
`--format substack` for the Substack export, `--issue-slug issue-N` so the
rows link to the week's gists.
