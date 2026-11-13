# Spec: `app-gist-pages`, a page for every gist

- **Ticket:** AIB-145y, task T23
- **Parent spec:** `docs/specs/AIB-145y-gists.md`, module `app-gist-pages`
- **Builds on:** `AIB-145y-gist-contract.md` (the gist file), `AIB-145y-ledger-gist-ui.md`
  (`GistView`), `AIB-145y-gist-analytics.md` (Search Console, P8)
- **Status:** proposed 13 Nov 2026, for the publisher's approval. Three choices
  are marked **Decide** and each has a recommendation.

## Objective

Every gist that is shown gets a real page at `https://aibytes.io/gists/<slug>`.
The page reads in full with JavaScript off, has its own title, description,
canonical address and share tags, and takes over in the browser without a
flash. Search engines index `full` gists only. A sitemap and a `robots.txt`
tell them where the pages are.

This spec covers T24 (route and head), T25 (build output, sitemap, robots) and
T26 (the page in the app). The panel is a separate module.

## Route

`/gists/<slug>` in `route.js`: `{ kind: "gist", slug }`. The slug is lower case
letters, digits and hyphens, as the gist file name is. A trailing slash is
accepted. Anything else under `/gists/` is `notfound`. `/gists` itself is
`notfound` too: there is no index page in this ticket.

A gist with no page (hidden, or no such file) is a 404, the same as any other
unknown address. The app shows its not-found screen for it.

## The head, per depth

`gistHead(gist)` in `pageMeta.js` returns what `withHead` already takes, plus
`jsonLd` and `image`.

| Part | Value |
|---|---|
| Title | `<gist title> · aiBytes_` **(Decide 1)** |
| Description | The `lede`, cut at a word boundary to 155 characters with an ellipsis when longer. A `preview` has no lede: `<author name> on X: <post text>`, cut the same way. |
| Canonical | `https://aibytes.io/gists/<slug>`, no trailing slash, as `weeklyUrl` is. |
| Open Graph | `og:type` `article`, `og:site_name`, `og:title`, `og:description`, `og:url`, and `og:image` when the gist's `image` has a `url`. `twitter:card` is always `summary`, never `summary_large_image`: the images are 40px accents, not share cards. |
| `robots` | `noindex` unless `depth` is `full`. Canonical and Open Graph stay on every page, so a `brief` or `preview` page still shares well. |
| JSON-LD | `full` only. Described below. |

Every value is escaped for HTML attributes, and the JSON-LD for `</script`
and `<!--`, so a title that holds a quote, an angle bracket or `</script>`
cannot break out of its tag.

### JSON-LD

One `Article` block on `full` pages, none on `noindex` pages (nothing to rank,
and it would invite a rich result for a page we ask engines to skip):

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "<title>",
  "description": "<the description above>",
  "datePublished": "<created_at>",
  "dateModified": "<updated_at>",
  "mainEntityOfPage": "https://aibytes.io/gists/<slug>",
  "isBasedOn": "<source_url>",
  "author": { "@type": "Organization", "name": "aiBytes_", "url": "https://aibytes.io" },
  "publisher": { "@type": "Organization", "name": "aiBytes_", "url": "https://aibytes.io" }
}
```

`isBasedOn` says plainly that the page summarises another page, which is what
the parent spec's thin-content risk calls for. No `Review`, `Rating`,
`SoftwareApplication` or `Product` type: a gist does not review or sell
anything, and a wrong type risks a manual action. **(Decide 2)**

## Server markup

The build writes `dist/gists/<slug>/index.html` for every shown gist (shown
as `gistIsShown` says, from the edition and issue files the build already
reads). Each page is the app's `index.html` with:

- the head above, through `withHead`;
- `<div id="root">` filled with the rendered `GistPage`: the header, a back
  link to the first appearance's edition or issue, `GistView as="page"`, and
  "More from" (up to four items of that edition or issue, ranked, as list
  rows, the gist's own item left out; none when the edition or issue file
  cannot be loaded).

`GistPage` is one component in `apps/web/src`, used by the build and by the
browser, so the two cannot drift. It takes the gist and the "More from" items
as props and reads nothing from the browser while rendering.

**How the build renders it.** The build plugin runs a second, server-side
Vite build of a small entry (`src/gistPageServer.jsx`) into the build cache,
imports it, and calls `renderToString` per gist. No new dependency: Vite and
`react-dom/server` are already installed. If this proves unworkable in T25,
that task says so and proposes the alternative before building it.

**What the server markup holds, and what waits for the browser.** The server
cannot know the reader's saves, theme or sign-in. It renders the page as a
signed-out reader with nothing saved would see it, in the light theme, with the
UTC day in the stats heading (`GistView` already works this way). The star is
drawn, but only pressing it needs JavaScript. The reactions row is not in the
server markup in this ticket (T32 adds it); `GistView`'s `actions` slot is empty
there.

**Taking over.** On a gist route whose `#root` already has markup, `main.jsx`
calls `hydrateRoot`; on every other route, and on a gist route with no markup
(the dev server), it calls `createRoot` as today. The first client render uses
the same defaults as the server. Saves, theme, sign-in and the local day are
read after mount, in effects, so hydration never sees a difference. A
hydration warning in the console is a failing test of T26.

