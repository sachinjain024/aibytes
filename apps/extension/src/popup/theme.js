// The popup's theme (AIB-76n, the publisher's ask of 27 Nov 2026): light by
// default, dark once the reader picks it with the header's toggle. Kept in
// the popup's localStorage under aibytes.io's own key. A storage that is
// missing or throws, or a value this build does not know, reads as light.
export const THEME_KEY = "aibytes-theme";
const THEMES = ["light", "dark"];

export function readTheme(storage) {
  try {
    const value = storage?.getItem(THEME_KEY);
    return THEMES.includes(value) ? value : "light";
  } catch {
    return "light";
  }
}

/** True if it was kept; a failed write keeps the choice for this open only. */
export function writeTheme(storage, theme) {
  if (!THEMES.includes(theme)) throw new Error(`unknown theme ${theme}`);
  try {
    storage.setItem(THEME_KEY, theme);
    return true;
  } catch {
    return false;
  }
}
