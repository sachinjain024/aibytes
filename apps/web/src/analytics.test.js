import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { afterEach, test } from "node:test";
import { track } from "./analytics.js";

// AIB-145y gist-analytics: docs/specs/AIB-145y-gist-analytics.md

afterEach(() => { delete globalThis.umami; });

test("no tracker loaded: does nothing and does not throw", () => {
  assert.doesNotThrow(() => track("gist-panel-open", { slug: "hn-x", page: "daily" }));
});

test("tracker loaded: passes the name and data through", () => {
  const calls = [];
  globalThis.umami = { track: (name, data) => calls.push([name, data]) };
  track("gist-panel-open", { slug: "hn-x", page: "weekly" });
  assert.deepEqual(calls, [["gist-panel-open", { slug: "hn-x", page: "weekly" }]]);
});

test("a tracker that throws, or is not a function, never breaks the page", () => {
  globalThis.umami = { track: () => { throw new Error("blocked"); } };
  assert.doesNotThrow(() => track("gist-panel-open"));
  globalThis.umami = { track: "not a function" };
  assert.doesNotThrow(() => track("gist-panel-open"));
  globalThis.umami = null;
  assert.doesNotThrow(() => track("gist-panel-open"));
});

// Every page the build writes starts from index.html (editionPages() in
// vite.config.js), so the tag here is the tag on every page.
const shell = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const tag = shell.match(/<script[^>]*cloud\.umami\.is[^>]*><\/script>/);

test("the shell carries the Umami tag, deferred, for this site", () => {
  assert.ok(tag, "no Umami script tag in index.html");
  assert.match(tag[0], /\bdefer\b/);
  assert.match(tag[0], /src="https:\/\/cloud\.umami\.is\/script\.js"/);
  assert.match(tag[0], /data-website-id="3bafe9de-d5cd-44f1-8e47-92a2083d53b2"/);
});

test("the tag runs on aibytes.io only, so dev and local builds record nothing", () => {
  assert.match(tag[0], /data-domains="aibytes\.io"/);
});

test("the tag keeps the query string, which carries the UTM tags", () => {
  assert.doesNotMatch(tag[0], /data-exclude-search/);
});

// /privacy has to say what the tag does (AIB-145y T3). The page lives in
// App.jsx, so check its source rather than render the whole app.
const app = readFileSync(new URL("./App.jsx", import.meta.url), "utf8");

test("/privacy names Umami and no longer claims no analytics", () => {
  assert.doesNotMatch(app, /runs no analytics/);
  assert.match(app, /uses <a href="https:\/\/umami\.is">Umami<\/a>/);
  assert.match(app, /changes every month/);
});

test("the app never identifies a reader to the analytics tool", () => {
  for (const name of ["App.jsx", "analytics.js", "account.js", "saves.js"]) {
    const src = readFileSync(new URL("./" + name, import.meta.url), "utf8");
    assert.doesNotMatch(src, /umami\.identify|\.identify\(/, name);
  }
});

test("/privacy lists every service that handles reader data", () => {
  const section = app.slice(app.indexOf("Services that handle your data"), app.indexOf(">Questions<"));
  for (const name of ["GitHub", "Google Cloud", "Google Fonts", "Umami", "Substack", "Slack"]) {
    assert.match(section, new RegExp(`<strong>${name}</strong>`), name);
  }
});
