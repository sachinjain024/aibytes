import assert from "node:assert/strict";
import { test } from "node:test";
import { groupedItems, rankedItems, TIE_ORDER } from "./order.js";

const PREFIX = { producthunt: "ph", github: "gh", techcrunch: "tc", hackernews: "hn" };
const CATEGORY = { producthunt: "launches", github: "repos", techcrunch: "news", hackernews: "hn" };

// An edition as curate writes it: grouped by category, each source in its
// fetcher's order. `n` is the item's position within its source, from 0.
function edition(counts) {
  return ["producthunt", "github", "techcrunch", "hackernews"].flatMap((source) =>
    Array.from({ length: counts[source] || 0 }, (_, n) => ({
      // Ids that do not sort in fetch order, so order cannot come from them.
      id: `${PREFIX[source]}-${String.fromCharCode(122 - n)}-2026-10-09`,
      source, category: CATEGORY[source], hidden: false, n,
    })));
}
const label = (item) => `${item.source}:${item.n}`;

test("a ranked edition sorts by rank", () => {
  const items = edition({ producthunt: 2, github: 2 });
  [3, 1, 4, 2].forEach((rank, i) => (items[i].rank = rank));
  assert.deepEqual(rankedItems(items).map((i) => i.rank), [1, 2, 3, 4]);
});

test("ranks with gaps still sort, and the input is not mutated", () => {
  const items = [{ id: "a", rank: 7 }, { id: "b", rank: 2 }, { id: "c", rank: 5 }];
  assert.deepEqual(rankedItems(items).map((i) => i.id), ["b", "c", "a"]);
  assert.deepEqual(items.map((i) => i.id), ["a", "b", "c"]);
});

test("a rank-less edition reproduces the edition-rank worked table", () => {
  // 2026-10-09: PH 5, GitHub 3, TC 10, HN 10 - docs/specs/AIB-77u-edition-rank.md
  const order = rankedItems(edition({ producthunt: 5, github: 3, techcrunch: 10, hackernews: 10 }));
  assert.equal(order.length, 28);
  assert.deepEqual(order.slice(0, 12).map(label), [
    "github:0", "hackernews:0", "techcrunch:0", "producthunt:0",
    "hackernews:1", "techcrunch:1", "hackernews:2", "techcrunch:2",
    "producthunt:1", "hackernews:3", "techcrunch:3", "github:1"]);
});

test("a partly ranked edition falls back entirely", () => {
  const items = edition({ producthunt: 2, github: 2 });
  items[0].rank = 1; // PH's leader claims first; the fallback puts GitHub's first
  assert.deepEqual(rankedItems(items).map(label),
    ["github:0", "producthunt:0", "github:1", "producthunt:1"]);
});

test("the fallback ranks a source's items in file order within it", () => {
  // A Show HN is filed under launches, after Product Hunt and before the HN
  // threads; within Hacker News it still stands where the file puts it.
  const items = [
    { id: "ph-a-2026-10-09", source: "producthunt", category: "launches" },
    { id: "hn-show-2026-10-09", source: "hackernews", category: "launches" },
    { id: "hn-thread-2026-10-09", source: "hackernews", category: "hn" },
  ];
  assert.deepEqual(rankedItems(items).map((i) => i.id),
    ["hn-show-2026-10-09", "ph-a-2026-10-09", "hn-thread-2026-10-09"]);
});

test("filtering after ordering never changes relative order", () => {
  const items = edition({ producthunt: 5, github: 3, techcrunch: 10, hackernews: 10 });
  items[0].hidden = true;
  items[7].hidden = true;
  const whole = rankedItems(items);
  const keep = (item) => !item.hidden && item.source !== "techcrunch";
  const filtered = whole.filter(keep);
  // Standing is over the whole edition, hidden included, so a hidden PH
  // leader does not promote the next launch.
  assert.deepEqual(filtered.map(label), whole.map(label).filter((_, i) => keep(whole[i])));
  assert.notDeepEqual(filtered.map(label), rankedItems(items.filter(keep)).map(label));
});

test("the order does not depend on input order", () => {
  const items = edition({ producthunt: 3, github: 2, techcrunch: 4, hackernews: 4 });
  items.forEach((item, i) => (item.rank = i + 1));
  assert.deepEqual(rankedItems([...items].reverse()).map((i) => i.id), rankedItems(items).map((i) => i.id));
});

test("grouped keeps category order, drops empty categories, and keeps rank order inside", () => {
  const items = edition({ producthunt: 2, techcrunch: 2, hackernews: 2 });
  const groups = groupedItems(rankedItems(items));
  assert.deepEqual(groups.map((g) => g.category.key), ["launches", "news", "hn"]);
  assert.deepEqual(groups.map((g) => g.items.length), [2, 2, 2]);
  assert.deepEqual(groups[0].items.map(label), ["producthunt:0", "producthunt:1"]);
  assert.equal(groups[2].category.label, "HN Threads");
});

test("grouped follows the given order, not the file's", () => {
  const items = edition({ producthunt: 3 });
  [3, 1, 2].forEach((rank, i) => (items[i].rank = rank));
  assert.deepEqual(groupedItems(rankedItems(items))[0].items.map((i) => i.rank), [1, 2, 3]);
});

test("grouped over nothing is no groups", () => {
  assert.deepEqual(groupedItems([]), []);
});

test("TIE_ORDER names every source once", () => {
  assert.deepEqual([...TIE_ORDER].sort(), ["github", "hackernews", "producthunt", "techcrunch"]);
});
