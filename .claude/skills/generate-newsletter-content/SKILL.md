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

### 2. Determine the send date, week number, and issue number

**aiBytes_ goes out to subscribers on Monday morning.** Everything dated flows from the send Monday, never from the day you happen to be building the issue.

- `issue_date`: the Monday it sends. Today if today is a Monday; otherwise the upcoming Monday, unless the user names a date. Fills `{{DATE_ISO}}`.
- `weekday`: **always `Monday`.** Fills `{{WEEKDAY}}` in the intro's welcome line. Do not run `date +%A` for this - building an issue on a Wednesday would ship "Wednesday-morning" to a Monday list. Only change it if the user says this particular issue sends on a different day.
- `yyyy` and `week_num`: the year and ISO week **of `issue_date`**, not of today: `date -j -f "%Y-%m-%d" "<issue_date>" "+%G %V"`. This matters most on a Sunday, where today's week number is one behind the issue's.
- `num` (issue number): count existing folders under `newsletter/` across all years and add 1. If none exist, it's issue 1. The user can override any of these.

### 3. Build the HTML from the template

Copy `assets/template.html` and replace every `{{TOKEN}}`. The template is the complete, styled v3 design - do not alter its CSS, fonts, or structure; only fill content. Key conventions, visible in the template's inline examples:

- **Masthead**: the logo line reads `⚡ aiBytes_ #{num}` - the brand is always written "aiBytes_" (lowercase a, capital B, trailing underscore), and the issue number must match the auto-incremented `num` from step 2. There is deliberately no TL;DR summary block and no separate issue-header rule; the intro block opens the issue right after the masthead.
- **Intro block**: the publisher talking to the reader - four short paragraphs, warm and first-person. Never quote a comment, upvote, or star count anywhere in the intro: it argues, the item rows carry the receipts (write "set off the loudest argument of the week", not "drew 1,746 comments").
  1. **Greeting** - fixed copy: `Good morning, builders 👋`, rendered in ink via `class="greet"`. "builders" is the standing name for the audience; never swap it issue to issue.
  2. **Welcome + hook** - opens with the standing line `Welcome back to your Monday-morning dose of aiBytes_.` (the newsletter always lands Monday morning, per step 2), then a **first-person hook**: the thing that surprised you while assembling the issue, told as a small story - "I had this issue half-written as a price-cut roundup - three labs, three cheaper models, tidy week. Then Anthropic published that its own models had breached three companies…". Past tense, publisher's voice, one light emoji allowed. It has to be a genuine turn in the week; if the week had none, state the week's shape plainly rather than manufacturing a reversal.
  3. **Storyline** - a `<b>`-led sentence naming the thread that connects the week's items (one inline link allowed).
  4. **Today** - `<b>Today:</b>` plus a comma-joined menu of what's below, in reading order, four or five clauses ending on the lightest one ("…and seven repos worth your weekend."). This is the closer: there is no "Let's dive in." sign-off any more.

  The hook should make skipping the issue feel expensive; the storyline should make the item list feel inevitable rather than miscellaneous; the Today line should make the scroll feel worth starting.
- **News items**: emoji + bold linked headline + one-line context + `<span class="src">(Source)</span>`. The source here is a plain text label, not a link. Mark the single biggest story with `<span class="hot">Story of the week</span>`.
- **Quote block**: the callout text only. No attribution line, no `- aiBytes_` under it. It is the issue talking to itself, so signing it reads like a stranger.
- **Closing block** (`.tldr`, "One idea to carry next week"): a butter panel (`--butter #FFF6D9`, hairline `--butter-line #F0E2AE`, label in `--amber #8A6A00`), never a dark slab. The notched corner is the signature and stays. The idea text is weight **500**, not bold - the only emphasis is the pivotal word, wrapped in `<b>` so it picks up the signal-yellow highlight that the "Story of the week" badge uses. Email drops the notch, so the fill and hairline carry the shape there.
- **Launches / Trending on GitHub / HN rows**: emoji, bold linked name, hyphen, description, right-aligned stat (`▲ upvotes`, `+N.Nk ★`, `N pts`). Engagement numbers belong here and in the news rows - never in the intro.
- **Issue tag**: `ISSUE 0x{num in hex, 2 digits} · TL;DR` and date + estimated read time.

