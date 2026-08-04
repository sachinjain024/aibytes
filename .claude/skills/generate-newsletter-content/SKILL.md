---
name: generate-newsletter-content
description: Generate the weekly "aiBytes_" (AI Bytes) newsletter as a styled HTML file from raw content in the data/ directory. Use this skill whenever the user wants to create, build, or generate a newsletter issue - triggers include "generate the newsletter", "create this week's issue", "build aiBytes", "make the newsletter html", or any mention of turning collected news/launches/repos/HN links into the newsletter. Also use when the user drops files into data/ and asks to "process" or "publish" them, or wants Beehiiv-ready snippets or copy-paste blocks for pasting sections into the Beehiiv editor.
---

# Generate Newsletter Content (aiBytes_)

Turn raw weekly material in `data/` into a finished aiBytes_ issue - a single self-contained HTML file in the v3 "TL;DR" design - saved under `newsletter/{yyyy}/week-{week_num}-Issue-{num}/`.

## Workflow

### 1. Read the raw data

Read every JSON file in the `data/` directory of the working folder (ask the user to connect a folder if none is). Each file holds content fetched from one source - Product Hunt, TechCrunch, HackerNews, GitHub Trending, etc. - usually identifiable from the filename (e.g. `producthunt.json`, `hackernews.json`). Field names vary by source and fetcher, so inspect each file's shape rather than assuming a schema; pull out title, URL, description, and the source's popularity metric (upvotes, points, stars). Then curate - don't dump everything. Rank by the popularity metric and relevance to AI builders, and map sources to the newsletter's buckets:

- **News for devs** (5-7 items) - TechCrunch stories plus major HackerNews news items
- **Launches** (top ~5) - Product Hunt, with upvote counts
- **Trending on GitHub** (top ~7) - GitHub repositories, with star growth
- **HN Deep Cuts** (top ~5) - HackerNews posts that are interesting but aren't headline news, with points/comments
- **Quote / closing idea** - a pull-quote and one takeaway thought (write these yourself from the week's themes if the data doesn't include them)

If a bucket has no data at all, omit that section from the output rather than inventing items. Never fabricate links, upvote counts, or star numbers - only use what's in the data.

### 2. Determine year, week number, and issue number

- `yyyy`: current year (or a date the user names).
- `week_num`: ISO week number - `date +%V` in bash.
- `weekday`: the issue date's day name - `date +%A`, or `date -j -f "%Y-%m-%d" "<date>" "+%A"` for a date the user names. Fills `{{WEEKDAY}}` in the intro's welcome line, so it must be the day the issue actually goes out.
- `num` (issue number): count existing folders under `newsletter/` across all years and add 1. If none exist, it's issue 1. The user can override any of these.

### 3. Build the HTML from the template

Copy `assets/template.html` and replace every `{{TOKEN}}`. The template is the complete, styled v3 design - do not alter its CSS, fonts, or structure; only fill content. Key conventions, visible in the template's inline examples:

- **Masthead**: the logo line reads `⚡ aiBytes_ #{num}` - the brand is always written "aiBytes_" (lowercase a, capital B, trailing underscore), and the issue number must match the auto-incremented `num` from step 2. There is deliberately no TL;DR summary block and no separate issue-header rule; the intro block opens the issue right after the masthead.
- **Intro block**: the publisher talking to the reader - four short paragraphs, warm and first-person. Never quote a comment, upvote, or star count anywhere in the intro: it argues, the item rows carry the receipts (write "set off the loudest argument of the week", not "drew 1,746 comments").
  1. **Greeting** - fixed copy: `Good morning, builders 👋`, rendered in ink via `class="greet"`. "builders" is the standing name for the audience; never swap it issue to issue.
  2. **Welcome + hook** - opens with the standing line `Welcome back to your {weekday}-morning dose of aiBytes_.` (`{weekday}` from step 2, so it names the real send day), then a **first-person hook**: the thing that surprised you while assembling the issue, told as a small story - "I had this issue half-written as a price-cut roundup - three labs, three cheaper models, tidy week. Then Anthropic published that its own models had breached three companies…". Past tense, publisher's voice, one light emoji allowed. It has to be a genuine turn in the week; if the week had none, state the week's shape plainly rather than manufacturing a reversal.
  3. **Storyline** - a `<b>`-led sentence naming the thread that connects the week's items (one inline link allowed).
  4. **Today** - `<b>Today:</b>` plus a comma-joined menu of what's below, in reading order, four or five clauses ending on the lightest one ("…and seven repos worth your weekend."). This is the closer: there is no "Let's dive in." sign-off any more.

  The hook should make skipping the issue feel expensive; the storyline should make the item list feel inevitable rather than miscellaneous; the Today line should make the scroll feel worth starting.
