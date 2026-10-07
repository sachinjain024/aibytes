// The app's URLs, as pure functions so `node --test` can check them without a
// browser. Vite's base is "/", so a pathname maps straight onto a route.
//
//   /             the latest edition
//   /2026-10-07   that edition (a real page at build time, see vite.config.js)
//   /p/<slug>     an old newsletter issue link from when aibytes.io was Beehiiv
//   anything else not found

export const NEWSLETTER_ORIGIN = "https://newsletter.aibytes.io";

const EDITION = /^\/(\d{4}-\d{2}-\d{2})\/?$/;
const ISSUE = /^\/p\/([^/]+)\/?$/;

export function parseRoute(pathname) {
  if (pathname === "/" || pathname === "") return { kind: "latest" };
  const edition = EDITION.exec(pathname);
  if (edition && isRealDate(edition[1])) return { kind: "edition", date: edition[1] };
  const issue = ISSUE.exec(pathname);
  if (issue) return { kind: "issue", slug: issue[1] };
  return { kind: "notfound" };
}

export function editionPath(date) {
  return "/" + date;
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

function isRealDate(text) {
  const date = new Date(text + "T00:00:00Z");
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === text;
}
