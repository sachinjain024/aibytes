// The extension's copy (spec AIB-76n site-extension): the agreed strings,
// filled in, and a missing key is an error rather than a blank.
import test from "node:test";
import assert from "node:assert/strict";
import { t } from "./extension.js";

test("strings come back as agreed, with their values filled in", () => {
  assert.equal(t("onb.ni.h1"), "aiBytes_ for Chrome");
  assert.equal(t("onb.stepof", { n: 1, total: 2 }), "Step 1 of 2");
  assert.equal(t("onb.s2.continue", { name: "Ada" }), "Continue as Ada");
  assert.equal(t("site.cta"), "Add to Chrome");
});

test("an unknown key throws", () => {
  assert.throws(() => t("onb.nope"), /onb\.nope/);
});
