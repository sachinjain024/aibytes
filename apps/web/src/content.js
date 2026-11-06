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
