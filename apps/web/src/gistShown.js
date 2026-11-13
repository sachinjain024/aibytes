// Whether a gist has a page (AIB-145y T7, contract spec D4): shown while at
// least one of its appearances is a loaded item whose `hidden` is false.
// Hiding is never stored in the gist. An x_post gist is always shown: issue
// files do not carry X posts, so there is nothing to hide.
//
// The Python copy is gist_is_shown in packages/feed-schema/gist_contract.py.
// Both are tested against packages/feed-schema/fixtures/gist-shown.json, so
// change them together. `items` is an object or a Map keyed by item id.
export function gistIsShown(gist, items) {
  if (gist?.kind === "x_post") return true;
  const get = items instanceof Map ? (id) => items.get(id) : (id) => items?.[id];
  return (gist?.appearances ?? []).some((appearance) => get(appearance?.item_id)?.hidden === false);
}
