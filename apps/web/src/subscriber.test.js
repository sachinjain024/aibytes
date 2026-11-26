import assert from "node:assert/strict";
import { test } from "node:test";
import { subscribe, toSubscriberDoc } from "./subscriber.js";

const at = new Date("2026-11-11T08:00:00.000Z");

test("a subscriber document is the email, the source and the time", () => {
  assert.deepEqual(toSubscriberDoc({ email: "ada@example.com", uid: "alice" }, at), {
    email: "ada@example.com",
    source: "signin-prompt",
    created_at: at,
  });
});

test("the source defaults to signin-prompt; extension-onboarding is the one other value", () => {
  const user = { email: "ada@example.com", uid: "alice" };
  assert.equal(toSubscriberDoc(user, at).source, "signin-prompt");
  assert.equal(toSubscriberDoc(user, at, "extension-onboarding").source, "extension-onboarding");
  for (const source of ["sidebar", "", null, "SIGNIN-PROMPT"]) {
    assert.throws(() => toSubscriberDoc(user, at, source), /source/, String(source));
  }
});

test("subscribe with an unknown source fails without writing", async () => {
  let wrote = false;
  const result = await subscribe({}, { uid: "alice", email: "ada@example.com" }, { source: "sidebar", writeDoc: async () => { wrote = true; } });
  assert.deepEqual(result, { failed: "invalid-argument" });
  assert.equal(wrote, false);
});

test("a user with no email throws", () => {
  assert.throws(() => toSubscriberDoc({}, at), /email/);
  assert.throws(() => toSubscriberDoc({ email: "" }, at), /email/);
  assert.throws(() => toSubscriberDoc(null, at), /email/);
});