**Where each row's links point.** A row has one destination link (the thing the reader wants) and, for two of the sections, a trailing attribution link:

| Section | Bold name links to | Trailing link |
|---|---|---|
| News for devs | the article | none, `(Source)` is a plain label |
| Launches | the product's **own website** | `(ProductHunt)` to the launch page |
| Trending on GitHub | the repo | none, the name is already the source |
| HN Deep Cuts | the **article**, not the thread | `(HackerNews)` to the thread |

Attribution links use the same `<span class="src">` styling as the news source, with only the word inside the anchor: `<span class="src">(<a href="...">HackerNews</a>)</span>`. They render **grey with a hairline underline**, never cobalt - they are a quiet second door, and the bold name link stays the loud one. In the Beehiiv export that means `style="color:#6B7080;text-decoration:underline;"` on the anchor.

**Product Hunt websites need resolving.** The API's `website` and `productLinks` fields only ever return a `producthunt.com/r/...` redirect, never the product's real domain, and that redirect returns 403 to curl. Get the real URL by fetching the launch page (`https://www.producthunt.com/products/{slug}`) and reading the "Visit website" link out of it. Use that resolved domain for the bold name link.

**Link URLs stay clean.** Every link is the plain canonical URL, with no tracking or referral parameters appended - no `ref`, no `utm_*`. Strip any tracking params the source data carries (the Product Hunt API adds `utm_campaign`, `utm_medium` and `utm_source` to its links) before putting a URL in the issue.

Match the template's tone: terse, builder-focused, no hype words. The intro is the one place the voice warms up - it greets the reader and speaks as "I"; everything below it stays clipped.

**Punctuation: single hyphens only.** Never emit an em dash (`—`) or en dash (`–`) anywhere in the output - not in prose, not between a name and its description, not in ranges. Use a spaced hyphen (` - `) where a dash is needed and a plain hyphen in ranges (`5-7 items`). This applies to the issue HTML, the Beehiiv export, and the title/description fields.

### 4. Write the post title and description

The title becomes the email subject line; the description becomes the preview/subtitle text - together they decide whether the issue gets opened, so write them from the week's strongest hooks, not generically.

- **Title**: `{emoji} {hook one} and {hook two}` - a single leading emoji, then the hooks (e.g. "📚 Amazon pulps rare books and Cursor fights GitHub" for a week whose lead story was Amazon pulping books). The emoji is not fixed: derive it from the issue's content, usually the story of the week or the first hook - the same instinct that picks each news row's emoji picks this one, and the story-of-week row's emoji is often the right answer. A standing brand emoji that never changes carries no information, so never fall back to one. No `aiBytes_` prefix and no issue number - the masthead and issue tag inside the issue carry those. Sentence case, concrete specifics, ≤ ~62 characters.

  **Spend the opening on content, not chrome.** A mobile inbox shows roughly 35 to 40 characters of subject line, and Beehiiv already prints "aiBytes_" in the sender field, so the subject carries no brand prefix and no issue number - the leading emoji is the only thing before the first hook, and it earns that spot by pointing at the lead story rather than repeating the brand. No `#`, no colon, no ` - ` separator, and write "and" rather than `&`. Two hooks, not three - the third never survives truncation.

- **Description**: one sentence that **starts with "Plus"** and names 2-3 things the title does not. It extends the title, it never restates it. Never "Catch up on …", which only ever paraphrases the subject line back at the reader.

  Check it against the intro's **Today:** line too, not just the title. Those are the issue's other menu, so pulling from the same four items three times is the same repetition in a different place. Reach for what neither one mentions: a launch, a repo, an HN thread, or the closing question.

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

Then check the links specifically: no URL carries a `ref` or `utm_*` parameter, no launch name still points at a `producthunt.com/r/` redirect, every HN deep cut name points at the article rather than the thread, and the quote block has no attribution line. Strip the template's fill-in comments from both output files before saving.

Finally read the title, the description, and the intro's **Today:** line back to back. The description must share no item with either of the other two; if it does, rewrite the description, since it is the one that has to earn its space. The title and the Today line may overlap freely - one is deciding whether to open, the other is deciding where to start reading.
