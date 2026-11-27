import assert from "node:assert/strict";
import { test } from "node:test";
import { mergedLine, toAdd } from "./merge.js";

const save = (item_id, created_at, from = { edition_date: "2026-11-06" }) => ({ item_id, ...from, created_at });
const LOCAL = [
  save("c", "2026-11-07T10:00:00.000Z"),
  save("b", "2026-11-06T10:00:00.000Z", { issue_slug: "issue-9" }),
  save("a", "2026-11-05T10:00:00.000Z"),
];

test("nothing in the account: every local save is added, as stored, in order", () => {
  assert.deepEqual(toAdd(LOCAL, []), LOCAL);
});

test("some already in the account: only the rest, and the account's copy wins", () => {
  const account = [save("b", "2026-01-01T00:00:00.000Z", { edition_date: "2026-01-01" })];
  assert.deepEqual(toAdd(LOCAL, account), [LOCAL[0], LOCAL[2]]);
});

test("all already in the account, or nothing local: nothing to add", () => {
  assert.deepEqual(toAdd(LOCAL, LOCAL.map((s) => ({ ...s }))), []);
  assert.deepEqual(toAdd([], LOCAL), []);
});

test("the line after a merge", () => {
  assert.equal(mergedLine(0), null);
  assert.equal(mergedLine(1), "1 save from this browser was added to your account.");
  assert.equal(mergedLine(3), "3 saves from this browser were added to your account.");
});
