// WCAG 2.1 AA for Ledger's colour pairs, in both themes, read straight from
// colors.css so a token edit that breaks contrast fails here. Text needs
// 4.5:1 (1.4.3); the focus ring and other non-text cues need 3:1 (1.4.11).
// Disabled controls are exempt under 1.4.3 and left out.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const css = readFileSync(new URL("./colors.css", import.meta.url), "utf8");

function tokens(selector) {
  const at = css.indexOf(selector + "{");
  assert.notEqual(at, -1, `no ${selector} block in colors.css`);
  const body = css.slice(at + selector.length + 1, css.indexOf("}", at));
  return Object.fromEntries([...body.matchAll(/--([\w-]+):(#[0-9A-Fa-f]{6})/g)].map((m) => [m[1], m[2]]));
}

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const SURFACES = ["bg", "surface", "surface-2"];
// [foreground, backgrounds, minimum]
const PAIRS = [
  ["text", [...SURFACES, "accent-tint", "hot-tint"], 4.5],
  ["text-2", [...SURFACES, "accent-tint", "hot-tint"], 4.5],
  ["accent", [...SURFACES, "accent-tint"], 4.5], // links, active chip label
  ["hot-text", [...SURFACES, "hot-tint"], 4.5], // the "TOP" label
  ["accent-fg", ["accent", "accent-hover", "accent-active"], 4.5], // primary button
  ["accent", SURFACES, 3], // the focus ring
];

const THEMES = { light: tokens(':root,[data-theme="light"]'), dark: tokens('[data-theme="dark"]') };

for (const [name, theme] of Object.entries(THEMES)) {
  test(`${name}: every text and focus pair meets AA`, () => {
    for (const [fg, backgrounds, min] of PAIRS) {
      for (const bg of backgrounds) {
        assert.ok(theme[fg] && theme[bg], `${name} is missing --${fg} or --${bg}`);
        const ratio = contrast(theme[fg], theme[bg]);
        assert.ok(ratio >= min, `${name} --${fg} on --${bg} is ${ratio.toFixed(2)}:1, needs ${min}:1`);
      }
    }
  });
}

test("the ratio matches WCAG's own examples", () => {
  assert.equal(contrast("#000000", "#FFFFFF").toFixed(1), "21.0");
  assert.equal(contrast("#777777", "#FFFFFF").toFixed(2), "4.48");
});
