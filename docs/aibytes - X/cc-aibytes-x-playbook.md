# aiBytes_ on X - Subscriber Growth Playbook

**For:** @sachinjain024 · **Newsletter:** aiBytes_ (weekly, Sunday) · **Subscribe:** aibytes.io
**Version:** merged playbook, September 2026

aiBytes_ is a weekly AI digest for developers: last week's AI news, the most-discussed HN stories, top AI launches on Product Hunt, viral AI posts on X, and trending GitHub repos.

**Objective:** newsletter subscribers who come from X *and open the email*. X reach is how we get there. It is not the scoreboard.

**Starting point:** roughly 880 followers (check the current number), Requestly (YC, acquired by BrowserStack) credibility, Beehiiv newsletter at getaibytes.beehiiv.com. Two of the five newsletter sections (viral X posts, GitHub) already live where the readers scroll.

**The short version**

1. Turn the profile into a landing page: bio, pin, banner, tagged links.
2. Publish the curation in small pieces people finish and forward. Put the subscribe link on the second beat, not in the post.
3. Tag every maker you feature. Their reposts are your cheapest reach.
4. Stay in the replies for the first hour after posting.
5. Run the week from one folder, with Claude and Grok drafting from the same prompt.
6. Judge everything by subscribers from X and whether they open. Ignore likes and follower counts as goals.

---

## 1. Profile as landing page (do this first)

X doesn't convert visitors who can't tell what they get by subscribing.

**Bio (example)**
```
Weekly AI digest for developers.
Last week's launches, HN, GitHub and the X posts that mattered - in 5 minutes.
Built Requestly (YC, acq. by BrowserStack).
Free every Sunday: aibytes.io
```

**Must-haves**
- **Website field** points to the subscribe page, never a generic homepage.
- **Display name** carries the brand: "Sachin | aiBytes_", so every reply you leave advertises it.
- **Pinned post** is an evergreen "what you get + highlights from the last issue + subscribe" post. On Sunday the launch post takes the pin for about 24 hours, then the evergreen pin goes back.
- **Banner** keeps the moon-and-hill illustration and adds one line: the issue number, the promise, and the short URL. Update the issue number weekly so returning visitors see it's alive.
- **Social proof** in the pin once it's real: subscriber count, or "N readers forwarded last week's issue". Specific beats vague.
- **Low friction:** one-tap subscribe on mobile, no extra Beehiiv fields for people coming from X.

**Link tagging scheme (use on every link)**
```
?utm_source=x&utm_medium=<profile|pin|ship|thread|reply|card|ad>&utm_campaign=issue-NN&utm_content=<post-id or model tag>
```
`utm_medium` shows which placement converts. `utm_content` lets you compare post types and, later, Claude- vs Grok-drafted posts.

---

## 2. The algorithm as a constraint, not a goal

