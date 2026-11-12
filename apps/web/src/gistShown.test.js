import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { gistIsShown } from "./gistShown.js";

// Shared with tests/test_gist_shown.py (AIB-145y T7).
const { cases } = JSON.parse(readFileSync(
  new URL("../../../packages/feed-schema/fixtures/gist-shown.json", import.meta.url), "utf8"));

test("every shared case", () => {
  assert.ok(cases.length >= 8);
  for (const c of cases) assert.equal(gistIsShown(c.gist, c.items), c.shown, c.name);
});

test("items may be a Map as well as an object", () => {
  for (const c of cases) assert.equal(gistIsShown(c.gist, new Map(Object.entries(c.items))), c.shown, c.name);
});
