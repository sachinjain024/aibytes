import assert from "node:assert/strict";
import { test } from "node:test";
import { appearanceUrl, gistUrl, savedUrl, tabHref, todayUrl } from "./links.js";

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

test("appearance links go to the edition or the weekly issue on aibytes.io, tagged as from a gist", () => {
  assert.equal(appearanceUrl("https://aibytes.io", { item_id: "a", edition_date: "2026-11-24" }), `https://aibytes.io/2026-11-24?${TAGS}gist`);
  assert.equal(appearanceUrl("https://aibytes.io", { item_id: "w", issue_slug: "issue-18" }), `https://aibytes.io/weekly/issue-18?${TAGS}gist`);
});

// A click as the popup root sees it: the anchor it came from, its buttons and keys.
function click(href, extra = {}) {
  const anchor = href === null ? null : { getAttribute: () => href, href: href && new URL(href, "chrome-extension://id/popup.html").href };
  return { button: 0, defaultPrevented: false, target: { closest: (sel) => (sel === "a[href]" ? anchor : null) }, ...extra };
}

test("tabHref returns the link for every http(s) click the popup must not follow", () => {
  assert.equal(tabHref(click("https://github.com/x")), "https://github.com/x");
  assert.equal(tabHref(click("https://aibytes.io/gists/g", { metaKey: true })), "https://aibytes.io/gists/g", "a modified click on a gist title");
  assert.equal(tabHref(click("https://aibytes.io/2026-11-24", { ctrlKey: true })), "https://aibytes.io/2026-11-24");
  assert.equal(tabHref(click("http://localhost:5173/saved", { shiftKey: true })), "http://localhost:5173/saved");
  assert.equal(tabHref(click("https://x.com/a", { button: 1 })), "https://x.com/a", "a middle click");
});

test("tabHref leaves alone what is not a web link, or what the row already handled", () => {
  assert.equal(tabHref(click(null)), null, "not on a link");
  assert.equal(tabHref(click("#top")), null);
  assert.equal(tabHref(click("mailto:a@b.c")), null);
  assert.equal(tabHref(click("javascript:void(0)")), null);
  assert.equal(tabHref(click("https://aibytes.io/gists/g", { defaultPrevented: true })), null, "a plain click that opened the gist");
  assert.equal(tabHref(click("https://x.com/a", { button: 2 })), null, "a right click");
});