X published the code behind its For You feed: [xai-org/x-algorithm](https://github.com/xai-org/x-algorithm) (2026, a Grok-based ranking model called Phoenix). It predicts how likely each viewer is to take about 19 actions - like, reply, repost, quote, share, share by DM, copy link, click, time spent reading, follow the author, and negative ones like mute, block, report and "not interested" - and adds them up with weights.

**On the weights:** it's disputed whether real production weights were published, and they can vary per user and per experiment. Figures you'll see online ("a reply is worth 75 likes", "out-of-network × 0.75") either come from the retired 2023 code or aren't verified. Use the *direction*, not the numbers.

**The conflict rule:** X rewards actions that keep people on X. A signup means someone leaves X. When a post that ranks well and a post that converts well pull apart, the newsletter wins. A thread with all 30 items gets reading time and bookmarks, but gives nobody a reason to subscribe.

| What the ranker favours | What hurts | What we do for subscribers |
|---|---|---|
| Replies, quotes, shares by DM and copy link | Chasing likes | Write posts people answer or forward to a colleague |
| The author replying on their own post | Post and disappear | First-hour reply routine (below) |
| Time spent reading, finishing a thread | Long threads nobody finishes | 5-8 tweets, one idea each |
| Posts from accounts you follow, before recommended ones | Expecting strangers to find a cold link | Maker reposts and replies under bigger accounts put you in other people's feeds |
| Spacing between posts from one author | Posting the whole issue package in 20 minutes | Stagger Sunday over 6-24 hours |
| Staying on one topic (the model matches posts to readers by topic) | Mixing in unrelated takes | Only AI for developers on this account |
| - | "Not interested", mutes, blocks | No bait, no broad-appeal hot takes. They attract the wrong viewers and cost reach |

**Link placement**
- Never post a bare link. The ranking model doesn't penalise links directly, but X's quality classifier likely scores link-only posts low.
- Monday to Saturday: the value goes in the post. The subscribe link goes in the last tweet of a thread, or in a self-reply once the post gets traction.
- **Exception:** the Sunday launch post may carry the issue link. Its job is converting people already looking for the digest.
- The bio and pin are the always-on door. Not every post needs a link.
- Test link-in-reply against link-in-post and let signups decide.

**First-hour routine**
- Post only when you can stay in the replies for 30-60 minutes.
- Reply to every serious reply. It keeps the conversation going and is the warmest moment to convert someone.
- Don't post another original in that same hour.

**What we don't take from the algorithm**
- Posting more to game reach, polls or video tricks, "reply YES for the thread".
- Optimising impressions or follower count.
- Paid engagement pods to fake early momentum.
- Turning aiBytes_ into daily breaking news because fresh posts rank well.

The model predicts actions. Editorial taste decides whether the people acting are people who belong on the list.

---

## 3. Content system: one X format per newsletter section

Don't dump the whole issue on X. Cut it into pieces that each earn attention, then point the curious to the full digest.

**80/20 rule:** 80% of posts stand on their own (someone who never subscribes still learned something). 20% ask for the subscription. If every post is a pitch, reach dies and there's nothing left to convert.

| Newsletter section | X format | Cadence | Call to action |
|---|---|---|---|
| AI news | One sharp take: what it means for builders | 2-3 / week | Self-reply: "full week in the digest" |
| Hacker News | Quote the thread with your take, or "What HN got right and wrong" | 1-2 / week | Self-reply after traction |
| Product Hunt | Launch teardown: what's clever, what's missing, who it competes with. Tag the makers | 1 / week + Sunday recap | Link in last tweet or self-reply |
| Viral on X | "Signal or hype": quote the viral post with what's actually new | Daily skim, 1 post when it fits | "I track these every week in aiBytes_" |
| GitHub Trending | Repo card: what it does, stars this week, who should clone it. Tag the maintainer | 2 / week | Self-reply: "more repos in this week's issue" |
| Your pipeline data | Pattern post: "8 weeks of PH launches - here's what keeps winning" | 1-2 / month | Last tweet |
| Behind the scenes | Build in public: the curation pipeline, Claude Code, the iMac on cron duty | 1 / week or less | Soft |

**Images:** plain text beats graphics for news and repos, unless the image *is* the content (a star chart, a PH ranking, a 3-line code snippet). The exception is maker cards (section 4), which exist for makers to share. Number the issues ("aiBytes_ 42") so the series builds recognition.

### Thread templates

**A - "This week in 8 tweets"**
1. Hook: "If you only tracked 8 AI things this week as a developer, make it these."
2-7. One item each (repo, launch, HN, paper, X post), one sentence on why it matters.
8. "I do this every week so you don't have to. Free, every Sunday: [link]"

**B - Single-item deep cut**
Hook, problem, what they shipped, how you'd use it tomorrow, limits. Last tweet: "I logged 6 more like this in issue NN."

**C - What HN got right and wrong**
Take the most-discussed HN AI story, steelman the top comments, add the builder's view, end with the digest link.

**D - Patterns from the week (your unfair advantage)**
"I read every viral AI post this week. 3 patterns that keep winning, 2 that are dying." Publish the pattern, not just the links. Only a curator with a dataset can write this, and these are the posts that get copied and shared.

**Thread closer:**
> If you'd rather get this in one email every Sunday than hunt across HN, PH, X and GitHub - that's aiBytes_.

---

## 4. The biggest lever: the featured-maker loop

Every issue features 20-40 makers: repo authors, PH founders, people behind viral posts. At under 1k followers, their audiences are bigger than yours.

- **Tag them** when you post about their work. Many repost because it's free social proof, and their followers see it as normal content from someone they follow.
- **Give them something to share:** a small "Featured in aiBytes_ · Issue NN" card per item, generated by the existing Pillow + Google Fonts setup.
- **Tell the top 5 each week** with a short reply or DM: "Featured your project in this week's issue, here's the link." No ask.
- **Keep an X List** of featured makers. Adding someone notifies them.

Track "maker reposts per issue" as the health metric for this loop.

---

## 5. Distribution without posting more

Most growth at this follower count comes from other people's reach.

**Reply strategy (15 minutes, twice a day)**
Keep a private X List of about 30 accounts:
- AI labs and dev tools (OpenAI, Anthropic, Cursor, v0, LangChain, Hugging Face and similar)
- AI indie hackers and people who post on HN
- PH makers shipping AI
- Other AI newsletter writers (weekly filters, not daily spam)
- GitHub trending authors when they post a release

Replies that earn follows:
- Add a missing constraint ("this breaks when context goes past 100k unless...")
- Cite a repo or HN thread they missed
- Contrast two launches they mentioned

Never "Great post". Never a link in the first reply. When your reply gets traction, add a second one: "Wrote this up with 4 related tools in this week's digest."

**Reply moments that convert directly**
Watch for "how do you keep up with AI?" and "what newsletters do you read?" Have a two-line answer ready (see snippets).

**Quote, don't repost**
A quote with a sharp first line travels further than a repost. Use it on viral AI posts you'd include in the newsletter anyway. It previews your editorial voice.

**Borrow other audiences**
- One cross-promo swap a month with 1-2 AI newsletters of similar size, announced on X by both sides and in both issues.
- Post recaps in X Communities for AI, LLMs and build in public.
- Co-write a thread with a maker you featured.
- Use the YC and Requestly networks for early reposts on the first few threads.

---

## 6. Conversion mechanics

1. **Lead magnet that's a slice of the product**, delivered through a Beehiiv subscribe flow (not "comment a keyword and I'll DM you"):
   - The last 4 issues as a sample pack
   - "The 12 GitHub repos developers starred most this month"
   - "How I filter HN, PH, X and GitHub in 45 minutes"
2. **Tease, don't dump.** The thread shares 8 items, the issue has 30+. Say so: "20 more in Sunday's issue, including a repo I think will be everywhere next month."
3. **Self-reply after traction.** When a post gets real replies or a clear spike in views, reply to yourself with the subscribe link and one extra item from the issue that wasn't in the post.
4. **Link to a specific issue on the web**, not the Beehiiv homepage. Readers see the product before the subscribe box. Make each block (HN, repo, launch) on the web edition easy to share on its own.
5. **Write the launch post yourself.** Auto-generated RSS teasers read like every other digest.
6. **Beehiiv referrals and Recommendations.** Turn them on when there's a reason to share, and announce them on X once.
7. **X Articles experiment:** a trimmed issue as an X Article with a subscribe link. Compare signups against threads.
8. **Loop back from email to X:** a "seen on X this week - discuss here" block in the issue brings readers back to your posts, where they reply and reshare.

---

## 7. Weekly rhythm

Sustainable for one person: **one original post a day, 8-15 replies a day, one thread per issue.** Never two originals in the same hour.

**Sunday (issue day) - staggered**
1. **T0 - Launch post.** "aiBytes_ #NN is out", three bullets, issue link allowed. Pin it for about 24 hours. Stay in the replies for 30-60 minutes.
2. **T+3-6h - Leftovers thread**, 6-8 tweets: one HN story, two repos, one PH launch, one X post, one "what I ignored and why". Subscribe link only on the last tweet.
3. **T+8-24h - One card** (repo or launch) as a standalone post, link in a self-reply if it moves.

**Monday to Wednesday**
- One builder's take on a news item (not a link dump).
- One HN digest or "what HN got right and wrong".
- Quote 2-3 big accounts with a specific addition: a number, a caveat, "this breaks if...".
- Reply blocks, kept apart from your original posts.

**Thursday and Friday**
- GitHub or PH deep cut: what the README or launch page doesn't tell you.
- Build-in-public post, or a pattern post from pipeline data.
- Reuse last issue's best insight as a standalone post with new wording.

**Saturday (optional)**
- "Signal or hype" quote on the week's most viral AI claim, or one "what readers replied this week" note.
- Batch Sunday's posts Saturday night.

---

## 8. Execution system: one folder, two models

**The source of truth is a folder you own, under git.** Projects in the Claude or Grok apps are optional shells over it. The two models only help if they read the same playbook and write to separate folders.

### Layout
```
aibytes-x/
  README.md
  PLAYBOOK.md              this document
  VOICE.md                 do's and don'ts + 5 real posts in your voice
  WEEKLOG.md               5 lines a week: what we learned
  prompts/
    weekly-pack.md         the one prompt both models get
    first-hour-replies.md
  issues/
    2026-10-04.md          outline and bullets for that issue (or the edition JSON)
  drafts/
    2026-W40/
      A/                   blind-labelled drafts
      B/
      key.md               which model wrote A and B - don't open until you've picked
  published/               what actually went out, after your edits
  stats/                   dated snapshots at 24h and 7d
  signups.csv              weekly Beehiiv UTM export
  tracker.csv              one row per live post
```

**Use CSV, not .xlsx.** Two agents writing to one binary file corrupt it, and git can't show what changed. Open `tracker.csv` in Excel or Sheets when you want a view.

### Who does what

| Job | Owner | Writes to |
|---|---|---|
| Weekly package from `issues/` (launch post, thread, cards, takes) | **Both**, same `prompts/weekly-pack.md` | Their own draft folder, then relabelled A/B |
| What moved on X this week, quote angles, reply sentiment | **SuperGrok** (has live X access) | Notes in that week's `issues/` file |
| Public stats on your posts (views, likes, reposts, replies, bookmarks) | **SuperGrok** from URLs, or Claude Code | `stats/` |
| Private stats (profile clicks, link clicks, engagement rate) | **Claude Code** via the Chrome extension while you're signed in. Check whether X analytics offers a CSV export first | `stats/` |
| Signups by UTM | **Beehiiv** export | `signups.csv` |
| Voice check, playbook compliance, weekly report | **Claude Code** | `WEEKLOG.md`, `reports/` |
| Blind pick, final edits, posting | **You** | `published/` + a row in `tracker.csv` |

Neither model overwrites the other's drafts or `published/`.

**Check first:** confirm whether your SuperGrok plan can work in a local folder. If not, upload the inputs to it and save its drafts into the folder yourself (or have Claude Code do it).

### `tracker.csv` columns
```
posted_at,issue,url,type,utm_medium,utm_content,base_model,blind_pick,edited,hook,views_24h,views_7d,replies,quotes,reposts,bookmarks,profile_clicks,link_clicks,subs_attributed,notes
```
- `type`: ship | thread | card | take | quote | reply-cta
- `base_model`: which model's draft you picked (from `key.md`, after picking)
- `edited`: light | heavy - heavy edits make that post a weaker data point for the model test
- `subs_attributed` comes from Beehiiv UTMs, never from guesses.

### Prompt contract (`prompts/weekly-pack.md`)
The prompt both models get should require, not suggest:
- Follow the link rules in section 2.
- Output: 1 launch post, 1 thread of 6-8 tweets, 2 GitHub/PH cards, 3 mid-week takes, each as its own markdown file (`ship.md`, `thread.md`, `card-1.md`...).
- Label each piece with its `type` and `utm_medium`.
- Tag makers' handles where known.
- Cite which bullet in `issues/` each piece came from. **No invented launches, numbers or star counts.**
- Follow `VOICE.md`: single dashes, no hashtags, no emoji, value first, soft plug last.

### Weekly loop
1. Put the issue outline or edition JSON into `issues/`.
2. Run `prompts/weekly-pack.md` through Claude Code and SuperGrok with identical inputs.
3. Relabel the outputs A and B. **Pick blind**, piece by piece, before opening `key.md`.
4. Edit the chosen drafts lightly and save them to `published/`.
5. Post on the staggered Sunday schedule. Log the URL, UTM and time in `tracker.csv` right away.
6. First hour: you reply, as yourself. `prompts/first-hour-replies.md` can suggest drafts.
7. At 24 hours and 7 days: pull stats into `stats/`, update `tracker.csv`, add the Beehiiv export.
8. Five lines in `WEEKLOG.md`: what converted, what got replies but no signups, what to reuse, what to drop.

### Keeping the model test fair
- Same inputs and same prompt for both.
- Blind picks. Record `base_model` and `edited` for every post.
- Keep each week's post types, days and times the same so the model is the only thing that changes.
- Run 6-8 weeks before calling a winner. Two or three is noise.
- Once you have a winner, you can switch to merging the best lines from both. Merging makes better posts but hides which model did better.

### Automation from the curation pipeline
- Add a pipeline step that turns the edition JSON into the `issues/` file, with maker handles attached where known.
- Generate maker cards and thread images with Pillow.
- Push the posts you choose into a scheduler (X's own, or Typefully) rather than posting through the API. You keep a review step and skip X API costs.

### What this setup is not
- A reason to post two versions of everything.
- An analytics product. If stats are late, still post next Sunday.
- A substitute for reading the issue. A weak outline gives you two weak drafts.

---

## 9. Measurement

A 10-minute weekly scorecard.

**Primary**
- New Beehiiv subscribers with `utm_source=x`, broken out by `utm_medium` (pin, ship, thread, reply, card).
- **Subscribers per 1,000 views, by post type.** The main number for comparing formats (and models).
- **30-day open rate of the X cohort** compared with other sources. If X subscribers don't open, the channel isn't working, however many signups it brings.

**Secondary (the health of the reach, not the goal)**
- Launch post and best thread: views, replies, and how many you replied to.
- Profile visits → link clicks.
- Maker reposts per issue.
- Bookmarks, quotes and shares on cards.
- Follower growth: the audience that sees every post without the discount on recommended posts.

**When to drop a format**
- It gets views but no signups.
- It gets a few signups but needs bait that brings mutes.

---

## 10. Paid (only after the organic loop works)

Skip ads until you have 4 weeks of organic posts with signups you can trace. Then:
- Boost one proven thread, not a cold "subscribe" ad.
- Optimise for link clicks to the subscribe page, not follows.
- Target interests: AI, software engineering, GitHub, Product Hunt, Hacker News, Cursor, Claude.
- Keep a small daily cap until you know the cost per subscriber, tracked with `utm_medium=ad`.

---

## 11. 30/60/90-day plan

### Days 1-7 - Foundation
- [ ] Rewrite bio, website link, display name and banner
- [ ] Write and pin the evergreen "what aiBytes_ is" post
- [ ] Set up the tagging scheme and a Beehiiv subscribe page for X
- [ ] Create the private reply list and the featured-makers list
- [ ] Create `aibytes-x/` with `PLAYBOOK.md`, `VOICE.md`, `tracker.csv` and `prompts/weekly-pack.md`
- [ ] Confirm whether SuperGrok can work in the folder, and whether X analytics exports CSV
- [ ] Post this week's launch post and leftovers thread on the staggered Sunday schedule
- [ ] Practise the first-hour reply routine on that launch post

### Days 8-30 - Cadence
- [ ] One staggered Sunday package every week
- [ ] 5-7 original posts a week from the section table (link in reply, not in the post, Monday to Saturday)
- [ ] 10+ thoughtful replies a day on the list
- [ ] Tag makers in every post; send cards to the top 5 each week
- [ ] One lead magnet live
- [ ] Claude vs Grok blind test running every week
- [ ] Weekly review: which posts brought `utm_source=x` subscribers, not which got likes

### Days 31-60 - Compound
- [ ] Double down on the 1-2 formats that converted
- [ ] Start one newsletter swap
- [ ] Self-reply with the link on any post that sparks conversation
- [ ] First pattern post from pipeline data
- [ ] Refresh the pin with real social proof
- [ ] Automate the `issues/` file and maker cards from the pipeline

### Days 61-90 - System
- [ ] Batch Sunday posts on Saturday night
- [ ] Call the model test (6-8 weeks of data) and settle the drafting setup
- [ ] Add the "seen on X this week" block to the issue
- [ ] Consider a small ads test on the best thread
- [ ] Set a monthly goal in subscribers from X (with open rate), not followers

**Realistic expectation from under 1k followers:** tens of subscribers a week with steady posting and the maker loop working. More when a thread gets copied widely. Measure it rather than trusting any benchmark.

---

## 12. Experiments backlog

| Experiment | Impact | Effort |
|---|---|---|
| Featured-maker cards + messages to the top 5 makers | High | Medium |
| Lead magnet delivered through a Beehiiv subscribe flow | High | Medium |
| Monthly "state of AI launches" data post | High | Medium |
| Claude vs Grok drafts, blind-picked, 6-8 weeks | Medium | Low |
| Link in reply vs link in post | Medium | Low |
| X Article version of the issue vs the leftovers thread | Medium | Low |
| Short video walkthrough of the week's top 3 repos | Medium | High |
| Monthly X Space with 2 featured makers | Medium | High |
| Boosting the best-performing thread (after day 30) | Unknown | Medium |

---

## 13. Snippets to adapt

**Pinned post**
```
aiBytes_ is a 5-minute Sunday email for developers who won't open 40 tabs.

Every week:
- What actually shipped (Product Hunt + GitHub)
- HN threads worth your time
- The AI posts on X that weren't noise
- The news that changes how you build

I built Requestly (YC, acquired by BrowserStack). This is the briefing I wanted when I was shipping.

Free: aibytes.io
```

**Sunday launch post (link allowed)**
```
aiBytes_ #NN is out - this week's 5-minute brief for builders

- [PH launch] - why it matters
- [repo] - stars this week and who should clone it
- [HN] - the comment that changed the thread
- [X post] - the pattern behind the reach

Full issue: [link]
```

**Leftovers thread opener**
```
I read ~400 AI links this week so you don't have to.

8 that didn't make the top of Sunday's issue but should be on your radar - repos, launches and one HN argument worth reading:
```

**Repo card (no link in the post)**
```
Trending for a reason: [repo] by @[maintainer]

Does: [one line]
Stars this week: +N
Use it if you: [who / what job]
```
Self-reply once it moves: `I logged [N] more like this in this week's aiBytes_: [link]`

**Pattern post**
```
I've tracked every AI launch on Product Hunt for the last [8] weeks.

[X] of the top 5 each week were [pattern].
Almost none were [other pattern].

What that says about where AI products are heading:
```

**Reply when someone can't keep up with AI news**
```
Same problem. I ended up writing a 5-minute Sunday filter: PH, HN, GitHub and the X posts that weren't slop.

That's aiBytes_ if you want it in one place.
```

---

## 14. What not to do

- "Issue is out" posts on days other than Sunday.
- The Sunday firehose: launch post, thread and three cards in 20 minutes.
- A link in every post, or a bare link with no value.
- The table of contents as a screenshot with no point of view.
- "Support indie writers" appeals. Developers subscribe to save time.
- Engagement bait ("Which model is best?", "comment BYTES and I'll DM you"). It grows followers who don't subscribe and invites mutes.
- Hashtags, follow-for-follow, bought followers, reply pods.
- Posting unreviewed AI drafts. One wrong claim costs more trust than a missed day.
- Tactics built on "leaked" algorithm weights.
- Changing the promise on X to "daily breaking news".
- Treating reach, likes or follower count as the goal.

---

## Bottom line

You already do the expensive part: reading HN, PH, X and GitHub so other developers don't have to. Growing aiBytes_ through X means publishing that taste in public, in pieces small enough to finish and forward, with the makers you feature carrying it further, the first hour spent in the replies, and the subscribe link on the second beat.

Use the open-source algorithm so you don't hurt your own reach. Don't make it the goal. The list is the product, and the folder is the system.

---

**Sources**
- [xai-org/x-algorithm on GitHub](https://github.com/xai-org/x-algorithm)
- [X algorithm 2026 open-source release, inspected (The Deep Feed)](https://www.thedeepfeed.ai/posts/2026-05-16-x-algorithm-phoenix-release/)
