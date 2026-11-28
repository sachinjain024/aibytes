---
format: longclaw.ticket/v1
id: b3f31423-0e32-47d9-b600-29d771485dbc
key: AIB-155h
title: Publish an RSS feed and announce it for Readwise and other readers
status: todo
priority: p2
labels:
  - app
  - marketing
type: feature
created_at: 2026-11-27T11:33:24.253Z
updated_at: 2026-11-27T11:33:24.253Z
---

Publish an RSS feed of aiBytes_ content so readers can follow it in Readwise Reader, Feedly, NetNewsWire, Reeder and similar apps. Then announce it the same way we are introducing the Chrome extension: a feature in the weekly newsletter, plus a short how-to that names the apps.

The product spec already lists "RSS of the daily edition" as Phase 3 / v1.1 (`docs/aibytes-app-product-spec.md` §12). Gists (AIB-145y) and the daily runner make that cheap to ship now: the writing already lives at stable URLs on aibytes.io.

## Goal

- **Outcome.** A public feed at a stable URL on aibytes.io (for example `https://aibytes.io/rss.xml`) that updates whenever a new edition or gist lands. A reader pastes that URL into Readwise (Add feeds, Shift+A) and new items arrive in their Feed.
- **Who.** Existing newsletter readers who already live in a read-later app; people who save a gist and see Readwise's Subscribe button because the page advertises the feed; builders who never open the site or the extension and still want the daily roundup.
- **Why now.** Gists are original, full-text pages (`aibytes.io/gists/<slug>`). That is the content Readwise is built to ingest. The Chrome extension is being introduced in Issue #20 (AIB-154m / AIB-152d); RSS is the next "read aiBytes where you already are" surface, and it needs no store review.
- **Success.** The feed is subscribed to from Readwise and at least one other reader; a newsletter issue carries the announcement; gist pages expose the feed so Readwise can auto-detect it.

## What is true today

- Daily editions: `content/editions/YYYY-MM-DD.json`, items with a one-line `summary` and a `gist` slug when one exists.
- Gists: `content/gists/<slug>.json` with `lede` and `sections`, rendered as pages at `/gists/<slug>`. Full gists are already in `sitemap.xml` (`apps/web/src/buildGistSite.js`).
- Weekly issues: on aibytes.io at `/weekly/issue-N`, and on Substack. Substack already exposes `https://aibytesnewsletter.substack.com/feed` (or the custom-domain equivalent). That is the weekly email archive, not the daily gist stream.
- Hosting: GitHub Pages from the Vite static build. New content on `main` rebuilds the site. No RSS or Atom file exists; pages have no `<link rel="alternate" type="application/rss+xml">`.
- Footer (`apps/web/src/footer.js`): Chrome Extension, Weekly Archive, GitHub, Advertise, Privacy. No RSS link.
- Readwise Reader: subscribe by pasting a feed URL, or by saving a page on a domain that advertises a feed (it then shows Subscribe). It imports the five most recent documents on first subscribe. Full-text RSS parses better than title-only. Substack RSS is already how many people get newsletters into Reader.

## Product choice (decide before building)

The spec says "RSS of the daily edition." For Readwise, the better default is **gists**, because they are the prose we wrote. Edition rows are one-line summaries that send the reader off-site.

Recommended v1:

1. **Primary feed: new gists**, newest first. Each item's `link` is `https://aibytes.io/gists/<slug>`. Body is the gist (`lede` + sections) as HTML in `content:encoded`, so Readwise and other readers show the page without fetching. Skip hidden items, the same way gist pages do (`shownGists`). Cap the file at a recent window (for example 30 days or the last N gists) so it stays small.
2. **Keep Substack's feed as the weekly issue.** Do not duplicate the Monday email into this file.
3. **One URL in v1.** Category feeds (news / launches / repos / hn) can wait.

Open if the publisher wants them in v1:

- A second, compact feed of daily edition items (title + summary + gist or source link), for people who want the roundup rather than the gist.
- Weekly-issue items as a separate feed. Low value while Substack RSS exists.

## How we build it

Same pattern as the sitemap: generate the XML in the web static build from `content/`, so every edition push refreshes the feed. Do not add a runner step unless the build cannot see the files.

