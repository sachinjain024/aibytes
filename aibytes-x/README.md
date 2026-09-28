# aibytes-x

Working files for growing aiBytes_ on X. The strategy lives in
`docs/aibytes - X/cc-aibytes-x-playbook.md`. The execution ticket is AIB-60t.

This folder is the log. Drafts, what actually went out, and the weekly
numbers all stay here, in git.

```
drafts/<year>-W<week>/     posts not yet sent
published/                 the text that went out, after edits
stats/                     snapshots at 24h and 7d, plus the profile baseline
tracker.csv                one row per live post
signups.csv                weekly Beehiiv UTM export
WEEKLOG.md                 five lines a week
```

`drafts/` holds a named file per post (`jev-take-grok.md`). The blind test, once
it is running, uses `A/`, `B/`, and `key.md` inside the week folder. A draft
written by one model in the open stays a named file, so it is not mistaken
for a blind pick.

A row goes into `tracker.csv` when a post is live, not when it is drafted.
Columns: `posted_at,issue,url,type,utm_medium,utm_content,base_model,blind_pick,edited,hook,views_24h,views_7d,replies,quotes,reposts,bookmarks,profile_clicks,link_clicks,subs_attributed,notes`.
