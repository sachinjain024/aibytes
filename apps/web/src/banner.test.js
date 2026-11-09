import assert from "node:assert/strict";
import { test } from "node:test";
import { showBanner } from "./banner.js";

const SHOWN = { signedIn: false, saveCount: 1 };

test("signed out with a save: shown, on every page (C2, amended)", () => {
  assert.equal(showBanner(SHOWN), true);
  assert.equal(showBanner({ ...SHOWN, saveCount: 12 }), true);
});

test("each condition alone hides it", () => {
  assert.equal(showBanner({ ...SHOWN, signedIn: true }), false, "signed in");
  assert.equal(showBanner({ ...SHOWN, signedIn: null }), false, "session still restoring");
  assert.equal(showBanner({ ...SHOWN, saveCount: 0 }), false, "no saves");
});
