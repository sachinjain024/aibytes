// The store version and the listing's words (spec AIB-76n store-listing,
// "The package"): the version is YY.M.D of the submission day, a valid Chrome
// version above the existing listing's 26.1.15; the name and short description
// fit the store's limits and match CHROMEWEBSTORE.md.
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { NAME, SHORT_DESCRIPTION } from "./manifest.config.js";

const { version } = JSON.parse(await readFile(new URL("./package.json", import.meta.url), "utf8"));
const listing = await readFile(new URL("./CHROMEWEBSTORE.md", import.meta.url), "utf8");

/** Chrome's version: one to four dot-separated integers, 0 to 65535, no leading zeros. */
export const chromeVersion = (v) => /^(0|[1-9]\d{0,4})(\.(0|[1-9]\d{0,4})){0,3}$/.test(v) && v.split(".").every((n) => Number(n) <= 65535);
const compare = (a, b) => {
  const [x, y] = [a, b].map((v) => v.split(".").map(Number));
  for (let i = 0; i < 4; i++) if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) - (y[i] ?? 0);
  return 0;
};

test("the version is a YY.M.D Chrome version above the existing listing's 26.1.15", () => {
  assert.ok(chromeVersion(version), version);
  assert.match(version, /^\d{2}\.(1[0-2]|[1-9])\.(3[01]|[12]\d|[1-9])$/);
  assert.ok(compare(version, "26.1.15") > 0, `${version} must be above 26.1.15`);
  assert.ok(!chromeVersion("26.01.5") && !chromeVersion("70000.1") && chromeVersion("26.11.27"));
});

test("the name and short description fit the store and match the listing", () => {
  assert.ok(NAME.length <= 75, `name is ${NAME.length} characters`);
  assert.ok(SHORT_DESCRIPTION.length <= 132, `short description is ${SHORT_DESCRIPTION.length} characters`);
  assert.ok(listing.includes(`| Name | ${NAME} |`));
  assert.ok(listing.includes(`| Short description | ${SHORT_DESCRIPTION} |`));
});

test("the description fits the store, under 1,000 words, and links /privacy", () => {
  const description = /<!-- description:start -->\n```text\n([\s\S]*?)\n```\n<!-- description:end -->/.exec(listing)?.[1];
  assert.ok(description, "the description block is in CHROMEWEBSTORE.md");
  assert.ok(description.length <= 16000);
  assert.ok(description.split(/\s+/).length < 1000);
  assert.match(description, /https:\/\/aibytes\.io\/privacy/);
  assert.doesNotMatch(description, /\b(best|#1|number one|free|top-rated)\b/i);
});
