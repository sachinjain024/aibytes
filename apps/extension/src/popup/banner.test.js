// The popup's save banner: signed out with a save, until the reader dismisses it.
import test from "node:test";
import assert from "node:assert/strict";
import { BANNER_KEY, readDismissed, showSaveBanner, writeDismissed } from "./banner.js";

const memory = (seed = {}) => {
  const map = new Map(Object.entries(seed));
  return { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => map.set(k, String(v)), map };
};
const throwing = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } };

test("shown signed out with at least one save, and not dismissed", () => {
  assert.equal(showSaveBanner({ user: null, saveCount: 1, dismissed: false }), true);
  assert.equal(showSaveBanner({ user: null, saveCount: 0, dismissed: false }), false);
  assert.equal(showSaveBanner({ user: null, saveCount: 3, dismissed: true }), false);
});

test("never signed in, nor while the session restores (user undefined)", () => {
  assert.equal(showSaveBanner({ user: { name: "A" }, saveCount: 3, dismissed: false }), false);
  assert.equal(showSaveBanner({ user: undefined, saveCount: 3, dismissed: false }), false);
});

test("a dismissal is kept; nothing stored, no storage or a throwing one reads as not dismissed", () => {
  const storage = memory();
  assert.equal(readDismissed(storage), false);
  assert.equal(writeDismissed(storage), true);
  assert.equal(storage.map.get(BANNER_KEY), "1");
  assert.equal(readDismissed(storage), true);
  assert.equal(readDismissed(null), false);
  assert.equal(readDismissed(throwing), false);
  assert.equal(writeDismissed(throwing), false);
});
