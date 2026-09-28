---
format: longclaw.ticket/v1
id: 8856a883-be5c-4b99-b238-b7a18a3babcb
key: AIB-60t
title: Execute aiBytes_ growth on X
status: in_progress
priority: p1
labels:
  - marketing
created_at: 2026-09-28T10:26:34.855Z
updated_at: 2026-09-28T10:33:04.996Z
---

Source of truth: `docs/aibytes - X/cc-aibytes-x-playbook.md` (merged playbook, September 2026). This ticket is the execution of that playbook on @sachinjain024. Read the playbook before changing the system. This description is the operating brief.

**Objective.** Newsletter subscribers who arrive from X and open the email. X reach is how they get here. Likes and follower count stay health signals.

**What aiBytes_ is.** A weekly AI digest for developers: last week's AI news, the most-discussed HN stories, top AI launches on Product Hunt, viral AI posts on X, and trending GitHub repos. Free every Sunday. Subscribe at aibytes.io. Beehiiv home is getaibytes.beehiiv.com.

**Starting point.** Roughly 880 followers (recheck the live number before the first review). Requestly (YC, acquired by BrowserStack) is the credibility line. Two of the five newsletter sections — viral X posts and GitHub — already live where readers scroll.

## How the week works

1. The profile is the landing page. Bio, display name ("Sachin | aiBytes_"), website field, banner, and an evergreen pin. The website field points at the subscribe page. The banner keeps the moon-and-hill illustration and adds the issue number, the promise, and the short URL, updated every week. On Sunday the launch post takes the pin for about 24 hours, then the evergreen pin goes back.
2. Publish the curation in pieces people finish and forward. 80% of posts stand on their own. 20% ask for the subscription. One original post a day, 8–15 replies a day, one thread per issue. Never two originals in the same hour. Stagger Sunday across 6–24 hours.
3. Tag every maker featured (repo authors, PH founders, people behind viral posts). At under 1k followers their audiences are larger than ours. Give them a "Featured in aiBytes_ · Issue NN" card. Tell the top 5 each week with a short reply or DM and no ask. Track maker reposts per issue.
4. Stay in the replies for 30–60 minutes after posting. Reply to every serious reply. Post only when that hour is free.
5. Run the week from one git folder, `aibytes-x/`. Both models read the same playbook and the same prompt and write to separate draft folders.

**Link placement.** Monday to Saturday the value is in the post. The subscribe link goes in the last tweet of a thread, or in a self-reply once the post has traction. The Sunday launch post may carry the issue link, because its job is converting people already looking for the digest. The bio and the pin are the always-on door. Link to a specific issue on the web, so readers see the product before the subscribe box.

**UTM scheme, on every link.**

```
?utm_source=x&utm_medium=<profile|pin|ship|thread|reply|card|ad>&utm_campaign=issue-NN&utm_content=<post-id or model tag>
```

`utm_medium` shows which placement converts. `utm_content` compares post types and, during the test, Grok 4.7 against Claude Opus 5.5.

**Content map.** One X format per newsletter section, from the playbook's section table: a builder's take on the news (2–3/week), an HN quote or "what HN got right and wrong" (1–2/week), a PH teardown that tags the makers (1/week plus the Sunday recap), a "signal or hype" quote when a viral post earns it, a GitHub repo card that tags the maintainer (2/week), a pattern post from the pipeline (1–2/month), and build-in-public (1/week or less). Plain text beats graphics unless the image is the content. Maker cards are the exception, because they exist for makers to share. Number the issues ("aiBytes_ 42").

**Sunday, staggered.** T0 launch post: "aiBytes_ #NN is out", three bullets, issue link allowed, pin for ~24h, stay in the replies. T+3–6h leftovers thread, 6–8 tweets, subscribe link only on the last tweet. T+8–24h one repo or launch card, link in a self-reply if it moves. Batch Sunday on Saturday night once the rhythm is real.

**Reply strategy.** A private list of about 30 accounts (AI labs and dev tools, AI indie hackers, PH makers, peer newsletter writers, GitHub trending authors). Two blocks a day. Replies add a constraint, a missed repo or HN thread, or a contrast between two launches. A link waits for a second reply, after the first one has traction. Keep a two-line answer ready for "how do you keep up with AI?" and "what newsletters do you read?". Quote, with a sharp first line, rather than bare-reposting a viral post that belongs in the issue.

**Conversion.** Lead magnet is a slice of the product, delivered through a Beehiiv subscribe flow: the last 4 issues, "the 12 GitHub repos developers starred most this month", or "how I filter HN, PH, X and GitHub in 45 minutes". Tease the rest of the issue ("20 more on Sunday"). Self-reply with the link and one extra item when a post gets real replies or a view spike. Turn on Beehiiv referrals when there is a reason to share, and announce them on X once.

