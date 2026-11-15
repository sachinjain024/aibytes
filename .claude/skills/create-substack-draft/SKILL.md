---
name: create-substack-draft
description: Create the Substack draft for a finished aiBytes_ weekly issue in the publisher's Chrome (Claude in Chrome) - a new post with the issue's title, subtitle and body pasted with formatting, checked against the issue's section counts, and left unpublished. Use when the user wants to draft, stage, paste or put an issue on Substack - triggers include "draft issue 18 on Substack", "create the Substack draft", "paste the issue into Substack", or "/create-substack-draft". Not for publishing or sending; the publisher does that.
---

# create-substack-draft

Turns a finished, reviewed issue (`newsletter/issues/{yyyy}/week-NN-Issue-N/aiBytes-issue-N.html`,
built by `/generate-newsletter-content`) into a **draft** post on
`newsletter.aibytes.io`, in the publisher's own Chrome with their Substack
sign-in. It never publishes and never sends email.

The body comes from the same converter as the Substack export and the review
artifact (`generate-newsletter-content/scripts/substack_export.py`), so the
draft is exactly what was reviewed. Edits still go through the issue HTML;
if the issue changes after the draft exists, re-run from step 1 into the same
draft (select all in the body, paste again).

## Steps

1. **Stage it.** From the repo root:

   ```bash
   python3 .claude/skills/create-substack-draft/scripts/stage_draft.py \
     --issue newsletter/issues/{yyyy}/week-NN-Issue-N/aiBytes-issue-N.html
   ```

   It prints `title`, `subtitle` and `counts` as JSON and puts the body on
   the macOS clipboard as HTML. A real cmd+v of that clipboard is the only
   paste that worked: a synthetic paste event or a `fetch` from the page to a
   local server does not (Chrome blocks the local-network call).

2. **Open a new post.** Load the Chrome tools (`/chrome-browser`), take tab
   context, open a new tab, and go to
   `https://newsletter.aibytes.io/publish/post?type=newsletter`. It redirects
   to `/publish/post/{id}`; note the id.

3. **Title and subtitle.** Find the fields with `find` and click them **by
   ref**, not by coordinate: a long title wraps and pushes the subtitle down,
   so a coordinate click lands inside the title (Issue 18). Type the JSON's
   `title`, then `subtitle`. Check both with JS:
   `[...document.querySelectorAll('textarea')].map(t=>[t.placeholder,t.value])`.
   Substack turns `'` into `’` in the subtitle; that is expected.

4. **Body.** Click the body field ("Start writing...") by ref and press
   cmd+v. Wait a few seconds, then check the editor (`.ProseMirror`): the
   `h2`s are the issue's sections in order, the `ol` lengths match `counts`
   for the ranked sections, the first line is the greeting, the last line is
   the sign-off, and the pull quote and the announcement posts are
   blockquotes.

5. **Confirm it saved and stop.** The toolbar button reads **Saved**, and
   `fetch('/api/v1/drafts/{id}')` shows the title and subtitle with
   `is_published: false` and `email_sent_at: null`. Do not press Continue,
   Publish, or Send. Leave the tab open on the draft for the publisher.

6. **Record it.** Comment the draft URL
   (`https://newsletter.aibytes.io/publish/post/{id}`) on the issue's LongClaw
   ticket, and tell the publisher what is left for them: the hero thumbnail,
   the subscribe button, and the send, which goes out only after
   `aibytes.io/weekly/issue-{num}` is live (see generate-newsletter-content
   step 7).

## Rules

- **Never publish or send.** The publisher clicks Publish. If they ask
  Claude to publish, that is a separate, explicit request each time.
- **One draft per issue.** If a draft for this issue already exists (Substack
  → Posts → Drafts), update it rather than opening a second one.
- **Don't type the body.** Typing loses links and list structure; only the
  staged clipboard paste keeps the formatting.
- The clipboard step overwrites what the publisher has copied; say so when
  you hand back.
