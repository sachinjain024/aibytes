// The popup's save banner (Ledger's SaveBanner, as aibytes.io shows it): for a
// signed-out reader with at least one save, saying the saves are kept in the
// extension and offering sign-in to sync them. Dismissing it is remembered in
// the popup's own localStorage, so it does not come back on every open; signing
// in hides it too.
export const BANNER_KEY = "aibytes-save-banner-dismissed";

// user: null signed out, undefined while the session restores (show nothing yet).
export function showSaveBanner({ user, saveCount, dismissed }) {
  return user === null && saveCount > 0 && !dismissed;
}

export function readDismissed(storage) {
  try {
    return storage?.getItem(BANNER_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeDismissed(storage) {
  try {
    storage.setItem(BANNER_KEY, "1");
    return true;
  } catch {
    return false;
  }
}
