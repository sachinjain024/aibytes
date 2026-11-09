// Saved items in local storage (spec AIB-75v app-local-saves). A save names its
// item and the one file the item lives in - an edition's date or a weekly
// issue's slug - so the Saved page can load just those files. Every read is
// validated, so a corrupt or hand-edited entry is dropped instead of breaking a
// render, and a storage that throws (private mode, blocked site data) behaves
// like an empty one; a save then still holds for the page view. `storage` and
// `events` (where other tabs' `storage` events arrive) are injectable for the tests.
//
// localSaves() is the interface the account store (app-accounts) implements
// too, so the app picks a store and components never learn where saves live.
import { browserStorage } from "./prefs.js";
import { isRealDate } from "./route.js";

export const SAVES_KEY = "aibytes-saves";
const SLUG = /^issue-\d+$/;

// { edition_date } or { issue_slug }, if `from` carries exactly one valid one.
export function sourceOf(from) {
  const date = from && from.edition_date;
  const slug = from && from.issue_slug;
  if (date !== undefined && slug !== undefined) return null;
  if (typeof date === "string" && isRealDate(date)) return { edition_date: date };
  if (typeof slug === "string" && SLUG.test(slug)) return { issue_slug: slug };
  return null;
}

// The entry as stored, with only the known fields, or null if it is not a save.
export function asSave(entry) {
  if (!entry || typeof entry !== "object") return null;
  const source = sourceOf(entry);
  const { item_id, created_at } = entry;
  if (typeof item_id !== "string" || !item_id || !source) return null;
  if (typeof created_at !== "string" || Number.isNaN(Date.parse(created_at))) return null;
  return { item_id, ...source, created_at };
}

/** The stored saves, newest first: valid entries only, the first of each item_id. */
export function readSaves(storage = browserStorage()) {
  let parsed;
  try {
    parsed = JSON.parse(storage.getItem(SAVES_KEY) ?? "[]");
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const seen = new Set();
  return parsed.map(asSave).filter((save) => save && !seen.has(save.item_id) && seen.add(save.item_id));
}

export function localSaves(storage = browserStorage(), events = globalThis) {
  let saves = readSaves(storage);
  const listeners = new Set();
  const notify = () => listeners.forEach((listener) => listener());
  // Another tab changed the key, or cleared storage (key null).
  const onStorage = (event) => {
    if (event.key !== SAVES_KEY && event.key !== null) return;
    saves = readSaves(storage);
    notify();
  };

  return {
    /** The saves, newest first. The same array until something changes. */
    list: () => saves,
    has: (itemId) => saves.some((save) => save.item_id === itemId),
    /** Save or unsave `item`. `kept` is false if the write failed; the change still holds for this page view. */
    toggle(item, from) {
      const source = sourceOf(from);
      if (!source) throw new Error("A save needs exactly one of edition_date or issue_slug");
      if (!item || typeof item.id !== "string" || !item.id) throw new Error("A save needs an id");
      const saved = !saves.some((save) => save.item_id === item.id);
      saves = saved
        ? [{ item_id: item.id, ...source, created_at: new Date().toISOString() }, ...saves]
        : saves.filter((save) => save.item_id !== item.id);
      let kept = true;
      try {
        storage.setItem(SAVES_KEY, JSON.stringify(saves));
      } catch {
        kept = false;
      }
      notify();
      return { saved, kept };
    },
    /** Call `listener` on every change, here or in another tab. Returns the unsubscribe. */
    subscribe(listener) {
      if (!listeners.size && events && events.addEventListener) events.addEventListener("storage", onStorage);
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        if (!listeners.size && events && events.removeEventListener) events.removeEventListener("storage", onStorage);
      };
    },
  };
}
