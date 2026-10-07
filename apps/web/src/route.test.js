import assert from "node:assert/strict";
import { test } from "node:test";
import { editionPath, issueRedirect, parseRoute, pickEdition } from "./route.js";

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
