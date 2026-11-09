// When the sticky "saves live in this browser" banner shows (C2 in the AIB-75v
// design record): signed out, at least one save, and not on /saved, which says
// it in its own words. It cannot be dismissed (decided 10 Nov). `signedIn` is
// null while the session is still restoring, so a signed-in reader never sees it flash.

export function showBanner({ signedIn, saveCount, page }) {
  return signedIn === false && saveCount > 0 && page !== "saved";
}
