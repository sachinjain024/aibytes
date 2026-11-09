import assert from "node:assert/strict";
import { test } from "node:test";
import {
  editionPath,
  issueRedirect,
  olderEdition,
  olderWeeklyIssue,
  parseRoute,
  pickEdition,
  pickWeeklyIssue,
  privacyPath,
  savedPath,
  weeklyPath,
  weeklyUrl,
} from "./route.js";

const EDITIONS = [
  { date: "2026-10-07", path: "editions/2026-10-07.json" },
  { date: "2026-10-06", path: "editions/2026-10-06.json" },
];

test("the root is the latest edition", () => {
  assert.deepEqual(parseRoute("/"), { kind: "latest" });
  assert.equal(pickEdition(parseRoute("/"), EDITIONS).date, "2026-10-07");
});

test("a date path is that edition, with or without a trailing slash", () => {
  for (const path of ["/2026-10-06", "/2026-10-06/"]) {
    assert.deepEqual(parseRoute(path), { kind: "edition", date: "2026-10-06" });
  }
  assert.equal(pickEdition(parseRoute("/2026-10-06"), EDITIONS).date, "2026-10-06");
});

test("a real date with no edition picks nothing", () => {
  assert.equal(pickEdition(parseRoute("/2026-10-01"), EDITIONS), null);
});

test("an empty index has no latest edition", () => {
  assert.equal(pickEdition(parseRoute("/"), []), null);
});

test("impossible dates and other paths are not found", () => {
  for (const path of ["/2026-02-30", "/2026-13-01", "/about", "/2026-10-07/extra", "/content/index.json"]) {
    assert.deepEqual(parseRoute(path), { kind: "notfound" }, path);
  }
});

test("old newsletter issue links go to the newsletter subdomain, query and hash kept", () => {
  assert.deepEqual(parseRoute("/p/gemini-4-argon"), { kind: "issue", slug: "gemini-4-argon" });
  assert.equal(
    issueRedirect({ pathname: "/p/gemini-4-argon", search: "?utm_source=x", hash: "#top" }),
    "https://newsletter.aibytes.io/p/gemini-4-argon?utm_source=x#top",
  );
});

test("editionPath is what parseRoute reads back", () => {
  assert.deepEqual(parseRoute(editionPath("2026-10-07")), { kind: "edition", date: "2026-10-07" });
});

test("the older edition is the next entry, and the oldest has none", () => {
  assert.equal(olderEdition(EDITIONS, "2026-10-07").date, "2026-10-06");
  assert.equal(olderEdition(EDITIONS, "2026-10-06"), null);
  assert.equal(olderEdition(EDITIONS, "2026-01-01"), null);
});

test("the weekly archive route", () => {
  for (const path of ["/weekly", "/weekly/"]) {
    assert.deepEqual(parseRoute(path), { kind: "weekly_index" });
  }
  assert.equal(weeklyPath(), "/weekly");
});

test("a weekly issue slug path", () => {
  for (const path of ["/weekly/issue-16", "/weekly/issue-16/"]) {
    assert.deepEqual(parseRoute(path), { kind: "weekly_issue", slug: "issue-16" });
  }
  assert.equal(weeklyPath("issue-16"), "/weekly/issue-16");
  assert.equal(weeklyUrl("issue-16"), "https://aibytes.io/weekly/issue-16");
});

test("weekly issue paths do not steal edition dates or /p/ links", () => {
  assert.deepEqual(parseRoute("/weekly/2026-10-07"), { kind: "notfound" });
  assert.deepEqual(parseRoute("/weekly/issue"), { kind: "notfound" });
  assert.deepEqual(parseRoute("/weekly/issue-16/extra"), { kind: "notfound" });
});

test("pickWeeklyIssue and olderWeeklyIssue read the weekly index", () => {
  const issues = [
    { slug: "issue-16", number: 16, path: "weekly/issues/issue-16.json" },
    { slug: "issue-15", number: 15, path: "weekly/issues/issue-15.json" },
  ];
  assert.equal(pickWeeklyIssue(parseRoute("/weekly/issue-16"), issues).number, 16);
  assert.equal(pickWeeklyIssue(parseRoute("/weekly/issue-1"), issues), null);
  assert.equal(olderWeeklyIssue(issues, "issue-16").slug, "issue-15");
  assert.equal(olderWeeklyIssue(issues, "issue-15"), null);
});

test("the Saved page route, with or without a trailing slash", () => {
  for (const path of ["/saved", "/saved/"]) {
    assert.deepEqual(parseRoute(path), { kind: "saved" });
  }
  assert.equal(savedPath(), "/saved");
  assert.deepEqual(parseRoute(savedPath()), { kind: "saved" });
  assert.deepEqual(parseRoute("/saved/2026-11-06"), { kind: "notfound" });
});

test("the privacy page route, with or without a trailing slash", () => {
  for (const path of ["/privacy", "/privacy/"]) {
    assert.deepEqual(parseRoute(path), { kind: "privacy" });
  }
  assert.equal(privacyPath(), "/privacy");
  assert.deepEqual(parseRoute("/privacy/policy"), { kind: "notfound" });
});
