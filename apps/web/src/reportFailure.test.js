import assert from "node:assert/strict";
import { test } from "node:test";
import { failureReport } from "./newsletterPrompt.js";
import { reportFailure } from "./reportFailure.js";

test("a failed attempt is reported once, with the code and the page, and never an email", async () => {
  assert.equal(failureReport("ok", "/"), null);
  assert.equal(failureReport(null, "/"), null);
  const report = failureReport({ failed: "timeout" }, "/weekly/issue-17");
  assert.deepEqual(report, { code: "timeout", page: "/weekly/issue-17" });
  const calls = [];
  await reportFailure(report.code, report.page, (data) => { calls.push(data); });
  assert.deepEqual(calls, [{ code: "timeout", page: "/weekly/issue-17" }]);
  assert.equal(Object.hasOwn(calls[0], "email"), false);
});

test("a reporter that fails resolves anyway", async () => {
  await reportFailure("permission-denied", "/", () => { throw new Error("down"); });
  await reportFailure("permission-denied", "/", () => Promise.reject(new Error("down")));
});
