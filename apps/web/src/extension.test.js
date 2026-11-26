// The extension's site-wide settings (spec AIB-76n site-extension, "The install
// box"): the flag stays off until the store update is live, and the store URL
// is the listing the extension replaces.
import test from "node:test";
import assert from "node:assert/strict";
import { EXTENSION_LIVE, STORE_URL } from "./extension.js";
import { EXTENSION_ID } from "./extensionBridge.js";

test("the flag is off until the store-listing module turns it on", () => {
  assert.equal(EXTENSION_LIVE, false);
});

test("the store URL is the listing for the extension's id", () => {
  assert.equal(STORE_URL, `https://chromewebstore.google.com/detail/${EXTENSION_ID}`);
});
