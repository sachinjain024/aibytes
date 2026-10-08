import assert from "node:assert/strict";
import { test } from "node:test";
import { sizedImageUrl } from "./imageUrl.js";

test("TechCrunch uploads are asked for twice the slot's width", () => {
  assert.equal(sizedImageUrl("https://techcrunch.com/wp-content/uploads/2026/10/a.jpg?w=1016", 40),
    "https://techcrunch.com/wp-content/uploads/2026/10/a.jpg?w=160");
});

test("Product Hunt logos are cropped to the slot at 2x", () => {
  assert.equal(sizedImageUrl("https://ph-files.imgix.net/abc.png?auto=format", 24),
    "https://ph-files.imgix.net/abc.png?auto=format&w=48&h=48&fit=crop");
});

test("GitHub avatars take ?size=", () => {
  assert.equal(sizedImageUrl("https://github.com/ayghri.png?size=80", 40), "https://github.com/ayghri.png?size=80");
  assert.equal(sizedImageUrl("https://github.com/ayghri.png", 24), "https://github.com/ayghri.png?size=48");
});

test("anything unknown is left exactly as published", () => {
  for (const src of [
    "https://example.com/logo.png?w=9",
    "https://techcrunch.com/some/page",
    "https://github.com/org/repo/raw/main/logo.png",
    "not a url",
  ]) {
    assert.equal(sizedImageUrl(src, 40), src);
  }
});
