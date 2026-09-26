# X data contract (`x_data.json`)

The data behind two newsletter sections:

- **Loudest on X**: practical posts for builders (`bucket: insight`).
- **Official Announcements**: model releases, benchmarks, and pricing and
  launch news straight from AI companies (`bucket: announcement`). Once an
  announcement lands here, no other section covers it. AI News keeps the
  reporting around it.

Unlike every other source, this data is not fetched by a script. The publisher
runs the prompt in `grok-prompt.md` (or a saved Grok task) and pastes Grok's
JSON into `/x-fetch-items`. Grok returns `{announcements, insights}`. The skill
flattens both lists into `posts`, wraps them in the envelope (it already knows
the window and dates), saves the file, and adds `shortlist` once the publisher
has reviewed it. This file is the contract between the Grok prompt,
`/x-fetch-items`, and `/generate-newsletter-content`.

## Where it lives

```
newsletter/data/{yyyy}/{mm}/weeks/week-NN/x/x_data.json
```

It goes in the **same `week-NN` folder as that issue's other snapshots**
(`github/`, `news/`, `producthunt/`), next to them. The file is optional. If
it's missing, the issue has neither section.

## Shape

```json
{
  "source": "x",
  "section": "loudest-on-x",
  "fetched_at": "2026-09-26",
  "fetched_via": "grok",
  "window": { "after": "2026-09-19", "before": "2026-09-26" },
  "ranking": "likes",
  "shortlist": {
    "insight": ["https://x.com/example/status/1234567890123456789"],
    "announcement": ["https://x.com/somelab/status/1234567890000000000"]
  },
  "posts": [
    {
      "bucket": "insight",
      "rank": 1,
      "url": "https://x.com/example/status/1234567890123456789",
      "author_handle": "@example",
      "author_name": "Example Person",
      "author_type": "person",
      "posted_at": "2026-09-22",
      "kind": "post",
      "text": "Three things that made our coding agent reliable: ...",
      "quoted_post": null,
      "media": "none",
      "link_url": null,
      "likes": 4210,
      "reposts": 380,
      "replies": 95,
      "views": 512000,
      "category": "dev-tool",
      "why_viral": "A concrete, repeatable checklist from someone running agents in production.",
      "why_it_matters": "Directly reusable harness advice for anyone shipping a coding agent.",
      "also_covered": []
    }
  ]
}
```

The example is a placeholder, not a real post. This repo is public, so real
examples live only in the dated snapshots.

### Envelope

| Field | Type | Rule |
|---|---|---|
| `source` | `"x"` | Fixed. |
| `section` | `"loudest-on-x"` | Fixed. The file's name for itself, even though it feeds two sections. |
| `fetched_at` | `YYYY-MM-DD` | The day the Grok prompt was run. Counts are a snapshot as of that day. |
| `fetched_via` | `"grok"` | How the data was gathered. Keeps the door open for a script later. |
| `window` | `{after, before}` | The 7 days covered: `after` inclusive, `before` exclusive. |
| `ranking` | `"likes"` | What `rank` is ordered by within each bucket: likes descending, ties broken by reposts. |
| `shortlist` | object or absent | `{insight: [...], announcement: [...]}`, the post `url`s that go into the issue, in display order: **5** insights and **3–5** announcements. `/x-fetch-items` adds it, since Grok never writes it. If it is absent, nothing has been shortlisted yet. |
| `posts` | array | Every post Grok returned: up to **10** announcements, then up to **20** insights, each group in `rank` order. The full pool is kept even after shortlisting. |

### Post

