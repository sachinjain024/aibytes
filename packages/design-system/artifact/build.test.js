// The Design System Artifact build: tokens.json mirrors tokens/token.css, the
// stylesheet stops declaring what tokens.json holds, every exported component
// gets a preview.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { bundleCss, componentNames, tokensCss, tokensFromCss } from "./build.mjs";
import { PREVIEWS } from "./previews.mjs";

const css = await readFile(new URL("../tokens/token.css", import.meta.url), "utf8");
const tokens = tokensFromCss(css, {});
const colour = (name) => tokens.color.tokens.find((t) => t.name === name);

test("colours carry both themes, exactly as token.css has them", () => {
  assert.deepEqual(colour("paper").value, { light: "#f6f8fc", dark: "#101012" });
  assert.deepEqual(colour("line").value, { light: "#17253d0d", dark: "#ffffff0d" });
  assert.equal(colour("bg").value, "{paper}");
  assert.equal(colour("link").value, "{blue}");
  assert.equal(colour("lang-other").value, "{text-2}");
});

test("every token name is used once, and every one the page reads has a valid value", () => {
  const names = ["color", "spacing", "radius", "letterSpacing", "fontSize", "lineHeight", "zIndex", "other"]
    .flatMap((family) => tokens[family].tokens.map((t) => t.name));
  assert.equal(new Set(names).size, names.length);
  const colours = new Set(tokens.color.tokens.map((t) => t.name));
  for (const t of tokens.color.tokens) {
    for (const v of typeof t.value === "string" ? [t.value] : Object.values(t.value)) {
      assert.ok(/^#[0-9a-f]{3,8}$/.test(v) || colours.has(v.slice(1, -1)), `${t.name}: ${v}`);
    }
  }
  assert.ok(colour("ink").usage, "colours carry a usage note");
});

test("tokens.css declares the variables the components read", () => {
  const out = tokensCss(tokens);
  assert.match(out, /^\/\* aiBytes_ App Design System — generated from tokens.json \*\//);
  for (const name of ["--bg", "--text-2", "--link", "--space-4", "--text-12", "--lh-12", "--radius-card", "--font-display", "--z-banner"]) {
    assert.ok(out.includes(`${name}:`), name);
  }
});

test("bundle.css keeps no token values but the two tokens.json cannot hold", async () => {
  const out = await bundleCss();
  assert.doesNotMatch(out, /--paper:\s*#/);
  assert.match(out, /--redesign-top:calc\(/);
  assert.match(out, /--mono-features:/);
  assert.match(out, /^@import url\("https:\/\/fonts\.googleapis\.com/);
});

test("every exported component has a preview, and helpers have none", async () => {
  const names = await componentNames();
  for (const name of ["AppHeader", "Sidebar", "Card", "SaveBanner", "CardGrid"]) assert.ok(names.includes(name), name);
  for (const name of ["FeedItem", "SOURCE_NAMES", "Icon"]) assert.ok(!names.includes(name), name);
  assert.deepEqual(names.filter((name) => !PREVIEWS[name]), []);
});
