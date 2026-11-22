// Which items are feed cards (spec AIB-76n app-core), shared by aibytes.io
// and the Chrome extension. Rank the whole file first, then filter with this.

/** Weekly Viral on X / Official Announcements rows (`category: "x"`) live in
 * the issue file so a gist page can star them. They are not feed cards and
 * have no chip (spec AIB-145y-newsletter-gist-links). Hidden items never are. */
export function inFeed(item) {
  return Boolean(item) && item.hidden !== true && item.category !== "x";
}
