import assert from "node:assert/strict";
import { test } from "node:test";
import { moreFrom, backLink, robotsTxt, shownGists, sitemapXml, siteEntries } from "./gistSite.js";

const item = (id, rank, extra = {}) => ({ id, rank, hidden: false, source: "hackernews", ...extra });
const gist = (slug, depth, appearances, extra = {}) => ({ slug, depth, kind: "hn", appearances, updated_at: "2026-08-28T09:00:00Z", ...extra });

test("only gists with a visible appearance are shown", () => {
  const items = { a: item("a", 1), b: item("b", 2, { hidden: true }) };
  const gists = [gist("one", "full", [{ item_id: "a", edition_date: "2026-08-27" }]), gist("two", "full", [{ item_id: "b", edition_date: "2026-08-27" }])];
  assert.deepEqual(shownGists(gists, items).map((g) => g.slug), ["one"]);
});

test("more from: the first appearance's edition, ranked, without the gist's own item, at most four", () => {
  const items = [item("a", 3), item("b", 1), item("c", 2, { hidden: true }), item("d", 4), item("e", 5), item("f", 6), item("g", 7)];
  const more = moreFrom({ appearances: [{ item_id: "a", edition_date: "2026-08-27" }] }, items);
  assert.deepEqual(more.map((i) => i.id), ["b", "d", "e", "f"]);
});

test("more from is empty when the edition or issue could not be loaded", () => {
  assert.deepEqual(moreFrom({ appearances: [{ item_id: "a", edition_date: "2026-08-27" }] }, undefined), []);
});

test("the back link names the first appearance", () => {
  assert.deepEqual(backLink({ appearances: [{ item_id: "a", edition_date: "2026-08-27" }] }), { href: "/2026-08-27", label: "Thu, Aug 27" });
  assert.deepEqual(backLink({ appearances: [{ item_id: "a", issue_slug: "issue-9" }] }), { href: "/weekly/issue-9", label: "Issue 9" });
  assert.equal(backLink({ appearances: [] }), null);
});

const SITE = {
  editions: [{ date: "2026-08-28" }, { date: "2026-08-27" }],
  issues: [{ slug: "issue-9", published_on: "2026-08-24" }],
  gists: [gist("full-one", "full", []), gist("brief-one", "brief", []), gist("x-one", "preview", [], { kind: "x_post" })],
};

test("the sitemap lists the index pages, editions, issues and full gists, and nothing else", () => {
  const urls = siteEntries(SITE).map((e) => e.loc);
  assert.deepEqual(urls, [
    "https://aibytes.io/", "https://aibytes.io/weekly", "https://aibytes.io/2026-08-28", "https://aibytes.io/2026-08-27",
    "https://aibytes.io/weekly/issue-9", "https://aibytes.io/gists/full-one",
  ]);
  assert.ok(!urls.some((u) => /brief-one|x-one|saved|privacy/.test(u)));
});

test("lastmod comes from the source's own date", () => {
  const by = Object.fromEntries(siteEntries(SITE).map((e) => [e.loc.replace("https://aibytes.io", "") || "/", e.lastmod]));
  assert.equal(by["/"], "2026-08-28");
  assert.equal(by["/weekly"], "2026-08-24");
  assert.equal(by["/2026-08-27"], "2026-08-27");
  assert.equal(by["/weekly/issue-9"], "2026-08-24");
  assert.equal(by["/gists/full-one"], "2026-08-28");
});

test("sitemap XML is escaped and well formed", () => {
  const xml = sitemapXml([{ loc: "https://aibytes.io/gists/a&b", lastmod: "2026-08-28" }]);
  assert.match(xml, /^<\?xml version="1.0" encoding="UTF-8"\?>\n<urlset xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9">/);
  assert.match(xml, /<loc>https:\/\/aibytes\.io\/gists\/a&amp;b<\/loc><lastmod>2026-08-28<\/lastmod>/);
  assert.ok(xml.trimEnd().endsWith("</urlset>"));
});

test("a sitemap past 45,000 addresses fails the build", () => {
  const gists = Array.from({ length: 45_000 }, (_, i) => gist("g" + i, "full", []));
  assert.throws(() => siteEntries({ ...SITE, gists }), /45,000/);
});

test("robots.txt allows everything and names the sitemap", () => {
  assert.equal(robotsTxt(), "User-agent: *\nAllow: /\n\nSitemap: https://aibytes.io/sitemap.xml\n");
});
