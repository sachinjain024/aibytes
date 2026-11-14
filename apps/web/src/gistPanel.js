// The panel's URL, as pure functions so node --test covers them (spec
// AIB-145y-app-gist-panel). `?gist=<slug>` rides alongside the filters
// (?c ?t ?s ?q) without either overwriting the other.
import { gistParam } from "./route.js";

const query = (params) => {
  // Commas read better unescaped, as filtersToSearch writes them: ?t=agents,open-source
  const text = params.toString().replace(/%2C/g, ",");
  return text ? "?" + text : "";
};

/** The path and query that open `slug` on `location`, filters kept. */
export function withGist(location, slug) {
  const params = new URLSearchParams(location.search);
  params.set("gist", slug);
  return location.pathname + query(params);
}

/** The path and query with the panel closed, filters kept. */
export function withoutGist(location) {
  const params = new URLSearchParams(location.search);
  params.delete("gist");
  return location.pathname + query(params);
}

/** `next` (a new filter query) with the open gist of `current` carried over. */
export function keepGist(current, next) {
  const slug = gistParam(current);
  if (!slug) return next;
  const params = new URLSearchParams(next);
  params.set("gist", slug);
  return query(params);
}

/** What the open event calls the page the card was on: where the item lives. */
export function panelPage(from) {
  return from && from.issue_slug ? "weekly" : "daily";
}
