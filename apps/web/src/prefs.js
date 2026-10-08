// Reader preferences in local storage. Every read is validated against the
// values the app knows, so a stale or hand-edited entry falls back instead of
// breaking a render, and a storage that throws (private mode, blocked site
// data) behaves like an empty one. `storage` is injectable for the tests.

export const THEME = { key: "aibytes-theme", values: ["light", "dark"] };
export const VIEW = { key: "aibytes-view", values: ["grid", "list"] };

export function readChoice(pref, storage = globalThis.localStorage) {
  try {
    const value = storage.getItem(pref.key);
    return pref.values.includes(value) ? value : null;
  } catch {
    return null;
  }
}

/** True if it was kept. A failed write leaves the choice for this page view only. */
export function writeChoice(pref, value, storage = globalThis.localStorage) {
  if (!pref.values.includes(value)) throw new Error(`${pref.key}: unknown value ${value}`);
  try {
    storage.setItem(pref.key, value);
    return true;
  } catch {
    return false;
  }
}
