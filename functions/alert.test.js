const assert = require("node:assert/strict");
const { test } = require("node:test");
const { prepareReport, CODE_MAX, PAGE_MAX, DAILY_CAP } = require("./alert.js");

const auth = { uid: "reader-1", token: { email: "ada@example.com" } };
const day = "2026-11-11";

test("no auth is refused", () => {
  assert.deepEqual(prepareReport({ auth: null, data: { code: "timeout" }, day }), { ok: false, error: "unauthenticated" });
  assert.deepEqual(prepareReport({ auth: {}, data: {}, day }).error, "unauthenticated");
});

test("the email comes from the token and a body email is ignored", () => {
  const report = prepareReport({
    auth,
    data: { email: "other@example.com", uid: "someone-else", code: "timeout", page: "/" },
    day,
  });
  assert.equal(report.ok, true);
  assert.equal(report.email, "ada@example.com");
  assert.equal(report.uid, "reader-1");
  assert.equal(report.text.includes("other@example.com"), false);
  assert.equal(report.text.includes("someone-else"), false);
});

test("code and page are capped and stripped to one line", () => {
  const report = prepareReport({
    auth,
    data: { code: "time\nout\u0000", page: "  /weekly\nissue  " + "x".repeat(PAGE_MAX) },
    day,
  });
  assert.equal(report.code, "time out");
  assert.equal(report.code.length <= CODE_MAX, true);
  assert.equal(report.page.startsWith("/weekly issue"), true);
  assert.equal(report.page.length, PAGE_MAX);
  assert.equal(report.page.includes("\n"), false);
});

test("the fourth report in a day is dropped, and yesterday's count is not", () => {
  const full = prepareReport({ auth, data: { code: "timeout", page: "/" }, stored: { day, count: DAILY_CAP }, day });
  assert.equal(full.ok, false);
  assert.equal(full.error, "dropped");
  const nextDay = prepareReport({ auth, data: { code: "timeout", page: "/" }, stored: { day, count: DAILY_CAP }, day: "2026-11-12" });
  assert.equal(nextDay.ok, true);
  assert.equal(nextDay.count, 0);
});

test("client text cannot ping or link in Slack", () => {
  const report = prepareReport({
    auth,
    data: {
      code: "<!channel> <https://evil.example|Fix your webhook>",
      page: "<@U123> & co",
    },
    day,
  });
  assert.equal(report.text.includes("<!channel>"), false);
  assert.equal(report.text.includes("<https://"), false);
  assert.equal(report.text.includes("<@U123>"), false);
  assert.match(report.text, /code: &lt;!channel&gt; &lt;https:\/\/evil\.example\|Fix your webhook&gt;/);
  assert.match(report.text, /page: &lt;@U123&gt; &amp; co/);
});

test("the message names the failure for a person to add the reader by hand", () => {
  const now = new Date("2026-11-11T09:00:00.000Z");
  const report = prepareReport({ auth, data: { code: "permission-denied", page: "/weekly/issue-17" }, day, now });
  assert.equal(report.text, [
    "aibytes.io: a newsletter subscribe failed",
    "email: ada@example.com",
    "uid: reader-1",
    "code: permission-denied",
    "page: /weekly/issue-17",
    "time: 2026-11-11T09:00:00.000Z",
  ].join("\n"));
});
