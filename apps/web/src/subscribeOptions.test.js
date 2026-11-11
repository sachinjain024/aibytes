import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { NEWSLETTER_PRIVACY, showSubscribeOptions } from "./subscribeOptions.js";

test("subscribe options show until the reader is subscribed", () => {
  assert.equal(showSubscribeOptions(undefined), true);
  assert.equal(showSubscribeOptions(false), true);
  assert.equal(showSubscribeOptions(true), false);
});

test("the privacy page carries the newsletter paragraph", () => {
  assert.match(NEWSLETTER_PRIVACY, /Signing in here does not subscribe you\./);
  assert.match(NEWSLETTER_PRIVACY, /Google email is stored as a subscriber and added to the newsletter's list on Substack\./);
  assert.match(NEWSLETTER_PRIVACY, /You can unsubscribe from any issue\./);
  assert.match(NEWSLETTER_PRIVACY, /publisher's Slack workspace so you can be added by hand\./);
  const page = readFileSync(new URL("./App.jsx", import.meta.url), "utf8");
  assert.match(page, /\{NEWSLETTER_PRIVACY\}/);
});
