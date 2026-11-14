// The app's URLs, as pure functions so `node --test` can check them without a
// browser. Vite's base is "/", so a pathname maps straight onto a route.
//
//   /                    the latest edition
//   /2026-10-07          that edition (a real page at build time, see vite.config.js)
//   /weekly              the weekly issue archive
//   /weekly/issue-16     a published weekly issue (static HTML at build time)
//   /saved               the reader's saved items (a real page too, noindex)
//   /gists/<slug>        a gist: the summary page for one item (a real page at build time)
//   /privacy             what signing in and saving keep, and where (a real page)
//   /p/<slug>            an old newsletter issue link from when aibytes.io was Beehiiv
//   anything else        not found

export const NEWSLETTER_ORIGIN = "https://newsletter.aibytes.io";
export const SITE_ORIGIN = "https://aibytes.io";

const EDITION = /^\/(\d{4}-\d{2}-\d{2})\/?$/;
const WEEKLY_INDEX = /^\/weekly\/?$/;
const WEEKLY_ISSUE = /^\/weekly\/(issue-\d+)\/?$/;
const ISSUE = /^\/p\/([^/]+)\/?$/;
const SAVED = /^\/saved\/?$/;
const PRIVACY = /^\/privacy\/?$/;
const GIST = /^\/gists\/([a-z0-9][a-z0-9-]*)\/?$/;

export function parseRoute(pathname) {
  if (pathname === "/" || pathname === "") return { kind: "latest" };
  if (WEEKLY_INDEX.test(pathname)) return { kind: "weekly_index" };
  if (SAVED.test(pathname)) return { kind: "saved" };
  if (PRIVACY.test(pathname)) return { kind: "privacy" };
  const gist = GIST.exec(pathname);
  if (gist) return { kind: "gist", slug: gist[1] };
  const weekly = WEEKLY_ISSUE.exec(pathname);
  if (weekly) return { kind: "weekly_issue", slug: weekly[1] };
  const edition = EDITION.exec(pathname);
  if (edition && isRealDate(edition[1])) return { kind: "edition", date: edition[1] };
  const issue = ISSUE.exec(pathname);
  if (issue) return { kind: "issue", slug: issue[1] };
  return { kind: "notfound" };
}

const GIST_SLUG = /^[a-z0-9][a-z0-9-]*$/;

/**
 * The gist the panel should show: `?gist=<slug>` on a daily, weekly or saved
 * page. null when it is absent, repeated or not a well-formed slug, so a hand-
 * edited link opens the page with no panel instead of a failed load.
 */
export function gistParam(search) {
  const all = new URLSearchParams(search).getAll("gist");
  return all.length === 1 && GIST_SLUG.test(all[0]) ? all[0] : null;
}

export function editionPath(date) {
  return "/" + date;
}

export function privacyPath() {
  return "/privacy";
}

export function savedPath() {
  return "/saved";
}

export function gistPath(slug) {
  return "/gists/" + slug;
}

export function gistUrl(slug) {
  return SITE_ORIGIN + gistPath(slug);
}

export function weeklyPath(slug) {
  return slug ? "/weekly/" + slug : "/weekly";
}

export function weeklyUrl(slug) {
  return SITE_ORIGIN + weeklyPath(slug);
}

/** The weekly issue ref for a route, given weekly/index.json (newest first). */
export function pickWeeklyIssue(route, issues) {
  if (route.kind !== "weekly_issue") return null;
  return issues.find((ref) => ref.slug === route.slug) || null;
}

/** The issue after `slug` in weekly/index.json (newest first), or null. */
export function olderWeeklyIssue(issues, slug) {
  const at = issues.findIndex((ref) => ref.slug === slug);
  return at === -1 ? null : issues[at + 1] || null;
}

// Where an old aibytes.io/p/<slug> link lives now, query and hash kept.
export function issueRedirect(location) {
  return NEWSLETTER_ORIGIN + location.pathname + (location.search || "") + (location.hash || "");
}

// The ref for a route, given index.json's editions (newest first). null means
// the route names a day with no edition.
export function pickEdition(route, editions) {
  if (route.kind === "latest") return editions[0] || null;
  if (route.kind === "edition") return editions.find((ref) => ref.date === route.date) || null;
  return null;
}

// The edition before `date` in index.json (newest first), or null.
export function olderEdition(editions, date) {
  const at = editions.findIndex((ref) => ref.date === date);
  return at === -1 ? null : editions[at + 1] || null;
}

export function isRealDate(text) {
  const date = new Date(text + "T00:00:00Z");
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === text;
}
