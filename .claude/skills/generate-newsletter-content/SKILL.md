---
name: generate-newsletter-content
description: Generate the weekly "aiBytes_" (AI Bytes) newsletter as a styled HTML file from raw content in the data/ directory. Use this skill whenever the user wants to create, build, or generate a newsletter issue - triggers include "generate the newsletter", "create this week's issue", "build aiBytes", "make the newsletter html", or any mention of turning collected news/launches/repos/HN links into the newsletter. Also use when the user drops files into data/ and asks to "process" or "publish" them, or wants Beehiiv-ready snippets or copy-paste blocks for pasting sections into the Beehiiv editor.
---

# Generate Newsletter Content (aiBytes_)

Turn raw weekly material in `newsletter/data/` into a finished aiBytes_ issue - a single self-contained HTML file in the v3 "TL;DR" design - saved under `newsletter/issues/{yyyy}/week-{week_num}-Issue-{num}/`.

## Workflow

### 1. Read the raw data

Read every JSON file in the `newsletter/data/` directory of the working folder (ask the user to connect a folder if none is). Each file holds content fetched from one source - Product Hunt, TechCrunch, HackerNews, GitHub Trending, etc. - usually identifiable from the filename (e.g. `producthunt.json`, `hackernews.json`). Field names vary by source and fetcher, so inspect each file's shape rather than assuming a schema; pull out title, URL, description, and the source's popularity metric (upvotes, points, stars). Then curate - don't dump everything. Rank by the popularity metric and relevance to AI builders, and map sources to the newsletter's buckets:

