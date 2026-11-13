import assert from "node:assert/strict";
import { test } from "node:test";
import { REF, withRef } from "./withRef.js";

test("the parameter is ref=aiBytes_", () => {
  assert.equal(REF, "aiBytes_");
});

test("a URL with no query gets ?ref=", () => {
  assert.equal(withRef("https://tinyeval.dev"), "https://tinyeval.dev?ref=aiBytes_");
  assert.equal(withRef("https://example.com/a/b/"), "https://example.com/a/b/?ref=aiBytes_");
});

test("a URL with a query gets &ref=, and the query is kept byte for byte", () => {
  assert.equal(withRef("https://techcrunch.com/2026/11/10/a/?utm_source=x"),
    "https://techcrunch.com/2026/11/10/a/?utm_source=x&ref=aiBytes_");
  assert.equal(withRef("https://x.com/s?q=a%20b,c"), "https://x.com/s?q=a%20b,c&ref=aiBytes_");
  assert.equal(withRef("https://x.com/s?"), "https://x.com/s?ref=aiBytes_");
});

test("the fragment stays after the parameter", () => {
  assert.equal(withRef("https://example.com/officecli#readme"),
    "https://example.com/officecli?ref=aiBytes_#readme");
  assert.equal(withRef("https://a.com/p?x=1#y"), "https://a.com/p?x=1&ref=aiBytes_#y");
});

test("an existing ref, of any value, is left alone", () => {
  for (const url of ["https://a.com/?ref=producthunt", "https://a.com/?x=1&ref=aiBytes_", "https://a.com/?ref="]) {
    assert.equal(withRef(url), url);
  }
});

test("anything that is not an http(s) link is untouched", () => {
  for (const url of ["mailto:a@b.c", "#ph", "/gists/x", "", "not a url", undefined, null, "javascript:alert(1)"]) {
    assert.equal(withRef(url), url);
  }
  assert.equal(withRef("HTTPS://A.COM/x"), "HTTPS://A.COM/x?ref=aiBytes_");
});

test("GitHub and Hacker News links are left alone", () => {
  // GitHub reads ?ref= as a branch or tag: the page falls back to the default
  // branch but its title says "at aiBytes_". Neither site shows owners query
  // parameters, so the tag would cost something and tell no one anything.
  for (const url of [
    "https://github.com/addyosmani/agent-skills",
    "https://www.github.com/acme/repo/tree/main",
    "https://news.ycombinator.com/item?id=50439193",
  ]) {
    assert.equal(withRef(url), url);
  }
  // A host that merely contains the name is not skipped.
  assert.equal(withRef("https://github.community.example/x"), "https://github.community.example/x?ref=aiBytes_");
  assert.equal(withRef("https://gist.github.com/a/b"), "https://gist.github.com/a/b");
});
