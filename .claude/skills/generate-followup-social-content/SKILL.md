---
name: generate-followup-social-content
description: Generate follow-up LinkedIn and X (Twitter) posts that go deep on one item from a published aiBytes_ issue - a news story, a GitHub repo, or a product launch - and ship them as two review artifacts under newsletter/issues/{yyyy}/{week-folder}/social/. Use whenever the user wants social media content, LinkedIn posts, tweets, X threads, or promo copy for the newsletter - triggers include "social posts for this week", "write the LinkedIn post", "make the X thread", "follow-up content for issue N", or "/generate-followup-social-content".
---

# Generate Follow-up Social Content (aiBytes_)

The newsletter is the roundup. Social is the deep dive.

Each week, after an issue ships, pick single items out of it and go further than the issue could - explain the mechanism, unpack the number, take a side. Produce **LinkedIn story posts for the items the user picks** (one post per item, chosen by the user from a shortlist you offer) and **5 X (Twitter) variations**, presented as two review artifacts so the user can read them side by side and pick.

Output goes to `newsletter/issues/{yyyy}/{week-folder}/social/`, where `{week-folder}` is the issue folder that already exists (e.g. `newsletter/issues/2026/week-32-Issue-3/social/`).

## Workflow

### 1. Find the issue and load its raw data

- The default target is the **most recently published issue**: the highest-numbered folder under `newsletter/issues/{yyyy}/`. The user can name a different issue or week.
- Read the issue HTML (`aiBytes-issue-{num}.html`) for the curated items, the intro's storyline, and the closing idea. That tells you what the week was *about*.
- Read the matching raw snapshots under `newsletter/data/{yyyy}/{mm}/weeks/week-{NN}/` (producthunt, github, news/hackernews, news/techcrunch). The issue carries one line per item; the raw JSON carries the full description, the vote and star and point counts, the comment counts and the canonical URL. **The deep dive lives in the raw data**, so never write from the issue alone.
- Every number and link in a post must be traceable to that data. Do not round, inflate, or invent. If a detail would strengthen a post and is not in the data, either leave it out or fetch the source page and cite what it actually says.

### 2. Pick 5 anchor items (X deck)

This step and the format step below govern the **X deck**. LinkedIn anchors are not picked here: the user picks them in step 4, from a shortlist you offer. One item per variation, five different items. Rank candidates on how much there is to *say*:

- Does it have a mechanism worth explaining, a number worth unpacking, or a real disagreement behind it?
- Would a builder change something on Monday because they read it?
- Did the week's own storyline run through it?

Coverage rule: across the five, include **at least one news story, at least one GitHub repo, and at least one product launch**. Highest engagement is a tiebreaker, not the criterion - a 5k-star repo with an interesting design beats a 7k-star repo that is another awesome-list.

### 3. Assign each anchor a format (X deck)

Five formats, one each, so the set reads as five different kinds of post rather than one post rewritten five times:

1. **The reversal** - the week looked like one story, then something landed that changed its shape. Tell the turn, then the implication.
2. **The teardown** - open a repo or product, explain how it actually works, name the one feature doing the work, then say plainly what it costs you and who should not use it.
3. **The number** - lead with one figure, then show why it is bigger or stranger than it looks. Ratios between two numbers are usually more interesting than either alone.
4. **The field note** - the problem, in first person, from the builder's chair: the failure mode this item is aimed at and why it is hard to see coming.
5. **The argument** - a genuine disagreement the week surfaced. Give the strongest version of both sides before saying where you land, and be willing to land on "no clean answer".

**Honesty guard for the field note.** Never write a first-person claim of having used, tested, installed, or measured something unless the user actually did. Anchor the first person in the *problem* ("I have shipped this bug", "I could not answer that for my own setup"), not in the product. If a variation needs a personal claim to work, write it and flag it in the artifact as **needs the user's confirmation before posting**.

### 4. Write the LinkedIn stories (ask the user first)

LinkedIn posts are **zoom-ins, not roundups**: each post tells the story of exactly one item from the issue, in plain narrative English, the way you would tell it to a colleague.

**Ask before writing.** Shortlist 5-8 items from the issue, each with one line on why it would make a good story, and ask the user which ones to write (use the question tool, multi-select). Never pick for them; wait for the pick. One post per chosen item - the number of variations is however many the user picks.

Structure per post:

