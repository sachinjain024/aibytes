import assert from "node:assert/strict";
import { test } from "node:test";
import { localSaves, readSaves, SAVES_KEY } from "./saves.js";

const memory = (entries = {}) => ({
  entries,
  getItem: (key) => (key in entries ? entries[key] : null),
  setItem: (key, value) => { entries[key] = value; },
});
const broken = {
  getItem() { throw new Error("SecurityError"); },
  setItem() { throw new Error("QuotaExceededError"); },
};
// Another tab's write, as the browser reports it to this one.
const storageEvent = (key) => Object.assign(new Event("storage"), { key });
const stored = (storage) => JSON.parse(storage.entries[SAVES_KEY]);

const EDITION_ITEM = { id: "ph-glasshand-2026-11-06" };
const WEEKLY_ITEM = { id: "hn-rubygems-issue-9" };
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

test("saving and unsaving round-trip for an edition item and a weekly item, newest first", () => {
  const storage = memory();
  const saves = localSaves(storage, new EventTarget());
  assert.equal(SAVES_KEY, "aibytes-saves");
  assert.equal(saves.has(EDITION_ITEM.id), false);

  assert.deepEqual(saves.toggle(EDITION_ITEM, { edition_date: "2026-11-06" }), { saved: true, kept: true });
  assert.deepEqual(saves.toggle(WEEKLY_ITEM, { issue_slug: "issue-9" }), { saved: true, kept: true });
  assert.equal(saves.has(EDITION_ITEM.id), true);
  assert.equal(saves.has(WEEKLY_ITEM.id), true);

  const [weekly, edition] = stored(storage);
  assert.deepEqual(Object.keys(weekly), ["item_id", "issue_slug", "created_at"]);
  assert.deepEqual(Object.keys(edition), ["item_id", "edition_date", "created_at"]);
  assert.equal(weekly.item_id, WEEKLY_ITEM.id);
  assert.equal(edition.edition_date, "2026-11-06");
  assert.match(edition.created_at, ISO);
  assert.deepEqual(saves.list(), stored(storage));

  assert.deepEqual(saves.toggle(EDITION_ITEM, { edition_date: "2026-11-06" }), { saved: false, kept: true });
  assert.equal(saves.has(EDITION_ITEM.id), false);
  assert.deepEqual(stored(storage).map((s) => s.item_id), [WEEKLY_ITEM.id]);
  // A fresh store over the same storage sees what was kept.
  assert.deepEqual(localSaves(storage, new EventTarget()).list(), stored(storage));
});

test("only valid saves are read back: bad entries are dropped and the first of each id kept", () => {
  const good = { item_id: "a-2026-11-06", edition_date: "2026-11-06", created_at: "2026-11-07T09:30:00.000Z" };
  const weekly = { item_id: "b-issue-9", issue_slug: "issue-9", created_at: "2026-11-07T09:31:00.000Z" };
  const read = (value) => readSaves(memory({ [SAVES_KEY]: value }));
  assert.deepEqual(read(undefined), []);
  assert.deepEqual(readSaves(memory()), []);
  assert.deepEqual(read("{not json"), []);
  assert.deepEqual(read(JSON.stringify({ item_id: "a" })), []);
  assert.deepEqual(read(JSON.stringify([
    good,
    weekly,
    null,
    "a-2026-11-06",
    { ...good, item_id: "" },
    { ...good, item_id: 7 },
    { ...good, item_id: "both", issue_slug: "issue-9" },
    { item_id: "neither", created_at: good.created_at },
    { ...good, item_id: "impossible", edition_date: "2026-02-30" },
    { ...good, item_id: "loose", edition_date: "2026-11-6" },
    { ...weekly, item_id: "slug", issue_slug: "issue-nine" },
    { ...good, item_id: "when", created_at: "yesterday" },
    { ...good, item_id: "nowhen", created_at: undefined },
    { ...good, created_at: "2026-11-08T00:00:00.000Z" },
  ])), [good, weekly]);
  // Unknown fields are not carried along.
  assert.deepEqual(read(JSON.stringify([{ ...good, note: "x" }])), [good]);
});

test("a storage that throws reads as empty, and a save still holds for this page view", () => {
  assert.deepEqual(readSaves(broken), []);
  const saves = localSaves(broken, new EventTarget());
  assert.deepEqual(saves.list(), []);
  assert.deepEqual(saves.toggle(EDITION_ITEM, { edition_date: "2026-11-06" }), { saved: true, kept: false });
  assert.equal(saves.has(EDITION_ITEM.id), true);
  assert.equal(saves.list().length, 1);
});

test("list() is the same array until a change, so it can be a render snapshot", () => {
  const saves = localSaves(memory(), new EventTarget());
  const before = saves.list();
  assert.equal(saves.list(), before);
  saves.toggle(EDITION_ITEM, { edition_date: "2026-11-06" });
  const after = saves.list();
  assert.notEqual(after, before);
  assert.equal(saves.list(), after);
});

test("subscribers hear local changes and other tabs' changes to the saves key only", () => {
  const storage = memory();
  const tab = new EventTarget();
  const saves = localSaves(storage, tab);
  let calls = 0;
  const unsubscribe = saves.subscribe(() => { calls += 1; });

  saves.toggle(EDITION_ITEM, { edition_date: "2026-11-06" });
  assert.equal(calls, 1);

  // Another tab saves the weekly item.
  storage.entries[SAVES_KEY] = JSON.stringify([{ item_id: WEEKLY_ITEM.id, issue_slug: "issue-9", created_at: "2026-11-07T09:31:00.000Z" }]);
  tab.dispatchEvent(storageEvent(SAVES_KEY));
  assert.equal(calls, 2);
  assert.equal(saves.has(WEEKLY_ITEM.id), true);
  assert.equal(saves.has(EDITION_ITEM.id), false);

  // A corrupt value from another tab reads as no saves, through the same validation.
  storage.entries[SAVES_KEY] = "{oops";
  tab.dispatchEvent(storageEvent(SAVES_KEY));
  assert.equal(calls, 3);
  assert.deepEqual(saves.list(), []);

  // Another key, then clearing all storage (key null).
  tab.dispatchEvent(storageEvent("aibytes-theme"));
  assert.equal(calls, 3);
  storage.entries[SAVES_KEY] = JSON.stringify([{ item_id: "a-2026-11-06", edition_date: "2026-11-06", created_at: "2026-11-07T09:30:00.000Z" }]);
  tab.dispatchEvent(storageEvent(null));
  assert.equal(calls, 4);
  assert.equal(saves.has("a-2026-11-06"), true);

  unsubscribe();
  saves.toggle(EDITION_ITEM, { edition_date: "2026-11-06" });
  tab.dispatchEvent(storageEvent(SAVES_KEY));
  assert.equal(calls, 4);
});

test("saving without exactly one valid source, or without an id, is a bug, not a silent store", () => {
  const storage = memory();
  const saves = localSaves(storage, new EventTarget());
  for (const from of [{}, undefined, { edition_date: "2026-11-06", issue_slug: "issue-9" }, { edition_date: "2026-02-30" }, { issue_slug: "9" }]) {
    assert.throws(() => saves.toggle(EDITION_ITEM, from), /exactly one of edition_date or issue_slug/);
  }
  assert.throws(() => saves.toggle({}, { edition_date: "2026-11-06" }), /needs an id/);
  assert.equal(SAVES_KEY in storage.entries, false);
});
