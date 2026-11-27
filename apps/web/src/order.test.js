import assert from "node:assert/strict";
import { test } from "node:test";
import { rankedItems } from "@aibytes/app-core/order.js";
import { inFeed } from "@aibytes/app-core/visibility.js";
import { groupedItems } from "./order.js";

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

test("a weekly issue with an x item keeps x off the ranked and grouped feeds", () => {
  const items = edition({ producthunt: 1, github: 1, techcrunch: 1, hackernews: 1 });
  items.forEach((item, i) => { item.rank = i + 1; });
  items.push({ id: "x-lab-five-words-issue-19", source: "x", category: "x", hidden: false, rank: 5 });
  const feed = rankedItems(items).filter(inFeed);
  assert.equal(feed.some((item) => item.category === "x"), false);
  assert.deepEqual(groupedItems(feed).map((g) => g.category.key), ["launches", "repos", "news", "hn"]);
  assert.equal(feed.length, 4);
});

test("grouped keeps category order, drops empty categories, and keeps rank order inside", () => {
  const items = edition({ producthunt: 2, techcrunch: 2, hackernews: 2 });
  const groups = groupedItems(rankedItems(items));
  assert.deepEqual(groups.map((g) => g.category.key), ["launches", "news", "hn"]);
  assert.deepEqual(groups.map((g) => g.items.length), [2, 2, 2]);
  assert.deepEqual(groups[0].items.map(label), ["producthunt:0", "producthunt:1"]);
  assert.equal(groups[2].category.label, "HN Threads");
});

test("a starred x item on /saved gets its own last group, so Grouped and Ranked show the same items", () => {
  const items = edition({ producthunt: 1, hackernews: 1 });
  items.push({ id: "x-lab-five-words-issue-19", source: "x", category: "x", hidden: false });
  const groups = groupedItems(items);
  assert.deepEqual(groups.map((g) => g.category.key), ["launches", "hn", "x"]);
  assert.equal(groups[2].category.label, "On X");
  assert.equal(groups.flatMap((g) => g.items).length, items.length);
});

test("grouped follows the given order, not the file's", () => {
  const items = edition({ producthunt: 3 });
  [3, 1, 2].forEach((rank, i) => (items[i].rank = rank));
  assert.deepEqual(groupedItems(rankedItems(items))[0].items.map((i) => i.rank), [1, 2, 3]);
});

test("grouped over nothing is no groups", () => {
  assert.deepEqual(groupedItems([]), []);
});