- **Opener**: one or two lines that set the scene as a story, not a headline. Two shapes that work: the personal-discovery opener ("Last week, I read a thread on HackerNews that would not leave me alone.") and the big-news-plus-question opener ("Stripe is reportedly buying OpenRouter for $7B+. Why does a payments company want an LLM router?"). The opener must work as the only thing a scrolling reader sees.
- **The fold**: LinkedIn truncates around 200 characters on mobile. The opener must land a complete thought before the cut, and the line just after the cut has to be worth expanding for.
- **Arc**: tell it in sequence rather than in labeled sections - what happened, with the concrete details and numbers from the data; the mechanism or context most coverage skips; why a builder should care; then an honest open question or a stated take. 150 to 350 words. The post must go deeper on its one item than the newsletter blurb did, or it has no reason to exist.
- **Facts**: insightful and factually correct beats punchy. Every number and claim must trace to `newsletter/data/` or a fetched source. If the story wants a figure that is not in the data (a revenue multiple, a valuation, a user count), fetch the source and cite what it actually says, or leave it out - never estimate one into existence.
- **Close**: a real question or a stated position. Never "What do you think? Comment below."
- **Link handling**: LinkedIn suppresses posts with external links in the body. Put the URL in a `First comment:` line instead, and say what the link is.
- **Newsletter mention**: at most one, at the end, phrased as where the rest of the week lives. Not a pitch.
- **Emojis**: sparing - at most two per post, never in the opener.
- **Hashtags**: three maximum, on their own line at the end, lowercase-specific (`#llmops`) over generic (`#AI #Tech #Innovation`). Zero is a valid choice.

### 5. Write the X (Twitter) variations

Each variation is a thread of 5 to 7 tweets - a single tweet cannot go deep.

- **Tweet 1** is the whole post in miniature and must stand alone when quoted without the rest. Keep it under 240 characters so it is quotable with a comment.
- **One idea per tweet.** If a tweet needs "and", it is probably two tweets.
- Hard limit 280 characters per tweet, counted and shown in the artifact. Line breaks inside a tweet are good; three or four short lines read better than one block.
- **Last tweet** carries the links: the source, then the issue. No "follow me for more".
- No "🧵", no "a thread", no "1/n" theatre. Number tweets `1/` `2/` only when the thread runs past four.
- Zero hashtags.

### 6. Voice: write like a person

The publisher's voice, first person singular, talking to builders. Terse, specific, unimpressed by hype. The reader should believe a human sat with the item for an hour.

**Punctuation, strictly.** No em dash (`—`), no en dash (`–`), and **no double hyphen (`--`)** anywhere in any post. Use a single spaced hyphen (` - `), a comma, a full stop, or restructure the sentence. Also avoid `→` arrows in prose and `...` used for suspense. This applies to the post copy, the hooks, and the artifact prose around them.

**Do not write:**

- Openers: "Ever wondered", "Let that sink in", "Here's the thing", "Read that again", "Plot twist", "Buckle up", "The kicker?"
- Constructions: "It's not X. It's Y." · "This isn't just X, it's Y." · "X? Yes. Y? Also yes." · three-adjective lists · a rhetorical question answered in the next line · one-word paragraphs used as drumbeats (at most one per post, and only when it is genuinely the point)
- Vocabulary: game changer, unlock, leverage, delve, robust, seamless, supercharge, revolutionize, harness, elevate, in today's fast-paced world, the future of X is here, X just changed everything
- Shape: every line the same length; every paragraph exactly one sentence; an emoji at the head of every line

**Do write:** varied sentence length, at least one sentence long enough to need a comma. Contractions. Specific numbers, product names, and version strings. The thing you are unsure about, said as such. One concrete image over one abstract claim. Emoji at most twice per post, never in the hook.

Read every draft back against a plain test: would this person say this out loud to another engineer? If it would sound like a press release across a table, rewrite it.

### 7. Build the two artifacts

Two self-contained HTML files, one per platform, in `newsletter/issues/{yyyy}/{week-folder}/social/`:

```
newsletter/issues/{yyyy}/{week-folder}/social/linkedin-variations.html
newsletter/issues/{yyyy}/{week-folder}/social/x-variations.html
```

Each page carries, for every variation: the format name, the anchor item and its source link, the post rendered in a platform-shaped specimen, a metadata ledger, and a **copy button that copies the exact post text** (plain text, the characters that get pasted, no markup and no dashes the rules ban).

Platform-specific specimen details that earn their place:

- **LinkedIn**: render the post in the platform's own face (`-apple-system, "Segoe UI", …`) and draw a marked fold line where the "see more" truncation falls, so the user can see what survives the cut. Show total character count against the 3,000 limit, plus the `First comment:` line as its own copyable field.
- **X**: render each tweet as its own cell with a per-tweet character count and a fill bar against 280. Flag any tweet over the limit in a warning color rather than silently letting it through.

Both pages must be theme-aware (light, dark, and the unstamped system default), must not load any external font or script, and must scroll wide content inside its own container. Keep the two pages visually siblings: same palette and layout, one accent token swapped so the user can tell the tabs apart.

Then publish both as artifacts so the user can read them in the browser, and tell the user which variation you would post and why.

### 8. Verify before handing over

- Grep both files for `—`, `–`, and `--`. Any hit is a bug, including inside the copy-button payload.
- Every number in every post appears in `newsletter/data/` or in the issue HTML.
- Every link resolves to a URL taken from the data, not typed from memory.
- No LinkedIn post has a URL in its body; each has a `First comment:` line.
- No tweet exceeds 280 characters; tweet 1 is under 240.
- Any first-person claim about using or testing something is flagged for the user's confirmation.
- On the X deck, the five formats are all different and the five anchors are all different, with news, GitHub, and a launch all represented.
- Every LinkedIn post zooms into exactly one item, opens as a story rather than a headline, and was picked by the user, not for them.
