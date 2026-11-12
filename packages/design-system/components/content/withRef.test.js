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
  assert.equal(withRef("https://news.ycombinator.com/item?id=50443587"),
    "https://news.ycombinator.com/item?id=50443587&ref=aiBytes_");
  assert.equal(withRef("https://x.com/s?q=a%20b,c"), "https://x.com/s?q=a%20b,c&ref=aiBytes_");
  assert.equal(withRef("https://x.com/s?"), "https://x.com/s?ref=aiBytes_");
});

test("the fragment stays after the parameter", () => {
  assert.equal(withRef("https://github.com/acme/officecli#readme"),
    "https://github.com/acme/officecli?ref=aiBytes_#readme");
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