**Measurement, 10 minutes a week.** Primary: new Beehiiv subscribers with `utm_source=x`, by `utm_medium`; subscribers per 1,000 views, by post type (this is also the model comparison); 30-day open rate of the X cohort against other sources. Secondary: launch-post views and replies answered, profile visits to link clicks, maker reposts per issue, bookmarks and quotes on cards, follower growth. Drop a format that gets views and no signups, or signups that depended on bait. Expect tens of subscribers a week from under 1k followers once the maker loop is working, and measure that rather than a benchmark.

**Paid.** Wait until 4 weeks of organic posts have signups that trace. Then boost one proven thread, optimise for link clicks to the subscribe page, and cap spend until cost per subscriber is known (`utm_medium=ad`).

**Leave these out.** "Issue is out" on any day but Sunday. The Sunday firehose (launch, thread, and cards inside 20 minutes). A link in every post, or a bare link. A table-of-contents screenshot with no point of view. "Support indie writers" appeals. Engagement bait, hashtags, follow-for-follow, bought followers, reply pods. Unreviewed drafts. Tactics built on unverified algorithm weights. Changing the promise to daily breaking news. Treating reach, likes, or follower count as the goal.

## Model test: Grok 4.7 vs Claude Opus 5.5

Both models draft each week's package. The test asks which one writes posts that earn subscribers, using the latest edition and the engagement already on the books.

**Same inputs, every week.** `prompts/weekly-pack.md`, that week's file in `issues/` (outline or edition JSON, with maker handles), the latest published edition, `VOICE.md`, `PLAYBOOK.md`, `tracker.csv`, `stats/` (24h and 7d), `signups.csv`, and `WEEKLOG.md`. Previous engagement is part of the input so later weeks can reuse what converted and drop what only collected replies.

**Same required output.** 1 launch post, 1 thread of 6–8 tweets, 2 GitHub or PH cards, 3 mid-week takes. Each piece is its own markdown file (`ship.md`, `thread.md`, `card-1.md`, `card-2.md`, and one file per take), labelled with `type` and `utm_medium`, maker handles where known, and a citation to the bullet in `issues/` it came from. No invented launches, numbers, or star counts. Voice: single dashes, no hashtags, no emoji, value first, soft plug last.

**Blind pick.** Relabel the two outputs A and B. The mapping lives in `key.md`, unopened until the pick is done. Sachin picks piece by piece, edits, and saves the chosen drafts to `published/`. Record `base_model` (from `key.md`, after the pick) and `edited` (`light` or `heavy`) on every `tracker.csv` row. A heavy edit is a weaker data point for that model.

**Who else does what.** Grok 4.7 also writes the week's X notes: what moved, quote angles, reply sentiment, and public stats from post URLs. Claude Opus 5.5 also runs the voice check, playbook compliance, and the weekly report, and pulls private X analytics (profile clicks, link clicks, engagement rate) while signed in, after checking whether X analytics already exports a CSV. Beehiiv supplies `signups.csv`. Sachin does the blind pick, the final edit, the posting, and the first-hour replies as himself. `prompts/first-hour-replies.md` may suggest drafts. Neither model overwrites the other's drafts or `published/`. One version goes out.

**Fairness.** Same prompt, same inputs, stable post types, days, and times, so the model is the variable. Run 6–8 weeks before calling a winner. Two or three weeks is noise. Merging the best lines from both can start after a winner is called. Merging during the test hides which model did the work. Confirm first whether Grok 4.7 can read and write the local folder. If it cannot, upload the inputs and save its drafts back into the folder by hand.

**Folder.**

```
aibytes-x/
  README.md
  PLAYBOOK.md
  VOICE.md
  WEEKLOG.md
  prompts/weekly-pack.md
  prompts/first-hour-replies.md
  issues/
  drafts/<week>/{A,B,key.md}
  published/
  stats/
  signups.csv
  tracker.csv
```

`tracker.csv` columns: `posted_at,issue,url,type,utm_medium,utm_content,base_model,blind_pick,edited,hook,views_24h,views_7d,replies,quotes,reposts,bookmarks,profile_clicks,link_clicks,subs_attributed,notes`. `type` is `ship | thread | card | take | quote | reply-cta`. CSV only, so two agents can write it and git can show the diff. `subs_attributed` comes from Beehiiv UTMs.

**Weekly loop.** Outline into `issues/`. Both models run `weekly-pack.md`. Blind pick. Light edit into `published/`. Post on the staggered Sunday schedule and log the row immediately. First hour in the replies. Stats at 24h and 7d, then the Beehiiv export. Five lines in `WEEKLOG.md`: what converted, what got replies and no signups, what to reuse, what to drop.

