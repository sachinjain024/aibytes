// What the build knows about gist pages, as pure functions so `node --test`
// covers it (spec AIB-145y-app-gist-pages): which gists are shown, the "More
// from" list, the back link, the sitemap and robots.txt. vite.config.js and
// buildGistSite.js do the file work.
import { midDate } from "./format.js";
import { gistIsShown } from "./gistShown.js";
import { rankedItems } from "./order.js";
import { SITE_ORIGIN } from "./route.js";

export const MORE_FROM = 4;
export const SITEMAP_LIMIT = 45_000;

/** The gists with a page: at least one appearance is a loaded item that is not hidden. `items` is keyed by item id. */
export function shownGists(gists, items) {
  return gists.filter((gist) => gistIsShown(gist, items));
}

/** Up to four ranked, visible items of the gist's first appearance's edition or issue, leaving out the gist's own item. */
export function moreFrom(gist, items) {
  const own = gist.appearances?.[0]?.item_id;
  if (!Array.isArray(items)) return [];
  return rankedItems(items).filter((item) => item.hidden !== true && item.id !== own).slice(0, MORE_FROM);
}

/** Where "Back" goes and what it is called: the gist's first edition or issue. */
export function backLink(gist) {
  const first = gist.appearances?.[0];
  if (!first) return null;
  if (first.edition_date) return { href: "/" + first.edition_date, label: midDate(first.edition_date) };
  const number = /^issue-(\d+)$/.exec(first.issue_slug || "");
  return { href: "/weekly/" + first.issue_slug, label: number ? "Issue " + number[1] : first.issue_slug };
}

/** The key of the edition or issue an appearance points into, for a map of item lists. */
export const listKey = (appearance) => (appearance.edition_date ? "edition:" + appearance.edition_date : "issue:" + appearance.issue_slug);

/**
 * What a gist page needs: the gist and its "More from" rows, or null when the
 * gist has no page (hidden, or its items could not be loaded). `lists` maps
 * listKey to the items of each edition or issue the gist appears in. The build
 * and the browser both call this, so they decide the same way.
 */
export function pageData(gist, lists) {
  const itemsById = {};
  for (const appearance of gist.appearances ?? []) {
    for (const item of lists.get(listKey(appearance)) ?? []) itemsById[item.id] = item;
  }
  if (!gistIsShown(gist, itemsById)) return null;
  const first = gist.appearances?.[0];
  return { gist, more: moreFrom(gist, first ? lists.get(listKey(first)) : undefined) };
}

const entry = (path, lastmod) => ({ loc: SITE_ORIGIN + path, ...(lastmod ? { lastmod } : {}) });

/**
 * The sitemap's addresses: `/`, the weekly archive, every edition, every issue,
 * every shown gist whose depth is `full`. `editions` and `issues` are newest first.
 */
export function siteEntries({ editions, issues, gists }) {
  const entries = [
    entry("/", editions[0]?.date),
    entry("/weekly", issues[0]?.published_on),
    ...editions.map((e) => entry("/" + e.date, e.date)),
    ...issues.map((i) => entry("/weekly/" + i.slug, i.published_on)),
    ...gists.filter((g) => g.depth === "full").map((g) => entry("/gists/" + g.slug, g.updated_at?.slice(0, 10))),
  ];
  if (entries.length > SITEMAP_LIMIT) {
    throw new Error(`sitemap.xml would hold ${entries.length} addresses; a file holds 50,000 and the limit here is 45,000. Add a sitemap index.`);
  }
  return entries;
}

const xml = (text) => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function sitemapXml(entries) {
  const urls = entries.map((e) => `  <url><loc>${xml(e.loc)}</loc>${e.lastmod ? `<lastmod>${xml(e.lastmod)}</lastmod>` : ""}</url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/** Nothing is disallowed: a crawler must fetch a noindex page to see the tag. */
export function robotsTxt() {
  return `User-agent: *\nAllow: /\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`;
}
