import assert from "node:assert/strict";
import { test } from "node:test";
import { inFeed } from "@aibytes/app-core/visibility.js";
import { rankedItems } from "@aibytes/app-core/order.js";
import { CACHE_KEY, Refused, loadJson, loadToday, readCache, todayItems, writeCache } from "./content.js";

const BASE = "https://aibytes.io/content/";
const item = (id, source, extra = {}) => ({ id, source, category: "news", hidden: false, ...extra });
const edition = (date, items, extra = {}) => ({ schema_version: 1, date, generated_at: `${date}T17:00:00Z`, counts: {}, items, ...extra });
const index = (...dates) => ({ schema_version: 1, generated_at: "x", editions: dates.map((date) => ({ date, path: `editions/${date}.json`, total: 1, generated_at: "x" })) });

// A fetch over a map of absolute URLs; anything else is a 404.
function fakeFetch(files) {
  const asked = [];
  const fetch = async (url) => {
    asked.push(url);
    if (!(url in files)) return { ok: false, status: 404, json: async () => ({}) };
    return { ok: true, status: 200, json: async () => structuredClone(files[url]) };
  };
  return { fetch, asked };
}

// A Storage with getItem and setItem, as localStorage.
function fakeStorage(entries = {}) {
  const map = new Map(Object.entries(entries));
  return { getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)), map };
}

test("loadToday reads index.json, then its newest edition by path", async () => {
  const { fetch, asked } = fakeFetch({
    [BASE + "index.json"]: index("2026-11-19", "2026-11-18"),
    [BASE + "editions/2026-11-19.json"]: edition("2026-11-19", [item("a", "github")]),
    [BASE + "editions/2026-11-18.json"]: edition("2026-11-18", [item("b", "github")]),
  });
  const got = await loadToday({ fetch, base: BASE });
  assert.equal(got.date, "2026-11-19");
  assert.deepEqual(asked, [BASE + "index.json", BASE + "editions/2026-11-19.json"]);
});

test("loadToday refuses an index or an edition at schema_version 2", async () => {
  const v2index = fakeFetch({ [BASE + "index.json"]: { ...index("2026-11-19"), schema_version: 2 } });
  await assert.rejects(loadToday({ fetch: v2index.fetch, base: BASE }), Refused);
  assert.equal(v2index.asked.length, 1, "nothing is fetched past a refused index");
  const v2edition = fakeFetch({
    [BASE + "index.json"]: index("2026-11-19"),
    [BASE + "editions/2026-11-19.json"]: edition("2026-11-19", [], { schema_version: 2 }),
  });
  await assert.rejects(loadToday({ fetch: v2edition.fetch, base: BASE }), Refused);
});

test("loadJson refuses schema_version 2 for each kind of content file, and a file without one", async () => {
  const files = {
    "index.json": { editions: [] },
    "editions/2026-11-19.json": { date: "2026-11-19", items: [] },
    "weekly/index.json": { issues: [] },
    "weekly/issue-19.json": { slug: "issue-19", items: [] },
    "gists/hn-tinyeval.json": { slug: "hn-tinyeval" },
  };
  for (const [path, body] of Object.entries(files)) {
    const url = BASE + path;
    assert.deepEqual(await loadJson(fakeFetch({ [url]: { ...body, schema_version: 1 } }).fetch, url), { ...body, schema_version: 1 }, path);
    await assert.rejects(loadJson(fakeFetch({ [url]: { ...body, schema_version: 2 } }).fetch, url), Refused, path);
    await assert.rejects(loadJson(fakeFetch({ [url]: body }).fetch, url), Refused, `${path} without schema_version`);
  }
});

test("a failed request or an empty index is an error, not a refusal", async () => {
  await assert.rejects(loadToday({ fetch: fakeFetch({}).fetch, base: BASE }), (e) => !(e instanceof Refused) && /404/.test(e.message));
  await assert.rejects(loadToday({ fetch: fakeFetch({ [BASE + "index.json"]: index() }).fetch, base: BASE }), (e) => !(e instanceof Refused));
  const offline = async () => { throw new TypeError("Failed to fetch"); };
  await assert.rejects(loadToday({ fetch: offline, base: BASE }), TypeError);
});

test("todayItems ranks the whole edition, hidden items included, then filters", () => {
  // No rank, so the fallback orders by position within each source. The hidden
  // GitHub item takes GitHub's first place: ranked whole, g1 stands at 1/2 and
  // comes after h2. Filtered first, g1 would stand at 0 and lead the list.
  const items = [
    item("g0", "github", { hidden: true }), item("g1", "github"),
    item("h1", "hackernews"), item("h2", "hackernews"), item("h3", "hackernews"),
    item("x1", "x", { category: "x" }),
  ];
  assert.deepEqual(todayItems(edition("2026-11-19", items)).map((i) => i.id), ["h1", "h2", "g1", "h3"]);
  assert.notDeepEqual(rankedItems(items.filter(inFeed)).map((i) => i.id), ["h1", "h2", "g1", "h3"], "the fixture must tell the two orders apart");
});

test("todayItems follows rank when the edition has it", () => {
  const items = [item("a", "github", { rank: 3 }), item("b", "hackernews", { rank: 1, hidden: true }), item("c", "techcrunch", { rank: 2 })];
  assert.deepEqual(todayItems(edition("2026-11-19", items)).map((i) => i.id), ["c", "a"]);
});

test("the cache round-trips the edition with its date and when it was kept", () => {
  const storage = fakeStorage();
  const kept = edition("2026-11-19", [item("a", "github")]);
  writeCache(storage, kept, new Date("2026-11-19T18:00:00Z"));
  assert.deepEqual(JSON.parse(storage.map.get(CACHE_KEY)), { date: "2026-11-19", edition: kept, cached_at: "2026-11-19T18:00:00.000Z" });
  assert.deepEqual(readCache(storage), kept);
});

test("readCache treats missing, corrupt and unknown entries as empty", () => {
  const good = edition("2026-11-19", []);
  const entry = (e, date = e?.date) => JSON.stringify({ date, edition: e, cached_at: "x" });
  const bad = {
    missing: undefined,
    "not JSON": "{oops",
    null: "null",
    "a string": JSON.stringify("hi"),
    "no edition": JSON.stringify({ date: "2026-11-19" }),
    "schema_version 2": entry({ ...good, schema_version: 2 }),
    "no schema_version": entry({ date: good.date, items: [] }),
    "not a real date": entry({ ...good, date: "2026-02-30" }),
    "items not an array": entry({ ...good, items: {} }),
    "date disagrees": entry(good, "2026-11-18"),
  };
  for (const [name, raw] of Object.entries(bad)) {
    assert.equal(readCache(fakeStorage(raw === undefined ? {} : { [CACHE_KEY]: raw })), null, name);
  }
  assert.equal(readCache(null), null, "no storage at all");
  assert.equal(readCache({ getItem() { throw new Error("blocked"); } }), null, "storage that throws");
});

test("writeCache survives a storage that refuses the write", () => {
  assert.doesNotThrow(() => writeCache({ setItem() { throw new Error("QuotaExceededError"); } }, edition("2026-11-19", [])));
  assert.doesNotThrow(() => writeCache(null, edition("2026-11-19", [])));
});
