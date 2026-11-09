import assert from "node:assert/strict";
import { test } from "node:test";
import { PRIVACY_HEAD, SAVED_HEAD, WEEKLY_ARCHIVE_HEAD, weeklyIssueHead, withHead } from "./pageMeta.js";

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
