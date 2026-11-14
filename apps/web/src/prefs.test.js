import assert from "node:assert/strict";
import { test } from "node:test";
import { ORDER, PANEL_WIDTH, readChoice, readWidth, THEME, VIEW, writeChoice, writeWidth } from "./prefs.js";
import { withBlockedStorage } from "./blocked-storage.js";

const memory = (entries = {}) => ({
  getItem: (key) => (key in entries ? entries[key] : null),
  setItem: (key, value) => { entries[key] = value; },
});
const broken = {
  getItem() { throw new Error("SecurityError"); },
  setItem() { throw new Error("QuotaExceededError"); },
};

test("a stored known value is read back", () => {
  const storage = memory();
  assert.equal(writeChoice(VIEW, "list", storage), true);
  assert.equal(readChoice(VIEW, storage), "list");
});

test("nothing stored, or an unknown value, reads as no choice", () => {
  assert.equal(readChoice(VIEW, memory()), null);
  assert.equal(readChoice(VIEW, memory({ "aibytes-view": "masonry" })), null);
  assert.equal(readChoice(THEME, memory({ "aibytes-theme": "" })), null);
});

test("a storage that throws behaves like an empty one", () => {
  assert.equal(readChoice(THEME, broken), null);
  assert.equal(writeChoice(THEME, "dark", broken), false);
});

test("writing a value the app does not know is a bug, not a silent store", () => {
  assert.throws(() => writeChoice(VIEW, "masonry", memory()), /unknown value masonry/);
});

test("the feed order reads back both modes and nothing else", () => {
  const storage = memory();
  for (const mode of ["ranked", "grouped"]) {
    assert.equal(writeChoice(ORDER, mode, storage), true);
    assert.equal(readChoice(ORDER, storage), mode);
  }
  assert.equal(ORDER.key, "aibytes-order");
  assert.equal(readChoice(ORDER, memory({ "aibytes-order": "newest" })), null);
  assert.equal(readChoice(ORDER, broken), null);
  assert.throws(() => writeChoice(ORDER, "newest", memory()), /unknown value newest/);
});

test("blocked site data, where reading localStorage itself throws, is no choice and no write", () => {
  withBlockedStorage(() => {
    assert.equal(readChoice(THEME), null);
    assert.equal(writeChoice(THEME, "dark"), false);
  });
});

test("the panel width reads back inside 360 to 1200 and as nothing otherwise", () => {
  const storage = memory();
  assert.equal(readWidth(PANEL_WIDTH, storage), null);
  assert.equal(writeWidth(PANEL_WIDTH, 520, storage), true);
  assert.equal(readWidth(PANEL_WIDTH, storage), 520);
  for (const bad of ["", "abc", "359", "1201", "460.5", "-460", "1e3", "0x200", " 500"]) {
    assert.equal(readWidth(PANEL_WIDTH, memory({ "aibytes-gist-panel-w": bad })), null, bad);
  }
  assert.equal(readWidth(PANEL_WIDTH, broken), null);
  assert.equal(writeWidth(PANEL_WIDTH, 500, broken), false);
  assert.throws(() => writeWidth(PANEL_WIDTH, 100, memory()), /out of range/);
});
