// The popup's edition (spec AIB-76n extension-popup): newest by index.json,
// refused unless schema_version is 1, ranked over the whole file, then inFeed.
// The last edition shown is cached in the popup's localStorage and painted
// before any request. Pure: fetch and storage are passed in, so node --test
// drives it.
import { rankedItems } from "@aibytes/app-core/order.js";
import { inFeed } from "@aibytes/app-core/visibility.js";
import { isRealDate } from "@aibytes/app-core/dates.js";
import { filesToLoad } from "@aibytes/app-core/saved.js";

export const CACHE_KEY = "aibytes-extension-edition";

/** A file whose schema_version this build does not know (feed.d.ts): never guessed at. */
export class Refused extends Error {
  constructor(url, version) {
    super(`${url}: schema_version ${JSON.stringify(version)} is not 1`);
    this.name = "Refused";
  }
}

/** Fetches one content file and returns it only if it is schema_version 1.
 * Any content file: index.json, an edition, weekly/index.json, an issue, a gist. */
export async function loadJson(fetch, url) {
  const response = await fetch(String(url));
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  const file = await response.json();
  if (!file || typeof file !== "object" || file.schema_version !== 1) throw new Refused(url, file?.schema_version);
  return file;
}

/** Today's rows: the whole edition ranked, hidden items included, then filtered.
 * Filtering first would let a filter reshuffle what it leaves. */
export const todayItems = (edition) => rankedItems(edition.items).filter(inFeed);

/** The newest edition named by `base`/index.json. Throws Refused for an unknown
 * schema_version, Error for anything else. */
export async function loadToday({ fetch, base }) {
  const indexUrl = new URL("index.json", base);
  const index = await loadJson(fetch, indexUrl);
  const ref = Array.isArray(index.editions) ? index.editions[0] : undefined;
  if (!ref || typeof ref.path !== "string") throw new Error(`${indexUrl}: no editions`);
  const edition = await loadJson(fetch, new URL(ref.path, indexUrl));
  if (!usable(edition)) throw new Error(`${ref.path}: not an edition`);
  return edition;
}

/**
 * What the Saved list needs, as /saved loads it: index.json and
 * weekly/index.json (either refused or failing rejects), then only the editions
 * and issues the saves name. `files` maps each file's key to
 * { status: "ready", data } or { status: "error", error }, the shape
 * savedGroups takes; one file failing leaves the others.
 */
export async function loadSaved({ fetch, base, saves }) {
  const [index, weekly] = await Promise.all([
    loadJson(fetch, new URL("index.json", base)),
    loadJson(fetch, new URL("weekly/index.json", base)),
  ]);
  const editions = Array.isArray(index.editions) ? index.editions : [];
  const issues = Array.isArray(weekly.issues) ? weekly.issues : [];
  const files = {};
  await Promise.all(filesToLoad(saves, editions, issues).map(async (file) => {
    try {
      const data = await loadJson(fetch, new URL(file.ref.path, base));
      if (!Array.isArray(data.items)) throw new Error(`${file.ref.path}: no items`);
      files[file.key] = { status: "ready", data };
    } catch (error) {
      files[file.key] = { status: "error", error };
    }
  }));
  return { editions, issues, files };
}

const usable = (edition) =>
  Boolean(edition) && typeof edition === "object" && edition.schema_version === 1 &&
  typeof edition.date === "string" && isRealDate(edition.date) && Array.isArray(edition.items);

/** The cached edition, or null for anything missing, corrupt or unknown.
 * Synchronous, so the popup paints it on its first render. */
export function readCache(storage) {
  try {
    const entry = JSON.parse(storage?.getItem(CACHE_KEY) ?? "null");
    if (!entry || typeof entry !== "object" || !usable(entry.edition) || entry.date !== entry.edition.date) return null;
    return entry.edition;
  } catch {
    return null;
  }
}

/** Keeps `edition` for the next open. A full or blocked storage only loses the cache. */
export function writeCache(storage, edition, now = new Date()) {
  try {
    storage?.setItem(CACHE_KEY, JSON.stringify({ date: edition.date, edition, cached_at: now.toISOString() }));
  } catch {
    // The popup still works; the next open waits for the network.
  }
}
