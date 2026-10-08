import assert from "node:assert/strict";
import { test } from "node:test";
import { FOOTER_LINKS, mailto, SUBSCRIBE_URL } from "./footer.js";

test("a mailto link encodes its subject", () => {
  assert.equal(mailto("a@b.co", "Suggest a link: aiBytes_"), "mailto:a@b.co?subject=Suggest%20a%20link%3A%20aiBytes_");
});

test("the footer links, in order", () => {
  assert.deepEqual(FOOTER_LINKS.map((l) => l.label),
    ["Chrome Extension (soon)", "GitHub", "X", "Suggest a link", "Advertise"]);
});

test("the extension has no link until it ships", () => {
  assert.equal(FOOTER_LINKS[0].href, undefined);
});

test("every other link is https or mailto", () => {
  for (const link of FOOTER_LINKS.slice(1)) assert.match(link.href, /^(https:\/\/|mailto:)/, link.label);
  assert.equal(FOOTER_LINKS.find((l) => l.label === "GitHub").href, "https://github.com/sachinjain024/aibytes");
  assert.equal(FOOTER_LINKS.find((l) => l.label === "X").href, "https://x.com/sachinjain024");
});

test("subscribe goes to the newsletter's own subscribe page", () => {
  assert.equal(SUBSCRIBE_URL, "https://newsletter.aibytes.io/subscribe");
});
