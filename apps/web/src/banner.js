// When the sticky "saves live in this browser" banner shows (C2 in the AIB-75v
// design record, amended 10 Nov): signed out with at least one save, on every
// page, /saved included now that it has no line of its own, and it cannot be
// dismissed. `signedIn` is null while the session is still restoring, so a
// signed-in reader never sees it flash.

export function showBanner({ signedIn, saveCount }) {
  return signedIn === false && saveCount > 0;
}