- **News items**: emoji + bold linked headline + one-line context + `<span class="src">(Source)</span>`. Mark the single biggest story with `<span class="hot">Story of the week</span>`.
- **Launches / Trending on GitHub / HN rows**: emoji, bold linked name, hyphen, description, right-aligned stat (`▲ upvotes`, `+N.Nk ★`, `N pts`). Engagement numbers belong here and in the news rows - never in the intro.
- **Issue tag**: `ISSUE 0x{num in hex, 2 digits} · TL;DR` and date + estimated read time.

Match the template's tone: terse, builder-focused, no hype words. The intro is the one place the voice warms up - it greets the reader and speaks as "I"; everything below it stays clipped.

**Punctuation: single hyphens only.** Never emit an em dash (`—`) or en dash (`–`) anywhere in the output - not in prose, not between a name and its description, not in ranges. Use a spaced hyphen (` - `) where a dash is needed and a plain hyphen in ranges (`5-7 items`). This applies to the issue HTML, the Beehiiv export, and the title/description fields.

### 4. Write the post title and description

The title becomes the email subject line; the description becomes the preview/subtitle text - together they decide whether the issue gets opened, so write them from the week's strongest hooks, not generically.

- **Title**: sentence case, concrete specifics joined loosely - the working format is `aiBytes_ #{num} - {hook one}, {hook two} & {hook three}` (e.g. "aiBytes_ #1 - IMO medals, a $1.1B eval bet & the EU's consent question"). Keep it ≤ ~70 characters so it doesn't truncate in inboxes; drop the third hook if needed.
- **Description**: one sentence, "Catch up on …" style, naming 2-3 things from the issue in plain words.

Fill `{{EMAIL_SUBJECT}}` and `{{EMAIL_DESCRIPTION}}` in the main template (`<title>` and meta description) and in the export page's title panel.

### 5. Build the Beehiiv export

The user publishes on Beehiiv, whose HTML Snippet block strips `<style>` tags - so the main file's CSS classes won't survive a paste. Alongside the main HTML, always generate a second file: a copy-paste export page.

For each section of the issue (masthead, intro, news card, launches, Trending on GitHub, HN deep cuts, closing idea), rebuild the content as an email-safe snippet - inline styles only, `<table>` layout, no flexbox/clip-path/classes. The exact pattern for every section is in `references/beehiiv-patterns.html`; read it and fill the tokens with the same content as the main file.

Then take `assets/beehiiv-export-template.html` and fill its tokens: `{{PART1_HTML}}` with the merged snippets for masthead + intro + news card, `{{PART2_HTML}}` with launches + Trending on GitHub + HN deep cuts + closing idea (sections joined by a blank line, in reading order), plus `{{EMAIL_SUBJECT}}`, `{{EMAIL_DESCRIPTION}}`, and `{{ISSUE_NUM}}`. The page shows the title panel, then exactly two copy buttons - Part 1 and Part 2 - each with a live preview. Two parts rather than one because the user pastes native Beehiiv blocks (subscribe form, ads, polls) between them.

### 6. Save the output

Write both files to:

```
newsletter/{yyyy}/week-{week_num}-Issue-{num}/aiBytes-issue-{num}.html
newsletter/{yyyy}/week-{week_num}-Issue-{num}/aiBytes-beehiiv-export-issue-{num}.html
```

Create the directories if they don't exist. Then present both files to the user and, if an artifact/preview mechanism is available, render the main issue so they can see it immediately.

### 7. Verify

Open both generated files and check: no `{{` tokens remain, every link came from the data, sections with no data were removed cleanly (including their `sec-head`), the hex issue number matches the decimal one, the title/description are filled in both files, and the export page contains no `<style>`-dependent markup inside its textareas (inline styles only) with content matching the main file section for section.
