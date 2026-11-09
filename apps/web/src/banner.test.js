import assert from "node:assert/strict";
import { test } from "node:test";
import { showBanner } from "./banner.js";

const SHOWN = { signedIn: false, saveCount: 1, page: "feed" };

test("signed out with a save, off /saved: shown (C2)", () => {
  assert.equal(showBanner(SHOWN), true);
  assert.equal(showBanner({ ...SHOWN, saveCount: 12 }), true);
  assert.equal(showBanner({ ...SHOWN, page: "privacy" }), true);
});

test("each condition alone hides it", () => {
  assert.equal(showBanner({ ...SHOWN, signedIn: true }), false, "signed in");
  assert.equal(showBanner({ ...SHOWN, signedIn: null }), false, "session still restoring");
  assert.equal(showBanner({ ...SHOWN, saveCount: 0 }), false, "no saves");
  assert.equal(showBanner({ ...SHOWN, page: "saved" }), false, "on /saved, which says it itself");
});
