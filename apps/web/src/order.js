// The edition's two reading orders (spec AIB-77u app-feed-order). Ranked uses
// the curated `rank`; an edition written before rank existed gets the same
// order computed here, the way packages/curate/aibytes_curate/rank.py does.
// Pure, so node --test covers it; App.jsx only picks which to render.
import { CATEGORIES } from "./filters.js";

// Who wins a tie at equal standing. Must equal TIE_ORDER in rank.py;
// tests/test_curate_edition.py checks it.
export const TIE_ORDER = ["github", "hackernews", "techcrunch", "producthunt"];

const fullyRanked = (items) => items.length > 0 && items.every((item) => Number.isInteger(item.rank));

/**
 * The whole edition, strongest first: by `rank`, or - when any item lacks one,
 * which the contract only allows for all of them - by the fallback for every
 * item rather than a mix. Pass the whole edition, hidden items included, and
 * filter the result: standing is over the edition, as rank is, so a filter
 * never reshuffles what it leaves.
 */
export function rankedItems(items) {
  return fullyRanked(items) ? [...items].sort((a, b) => a.rank - b.rank) : fallbackOrder(items);
}

/** [{ category, items }] in CATEGORIES order, empty categories left out.
 * `ordered` is already ranked and filtered; this only splits it. */
export function groupedItems(ordered) {
  return CATEGORIES
    .map((category) => ({ category, items: ordered.filter((item) => item.category === category.key) }))
    .filter((group) => group.items.length > 0);
}

// rank.py's score without rank: an item's standing is its position within its
// own source over that source's count. The file lists each source in the
// fetcher's order (it is grouped by category, then by that order), so file
// position stands in for the draft's fetch rank.
function fallbackOrder(items) {
  const bySource = new Map();
  items.forEach((item) => {
    if (!bySource.has(item.source)) bySource.set(item.source, []);
    bySource.get(item.source).push(item);
  });
  const standing = new Map();
  for (const group of bySource.values()) {
    group.forEach((item, position) => standing.set(item, position / group.length));
  }
  // An unknown source sorts after the known ones rather than first (-1).
  const tie = (source) => (TIE_ORDER.includes(source) ? TIE_ORDER.indexOf(source) : TIE_ORDER.length);
  return [...items].sort((a, b) =>
    standing.get(a) - standing.get(b) || tie(a.source) - tie(b.source) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}
