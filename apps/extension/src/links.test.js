import assert from "node:assert/strict";
import { test } from "node:test";
import { gistUrl, savedUrl, todayUrl } from "./links.js";

const TAGS = "utm_source=chrome-extension&utm_medium=extension&utm_campaign=";

test("View on Web carries the three tags, with the campaign for each page", () => {
  assert.equal(todayUrl("https://aibytes.io", "2026-11-19"), `https://aibytes.io/2026-11-19?${TAGS}today`);
  assert.equal(savedUrl("https://aibytes.io"), `https://aibytes.io/saved?${TAGS}saved`);
  assert.equal(gistUrl("https://aibytes.io", "hn-tinyeval"), `https://aibytes.io/gists/hn-tinyeval?${TAGS}gist`);
});

test("the dev build's site works the same, with or without a trailing slash", () => {
  assert.equal(todayUrl("http://localhost:5173/", "2026-11-19"), `http://localhost:5173/2026-11-19?${TAGS}today`);
  assert.equal(savedUrl("http://localhost:5173"), `http://localhost:5173/saved?${TAGS}saved`);
});

test("every tag is lower case with no spaces", () => {
  for (const href of [todayUrl("https://aibytes.io", "2026-11-19"), savedUrl("https://aibytes.io"), gistUrl("https://aibytes.io", "x")]) {
    for (const [key, value] of new URL(href).searchParams) {
      if (key.startsWith("utm_")) assert.match(value, /^[a-z0-9-]+$/, href);
    }
  }
});
