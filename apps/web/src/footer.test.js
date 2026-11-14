import assert from "node:assert/strict";
import { test } from "node:test";
import { FOOTER_LINKS, GITHUB_URL, mailto, SUBSCRIBE_HREF, SUBSCRIBE_URL } from "./footer.js";

test("a mailto link encodes its subject", () => {
  assert.equal(mailto("a@b.co", "Suggest a link: aiBytes_"), "mailto:a@b.co?subject=Suggest%20a%20link%3A%20aiBytes_");
});

test("the footer links, in order", () => {
  assert.deepEqual(FOOTER_LINKS.map((l) => l.label),
    ["Chrome Extension (soon)", "GitHub", "X", "Suggest a link", "Advertise", "Privacy"]);
});

test("the extension has no link until it ships", () => {
  assert.equal(FOOTER_LINKS[0].href, undefined);
});

test("every other link is https, mailto, or a page of the site", () => {
  for (const link of FOOTER_LINKS.slice(1)) assert.match(link.href, /^(https:\/\/|mailto:|\/[a-z])/, link.label);
  assert.equal(FOOTER_LINKS.find((l) => l.label === "Privacy").href, "/privacy");
  assert.equal(GITHUB_URL, "https://github.com/sachinjain024/aibytes");
  assert.equal(FOOTER_LINKS.find((l) => l.label === "GitHub").href, GITHUB_URL);
  assert.equal(FOOTER_LINKS.find((l) => l.label === "X").href, "https://x.com/sachinjain024");
});

test("subscribe goes to the newsletter's own subscribe page", () => {
  assert.equal(SUBSCRIBE_URL, "https://newsletter.aibytes.io/subscribe");
});

test("every Subscribe link on the site uses one tagged address, so signups can be told apart from direct visits", () => {
  assert.equal(SUBSCRIBE_HREF, SUBSCRIBE_URL + "?ref=aiBytes_");
});

test("no Subscribe link in the app is written with the untagged address", async () => {
  const { readFileSync } = await import("node:fs");
  for (const file of ["App.jsx", "GistPage.jsx"]) {
    const source = readFileSync(new URL("./" + file, import.meta.url), "utf8");
    assert.doesNotMatch(source, /href=\{SUBSCRIBE_URL\}|subscribeUrl=\{[^}]*\? SUBSCRIBE_URL/, file);
  }
});
