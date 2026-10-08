// Filters live in the URL so a filtered view can be shared (spec §6, Filters):
//   ?c=repos                one category (single select)
//   &t=agents,open-source   tags by their tags.json slug (any of them)
//   &s=github,hackernews    sources (any of them)
// Values the app does not know are dropped, so an old or hand-edited link
// still opens - it just filters less. Pure functions, covered by node --test.

export const CATEGORIES = [
  { key: "launches", label: "New Products" },
  { key: "repos", label: "Trending Dev Projects" },
  { key: "news", label: "AI News" },
  { key: "hn", label: "HN Threads" },
];

export const SOURCES = [
  { key: "producthunt", label: "Product Hunt" },
  { key: "hackernews", label: "Hacker News" },
  { key: "github", label: "GitHub" },
  { key: "techcrunch", label: "TechCrunch" },
];

export const NO_FILTERS = { category: "all", tags: [], sources: [] };

const list = (value) => (value ? value.split(",").filter(Boolean) : []);
const allTags = (tagGroups) => tagGroups.flatMap((group) => group.tags);

/** The filters in a query string. `tagGroups` is tags.json's `groups`. */
export function parseFilters(search, tagGroups) {
  const params = new URLSearchParams(search);
  const category = params.get("c");
  const bySlug = new Map(allTags(tagGroups).map((tag) => [tag.slug, tag.name]));
  const wanted = new Set(list(params.get("s")));
  return {
    category: CATEGORIES.some((c) => c.key === category) ? category : "all",
    tags: [...new Set(list(params.get("t")).filter((slug) => bySlug.has(slug)).map((slug) => bySlug.get(slug)))],
    sources: SOURCES.filter((s) => wanted.has(s.key)).map((s) => s.key),
  };
}

/** The query string for `filters`, "" when nothing is filtered. Tags and
 * sources come out in tags.json and SOURCES order, so one view has one URL. */
export function filtersToSearch(filters, tagGroups) {
  const params = new URLSearchParams();
  if (filters.category !== "all") params.set("c", filters.category);
  const chosen = new Set(filters.tags);
  const slugs = allTags(tagGroups).filter((tag) => chosen.has(tag.name)).map((tag) => tag.slug);
  if (slugs.length) params.set("t", slugs.join(","));
  const sources = SOURCES.filter((s) => filters.sources.includes(s.key)).map((s) => s.key);
  if (sources.length) params.set("s", sources.join(","));
  // Commas are safe in a query and read better unescaped: ?t=agents,open-source
  const search = params.toString().replace(/%2C/g, ",");
  return search ? "?" + search : "";
}

/** Whether an item passes: its category, any chosen tag, any chosen source. */
export function matches(item, filters) {
  if (filters.category !== "all" && item.category !== filters.category) return false;
  if (filters.tags.length && !(item.tags || []).some((tag) => filters.tags.includes(tag))) return false;
  if (filters.sources.length && !filters.sources.includes(item.source)) return false;
  return true;
}

/** `values` with `value` added, or removed if it was there. */
export function toggle(values, value) {
  return values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
}

/** How many of `items` a reader would see under `filters`: hidden ones never count. */
export function countMatches(items, filters) {
  return items.filter((item) => !item.hidden && matches(item, filters)).length;
}

/** What `filters` asks for, to finish "No ... in this edition": the
 * category's label (or "items"), then any tags, then any sources. */
export function describeFilters(filters) {
  const category = CATEGORIES.find((c) => c.key === filters.category);
  let text = category ? category.label : "items";
  if (filters.tags.length) text += " tagged " + filters.tags.join(" or ");
  const sources = SOURCES.filter((s) => filters.sources.includes(s.key)).map((s) => s.label);
  if (sources.length) text += " from " + sources.join(" or ");
  return text;
}
