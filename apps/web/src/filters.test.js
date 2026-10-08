import assert from "node:assert/strict";
import { test } from "node:test";
import { countMatches, describeFilters, filtersToSearch, matches, NO_FILTERS, parseFilters, toggle } from "./filters.js";

const GROUPS = [
  { name: "What it is", tags: [{ name: "Open Source", slug: "open-source" }, { name: "Dev Tool", slug: "dev-tool" }] },
  { name: "Domain", tags: [{ name: "Agents", slug: "agents" }, { name: "Voice / Speech", slug: "voice-speech" }] },
];

test("no query is no filters", () => {
  assert.deepEqual(parseFilters("", GROUPS), NO_FILTERS);
  assert.equal(filtersToSearch(NO_FILTERS, GROUPS), "");
});

test("the spec's example URL reads as a category and two tags", () => {
  assert.deepEqual(parseFilters("?c=repos&t=agents,open-source", GROUPS),
    { category: "repos", tags: ["Agents", "Open Source"], sources: [] });
});

test("unknown values are dropped, not fatal", () => {
  assert.deepEqual(parseFilters("?c=podcasts&t=agents,nope,,agents&s=reddit,github", GROUPS),
    { category: "all", tags: ["Agents"], sources: ["github"] });
});

test("one view has one URL, whatever order things were picked in", () => {
  const filters = { category: "repos", tags: ["Agents", "Open Source"], sources: ["github", "producthunt"] };
  assert.equal(filtersToSearch(filters, GROUPS), "?c=repos&t=open-source,agents&s=producthunt,github");
});

test("a URL round-trips through parse and back", () => {
  const search = "?c=hn&t=dev-tool,voice-speech&s=hackernews";
  assert.equal(filtersToSearch(parseFilters(search, GROUPS), GROUPS), search);
});

test("matching: the category, then any chosen tag, then any chosen source", () => {
  const item = { category: "repos", source: "github", tags: ["Agents", "Open Source"] };
  assert.equal(matches(item, NO_FILTERS), true);
  assert.equal(matches(item, { ...NO_FILTERS, category: "news" }), false);
  assert.equal(matches(item, { ...NO_FILTERS, tags: ["Dev Tool", "Agents"] }), true);
  assert.equal(matches(item, { ...NO_FILTERS, tags: ["Dev Tool"] }), false);
  assert.equal(matches(item, { ...NO_FILTERS, sources: ["hackernews"] }), false);
  assert.equal(matches({ category: "hn", source: "hackernews" }, { ...NO_FILTERS, tags: ["Agents"] }), false);
});

test("toggle adds and removes", () => {
  assert.deepEqual(toggle(["a"], "b"), ["a", "b"]);
  assert.deepEqual(toggle(["a", "b"], "a"), ["b"]);
});

test("the empty state names what was filtered, category first", () => {
  assert.equal(describeFilters({ ...NO_FILTERS, category: "repos" }), "Trending Dev Projects");
  assert.equal(describeFilters({ ...NO_FILTERS, tags: ["Agents"] }), "items tagged Agents");
  assert.equal(describeFilters({ category: "launches", tags: ["Agents", "Dev Tool"], sources: ["github", "hackernews"] }),
    "New Products tagged Agents or Dev Tool from Hacker News or GitHub");
});

test("counting matches skips hidden items", () => {
  const items = [
    { category: "repos", source: "github" },
    { category: "repos", source: "github", hidden: { reason: "duplicate" } },
    { category: "news", source: "techcrunch" },
  ];
  assert.equal(countMatches(items, { ...NO_FILTERS, category: "repos" }), 1);
  assert.equal(countMatches(items, NO_FILTERS), 2);
});
