import assert from "node:assert/strict";
import { test } from "node:test";
import { keepGist, panelPage, withGist, withoutGist } from "./gistPanel.js";

const at = (pathname, search = "") => ({ pathname, search });

test("opening a gist adds ?gist= and keeps the path and every filter", () => {
  assert.equal(withGist(at("/2026-11-13"), "tinyeval"), "/2026-11-13?gist=tinyeval");
  assert.equal(withGist(at("/", "?c=repos&t=agents,open-source&s=github&q=claude"), "x1"), "/?c=repos&t=agents,open-source&s=github&q=claude&gist=x1");
  assert.equal(withGist(at("/weekly/issue-16", "?gist=old"), "new"), "/weekly/issue-16?gist=new");
  assert.equal(withGist(at("/saved", "?q=a%20b"), "x1"), "/saved?q=a+b&gist=x1");
});

test("closing removes only ?gist=", () => {
  assert.equal(withoutGist(at("/2026-11-13", "?gist=tinyeval")), "/2026-11-13");
  assert.equal(withoutGist(at("/", "?c=repos&gist=x1&t=agents,open-source")), "/?c=repos&t=agents,open-source");
  assert.equal(withoutGist(at("/", "?c=repos")), "/?c=repos");
});

test("a filter change keeps the open gist; a new day does not", () => {
  assert.equal(keepGist("?gist=x1", "?c=repos"), "?c=repos&gist=x1");
  assert.equal(keepGist("?c=news&gist=x1", ""), "?gist=x1");
  assert.equal(keepGist("?c=news", "?c=repos"), "?c=repos");
  assert.equal(keepGist("?gist=Bad", "?c=repos"), "?c=repos");
});

test("the event says whether the opening card was on a daily or a weekly page", () => {
  assert.equal(panelPage({ edition_date: "2026-11-13" }), "daily");
  assert.equal(panelPage({ issue_slug: "issue-16" }), "weekly");
  assert.equal(panelPage(undefined), "daily");
});
