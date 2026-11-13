import { listKey, pageData } from "./gistSite.js";

// Where the published JSON lives. BASE_URL is Vite's `base` ("/"), so this
// resolves to the same URL in dev, in `vite preview`, and on Pages.
export const CONTENT_URL = new URL(import.meta.env.BASE_URL + "content/", window.location.origin);

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url.pathname}: HTTP ${res.status}`);
  return res.json();
}

/** tags.json: the tag groups the Tags panel lists and URLs use slugs from. */
export function loadTags() {
  return getJson(new URL("tags.json", CONTENT_URL));
}

export function loadIndex() {
  return getJson(new URL("index.json", CONTENT_URL));
}

/** content/weekly/index.json: the published weekly issues, newest first. */
export function loadWeeklyIndex() {
  return getJson(new URL("weekly/index.json", CONTENT_URL));
}

/** A weekly issue JSON; `ref.path` is relative to content/ (e.g. weekly/issues/issue-16.json). */
export function loadWeeklyIssue(ref) {
  return getJson(new URL(ref.path, CONTENT_URL));
}

// An edition's `path` is relative to index.json (feed.d.ts, EditionRef.path).
export function loadEdition(ref) {
  return getJson(new URL(ref.path, CONTENT_URL));
}

/**
 * A gist's page data (the gist and its "More from" rows), read from content/. null
 * when there is no such gist or it has no page (hidden). Used when the page has no
 * embedded data: the dev server, and a client-side visit.
 */
export async function loadGistPage(slug) {
  const res = await fetch(new URL(`gists/${slug}.json`, CONTENT_URL));
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`gists/${slug}.json: HTTP ${res.status}`);
  let gist;
  try { gist = await res.json(); } catch { return null; } // a dev server answers a missing file with its HTML page
  const [index, weekly] = await Promise.all([loadIndex(), loadWeeklyIndex()]);
  const lists = new Map();
  await Promise.all((gist.appearances ?? []).map(async (appearance) => {
    const key = listKey(appearance);
    if (lists.has(key)) return;
    lists.set(key, []);
    const ref = appearance.edition_date
      ? index.editions.find((e) => e.date === appearance.edition_date)
      : weekly.issues.find((i) => i.slug === appearance.issue_slug);
    if (!ref) return;
    const file = appearance.edition_date ? await loadEdition(ref) : await loadWeeklyIssue(ref);
    lists.set(key, file.items);
  }));
  return pageData(gist, lists);
}
