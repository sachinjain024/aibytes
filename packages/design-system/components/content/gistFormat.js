// Pure helpers for the gist view: how counts, dates and button labels are
// worked out. Nothing here touches window, so a server can call all of it.
// The one exception by design is dayLabel(iso) with no zone, which the view
// only calls after mounting (a server cannot know the reader's time zone).

/** 1,000 or more is short: 1.2k below 10k, 140k below a million, 1.2M above. */
export function shortCount(n) {
  if (n < 1000) return String(n);
  if (n < 10000) return (Math.floor(n / 100) / 10).toFixed(1).replace(/\.0$/, "") + "k";
  if (n < 999500) return Math.round(n / 1000) + "k";
  if (n < 1000000) return "1M";
  return (Math.floor(n / 100000) / 10).toFixed(1).replace(/\.0$/, "") + "M";
}

/** A count shown whole, with a thousands separator: 1,169. */
export function wholeCount(n) {
  return Number(n).toLocaleString("en-US");
}

/** "6 Nov 2026". Pass timeZone "UTC" on a server; omit it for the reader's own. */
export function dayLabel(iso, timeZone) {
  const options = { day: "numeric", month: "short", year: "numeric" };
  if (timeZone) options.timeZone = timeZone;
  return new Date(iso).toLocaleDateString("en-GB", options);
}

/** "Jun 2026", from a YYYY-MM-DD date. */
export function monthYear(date) {
  return new Date(date + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

/** How long before `to` something was posted: "45m", "19h", "5d", "3mo", "2y". */
export function age(from, to) {
  const minutes = Math.max(0, Math.round((new Date(to) - new Date(from)) / 60000));
  if (minutes < 60) return minutes + "m";
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + "h";
  const days = Math.floor(hours / 24);
  if (days < 60) return days + "d";
  if (days < 730) return Math.floor(days / 30) + "mo";
  return Math.floor(days / 365) + "y";
}

/**
 * The label on a source button, worked out from the link's role and host,
 * never from the page's own title.
 */
export function linkLabel(link) {
  if (link.role !== "discussion") return "Source";
  let host = "";
  try { host = new URL(link.url).hostname.replace(/^www\./, ""); } catch { /* an unparseable URL is just "Discussion" */ }
  if (host === "news.ycombinator.com") return "HN Discussion";
  if (host === "producthunt.com") return "Product Hunt";
  return "Discussion";
}

/** Where an appearance links, and what it is called. */
export function appearanceLink(appearance) {
  if (appearance.edition_date) {
    return { href: "/" + appearance.edition_date, label: dayLabel(appearance.edition_date + "T00:00:00Z", "UTC") };
  }
  const number = /^issue-(\d+)$/.exec(appearance.issue_slug || "");
  return { href: "/weekly/" + appearance.issue_slug, label: number ? "Issue " + number[1] : appearance.issue_slug };
}

const STANCES = { agreed: "Agreed", disputed: "Disputed", counterpoint: "Counterpoint", theme: "Theme" };
export const stanceLabel = (stance) => STANCES[stance] || stance;

/**
 * The cells of the stats grid, in order, as [label, value] pairs. A cell with
 * no value is left out. `stars_gained` and `last_release` are in the file but
 * not shown. Hacker News counts are shown whole; every other count is short.
 */
export function statCells(kind, stats = {}, asOf) {
  const has = (key) => stats[key] != null;
  const count = (key, label, whole) => has(key) && [label, whole ? wholeCount(stats[key]) : shortCount(stats[key])];
  const text = (key, label) => has(key) && [label, String(stats[key])];
  let cells = [];
  if (kind === "hn") {
    cells = [count("points", "Points", true), count("comments", "Comments", true), text("submitted_by", "Submitted by"),
      has("posted_at") && ["Posted", age(stats.posted_at, asOf)]];
  } else if (kind === "repo") {
    cells = [count("stars", "Stars"), count("forks", "Forks"), count("contributors", "Contributors"), count("open_issues", "Open issues"),
      has("created_on") && ["Created", monthYear(stats.created_on)], text("language", "Language"), text("license", "Licence")];
  } else if (kind === "launch") {
    cells = [count("upvotes", "Upvotes"), count("comments", "Comments")];
  } else if (kind === "x_post") {
    cells = [count("likes", "Likes"), count("reposts", "Reposts"), count("replies", "Replies"), count("views", "Views")];
  }
  return cells.filter(Boolean);
}
