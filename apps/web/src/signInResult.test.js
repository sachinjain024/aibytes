import assert from "node:assert/strict";
import { test } from "node:test";
import { signInResult } from "./signInResult.js";

test("a new account is ok and new", () => {
  assert.deepEqual(signInResult({ isNewUser: true }), { status: "ok", isNew: true });
});

test("a returning account is ok and not new", () => {
  assert.deepEqual(signInResult({ isNewUser: false }), { status: "ok", isNew: false });
  assert.deepEqual(signInResult({}), { status: "ok", isNew: false });
  assert.deepEqual(signInResult(null), { status: "ok", isNew: false });
});

test("the three cancel codes are cancelled, and not new", () => {
  for (const code of ["auth/popup-closed-by-user", "auth/cancelled-popup-request", "auth/user-cancelled"]) {
    assert.deepEqual(signInResult(null, { code }), { status: "cancelled", isNew: false });
  }
});

test("any other error is a failure, and not new", () => {
  assert.deepEqual(signInResult(null, { code: "auth/popup-blocked" }), { status: "failed", isNew: false });
  assert.deepEqual(signInResult(null, {}), { status: "failed", isNew: false });
});
