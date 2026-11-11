import assert from "node:assert/strict";
import { test } from "node:test";
import { toSubscriberDoc } from "./subscriber.js";

const at = new Date("2026-11-11T08:00:00.000Z");

test("a subscriber document is the email, the source and the time", () => {
  assert.deepEqual(toSubscriberDoc({ email: "ada@example.com", uid: "alice" }, at), {
    email: "ada@example.com",
    source: "signin-prompt",
    created_at: at,
  });
});

test("a user with no email throws", () => {
  assert.throws(() => toSubscriberDoc({}, at), /email/);
  assert.throws(() => toSubscriberDoc({ email: "" }, at), /email/);
  assert.throws(() => toSubscriberDoc(null, at), /email/);
});