**Later automation.** A pipeline step that turns edition JSON into the `issues/` file with maker handles. Maker cards and thread images from the existing Pillow + Google Fonts setup. Chosen posts go into a scheduler (X's own, or Typefully) so a human still reviews them.

**30/60/90.** Days 1–7 are the profile, the lists, the folder, and one practised Sunday. Days 8–30 are the cadence, the maker loop, one lead magnet, and the blind test running every week. Days 31–60 double down on the formats that converted, add one newsletter swap, the first pattern post, pin social proof, and the pipeline automation. Days 61–90 batch Sunday, call the model test, add the "seen on X this week" block to the issue, and only then consider a small ads test. The monthly goal is subscribers from X who open, set after the first measured weeks.

## Checklist

- [ ] Recheck the live follower count and record it as the baseline <!-- longclaw:item=ck_54c3687f -->
- [ ] Rewrite the X bio: weekly AI digest for developers, the 5-minute promise, the Requestly line, and aibytes.io <!-- longclaw:item=ck_20e71b9c -->
- [ ] Point the website field at the X subscribe page <!-- longclaw:item=ck_dd9df804 -->
- [ ] Set the display name to "Sachin | aiBytes_" <!-- longclaw:item=ck_66b8d5e1 -->
- [ ] Update the banner: keep the moon-and-hill illustration, add the current issue number, the promise, and the short URL <!-- longclaw:item=ck_74d32757 -->
- [ ] Confirm one-tap mobile subscribe with no extra Beehiiv fields for people arriving from X <!-- longclaw:item=ck_45c2e5b2 -->
- [ ] Write and pin the evergreen "what aiBytes_ is" post, using the playbook snippet <!-- longclaw:item=ck_86e1ec95 -->
- [ ] Define the pin swap: Sunday launch post for about 24 hours, then the evergreen pin returns <!-- longclaw:item=ck_26717e06 -->
- [ ] Apply the UTM scheme on every link: utm_source=x, utm_medium, utm_campaign=issue-NN, utm_content=post-id or model tag <!-- longclaw:item=ck_ab8580f8 -->
- [ ] Set up the Beehiiv subscribe destination those UTMs use, and a weekly export into signups.csv <!-- longclaw:item=ck_7138a1e2 -->
- [ ] Create the private reply list of about 30 accounts: labs and dev tools, indie hackers, PH makers, peer newsletters, trending-repo authors <!-- longclaw:item=ck_243bcc71 -->
- [ ] Create the featured-makers X List <!-- longclaw:item=ck_ec848c24 -->
- [ ] Write the two-line reply for "how do you keep up with AI?" and "what newsletters do you read?" <!-- longclaw:item=ck_2127184e -->
- [ ] Create aibytes-x/ and seed PLAYBOOK.md from docs/aibytes - X/cc-aibytes-x-playbook.md <!-- longclaw:item=ck_368af6ba -->
- [ ] Add README.md, VOICE.md (rules plus 5 real posts), and an empty WEEKLOG.md <!-- longclaw:item=ck_61ada983 -->
- [ ] Write prompts/weekly-pack.md with the required outputs, link rules, maker tags, citations, and the no-invented-numbers rule <!-- longclaw:item=ck_a8d1bb1b -->
- [ ] Write prompts/first-hour-replies.md <!-- longclaw:item=ck_5e42fc3e -->
- [ ] Create tracker.csv and signups.csv with the playbook columns <!-- longclaw:item=ck_595dbfd2 -->
- [ ] Confirm whether Grok 4.7 can read and write the local folder, and document the fallback if it cannot <!-- longclaw:item=ck_db7936de -->
- [ ] Confirm whether X analytics exports CSV before pulling private stats through a signed-in browser <!-- longclaw:item=ck_8674a087 -->
- [ ] Each week, file the edition outline or edition JSON in aibytes-x/issues/ with maker handles attached <!-- longclaw:item=ck_71016eb7 -->
- [ ] Run weekly-pack.md through Grok 4.7 and Claude Opus 5.5 on identical inputs, including tracker, stats, signups, and WEEKLOG <!-- longclaw:item=ck_1fd9ed4a -->
- [ ] Relabel each week's drafts A and B, store the mapping in key.md, and pick blind before opening it <!-- longclaw:item=ck_81598a69 -->
- [ ] Edit the chosen drafts lightly, save them to published/, and record base_model and edited on every tracker row <!-- longclaw:item=ck_0dac1855 -->
- [ ] Log each live post in tracker.csv at post time: URL, UTM, type, hook, and timestamp <!-- longclaw:item=ck_b1c27fd7 -->
- [ ] At 24h and 7d, pull stats into stats/, update tracker.csv, and add that week's Beehiiv UTM export <!-- longclaw:item=ck_1c6abac2 -->
- [ ] Write the five-line WEEKLOG: what converted, what got replies and no signups, what to reuse, what to drop <!-- longclaw:item=ck_49fe4212 -->
- [ ] Keep post types, days, and times stable, and run the blind test for 6-8 weeks before calling a winner <!-- longclaw:item=ck_ed1893dc -->
- [ ] Sunday T0: launch post with three bullets, issue link, pin for about 24 hours, and 30-60 minutes in the replies <!-- longclaw:item=ck_7459d5c4 -->
- [ ] Sunday T+3-6h: leftovers thread of 6-8 tweets, subscribe link only on the last tweet <!-- longclaw:item=ck_bcef02d1 -->
- [ ] Sunday T+8-24h: one repo or launch card, link in a self-reply only if the post moves <!-- longclaw:item=ck_204547ac -->
- [ ] Monday to Saturday: 5-7 original posts from the section table, with the link in a reply <!-- longclaw:item=ck_5b0731c9 -->
- [ ] Reply in two daily blocks on the list: add a constraint, a missed source, or a contrast, and save links for a second reply <!-- longclaw:item=ck_1ab960e2 -->
- [ ] Quote viral AI posts that belong in the issue, with a sharp first line <!-- longclaw:item=ck_f9bcba5e -->
- [ ] Tag the maker in every post about their work <!-- longclaw:item=ck_89b23aeb -->
- [ ] Each week, send the top 5 makers a Featured-in card by reply or DM, with no ask, and count maker reposts <!-- longclaw:item=ck_ddc46b78 -->
- [ ] Ship one lead magnet through a Beehiiv subscribe flow: sample pack, top repos of the month, or the 45-minute filter <!-- longclaw:item=ck_ec01e4e9 -->
- [ ] Self-reply with the subscribe link and one extra item on any post that draws real replies or a view spike <!-- longclaw:item=ck_ef354457 -->
- [ ] Run the weekly scorecard: utm_source=x subscribers by medium, subscribers per 1,000 views by post type, and the X cohort's 30-day open rate <!-- longclaw:item=ck_7d2ac450 -->
- [ ] After the cadence is real, keep the 1-2 formats that converted and retire formats with views and no signups <!-- longclaw:item=ck_6c65eab9 -->
- [ ] Arrange one cross-promo swap with an AI newsletter of similar size <!-- longclaw:item=ck_ab7a7a60 -->
- [ ] Publish the first pattern post from the pipeline data <!-- longclaw:item=ck_d9e228c7 -->
- [ ] Refresh the evergreen pin with a real subscriber count or forward count <!-- longclaw:item=ck_e8ddde88 -->
- [ ] Generate the issues/ file and the maker cards from the curation pipeline <!-- longclaw:item=ck_701f9bcf -->
- [ ] Put chosen posts into a scheduler (X or Typefully) so a review step stays in front of publishing <!-- longclaw:item=ck_104402cb -->
- [ ] Add the "seen on X this week" block to the newsletter issue <!-- longclaw:item=ck_fabdf673 -->
- [ ] Batch Sunday's posts on Saturday night <!-- longclaw:item=ck_826a240f -->
- [ ] Call the model test from 6-8 weeks of tracker rows and settle whether one model drafts, or the best lines get merged <!-- longclaw:item=ck_d0d255d7 -->
- [ ] After 4 weeks of traceable organic signups, decide on a capped ads test of the best thread with utm_medium=ad <!-- longclaw:item=ck_27cb9d51 -->

## Activity

<!-- longclaw:event
id: evt_0bc27e66
kind: create
occurred_at: 2026-09-28T10:26:34.855Z
actor:
  type: agent
  id: grok
  name: Grok
-->
### Grok created this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_35106678
kind: comment
occurred_at: 2026-09-28T10:27:06.195Z
actor:
  type: agent
  id: grok
  name: Grok
-->
### Grok commented

Execution branch is aib-60t-x-growth, cut from main at aa05d7fd. Checklist is the playbook's 30/60/90 plus the Grok 4.7 vs Claude Opus 5.5 blind test. The ticket file is uncommitted on that branch.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_a1d39841
kind: update
occurred_at: 2026-09-28T10:33:04.996Z
actor:
  type: human
  id: local
changes:
  - field: status
    from: todo
    to: in_progress
-->
### You updated this ticket
<!-- /longclaw:event -->
