# Spec: `gist-analytics`, measuring traffic on aibytes.io

- **Ticket:** AIB-145y, task T1 (checklist 4.1)
- **Parent spec:** `docs/specs/AIB-145y-gists.md`, module `gist-analytics`
- **Status:** approved 12 Nov 2026: Umami Cloud picked (P1), with Google Search Console for search, and no Google Analytics

## Objective

The gists feature succeeds if traffic on gist pages is visible and growing
(parent spec, "Success"). Today aibytes.io runs no analytics, and `/privacy`
says so. This module adds one free tool that sets no cookies, before any gist
exists, so there is a baseline to compare against.

The publisher must be able to answer, per path and per day:

1. How many visits did it get?
2. Where did they come from: the newsletter, a social post, search, or
   aibytes.io itself?
3. How often is a gist opened in the panel rather than as a page?

## Requirements

| # | Requirement | Why |
|---|---|---|
| R1 | Free at our traffic | The parent spec says "a free tool" |
| R2 | No cookies and nothing written to the reader's storage | No consent banner; `/privacy` stays short |
| R3 | Page views per path, and referrers | Questions 1 and 2 |
| R4 | Reports `utm_source`, `utm_medium`, `utm_campaign` | Newsletter and social links are tagged (question 2) |
| R5 | A custom event with a value (the gist's slug) | Panel opens (question 3) |
| R6 | Counts client-side navigation | The app moves between editions with `history.pushState` (`App.jsx`) |
| R7 | One script tag from a hosted service | GitHub Pages serves static files only; nothing to run ourselves |

## Candidates, checked 12 Nov 2026 against each tool's own pages

| | Umami Cloud, Hobby | GoatCounter (hosted) | Cloudflare Web Analytics | PostHog Cloud | Plausible |
|---|---|---|---|---|---|
| R1 free | Yes: $0, 100K events a month, 1 site, 6 months' data | "Free for reasonable public usage"; no number published | Yes | Free tier exists (not checked in depth) | No free plan as far as I know; its pricing page returned 404 when checked, so this is unconfirmed |
| R2 no cookies | Yes: "Umami's web tracker does not use cookies" | Yes: "without cookies or persistently storing any personal data" | Not stated | Only with `persistence: "memory"`, which makes each page load a new visitor | — |
| R3 paths, referrers | Yes | Yes | Yes | Yes | — |
| R4 UTM | Yes: a UTM report splitting all five tags | Yes: campaigns from `utm_campaign`, sources from `utm_source` | **No**: "do not log query strings" | Yes | — |
| R5 custom event with data | Yes: `umami.track("name", { … })` | Partly: an event is a path name, no attached data | **No**: "Not yet" | Yes | — |
| R6 pushState | Yes: "path change detection" by default | Manual: needs a `count()` call on each navigation | — | Yes | — |
| R7 one script tag | Yes | Yes | Yes | Yes, a larger script | — |

**Out:** Cloudflare (no UTM, no events), Plausible (not free), PostHog (to
skip cookies it has to forget visitors between pages, so unique visits stop
meaning anything, and its script is much larger than we need).

## Recommendation: Umami Cloud, Hobby plan

It is the only candidate that meets all seven requirements as documented. It
counts the app's client-side navigation without code, reports UTM tags with no
setup, and takes the gist slug as event data.

**The limit to watch:** 100K events a month, page views and custom events
together. aibytes.io's traffic today is unknown, which is why this module
exists. If the first month approaches the cap, the fallback is GoatCounter. Its
page-view and campaign reporting covers questions 1 and 2. Panel opens would
be counted as an event path (`gist-panel/<slug>`), and navigation needs a small
manual `count()` call. Because every call goes through `analytics.js`, the
switch is one file and one script tag.

**Runner-up if the publisher prefers no account limits:** GoatCounter, for
the same reasons as the fallback.

## Google Search Console, and why not Google Analytics

Asked on 12 Nov 2026, so recorded here.

- **Search traffic comes from Search Console, not from the analytics tool.**
  Search Console gets its numbers from Google directly: the searches that
  showed a page, impressions, clicks, position, and how many pages are
  indexed and why some are not. It needs no script on the site and does not
  depend on Google Analytics. Linking GA only shows the same search reports
  inside GA.
- **No Google Analytics.** GA sets cookies, so EU and UK visitors would need
  a consent banner, which breaks R2. Its numbers would also disagree with
  Umami's. Its strengths are audiences and ads, which belong to monetization,
  and monetization is out of scope.
- **The publisher's step (P8, after T25 publishes `sitemap.xml`):** add
  `aibytes.io` as a **domain property** in Search Console, verified by a DNS
  TXT record at the domain's registrar, then submit
  `https://aibytes.io/sitemap.xml`. Verifying by DNS adds nothing to the
  site's code and covers every subdomain and both `http` and `https`.
  Optionally, import the property into Bing Webmaster Tools.
- **What to watch from week one:** in the page-indexing report, how many
  `/gists/` pages are indexed, and any marked "Crawled, currently not
  indexed". That is the parent spec's thin-content risk showing up. `brief`
  and preview gists should show as "Excluded by 'noindex' tag", as intended.

## How it is wired

**The tag.** One `<script defer>` in `apps/web/index.html` with the snippet
Umami gives when the site is created, plus:

- `data-domains="aibytes.io"`. The tracker runs only on the live site, so
  `npm run dev:web`, previews and local builds record nothing. This is what
  "skipped on localhost" in T2 means.
- No `data-exclude-search`. The query string carries the UTM tags. It also
  carries `?gist=<slug>` once the panel ships (T28), so a panel open is
  counted as a view of the edition with that query, on top of the event.

Every page the build writes starts from `index.html` (`editionPages()` in
`vite.config.js`), so editions, weekly issues, `/saved`, `/privacy` and, in
T25, gist pages all carry the tag with no extra work.

**The website id is public by design.** It sits in the page source of every
site that uses Umami and grants no access to the dashboard. It goes in
`index.html` as a plain attribute, not in `.env`. The repo rule about secrets
still applies to anything else: the Umami login stays with the publisher.

**`apps/web/src/analytics.js`:**

```js
// The only place the app talks to the analytics tool (AIB-145y gist-analytics).
// A no-op when the script is absent, blocked or still loading.
export function track(name, data) {
  try {
    const umami = globalThis.umami;
    if (umami && typeof umami.track === "function") umami.track(name, data);
  } catch {
    // Never let measurement break the page.
  }
}
```

**Events (only one in release 1):**

| Event | Data | Sent by | Task |
|---|---|---|---|
| `gist-panel-open` | `{ slug, page }`, where `page` is `daily` or `weekly` | the panel opening from a card | T29 |

Event names are kebab-case and listed in this table before they are sent.

## Link tags for the newsletter and social posts

Every link the publisher posts to aibytes.io carries three tags:

| Where the link is posted | `utm_source` | `utm_medium` | `utm_campaign` |
|---|---|---|---|
| The weekly newsletter | `newsletter` | `email` | `issue-<N>`, e.g. `issue-19` |
| X | `x` | `social` | the gist slug, or `issue-<N>` for an issue link |
| LinkedIn | `linkedin` | `social` | as for X |

Example: `https://aibytes.io/gists/hn-tinyeval?utm_source=newsletter&utm_medium=email&utm_campaign=issue-19`.

Values are lower case with no spaces, so the report does not split one source
into two. `newsletter-gist-links` (T35) builds the newsletter's links from
this table. Social links are tagged by hand until a skill writes them.

## What `/privacy` says (for P2)

The current "Reading" paragraph says the site "sets no cookies and runs no
analytics". The proposed replacement:

> aiBytes_ sets no cookies. To see which pages are read and where readers come
> from, it uses Umami, a privacy-focused analytics service that also sets no
> cookies and stores nothing in your browser. It records the page address,
> the site that linked to it, and your browser, operating system, device type
> and country; it does not record who you are, and it is not used for
> advertising. The site is hosted on GitHub Pages; its fonts come from Google
> Fonts, and item images from the sites they belong to, such as GitHub,
> TechCrunch and Product Hunt. Like any web request, those services see your
> IP address and browser.

The "Last changed" date moves to the day T3 ships. The comment above
`PrivacyApp` ("no cookies or analytics of the site's own") changes to match.
The product spec's analytics line, "Plausible or PostHog", is replaced by a
pointer to this spec.

**Before T3 ships, check:** that the fields listed above match what Umami's
own privacy and data pages say it collects, worded no more broadly than they
do. This spec has not verified that list yet.

## Tests

- `apps/web/src/analytics.test.js` (`node --test`): `track` does nothing
  with no `umami` global; calls `umami.track` with the name and data when
  present; does not throw when `umami.track` throws.
- A build check, for example in `tests/test_pages_workflow.py` or a web
  test: after `npm run build:web`, `dist/index.html`, one edition page and
  `dist/privacy/index.html` each contain the tag with `data-domains`.
- By hand, after merge (Checkpoint A): visits show in the Umami dashboard,
  and DevTools shows no cookie and no storage write from the tracker.

## Boundaries

- **Always:** route every event through `track()`; list an event here before
  sending it; keep the tag limited to `aibytes.io`.
- **Ask first:** adding an event, a second tool, or anything that identifies
  a signed-in reader to the analytics tool.
- **Never:** send an email address, a Firebase uid, or a save list to the
  analytics tool; set a cookie; add a consent banner instead of choosing a
  tool that needs none.

## Success criteria

1. The publisher has picked the tool (done: Umami) and created the site (P1).
2. Every built page carries the tag, and it does nothing off `aibytes.io`.
3. `track()` is tested and never throws.
4. `/privacy` describes the tool in words the publisher approved (P2).
5. Within a day of the merge, the dashboard shows page views by path,
   referrers, and a test visit that has UTM tags.

## Open questions

1. **P2:** the `/privacy` wording above, approved at T3 once the field list
   is checked against Umami's own pages.

Answered 12 Nov 2026: **P1**, Umami Cloud; Search Console added as P8; no
Google Analytics.

## Sources

- Umami pricing, Hobby plan: https://umami.is/pricing
- Umami FAQ, cookies: https://docs.umami.is/docs/faq
- Umami tracker functions, `umami.track`: https://docs.umami.is/docs/tracker-functions
- Umami tracker configuration, `data-domains` and path change detection: https://docs.umami.is/docs/tracker-configuration
- Umami UTM report: https://docs.umami.is/docs/utm
- GoatCounter, free use and cookies: https://www.goatcounter.com/
- GoatCounter campaigns: https://www.goatcounter.com/help/campaigns
- GoatCounter events: https://www.goatcounter.com/help/events
- GoatCounter in a single-page app: https://www.goatcounter.com/help/spa
- Cloudflare Web Analytics FAQ, events and query strings: https://developers.cloudflare.com/web-analytics/faq/
- PostHog persistence: https://posthog.com/docs/libraries/js/persistence
