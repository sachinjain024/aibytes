// The edition's grouped reading order (spec AIB-77u app-feed-order). The
// ranked order is rankedItems in @aibytes/app-core/order.js; this only splits
// an already ranked and filtered list by category. Pure, so node --test covers
// it; App.jsx only picks which to render.
import { CATEGORIES } from "./filters.js";

// Weekly Viral on X / Official Announcements rows. Not a category: no chip and
// never on a feed page (inFeed drops them), but a reader can star one from its
// gist page, so /saved groups them last.
export const X_GROUP = { key: "x", label: "On X" };

/** [{ category, items }] in CATEGORIES order, then X_GROUP, empty groups left out.
 * `ordered` is already ranked and filtered; this only splits it. */
export function groupedItems(ordered) {
  return [...CATEGORIES, X_GROUP]
    .map((category) => ({ category, items: ordered.filter((item) => item.category === category.key) }))
    .filter((group) => group.items.length > 0);
}
