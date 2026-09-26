---
name: x-fetch-items
description: Save the week's most-engaged AI posts on X, gathered by hand in Grok, as a weekly JSON snapshot under newsletter/data/yyyy/mm/weeks/week-NN/x/x_data.json, then shortlist the posts for the newsletter's Loudest on X and Official Announcements sections. Use when the user wants to add, paste, save, or shortlist X / Twitter posts, tweets, or Grok output for the newsletter, or asks for the Grok prompt.
---

# x-fetch-items

Unlike the other fetch skills, this one can't call an API. X data comes from
Grok (the publisher has X Premium), so the run has a manual step in the
middle. The skill hands over the prompt, waits for the publisher to paste
Grok's JSON, then saves the file and shortlists the posts.

One Grok run feeds two sections. **Loudest on X** gets practical posts for
builders (`insight`), and **Official Announcements** gets releases,
benchmarks, and pricing news from AI companies (`announcement`).

The data contract, which covers every field, the shortlist rules, and the
verbatim rule, is in `references/x-data.md`. Read it before touching the data.

## Workflow

All steps use one script, run from the repo root. `--date` is the snapshot
date, the last day of the week covered, and decides the `week-NN` folder.
Use the same date as that issue's other snapshots.

```bash
S=.claude/skills/x-fetch-items/scripts/x_items.py
python3 $S prompt    --date 2026-09-26
python3 $S save      --date 2026-09-26 --input paste.txt     # or --input - to read stdin
python3 $S move      --date 2026-09-26 URL... --to announcement
python3 $S shortlist --date 2026-09-26 --insight URL... --announcement URL...
```

Every command also takes `--output-root DIR` (default `newsletter/data`).

1. **Hand over the prompt.** Run `prompt` and give the publisher its output.
   If they run a saved Grok task instead, skip ahead.
2. **Wait for the paste.** Don't guess or fetch X data any other way. If the
   publisher has no X data this week, stop here. The issue simply has neither
   section.
3. **Save it.** Write the paste to a scratch file exactly as given, fences and
   tables included, and run `save`. The script checks the paste against
   `references/x-data.md`:
   - **Errors** mean the paste breaks the contract's shape: a missing field, a
     value that isn't allowed, a URL that doesn't match its author, a quote
     post without `quoted_post`. Nothing is saved. Tell the publisher what's
     wrong and ask for a re-run or a fixed paste.
   - **Warnings** are content problems: dates outside the week, under 500
     likes, `t.co` links, text ending in ":" with no `link_url`, very long
     posts, lists out of likes order, or posts listed twice. The file is
     saved. Report each one to the publisher. **Never edit `text`.**
4. **Re-file misplaced posts.** Read both lists. Run `move` on any post in the
   wrong bucket, such as a feature launch filed as an insight or a reaction
   filed as an announcement. The script re-ranks both buckets.
5. **Propose the shortlists** by the steps in `references/x-data.md`:
   5 insights (top by likes, one per account, at most 2 from company
   accounts) and 3–5 announcements (top by likes, one launch per company).
   Show the publisher both lists with a one-line reason for each post, plus
   what was dropped and why. Wait for them to confirm or give their own picks.
6. **Check the picks on X.** Open each shortlisted post in the publisher's
   Chrome (Claude in Chrome) and compare the author, text, and date. A post
   whose link doesn't open is dropped. Where Grok's `text` or `posted_at`
   differs, correct the snapshot to what X shows. Don't change the counts.
   They are Grok's, as of `fetched_at`.
7. **Record the picks** with `shortlist`. It warns when a pick breaks a rule
   (list size, one per account, the company cap, wrong bucket). The
   publisher's choice wins, so a warning doesn't block it.

`/generate-newsletter-content` reads only the `shortlist`ed posts. A file
with no `shortlist` has not been reviewed yet.

It never types the posts itself. `render` prints them as newsletter HTML,
word for word: `--format html` for the issue template, `--format beehiiv` for
the export page, one `--section` (`announcements` or `loudest`) per slot.
`verify --issue ... --export ...` then checks the built issue carries every
shortlisted post unchanged and in order, and fails if anything was retyped.
