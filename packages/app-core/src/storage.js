// The browser's local storage, guarded (spec AIB-76n app-core), shared by
// aibytes.io and the Chrome extension.

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