## `sitemap.xml`

Written by the build to `dist/sitemap.xml`. One `<url>` each, `<loc>` an
absolute `https://aibytes.io/...` address, with `<lastmod>` where the source
has a date:

| Address | `lastmod` |
|---|---|
| `/` | The newest edition's date |
| `/weekly` | The newest issue's date |
| Every edition, `/YYYY-MM-DD` | The edition's date |
| Every published weekly issue, `/weekly/issue-N` | The issue's date |
| Every shown gist with `depth` `full` | The date of `updated_at` |

Left out: `/saved` and `/privacy`, `brief` and `preview` gists, and gists
that are not shown. **(Decide 3)**: `/` and `/weekly` in, and `/privacy` out.

One sitemap file holds 50,000 addresses. At about 10 new gists a day that is
more than a decade away, so there is no sitemap index now. The build fails
loudly past 45,000 so nobody finds out from Search Console.

## `robots.txt`

Written to `dist/robots.txt`:

```
User-agent: *
Allow: /

Sitemap: https://aibytes.io/sitemap.xml
```

Nothing is disallowed. `/saved` already carries `noindex`, and a crawler must
be able to fetch a page to see the tag (parent spec, "Keeping a gist out of
search indexes").

## Boundaries

- **Always:** escape every gist string that reaches the head; render the page
  from the one `GistPage` component; test the head per depth.
- **Ask first:** a new dependency; a route other than `/gists/<slug>`; any
  change to which depths are indexed.
- **Never:** put anything about hiding in the gist file; list a `brief` or
  `preview` page in the sitemap; block `/gists/` in `robots.txt`; load anything
  from another site in the page.

## Testing

| Task | Tests |
|---|---|
| T24 | `route.test.js`: the gist route, slug rules, trailing slash, `/gists` alone. `pageMeta.test.js`: title, description cut, canonical, `noindex` per depth, JSON-LD on `full` only, escaping of quote, angle bracket and `</script>` in each field. |
| T25 | A build test on fixture content: the page holds the lede text, a `brief` gist's page has `noindex` and no sitemap entry, a hidden gist has no page, the sitemap has the addresses above and nothing else, `robots.txt` has the three lines. Build time for 1,000 fixture gists is recorded in the plan. |
| T26 | A server-render test that `GistPage` holds the title, lede, every section and the buttons with no browser global in scope. Browser checks: JavaScript off, no hydration warning, 1440 and 375px, both themes. |

## Success criteria

1. With JavaScript off, a gist page reads in full: title, lede, stats, every
   section, the buttons and "Appeared in".
2. A `full` gist is in `sitemap.xml` with a canonical address and a JSON-LD
   block; a `brief` or `preview` gist is in neither and carries `noindex`.
3. A hidden gist has no page and is not in the sitemap.
4. Saving from the page shows on `/saved` and on the card; the page takes over
   with no flash and no hydration warning.
5. Build time with 1,000 gists stays under the budget the plan records
   (the daily build is not slowed by more than a minute).

## Decide

1. **Title.** Recommended `<gist title> · aiBytes_`, the gist first because that
   is what a searcher matches. The weekly pages put the site first
   (`aiBytes_ #16: ...`); matching them is the alternative.
2. **JSON-LD.** Recommended a single `Article` with `isBasedOn`, on `full` pages
   only. The alternative is no structured data at all, which loses nothing
   in search except a clearer statement of what the page is.
3. **Sitemap contents.** Recommended editions, issues, `/`, `/weekly` and `full`
   gists, with `/privacy` and `/saved` out. The parent spec lists only
   editions, issues and `full` gists; this adds the two index pages.