- **My Favourite Picks** (3-5 items) - the publisher's own shortlist, pulled from any of the buckets below. This one is **not derived from the data**: ask the user for their picks, or carry forward the picks they last gave. Omit the section entirely if they have none for the week.
- **AI News** (5-9 items) - TechCrunch stories plus major HackerNews news items, **minus any story that Official Announcements carries** (see below). Seven is the usual size; go up to nine when the extra stories earn it rather than cutting one that does (issue #11 ran nine).
- **Official Announcements** (3-5 posts) and **Viral on X** (5 posts) - both from the week's `x/x_data.json`, and **opt-in**: use them only when that file exists **and has a `shortlist`**. A file without one hasn't been reviewed; run `/x-fetch-items` first or leave both sections out. Read only the shortlisted posts, in the shortlist's order: `shortlist.announcement` for Official Announcements, `shortlist.insight` for Viral on X, each URL looked up in `posts`.

  **Official Announcements is also a per-issue call.** Ask the publisher whether this issue carries the card; issue #11 went without it. When it is left out, the week's launches go back into AI News as ordinary news rows, linked to the company's own launch page (or the post on X), and can be the story of the week. Never pick other posts from the pool yourself. The contract is `.claude/skills/x-fetch-items/references/x-data.md`.
- **New AI Products** (top ~5) - Product Hunt, with upvote counts
- **Trending Github Projects** (top ~7) - GitHub repositories, with star growth
- **HN Deep Stories** (top ~5) - HackerNews posts that are interesting but aren't headline news, with points/comments
- **Quote** - a pull-quote in the news card (write it from the week's themes if the data does not include one)

**A launch lives in one place.** When a shortlisted announcement covers a story (Opus 5.5, GPT-6 Sol), AI News drops that story, even if it was the week's biggest; the story of the week then goes to the best remaining news item. The intro may still mention the launch.

If a bucket has no data at all, omit that section from the output rather than inventing items. Never fabricate links, upvote counts, or star numbers - only use what's in the data.

### 2. Determine the send date, week number, and issue number

**aiBytes_ goes out to subscribers on Monday morning.** Everything dated flows from the send Monday, never from the day you happen to be building the issue.

- `issue_date`: the Monday it sends. Today if today is a Monday; otherwise the upcoming Monday, unless the user names a date. Fills `{{DATE_ISO}}`.
- `yyyy` and `week_num`: the year and ISO week **of `issue_date`**, not of today: `date -j -f "%Y-%m-%d" "<issue_date>" "+%G %V"`. This matters most on a Sunday, where today's week number is one behind the issue's.
- `num` (issue number): count existing folders under `newsletter/issues/` across all years and add 1. If none exist, it's issue 1. The user can override any of these.

### 3. Build the HTML from the template

Copy `assets/template.html` and replace every `{{TOKEN}}`. The template is the complete, styled v3 design - do not alter its CSS, fonts, or structure; only fill content. Key conventions, visible in the template's inline examples:

- **Masthead**: the logo line reads `⚡ aiBytes_ #{num}` - the masthead brand is written "aiBytes_" (lowercase a, capital B, trailing underscore), and the issue number must match the auto-incremented `num` from step 2. There is deliberately no TL;DR summary block and no separate issue-header rule; the intro block opens the issue right after the masthead.
- **Intro block**: the publisher talking to the reader - four short paragraphs, warm and first-person. Never quote a comment, upvote, or star count anywhere in the intro: it argues, the item rows carry the receipts (write "set off the loudest argument of the week", not "drew 1,746 comments").
  1. **Greeting** - fixed copy: `Hello, builders 👋`, rendered in ink via `class="greet"`. "builders" is the standing name for the audience; never swap it issue to issue.
  2. **Welcome + hook** - opens with the standing line `Welcome back to your weekly dose of AI Bytes.`, then a **first-person hook** in two beats: **the surprise stated as a reaction, then the story that caused it** - "I did not expect to spend a week in AI thinking about paper. But Amazon, the company that started out selling books, is pulping rare ones to feed its models, and Anna's Archive is racing to scan whatever survives 📚". The reaction is a feeling in past tense; the story takes whatever tense it is actually in (present if it is still unfolding). Publisher's voice, one light emoji allowed.

     The "I" is **reacting to the news, never narrating how the issue got written**. Do not open with the draft-that-changed shape - "I had this issue half-written as X / sketched as Y - then Z". It shipped in #3 and #6, and by the third use the reader hears the template instead of the news; it also spends the opening words on a week that did not happen. Vary the reaction clause every issue too ("I did not expect…" is one phrasing of the beat, not the beat itself) - what repeats is the shape, not the words. The surprise has to be genuine; if the week held none, state the week's shape plainly rather than manufacturing one.
  3. **Storyline** - a `<b>`-led sentence naming the thread that connects the week's items (one inline link allowed).

     **Name the thing, don't describe it.** Products, platforms and companies get their actual names in the intro, not generic stand-ins: "Cursor", not "the editor"; "Hugging Face", not "the hub where open weights live". Pairing the name with its category is good where the reader may not know it ("the Cursor editor", "the Hugging Face platform"), but the name always appears. A reader skimming the intro should be able to tell which products the week is about without decoding a description. This applies to the **Today:** line too.
  4. **Today** - `<b>Today:</b>` plus a comma-joined menu of what's below, in reading order (the launches and the viral posts on X count as entries when those sections are in), four or five clauses ending on the lightest one ("…and seven repos worth your weekend."). This is the closer: there is no "Let's dive in." sign-off any more.

  The hook should make skipping the issue feel expensive; the storyline should make the item list feel inevitable rather than miscellaneous; the Today line should make the scroll feel worth starting.
- **My Favourite Picks**: sits directly under the intro, **above** AI News, and is a card like AI News rather than a numbered section. Ink border with a 5px signal spine on the left. Each pick is **two lines**. The title line carries a signal-highlighted numeral, the title, and a one-word `.from` chip naming the section it came from (News, Announcements, X, Products, GitHub or HN); the description hangs beneath it, indented clear of the numeral, at 13.5px slate. The description is a **neutral summary of one to two lines** (~155 characters max) - what the item is, not why it was picked. No stat and no source label: the chip carries provenance, and the picks stay a route map into the issue rather than a fifth content bucket. The pick title renders **ink, weight 600, with no underline**: the numeral is the marker, and cobalt stays with the sections that report. Numerals imply a ranking, so `01` is the top pick. Titles are the user's own words where they gave them; supply one from the item's own headline only where they gave a bare URL. The same goes for descriptions - where the user's picks arrived with their own gloss, use it verbatim and only write one for the picks that came bare.
- **News items**: emoji + bold linked headline + one-line context + `<span class="src">(Source)</span>`. The source here is a plain text label, not a link. Mark the single biggest story with `<span class="hot">Story of the week</span>`.
- **Section order and numbers**: intro, My Favourite Picks card, AI News card, Official Announcements card, then the numbered sections **Viral on X `0x02`**, New AI Products `0x03`, Trending Github Projects `0x04`, HN Deep Stories `0x05`. The cards are unnumbered, and any of them can be absent. Numbers run in order over the sections present: with no X shortlist, Products is `0x02` and the rest move up.
- **The X sections are verbatim, and rendered by script.** Every word shown from a post is the author's, exactly as in `text`: never reword, summarise, fix typos, add or drop emoji, or retitle. The words are already checked against X by `/x-fetch-items`. This overrides the punctuation rule below: a post's own em dashes stay. **Don't type the posts in.** Paste the output of the x-fetch-items script unchanged (`S=.claude/skills/x-fetch-items/scripts/x_items.py`, with `--date` set to the snapshot's date):
  - `{{ANNOUNCEMENT_ITEMS}}` ← `python3 $S render --section announcements`
  - `{{X_ROWS}}` ← `python3 $S render --section viral`
  - In the Beehiiv export, the Official Announcements card ← `render --format beehiiv --section announcements`, and the whole Viral on X section, header included, ← `render --format beehiiv --section viral`.

  The rules below are what the script does; they're here so you can read the output, not so you can rewrite it. The only things we write are the byline labels, the link text, the @handle and the row emoji, and the script writes those too. If it warns that an account has no company on file, add the account to `COMPANIES` in `packages/fetchers/aibytes_fetchers/x_render.py` and render again. If it warns that a post has no emoji, pick one for each Viral on X row from what the post is about, set them with `python3 $S emoji URL EMOJI [URL EMOJI ...]`, and render again.
- **Official Announcements card**: directly after the AI News card, title `📣 OFFICIAL ANNOUNCEMENTS`, subtitle fixed copy "This week's launches, in the companies' own words." Each entry is a byline, the post in a paper inset, and a footer:
  - **Byline**: the company in bold, then the posting account and the post's weekday and day from `posted_at` (`@claudeai · TUE 22`). The company is who the account speaks for, and all of a company's accounts are one company: `@claudeai` and `@ClaudeDevs` are Anthropic, `@SpaceXAI` is xAI, `@OfficialLoganK` is Google.
  - **Post**: the **whole** post. Split `text` into `<p>`s at blank lines and turn single line breaks into `<br>`; that is the only change. Announcements are short, so they are not trimmed. Only if a post runs past 600 characters, stop at its last paragraph break before 400 and end with `<span class="cut">…</span>`.
  - **Footer**: `Post on X ↗` to the post's `url`, then, when `link_url` is set, the page's bare domain with `↗` (`anthropic.com ↗`).
  - No likes and no stat: a launch matters for what it is, not its reach.
- **Viral on X rows**: under the `0x02` header and the fixed subtitle "The AI posts that drew the biggest reaction this week." Each row opens with an **emoji** in the `.ico` column, like the other ticker rows, then the author's **`@handle`** in bold cobalt linked to their profile (`https://x.com/{handle}`), then the post's **opening words, verbatim**, linked to the post:
  - Take `text` from the start and show each line break as `<span class="cut">/</span>`.
  - Stop at **140 characters** (about two lines), at the last word break inside that, and end with `<span class="cut">…</span>`. A post that fits in 140 is shown whole, with no ellipsis.
  - The stat is likes as `♥︎` plus one decimal of thousands (`♥︎ 13.3k`). The heart is U+2665 followed by U+FE0E; without the second character iOS Mail swaps in a red emoji.
  - The emoji is ours, not the author's: it sits in its own column, stored as the post's `emoji` field, and never enters the quoted words.
- **Quote block**: the callout text only. No attribution line, no `- aiBytes_` under it. It is the issue talking to itself, so signing it reads like a stranger.
- **New AI Products / Trending Github Projects / HN rows**: emoji, bold linked name, hyphen, description, right-aligned stat (`▲ upvotes`, `+N.Nk ★`, `N pts`). Engagement numbers belong here and in the news rows - never in the intro.
- **Issue tag**: `ISSUE 0x{num in hex, 2 digits} · TL;DR` and date + estimated read time.

**Where each row's links point.** A row has one destination link (the thing the reader wants) and, for two of the sections, a trailing attribution link:

| Section | Bold name links to | Trailing link |
|---|---|---|
| My Favourite Picks | the pick's own destination (same URL that item uses in its home section) | none, the `.from` chip is a plain label |
| AI News | the article | none, `(Source)` is a plain label |
| New AI Products | the product's **own website** | `(ProductHunt)` to the launch page |
| Trending Github Projects | the repo | none, the name is already the source |
| HN Deep Stories | the **article**, not the thread | `(HackerNews)` to the thread |
| Official Announcements | `Post on X ↗` to the post | `{domain} ↗` to `link_url`, when set |
| Viral on X | the post on X (the opening words are the link); the `@handle` links to the author's profile | none |

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

  Check it against the intro's **Today:** line too, not just the title. Those are the issue's other menu, so pulling from the same four items three times is the same repetition in a different place. Reach for what neither one mentions: a product, a repo, or an HN thread.

Fill `{{EMAIL_SUBJECT}}` and `{{EMAIL_DESCRIPTION}}` in the main template (`<title>` and meta description) and in the export page's title panel.

### 5. Build the Beehiiv export

The user publishes on Beehiiv, whose HTML Snippet block strips `<style>` tags - so the main file's CSS classes won't survive a paste. Alongside the main HTML, always generate a second file: a copy-paste export page.

For each section of the issue (masthead, intro, news card, Official Announcements, Viral on X, New AI Products, Trending Github Projects, HN Deep Stories), rebuild the content as an email-safe snippet - inline styles only, `<table>` layout, no flexbox/clip-path/classes. The exact pattern for every section is in `references/beehiiv-patterns.html`; read it and fill the tokens with the same content as the main file.

Every exported `<p>` must include inline `padding:0`; Beehiiv otherwise adds paragraph padding on top of our margins (confirmed in issue #10). Keep `margin:0 0 14px 0` between intro paragraphs and news items, but use `margin:0` on the final paragraph in each group and on the quote. If an edit removes the last intro paragraph, reset the new last paragraph too. Apply these resets inside the snippets, not just in the export page CSS.

Then take `assets/beehiiv-export-template.html` and fill its tokens: `{{PART1_HTML}}` with the merged snippets for masthead + intro + My Favourite Picks + news card + Official Announcements, `{{PART2_HTML}}` with Viral on X + New AI Products + Trending Github Projects + HN Deep Stories (sections joined by a blank line, in reading order), plus `{{EMAIL_SUBJECT}}`, `{{EMAIL_DESCRIPTION}}`, and `{{ISSUE_NUM}}`. The page shows the title panel - carrying its own **Copy Title** and **Copy Desc** buttons, since those two are typed into Beehiiv's title and subtitle fields as plain text rather than pasted as a snippet - then two HTML copy buttons, Part 1 and Part 2, each with a live preview. Two parts rather than one because the user pastes native Beehiiv blocks (subscribe form, ads, polls) between them. Put the snippets into the textareas as **raw HTML, not entity-escaped**: the browser reads a textarea's content as text anyway, and `x_items.py verify --export` looks for the rendered X rows in the raw page, so escaped snippets fail it.

### 6. Save the output

Write both files to:

```
newsletter/issues/{yyyy}/week-{week_num}-Issue-{num}/aiBytes-issue-{num}.html
newsletter/issues/{yyyy}/week-{week_num}-Issue-{num}/aiBytes-beehiiv-export-issue-{num}.html
```

Create the directories if they don't exist. Then present both files to the user and, if an artifact/preview mechanism is available, render the main issue so they can see it immediately.

### 7. Verify

Open both generated files and check: no `{{` tokens remain, every link came from the data, sections with no data were removed cleanly (including their `sec-head`), the hex issue number matches the decimal one, the title/description are filled in both files, and the export page contains no `<style>`-dependent markup inside its textareas (inline styles only) with content matching the main file section for section.

Check exported paragraph spacing: every `<p>` has inline `padding:0`, and the final intro paragraph, final news item and quote have `margin:0`.

Check My Favourite Picks too: every pick's URL matches the URL that same item carries in its home section, each row has a `.from` chip and a description of no more than two lines, and no row has grown a stat.

Check the X sections with `python3 .claude/skills/x-fetch-items/scripts/x_items.py verify --date <snapshot date> --issue <issue.html> --export <export.html>`, adding `--section viral` when the issue has no Official Announcements card. It fails if any shortlisted post is missing, retyped, or out of order in either file; fix it by pasting the render output again, never by editing the post. Then check by eye that no story in Official Announcements also appears in AI News, and that the section numbers run without a gap.

Then check the links specifically: no URL carries a `ref` or `utm_*` parameter, no launch name still points at a `producthunt.com/r/` redirect, every HN deep cut name points at the article rather than the thread, and the quote block has no attribution line. Strip the template's fill-in comments from both output files before saving.

Finally read the title, the description, and the intro's **Today:** line back to back. The description must share no item with either of the other two; if it does, rewrite the description, since it is the one that has to earn its space. The title and the Today line may overlap freely - one is deciding whether to open, the other is deciding where to start reading.
