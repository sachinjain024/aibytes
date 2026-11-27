// The popup's theme: light by default, the reader's choice once made, and
// light for anything else.
import test from "node:test";
import assert from "node:assert/strict";
import { THEME_KEY, readTheme, writeTheme } from "./theme.js";

const memory = (seed = {}) => {
  const map = new Map(Object.entries(seed));
  return { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => map.set(k, String(v)), map };
};
const throwing = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } };

test("light by default: nothing stored, no storage, a value it does not know, or a storage that throws", () => {
  assert.equal(readTheme(memory()), "light");
  assert.equal(readTheme(null), "light");
  assert.equal(readTheme(memory({ [THEME_KEY]: "sepia" })), "light");
  assert.equal(readTheme(throwing), "light");
});

test("the reader's choice is kept and read back", () => {
  const storage = memory();
  assert.equal(writeTheme(storage, "dark"), true);
  assert.equal(readTheme(storage), "dark");
  assert.equal(writeTheme(storage, "light"), true);
  assert.equal(readTheme(storage), "light");
});

test("a failed write reports false; an unknown theme is refused", () => {
  assert.equal(writeTheme(throwing, "dark"), false);
  assert.throws(() => writeTheme(memory(), "sepia"), /unknown theme/);
});
