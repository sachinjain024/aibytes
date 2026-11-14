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

/**
 * What a click on a card with a gist does. `state` is { slug, opened }: the gist
 * the URL shows, and the card that opened it (null after a reload or shared
 * link). Returns null when that card is already the open one; otherwise
 * { opened, event?, nav? }. A different gist gets a URL change and one event; a
 * second card of the gist already open only moves the save row and the marker.
 */
export function planOpen({ slug, opened }, item, from, location) {
  const next = { slug: item.gist, id: item.id, from };
  if (item.gist === slug) return opened && opened.id === item.id ? null : { opened: next };
  const replace = slug !== null;
  return {
    opened: next,
    event: { slug: item.gist, page: panelPage(from) },
    nav: { to: withGist(location, item.gist), replace, ...(replace ? {} : { state: { gist: true, base: withoutGist(location) } }) },
  };
}

/** Whether `item`'s card carries the open marker: the clicked card, or after a reload every card of that gist. */
export function isOpenCard(opened, slug, item) {
  if (!slug || item.gist !== slug) return false;
  return opened && opened.slug === slug ? opened.id === item.id : true;
}

/** The item the panel's save row presses: the clicked card, else the gist's first appearance. */
export function targetFor(opened, slug, gist) {
  if (opened && opened.slug === slug) return { id: opened.id, from: opened.from };
  const first = gist.appearances[0];
  return { id: first.item_id, from: first.edition_date ? { edition_date: first.edition_date } : { issue_slug: first.issue_slug } };
}

/** How closing goes: "back" when this page view pushed the panel on this same list, else "replace". */
export function planClose(historyState, location) {
  return historyState && historyState.gist && historyState.base === withoutGist(location) ? "back" : "replace";
}