| Field | Type | Required | Rule |
|---|---|---|---|
| `bucket` | enum | yes | `announcement` (the original official post about a release, benchmark, price change, or launch) or `insight` (practical value for builders, from anyone). |
| `rank` | int | yes | 1-based **within its bucket**, matching the `ranking` order. |
| `url` | string | yes | `https://x.com/{handle}/status/{id}`. The canonical post URL, with no query string. |
| `author_handle` | string | yes | With the leading `@`. |
| `author_name` | string | yes | Display name exactly as shown on X. |
| `author_type` | enum | yes | `person` (a builder, founder, or researcher) or `company` (an official company, lab, product, or dev-rel account). An insight can come from a company account. |
| `posted_at` | `YYYY-MM-DD` | yes | Must fall inside `window`. |
| `kind` | enum | yes | `post` or `quote`. Replies are excluded. A quote post qualifies only when its added commentary is what went viral. A thread counts as its first post. |
| `text` | string | yes | **The full post text exactly as posted:** no truncation, no paraphrase, no fixed typos. Line breaks and emoji are kept. Links are written as the full destination URL, never `t.co`. |
| `quoted_post` | object or `null` | when `kind` is `quote` | `{url, author_handle, text}` for the post being quoted, with `text` also verbatim. A quote post often means nothing without it. |
| `media` | enum | yes | `none`, `image`, `video`, `gif`, or `link`. What is attached. The layout needs to know, because email can't embed the media. |
| `link_url` | string or `null` | yes | The full destination of the post's link card. The card isn't part of `text`, which is why posts often end with "Read more:". |
| `likes`, `reposts`, `replies` | int | yes | Counts as of `fetched_at`. |
| `views` | int or `null` | yes | `null` when X doesn't show a count. |
| `category` | enum | yes | `launch`, `dev-tool`, `open-source`, `research`, `startup-news`, `policy`, `opinion`, or `demo`. |
| `why_viral` | string | yes | One sentence from Grok on why the post spread. **Context for the editor, never shown as fact.** |
| `why_it_matters` | string | yes | One line from Grok on why a developer or founder should care. The main input for the skill's own context line, but it is also Grok's claim, so check it first. |
| `also_covered` | string[] | no | Other qualifying posts about the same story or point that Grok merged into this one. The skill uses them to dedupe. |

## Shortlisting

`/x-fetch-items` shortlists each bucket separately.

**Both buckets:**

1. **Remove posts that fail the check:** the link is dead, the text doesn't
   match X, the date is outside the window, it has under 500 likes, it has
   profanity (starred-out words count), it's a reply, or it's in the wrong
   bucket (a launch post among the insights, or a reaction among the
   announcements). Move a post that's in the wrong
   bucket rather than dropping it.
2. **Merge any duplicates Grok missed.** Posts about the same story or point
   (linked by `also_covered`, the same `quoted_post`, or the same subject)
   keep only the one with the most likes.

**Insights: 5 posts for Loudest on X**

3. **Take the top 5 by likes, one post per account,** with **at most 2 from
   company accounts.** When a post would break either limit, skip it and take
   the next one.

**Announcements: 3–5 posts for Official Announcements**

3. **Take the top 3–5 by likes, one launch per company.** All of a company's
   accounts count as one (for example `@AnthropicAI`, `@claudeai`, and
   `@ClaudeDevs`). Stop at 3 in a quiet
   week. Go up to 5 only when each one is a release builders would switch
   to, test, or re-price for.

The publisher can override either list, and their choice wins. Deduping
against the rest of the issue happens in `/generate-newsletter-content`: a
shortlisted announcement's story is dropped from AI News, not the other way
round.

## Rules the skills rely on

- **Verbatim text.** `text` and `quoted_post.text` are shown as they are. The
  skill chooses which posts to show and in what order, and may add its own
  context line, but it never edits a post's words.
- **Nothing is invented.** A field Grok could not fill is left `null`, never
  guessed. Every shortlisted post is opened on X before the issue is built. A
  post whose `url` does not open is removed. Where Grok's `text` or
  `posted_at` differs from X, it is corrected to what X shows, since X is the
  source of truth for "verbatim".
- **Counts are Grok's.** They are shown with the post but are as of
  `fetched_at`, so they will drift.
