import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { t } from "./copy.js";

// The agreed copy, read from the prototype's source so a drift fails here.
const prototype = readFileSync(new URL("../../../docs/ux/prototypes/AIB-76n-extension/copy.js", import.meta.url), "utf8");
const agreed = Object.fromEntries([...prototype.matchAll(/key: "(pop\.[\w.]+)"[^}]*?text: "((?:[^"\\]|\\.)*)"/g)].map(([, key, text]) => [key, JSON.parse(`"${text}"`)]));

test("every pop.* string the popup uses is the prototype's, word for word", () => {
  const used = ["pop.savedbtn", "pop.signin", "pop.empty.title", "pop.empty.body", "pop.end", "pop.foot.meta", "pop.site",
    "pop.back.today", "pop.back.saved", "pop.gist.save", "pop.gist.saved", "pop.menu.signout",
    "pop.loading", "pop.error", "pop.retry", "pop.stale", "pop.refused"];
  for (const key of used) assert.equal(t(key), agreed[key], key);
});

// The theme toggle (added 27 Nov 2026, after the prototype) words its name as
// aibytes.io's header does: "Switch to {the other} theme".
test("the theme toggle's names match aibytes.io's header", () => {
  const header = readFileSync(new URL("../../../packages/design-system/components/navigation/AppHeader.jsx", import.meta.url), "utf8");
  assert.match(header, /`Switch to \$\{theme === "dark" \? "light" : "dark"\} theme`/);
  assert.equal(t("pop.theme.dark"), "Switch to dark theme");
  assert.equal(t("pop.theme.light"), "Switch to light theme");
});

// The save banner (added 27 Nov 2026, after the prototype) keeps aibytes.io's
// link and ending; only the first sentence says where the saves are kept.
test("the save banner's words follow aibytes.io's, except where the saves live", () => {
  const banner = readFileSync(new URL("../../../packages/design-system/components/content/SaveBanner.jsx", import.meta.url), "utf8");
  assert.ok(banner.includes(`link: "${t("pop.banner.link")}"`));
  assert.ok(banner.includes(`after: "${t("pop.banner.after")}"`));
  assert.equal(t("pop.banner.before"), "Saved items are kept in this extension.");
});

test("t fills {name} and leaves an unknown one as written", () => {
  assert.equal(t("pop.foot.meta", { date: "Nov 19", count: 34 }), "Nov 19 · 34 items");
  assert.equal(t("pop.end", {}), "That's the {date} edition.");
  assert.throws(() => t("pop.nope"), /no copy/);
});
