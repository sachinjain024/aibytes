import assert from "node:assert/strict";
import { test } from "node:test";
import { inFeed } from "./visibility.js";

test("weekly x items are not feed cards", () => {
  const x = { category: "x", source: "x", hidden: false, title: "@lab five words here" };
  const news = { category: "news", source: "techcrunch", hidden: false };
  assert.equal(inFeed(x), false);
  assert.equal(inFeed(news), true);
  assert.equal(inFeed({ ...news, hidden: true }), false);
  const issue = [news, x, { ...news, category: "hn", id: "hn-a-issue-19" }];
  assert.deepEqual(issue.filter(inFeed).map((item) => item.category), ["news", "hn"]);
});
