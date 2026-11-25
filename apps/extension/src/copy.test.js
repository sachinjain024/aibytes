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

test("t fills {name} and leaves an unknown one as written", () => {
  assert.equal(t("pop.foot.meta", { date: "Nov 19", count: 34 }), "Nov 19 · 34 items");
  assert.equal(t("pop.end", {}), "That's the {date} edition.");
  assert.throws(() => t("pop.nope"), /no copy/);
});
