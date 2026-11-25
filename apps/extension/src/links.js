// The popup's "View on Web" links (spec AIB-76n extension-popup), tagged by
// the site's link-tag rule (docs/specs/AIB-145y-gist-analytics.md): three
// tags, lower case, so Umami counts the visits the extension sends.

function tagged(site, path, campaign) {
  const url = new URL(path, site);
  url.searchParams.set("utm_source", "chrome-extension");
  url.searchParams.set("utm_medium", "extension");
  url.searchParams.set("utm_campaign", campaign);
  return url.href;
}

/** The edition's page on aibytes.io: /<date>. */
export const todayUrl = (site, date) => tagged(site, `/${date}`, "today");
/** aibytes.io's Saved list. */
export const savedUrl = (site) => tagged(site, "/saved", "saved");
/** A gist's page: /gists/<slug>. */
export const gistUrl = (site, slug) => tagged(site, `/gists/${encodeURIComponent(slug)}`, "gist");
/** A gist's "Appeared in" link: the edition's page, or the weekly issue's. */
export const appearanceUrl = (site, { edition_date, issue_slug }) =>
  tagged(site, edition_date ? `/${edition_date}` : `/weekly/${encodeURIComponent(issue_slug)}`, "gist");

/**
 * The URL a click should open in a new tab instead, or null. The popup never
 * navigates itself: any left or middle click on an http(s) link comes here,
 * plain or modified, with or without `target`. A click a row already handled
 * (a plain click on a gist title opens the gist) is left alone.
 */
export function tabHref(event) {
  if (event.defaultPrevented || (event.button !== 0 && event.button !== 1)) return null;
  const anchor = event.target?.closest?.("a[href]");
  if (!anchor) return null;
  let url;
  try {
    url = new URL(anchor.href);
  } catch {
    return null;
  }
  return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
}