- RSS 2.0 with Atom `rel=self` is enough; most readers accept it. GitHub Pages serves `.xml` as `application/xml`, which is fine.
- Put `<link rel="alternate" type="application/rss+xml" title="aiBytes_" href="https://aibytes.io/rss.xml">` on the site, gist pages, and edition pages so Readwise and browsers can discover it.
- Add an RSS row to the footer, next to Chrome Extension and Weekly Archive.
- Hide flags and `validate.py` still apply: a hidden item must not appear.
- Tests: a fixture edition/gist set produces a stable XML shape; hidden gists are absent; links are absolute `aibytes.io` URLs.

Spec and a short decision record under `docs/specs/` and `docs/decisions/product/`, named for this ticket. Update product spec §12 so RSS is no longer only a v1.1 bullet.

## Marketing (same shape as the Chrome extension)

The extension split the work: AIB-76n ships the product, AIB-152d launches it, Issue #20 (AIB-154m) introduces it in the newsletter. RSS is smaller, so launch stays on this ticket, but the **copy waits until the feed is live and checked in Readwise**.

Channels, in order:

1. **Weekly newsletter feature**, in the issue that follows the feed going live. Same slot as "Introduce the aiBytes_ Chrome extension to readers" on AIB-154m: a short intro beat plus a how-to (paste this URL into Readwise / Feedly / your reader). Not a whole issue about RSS.
2. **A standalone Substack post (optional, recommended).** A permalink: "You can read aiBytes_ in Readwise." Title, the feed URL, three short steps for Readwise, a mention of Feedly / NetNewsWire / Reeder, and that the weekly email still has its own Substack feed. This is the thing the footer, social posts and later issues can link. It is a how-to, not a product launch on Product Hunt.
3. **On-site.** Footer link + autodiscovery. That is what makes Readwise's Subscribe button appear when someone saves a gist.
4. **Social.** One X post and one LinkedIn post once the newsletter item exists, pointing at the how-to (or the issue). Reuse the generate-followup-social-content skill if the publisher wants them as follow-ups to that issue.
5. **Directories.** Only if cheap: a couple of RSS / newsletter directories. Not Product Hunt, HN or Reddit unless the post is genuinely the how-to and the publisher wants that extra reach.

Do not promise Readwise as a partner. We publish a normal RSS file; their app happens to consume it well.

## Not in this ticket

- Changing gist prose, the edition JSON contract, or the Chrome extension.
- A native Readwise or Matter integration, or any API beyond RSS.
- Paywalled or subscriber-only feeds.
- Backfilling years of gists into the XML file (the live window is enough; archive stays on the site and in the sitemap).

## Depends on

- Gists shipping (AIB-145y, done).
- Daily editions continuing to publish to `main` so the Pages build refreshes the file.

## Checklist

- [ ] Decide v1 feed contents: gists as primary, whether a compact edition feed is in v1 <!-- longclaw:item=ck_31d69115 -->
- [ ] Write spec and product decision record; update product spec §12 <!-- longclaw:item=ck_e06e312a -->
- [ ] Generate RSS 2.0 in the web static build (same path as sitemap.xml) <!-- longclaw:item=ck_7a9cd3ad -->
- [ ] Add autodiscovery link on site, gist and edition pages <!-- longclaw:item=ck_cec2525c -->
- [ ] Add an RSS link to the aibytes.io footer <!-- longclaw:item=ck_f8459579 -->
- [ ] Tests: shape, hidden items omitted, absolute aibytes.io links <!-- longclaw:item=ck_7173b6a6 -->
- [ ] Subscribe in Readwise Reader and one other app (Feedly or a desktop reader) and confirm new gists arrive <!-- longclaw:item=ck_e3e33e41 -->
- [ ] Newsletter feature in the issue after the feed is live, same slot as the Chrome extension intro <!-- longclaw:item=ck_a3331189 -->
- [ ] Optional standalone Substack how-to: read aiBytes in Readwise, with the feed URL and steps <!-- longclaw:item=ck_36902631 -->
- [ ] X and LinkedIn posts once the newsletter item exists <!-- longclaw:item=ck_02f47af1 -->

## Activity

<!-- longclaw:event
id: evt_aefe59f2
kind: create
occurred_at: 2026-11-27T11:33:24.253Z
actor:
  type: agent
  id: grok
  name: grok
-->
### grok created this ticket
<!-- /longclaw:event -->
