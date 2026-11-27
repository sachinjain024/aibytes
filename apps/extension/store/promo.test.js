// The promo images' script (spec AIB-76n store-listing, "The promo images").
import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { PROMO, candidate, nextPromoDir, numbered, pngColourType } from "./promo.mjs";

test("the shortlist numbers PNGs by kind, grouped in tool order, ignoring HTML and other files", () => {
  const names = ["grok-tile-1.png", "claude-tile-2.png", "claude-tile-1.png", "claude-tile-1.html", "gemini-marquee-1.png", "claude-marquee-1.png", "review.html"];
  assert.deepEqual(numbered(names).map((c) => `${c.label} ${c.name}`), [
    "T1 claude-tile-1.png", "T2 claude-tile-2.png", "T3 grok-tile-1.png",
    "M1 claude-marquee-1.png", "M2 gemini-marquee-1.png",
  ]);
});

test("the two store sizes and the committed names", () => {
  assert.deepEqual(PROMO.tile, { width: 440, height: 280, dir: "promo-tile", file: "promo-tile.png" });
  assert.deepEqual(PROMO.marquee, { width: 1400, height: 560, dir: "marquee", file: "marquee.png" });
});

test("a finished pick goes in a new version, never over an earlier one", async () => {
  const assets = await mkdtemp(path.join(tmpdir(), "promo-"));
  try {
    assert.equal(await nextPromoDir("tile", assets), path.join(assets, "promo-tile", "v1"));
    await mkdir(path.join(assets, "marquee", "v1"), { recursive: true });
    await mkdir(path.join(assets, "marquee", "v2"), { recursive: true });
    assert.equal(await nextPromoDir("marquee", assets), path.join(assets, "marquee", "v3"));
  } finally {
    await rm(assets, { recursive: true });
  }
});

test("a candidate's name gives its tool, kind and number", () => {
  assert.deepEqual(candidate("claude-tile-2.html"), { tool: "claude", kind: "tile", n: 2, ext: "html" });
  assert.deepEqual(candidate("gemini-marquee-1.png"), { tool: "gemini", kind: "marquee", n: 1, ext: "png" });
  assert.equal(candidate("claude-banner-1.png"), null);
  assert.equal(candidate("bing-tile-1.png"), null);
  assert.equal(candidate("notes.md"), null);
});

test("pngColourType reads the IHDR colour type: 2 is RGB with no alpha", () => {
  const png = Buffer.alloc(33);
  png[25] = 2;
  assert.equal(pngColourType(png), 2);
  png[25] = 6;
  assert.equal(pngColourType(png), 6);
});
