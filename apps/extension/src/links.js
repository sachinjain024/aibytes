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
