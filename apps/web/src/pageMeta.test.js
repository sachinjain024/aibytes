import assert from "node:assert/strict";
import { test } from "node:test";
import { gistHead, PRIVACY_HEAD, SAVED_HEAD, WEEKLY_ARCHIVE_HEAD, weeklyIssueHead, withHead } from "./pageMeta.js";

const SHELL = `<!doctype html>
<html lang="en">
  <head>
    <meta name="description" content="The latest in AI for developers." />
    <title>aiBytes_</title>
  </head>
  <body><div id="root"></div></body>
</html>`;

const ENTRY = {
  number: 16,
  slug: "issue-16",
  title: "🪤 A backdoored Claude Code extension & Anthropic's \"S-1\"",
  description: "Plus Google's Genie 4 <world model>.",
};

test("an issue page carries its own title, description and canonical URL", () => {
  const html = withHead(SHELL, weeklyIssueHead(ENTRY));
  assert.match(html, /<title>aiBytes_ #16: 🪤 A backdoored Claude Code extension &amp; Anthropic's &quot;S-1&quot;<\/title>/);
  assert.match(html, /<meta name="description" content="Plus Google's Genie 4 &lt;world model&gt;\." \/>/);
  assert.match(html, /<link rel="canonical" href="https:\/\/aibytes\.io\/weekly\/issue-16" \/>/);
  assert.match(html, /<meta property="og:url" content="https:\/\/aibytes\.io\/weekly\/issue-16" \/>/);
  assert.equal(html.match(/<title>/g).length, 1);
  assert.equal(html.match(/name="description"/g).length, 1);
});

test("the tags land inside the head, before the body", () => {
  const html = withHead(SHELL, weeklyIssueHead(ENTRY));
  assert.ok(html.indexOf('rel="canonical"') < html.indexOf("</head>"));
});

test("an issue with no description still gets one", () => {
  const head = weeklyIssueHead({ ...ENTRY, description: "" });
  assert.equal(head.description, "Issue #16 of aiBytes_, the week in AI for developers.");
});

test("the archive is canonical at /weekly", () => {
  assert.equal(WEEKLY_ARCHIVE_HEAD.url, "https://aibytes.io/weekly");
});

test("a $ in the title is kept literally, not read as a replacement pattern", () => {
  const html = withHead(SHELL, { title: "Costs $& more", description: "d", url: "https://aibytes.io/weekly" });
  assert.match(html, /<title>Costs \$&amp; more<\/title>/);
});

test("the Saved page is titled and kept out of search engines", () => {
  const html = withHead(SHELL, SAVED_HEAD);
  assert.match(html, /<title>aiBytes_ · Saved<\/title>/);
  assert.match(html, /<meta name="robots" content="noindex" \/>/);
  assert.ok(html.indexOf('name="robots"') < html.indexOf("</head>"));
});

test("a page without robots gets no robots tag", () => {
  assert.doesNotMatch(withHead(SHELL, weeklyIssueHead(ENTRY)), /name="robots"/);
  assert.doesNotMatch(withHead(SHELL, WEEKLY_ARCHIVE_HEAD), /name="robots"/);
});

test("the privacy page is titled, canonical at /privacy, and indexable", () => {
  const html = withHead(SHELL, PRIVACY_HEAD);
  assert.match(html, /<title>aiBytes_ · Privacy<\/title>/);
  assert.match(html, /<link rel="canonical" href="https:\/\/aibytes\.io\/privacy" \/>/);
  assert.doesNotMatch(html, /name="robots"/);
});

const LEDE = "TinyEval is a 300-line Python file that runs prompt evaluations against any OpenAI-compatible endpoint, with no dependencies to install and a table you can read.";
const GIST = {
  slug: "hn-show-hn-tinyeval", kind: "hn", depth: "full", title: "Show HN: TinyEval – an eval harness in one file",
  lede: LEDE, source_url: "https://news.ycombinator.com/item?id=50443587", image: { type: "none" },
  created_at: "2026-08-27T08:04:10Z", updated_at: "2026-08-28T09:00:00Z",
  appearances: [{ item_id: "hn-tinyeval", edition_date: "2026-08-27" }],
};

test("a full gist page is titled, described, canonical and indexable", () => {
  const head = gistHead(GIST);
  assert.equal(head.title, "Show HN: TinyEval – an eval harness in one file · aiBytes_");
  assert.equal(head.url, "https://aibytes.io/gists/hn-show-hn-tinyeval");
  assert.equal(head.robots, undefined);
  assert.ok(head.description.length <= 156);
  assert.ok(head.description.endsWith("…"));
  assert.ok(LEDE.startsWith(head.description.slice(0, -1).trimEnd()));
  const html = withHead(SHELL, head);
  assert.doesNotMatch(html, /name="robots"/);
  assert.match(html, /<link rel="canonical" href="https:\/\/aibytes\.io\/gists\/hn-show-hn-tinyeval" \/>/);
  assert.match(html, /<meta name="twitter:card" content="summary" \/>/);
});

test("a short lede is used as it is, and cut only at a word boundary", () => {
  const short = "A short lede that stands alone and says what the thing is in one go.";
  assert.equal(gistHead({ ...GIST, lede: short }).description, short);
  const cut = gistHead({ ...GIST, lede: "word ".repeat(60).trim() }).description;
  assert.match(cut, /^(word )*word…$/);
});

test("a full gist carries one Article block that says what it is based on", () => {
  const head = gistHead(GIST);
  assert.equal(head.jsonLd["@type"], "Article");
  assert.equal(head.jsonLd.headline, GIST.title);
  assert.equal(head.jsonLd.isBasedOn, GIST.source_url);
  assert.equal(head.jsonLd.datePublished, GIST.created_at);
  assert.equal(head.jsonLd.dateModified, GIST.updated_at);
  assert.equal(head.jsonLd.mainEntityOfPage, head.url);
  const html = withHead(SHELL, head);
  assert.equal(html.match(/application\/ld\+json/g).length, 1);
});

test("a brief or preview gist is noindex with no structured data, but still shares", () => {
  for (const depth of ["brief", "preview"]) {
    const head = gistHead({ ...GIST, depth });
    assert.equal(head.robots, "noindex", depth);
    assert.equal(head.jsonLd, undefined, depth);
    const html = withHead(SHELL, head);
    assert.match(html, /<meta name="robots" content="noindex" \/>/);
    assert.match(html, /rel="canonical"/);
    assert.match(html, /og:title/);
    assert.doesNotMatch(html, /ld\+json/);
  }
});

test("an X preview with no lede is described from the post", () => {
  const head = gistHead({ slug: "x-a-b", kind: "x_post", depth: "preview", title: "A post", image: { type: "none" },
    preview: { author_name: "Ada", author_handle: "@ada", text: "Evals are the new unit tests, and nobody is writing them yet." },
    created_at: GIST.created_at, updated_at: GIST.updated_at, appearances: [] });
  assert.equal(head.description, "Ada on X: Evals are the new unit tests, and nobody is writing them yet.");
});

test("an image URL becomes og:image, and none is invented", () => {
  assert.doesNotMatch(withHead(SHELL, gistHead(GIST)), /og:image/);
  const withImage = gistHead({ ...GIST, image: { type: "logo", url: "https://ph-files.imgix.net/a.png" } });
  assert.match(withHead(SHELL, withImage), /<meta property="og:image" content="https:\/\/ph-files\.imgix\.net\/a\.png" \/>/);
});

test("nothing from a gist can break out of the head", () => {
  const nasty = { ...GIST, title: 'Say "hi" </title><script>x</script> & <b>', lede: 'A lede with "quotes", <angle> brackets & </script><script>alert(1)</script> that is long enough to count.',
    source_url: 'https://example.com/?a="1"&b=<2>' };
  const html = withHead(SHELL, gistHead(nasty));
  assert.equal(html.match(/<title>/g).length, 1);
  assert.doesNotMatch(html, /<script>x<\/script>|<script>alert/);
  assert.equal(html.match(/<script type="application\/ld\+json">/g).length, 1);
  const block = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1];
  assert.doesNotMatch(block, /<\/script|<!--|<(?!\\)/);
  assert.equal(JSON.parse(block).headline, nasty.title);
});
