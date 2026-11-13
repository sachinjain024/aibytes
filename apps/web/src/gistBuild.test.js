// The built site, on fixture content: the gist pages, the sitemap and robots.txt
// (spec AIB-145y-app-gist-pages, T25). It runs a real `vite build` against a
// content tree written to a temp dir, so it takes several seconds.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, existsSync, writeFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const web = path.resolve(here, "..");
const vite = path.join(path.dirname(createRequire(import.meta.url).resolve("vite/package.json")), "bin", "vite.js");

const LEDE = "TinyEval is a 300-line Python file that runs prompt evaluations against any OpenAI-compatible endpoint.";
const item = (id, rank, extra = {}) => ({
  id, title: "Item " + id, summary: "About item " + id + ".", url: "https://example.com/" + id, source: "hackernews", source_url: "https://news.ycombinator.com/item?id=" + rank,
  category: "hn_threads", tags: [], image: { type: "none" }, rank, hidden: false, ...extra,
});
const gist = (slug, depth, itemId, extra = {}) => ({
  schema_version: 1, slug, kind: "hn", source: "hackernews", category: "hn_threads", title: "Gist " + slug, url: "https://example.com/" + slug,
  source_url: "https://news.ycombinator.com/item?id=" + slug.length, image: { type: "none" }, tags: [], depth,
  lede: depth === "preview" ? undefined : LEDE + " (" + slug + ")", sections: [{ key: "key_points", points: ["One point for " + slug + "."] }],
  links: [{ role: "destination", title: "Example", url: "https://example.com/" + slug }],
  appearances: [{ item_id: itemId, edition_date: "2026-08-27" }], created_at: "2026-08-27T08:00:00Z", updated_at: "2026-08-28T09:00:00Z", ...extra,
});

let dir;
let out;
let build;
const read = (...p) => readFileSync(path.join(out, ...p), "utf8");

before(() => {
  dir = mkdtempSync(path.join(tmpdir(), "aibytes-gist-build-"));
  const content = path.join(dir, "content");
  out = path.join(dir, "dist");
  for (const sub of ["editions", "gists", "weekly/issues"]) mkdirSync(path.join(content, sub), { recursive: true });
  const w = (file, data) => writeFileSync(path.join(content, file), JSON.stringify(data));
  w("index.json", { schema_version: 1, editions: [{ date: "2026-08-27", path: "editions/2026-08-27.json" }] });
  w("editions/2026-08-27.json", { schema_version: 1, date: "2026-08-27", items: [item("full", 1), item("brief", 2), item("gone", 3, { hidden: true }), item("other", 4, { front_page: true }), item("more", 5)] });
  w("weekly/index.json", { schema_version: 1, issues: [] });
  w("tags.json", { schema_version: 1, groups: [] });
  w("gists/full-one.json", gist("full-one", "full", "full"));
  w("gists/brief-one.json", gist("brief-one", "brief", "brief"));
  w("gists/hidden-one.json", gist("hidden-one", "full", "gone"));
  w("gists/index.json", { schema_version: 1, gists: [] });
  build = spawnSync(process.execPath, [vite, "build", "--outDir", out, "--emptyOutDir"], { cwd: web, env: { ...process.env, AIBYTES_CONTENT: content }, encoding: "utf8" });
});

after(() => rmSync(dir, { recursive: true, force: true }));

test("the build succeeds", () => {
  assert.equal(build.status, 0, build.stdout + build.stderr);
});

test("a full gist's page holds its text, its head and its structured data, with no script needed", () => {
  const page = read("gists", "full-one", "index.html");
  assert.match(page, new RegExp(LEDE.slice(0, 60)));
  assert.match(page, /<h1[^>]*>Gist full-one<\/h1>/);
  assert.match(page, /One point for full-one\./);
  assert.match(page, /<title>Gist full-one · aiBytes_<\/title>/);
  assert.match(page, /<link rel="canonical" href="https:\/\/aibytes\.io\/gists\/full-one" \/>/);
  assert.match(page, /application\/ld\+json/);
  assert.doesNotMatch(page, /name="robots"/);
  assert.match(page, /<div id="root"><div class="app-shell redesign"/);
});

test("the page links back and offers more from the same edition, not the gist's own item or a hidden one", () => {
  const page = read("gists", "full-one", "index.html");
  assert.match(page, /href="\/2026-08-27">← Back to Thu, Aug 27</);
  assert.match(page, /More from Thu, Aug 27/);
  assert.match(page, /Item other/);
  assert.match(page, /Item more/);
  assert.doesNotMatch(page, /Item gone/);
  assert.doesNotMatch(page, />Item full</);
});

test("the server markup already holds what the browser will render first: the save row and the theme toggle", () => {
  const page = read("gists", "full-one", "index.html");
  assert.match(page, /class="gist-actions"/);
  assert.match(page, /<button type="button" class="gist-save-label">Save<\/button>/);
  assert.doesNotMatch(page, /Added to your Saved items/);
  assert.match(page, /id="themeToggle"[^>]*aria-label="Switch to dark theme"/);
});

test("a More from row carries the Front page label when its item was on the HN front page", () => {
  assert.match(read("gists", "full-one", "index.html"), /Front page[\s\S]*Item other|Item other[\s\S]*Front page/);
});

test("the shell sets no theme of its own until the browser has mounted, so a dark reader never sees it flash light", () => {
  const page = read("gists", "full-one", "index.html");
  assert.match(page, /<div class="app-shell redesign">/);
  assert.doesNotMatch(page, /app-shell redesign" data-theme/);
});

test("the page carries its own data, escaped, for the browser to take over", () => {
  const page = read("gists", "full-one", "index.html");
  const block = page.match(/<script type="application\/json" id="gist-data">([\s\S]*?)<\/script>/)[1];
  assert.doesNotMatch(block, /</);
  const data = JSON.parse(block);
  assert.equal(data.gist.slug, "full-one");
  assert.deepEqual(data.more.map((i) => i.id), ["brief", "other", "more"]);
});

test("a brief gist has a page that says noindex, with no structured data", () => {
  const page = read("gists", "brief-one", "index.html");
  assert.match(page, /<meta name="robots" content="noindex" \/>/);
  assert.doesNotMatch(page, /ld\+json/);
  assert.match(page, new RegExp(LEDE.slice(0, 60)));
});

test("a hidden gist has no page", () => {
  assert.equal(existsSync(path.join(out, "gists", "hidden-one", "index.html")), false);
});

test("the sitemap lists the full gist and the edition, not the brief or hidden one", () => {
  const xml = read("sitemap.xml");
  assert.match(xml, /<loc>https:\/\/aibytes\.io\/gists\/full-one<\/loc><lastmod>2026-08-28<\/lastmod>/);
  assert.match(xml, /<loc>https:\/\/aibytes\.io\/2026-08-27<\/loc>/);
  assert.match(xml, /<loc>https:\/\/aibytes\.io\/<\/loc>/);
  assert.doesNotMatch(xml, /brief-one|hidden-one|saved|privacy/);
});

test("robots.txt allows everything and names the sitemap", () => {
  assert.equal(read("robots.txt"), "User-agent: *\nAllow: /\n\nSitemap: https://aibytes.io/sitemap.xml\n");
});
