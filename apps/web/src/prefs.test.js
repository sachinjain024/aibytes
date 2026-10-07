import assert from "node:assert/strict";
import { test } from "node:test";
import { readChoice, THEME, VIEW, writeChoice } from "./prefs.js";

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
