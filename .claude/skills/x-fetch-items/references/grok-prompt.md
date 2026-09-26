# Grok prompt

Paste the block below into Grok. Replace `{{AFTER}}` and `{{BEFORE}}` with the
week's window (`after` inclusive, `before` exclusive, both `YYYY-MM-DD`).
`/x-fetch-items` fills them in when it hands the prompt over. Grok returns two
lists of posts, and the skill flattens them into `posts` and adds the
envelope. The post shape must stay in sync with `x-data.md`.

````text
Search X for posts about AI posted from {{AFTER}} up to (not including) {{BEFORE}}, and return them in two separate lists.

Audience: a weekly newsletter read by software developers and startup founders building with AI.

LIST 1 — "announcements": up to 10 official announcements from AI companies, labs, or product accounts (OpenAI, Anthropic, Google, Meta, xAI, NVIDIA, Mistral, and similar): model releases, benchmark results, pricing changes, product or open-source launches, and feature or policy updates, including those posted by a company's developer-relations or staff accounts. Keep only the original announcement from the official account, not reactions or reposts of it. If a company posted several times about the same launch, keep the most-liked one and list the others under "also_covered".

LIST 2 — "insights": up to 20 posts with practical value for people building with AI, from anyone, including company developer-relations accounts. This covers how-tos and tips, prompting and agent-harness advice, lessons learned from shipping, real demos that give numbers (cost, time, results), useful open-source tools, and sharp takes from builders, founders, or researchers. Do NOT include launch announcements, reactions to launches, hype, or predictions with no practical takeaway. A post that announces a feature, product, pricing, or policy change belongs in "announcements" even when it comes from a developer-relations account or a company employee. A demo counts only if the post itself contains what it promises (the prompt, the numbers, the result), not just "full prompt below". If several posts make the same point, keep the most-liked one and list the others under "also_covered".

Both lists:
- 500+ likes.
- Original posts only, no replies. A quote post counts only when its added commentary is what went viral.
- English only.
- Exclude engagement bait, giveaways, crypto/token shilling, AI-generated spam threads, and consumer-only content (AI art showcases, celebrity deepfakes, meme reactions). Exclude posts with profanity, even when letters are starred out.
- Rank each list by likes, highest first, breaking ties by reposts. Check the order before replying. Return fewer if fewer qualify.
- A post appears once. If you list it under another post's "also_covered", don't also list it on its own.

Rules:
- Only include posts you actually found in search results. Every URL must be a real post URL you retrieved. Never construct or guess a URL.
- Copy the text verbatim: the full post as posted. Don't shorten, paraphrase, or fix typos. Keep line breaks and emoji. Copy the author's display name exactly as shown.
- Links: write every link in the text as its full destination URL, never as a t.co link. If the post has a link card (text often ends with "Read more:" or similar), put the card's full destination URL in "link_url". Otherwise set it to null.
- Engagement numbers must be exactly as shown on the post. If you can't see a number, use null. Never estimate.

Reply with one JSON code block containing only the object below. After it, add two short markdown tables, one per list (rank, author, first line of the post, likes), so I can skim them.

{
  "announcements": [ <post>, ... ],
  "insights": [ <post>, ... ]
}

where each <post> is:

{
  "bucket": "announcement | insight",
  "rank": 1,
  "url": "https://x.com/<handle>/status/<id>",
  "author_handle": "@...",
  "author_name": "...",
  "author_type": "person | company",
  "posted_at": "YYYY-MM-DD",
  "kind": "post | quote",
  "text": "full post text, verbatim",
  "quoted_post": { "url": "...", "author_handle": "@...", "text": "verbatim" } or null,
  "media": "none | image | video | gif | link",
  "link_url": "full URL of the link card" or null,
  "likes": 0,
  "reposts": 0,
  "replies": 0,
  "views": 0,
  "category": "launch | dev-tool | open-source | research | startup-news | policy | opinion | demo",
  "why_viral": "one line on why it spread",
  "why_it_matters": "one line on why a developer or founder should care",
  "also_covered": ["url", "..."]
}
````
