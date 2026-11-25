import assert from "node:assert/strict";
import { test } from "node:test";
import { SAVES_KEY, localSaves } from "@aibytes/app-core/saves.js";
import { extensionStorage } from "./extensionStorage.js";

// chrome.storage.local and chrome.storage.onChanged, as far as the adapter uses
// them. `outside` changes a key the way the background worker would.
function fakeChrome(initial = {}) {
  const data = { ...initial };
  const listeners = new Set();
  const fire = (changes, area = "local") => listeners.forEach((fn) => fn(changes, area));
  const local = {
    async get(key) { return key in data ? { [key]: data[key] } : {}; },
    async set(items) {
      const changes = {};
      for (const [k, v] of Object.entries(items)) { changes[k] = { oldValue: data[k], newValue: v }; data[k] = v; }
      queueMicrotask(() => fire(changes));
    },
    async remove(key) {
      const changes = { [key]: { oldValue: data[key] } };
      delete data[key];
      queueMicrotask(() => fire(changes));
    },
  };
  return {
    data,
    fire,
    outside(key, value) { const old = data[key]; if (value === undefined) delete data[key]; else data[key] = value; fire({ [key]: { oldValue: old, newValue: value } }); },
    storage: { local, onChanged: { addListener: (fn) => listeners.add(fn), removeListener: (fn) => listeners.delete(fn) } },
    listenerCount: () => listeners.size,
  };
}

const save = (item_id) => ({ item_id, edition_date: "2026-11-24", created_at: "2026-11-24T10:00:00.000Z" });
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

test("load copies the stored saves, so reads are synchronous", async () => {
  const chrome = fakeChrome({ [SAVES_KEY]: JSON.stringify([save("a")]) });
  const { storage } = await extensionStorage(chrome);
  assert.equal(storage.getItem(SAVES_KEY), JSON.stringify([save("a")]));
  assert.equal(storage.getItem("anything-else"), null);
  assert.deepEqual(localSaves(storage, null).list().map((s) => s.item_id), ["a"]);
});

test("an empty chrome.storage.local reads as no saves", async () => {
  const { storage } = await extensionStorage(fakeChrome());
  assert.equal(storage.getItem(SAVES_KEY), null);
  assert.deepEqual(localSaves(storage, null).list(), []);
});

test("writes go through to chrome.storage.local, and a reopened popup sees them", async () => {
  const chrome = fakeChrome();
  const first = await extensionStorage(chrome);
  localSaves(first.storage, first.events).toggle({ id: "a" }, { edition_date: "2026-11-24" });
  assert.deepEqual(JSON.parse(chrome.data[SAVES_KEY]).map((s) => s.item_id), ["a"]);
  const reopened = await extensionStorage(chrome);
  assert.ok(localSaves(reopened.storage, null).has("a"));
  first.storage.removeItem(SAVES_KEY);
  await tick();
  assert.equal(SAVES_KEY in chrome.data, false);
});

test("an outside change updates the copy and raises a storage event", async () => {
  const chrome = fakeChrome({ [SAVES_KEY]: JSON.stringify([save("a")]) });
  const { storage, events } = await extensionStorage(chrome);
  const store = localSaves(storage, events);
  let heard = 0;
  const stop = store.subscribe(() => { heard += 1; });
  chrome.outside(SAVES_KEY, JSON.stringify([save("b"), save("a")]));
  assert.equal(heard, 1);
  assert.deepEqual(store.list().map((s) => s.item_id), ["b", "a"]);
  chrome.outside(SAVES_KEY, undefined); // the merge clears them
  assert.equal(heard, 2);
  assert.deepEqual(store.list(), []);
  stop();
});

test("the popup's own write does not come back as an outside change", async () => {
  const chrome = fakeChrome();
  const { storage, events } = await extensionStorage(chrome);
  const store = localSaves(storage, events);
  let heard = 0;
  const stop = store.subscribe(() => { heard += 1; });
  store.toggle({ id: "a" }, { edition_date: "2026-11-24" });
  await tick();
  assert.equal(heard, 1, "the toggle's own notify only");
  stop();
});

test("other storage areas and other keys raise nothing", async () => {
  const chrome = fakeChrome();
  const { events } = await extensionStorage(chrome);
  const heard = [];
  events.addEventListener("storage", (e) => heard.push(e.key));
  chrome.fire({ [SAVES_KEY]: { newValue: "[]" } }, "sync");
  chrome.fire({ other: { newValue: "x" } });
  assert.deepEqual(heard, []);
});

test("the last listener removed stops listening to chrome", async () => {
  const chrome = fakeChrome();
  const { events } = await extensionStorage(chrome);
  const fn = () => {};
  events.addEventListener("storage", fn);
  assert.equal(chrome.listenerCount(), 1);
  events.removeEventListener("storage", fn);
  assert.equal(chrome.listenerCount(), 0);
});

test("a write that chrome rejects is not thrown, and the copy keeps it for this popup", async () => {
  const chrome = fakeChrome();
  chrome.storage.local.set = async () => { throw new Error("QUOTA_BYTES"); };
  const { storage } = await extensionStorage(chrome);
  assert.doesNotThrow(() => storage.setItem(SAVES_KEY, "[]"));
  await tick();
  assert.equal(storage.getItem(SAVES_KEY), "[]");
});
