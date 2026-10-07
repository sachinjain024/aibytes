import assert from "node:assert/strict";
import { test } from "node:test";
import { ago, longDate, midDate, shortDate } from "./format.js";

test("edition dates format as the UI kit's labels", () => {
  assert.equal(longDate("2026-10-07"), "Wed, Oct 7, 2026");
  assert.equal(midDate("2026-10-07"), "Wed, Oct 7");
  assert.equal(shortDate("2026-10-07"), "Oct 7");
});

test("a date stays on its day in any time zone", () => {
  // Formatting is pinned to UTC, so the process zone cannot shift the day.
  assert.equal(shortDate("2026-01-01"), "Jan 1");
  assert.equal(shortDate("2026-12-31"), "Dec 31");
});

test("ago rounds down to the largest whole unit", () => {
  const now = Date.parse("2026-10-07T17:30:00Z");
  assert.equal(ago("2026-10-07T17:29:40Z", now), "just now");
  assert.equal(ago("2026-10-07T17:05:00Z", now), "25m ago");
  assert.equal(ago("2026-10-07T13:29:00Z", now), "4h ago");
  assert.equal(ago("2026-10-05T17:30:00Z", now), "2d ago");
});

test("a timestamp in the future reads as just now, not negative", () => {
  assert.equal(ago("2026-10-07T18:00:00Z", Date.parse("2026-10-07T17:30:00Z")), "just now");
});
