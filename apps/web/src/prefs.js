// Reader preferences in local storage. Every read is validated against the
// values the app knows, so a stale or hand-edited entry falls back instead of
// breaking a render, and a storage that throws (private mode, blocked site
// data) behaves like an empty one. `storage` is injectable for the tests.

export const THEME = { key: "aibytes-theme", values: ["light", "dark"] };
export const VIEW = { key: "aibytes-view", values: ["grid", "list"] };
// Ranked (by the curated rank) or Grouped (by category); spec AIB-77u app-feed-order.
export const ORDER = { key: "aibytes-order", values: ["ranked", "grouped"] };

/**
 * The browser's local storage, or null. With site data blocked, reading
 * `window.localStorage` itself throws, so a default argument of
 * `globalThis.localStorage` would throw outside any try and blank the page.
 */
export function browserStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function readChoice(pref, storage = browserStorage()) {
  try {
    const value = storage.getItem(pref.key);
    return pref.values.includes(value) ? value : null;
  } catch {
    return null;
  }
}

/** True if it was kept. A failed write leaves the choice for this page view only. */
export function writeChoice(pref, value, storage = browserStorage()) {
  if (!pref.values.includes(value)) throw new Error(`${pref.key}: unknown value ${value}`);
  try {
    storage.setItem(pref.key, value);
    return true;
  } catch {
    return false;
  }
}

// The gist panel's width in px, kept in this browser like the feed's layout
// (spec AIB-145y-app-gist-panel). A whole number from 360 to 1200; anything else
// reads as "not set", and the panel uses its own default.
export const PANEL_WIDTH = { key: "aibytes-gist-panel-w", min: 360, max: 1200 };

export function readWidth(pref, storage = browserStorage()) {
  try {
    const text = storage.getItem(pref.key);
    if (!/^[0-9]{3,4}$/.test(text)) return null;
    const px = Number(text);
    return px >= pref.min && px <= pref.max ? px : null;
  } catch {
    return null;
  }
}

/** True if it was kept. Throws on a width outside the range: a bug, not a stored value. */
export function writeWidth(pref, px, storage = browserStorage()) {
  if (!Number.isInteger(px) || px < pref.min || px > pref.max) throw new Error(`${pref.key}: ${px} is out of range`);
  try {
    storage.setItem(pref.key, String(px));
    return true;
  } catch {
    return false;
  }
}
