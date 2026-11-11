import assert from "node:assert/strict";
import Module from "node:module";
import { createRequire } from "node:module";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { build } from "esbuild";
import { PROMPT_COPY, initialPrompt, promptReducer, shouldOpenPrompt } from "./newsletterPrompt.js";

const bundled = await build({
  entryPoints: [new URL("./NewsletterPrompt.jsx", import.meta.url).pathname],
  bundle: true, platform: "node", format: "cjs", jsx: "transform", external: ["react", "react-dom"], write: false,
});
const mod = new Module(import.meta.filename);
mod.filename = import.meta.filename;
mod.paths = Module._nodeModulePaths(new URL(".", import.meta.url).pathname);
mod.require = createRequire(import.meta.url);
mod._compile(bundled.outputFiles[0].text, import.meta.filename);
const { NewsletterPrompt } = mod.exports;

const render = (state) => renderToStaticMarkup(React.createElement(NewsletterPrompt, {
  state, email: "ada@example.com", onSubscribe() {}, onClose() {},
}));

const step = (state, type, extra) => promptReducer(state, { type, ...extra });

test("only a new account with an email is asked", () => {
  assert.equal(shouldOpenPrompt({ status: "ok", isNew: true }, "ada@example.com"), true);
  assert.equal(shouldOpenPrompt({ status: "ok", isNew: false }, "ada@example.com"), false);
  assert.equal(shouldOpenPrompt({ status: "ok", isNew: true }, ""), false);
  assert.equal(shouldOpenPrompt({ status: "cancelled", isNew: false }, "ada@example.com"), false);
  assert.equal(shouldOpenPrompt({ status: "failed", isNew: false }, "ada@example.com"), false);
});

test("Subscribe goes to saving, a saved write to thanks, and a failure back to failed", () => {
  const saving = step(initialPrompt, "subscribe");
  assert.deepEqual(saving, { status: "saving" });
  assert.deepEqual(step(saving, "saved"), { status: "thanks", seconds: 3 });
  assert.deepEqual(step(saving, "failed", { code: "permission-denied" }), { status: "failed" });
  assert.deepEqual(step(saving, "failed", { code: "timeout" }), { status: "failed" });
});

test("retry from failed goes back to saving", () => {
  assert.deepEqual(step({ status: "failed" }, "subscribe"), { status: "saving" });
});

test("the countdown ticks 3, 2, 1 and then closes", () => {
  const two = step({ status: "thanks", seconds: 3 }, "tick");
  const one = step(two, "tick");
  assert.deepEqual(two, { status: "thanks", seconds: 2 });
  assert.deepEqual(one, { status: "thanks", seconds: 1 });
  assert.deepEqual(step(one, "tick"), { status: "closed" });
});

test("close leaves offer, failed and thanks, and not saving", () => {
  for (const status of ["offer", "failed", "thanks"]) {
    assert.deepEqual(step({ status, seconds: 2 }, "close"), { status: "closed" });
  }
  assert.deepEqual(step({ status: "saving" }, "close"), { status: "saving" });
});

test("the copy matches the decision record word for word", () => {
  assert.equal(PROMPT_COPY.lead, "Get the best of AI in your inbox every Monday");
  assert.deepEqual(PROMPT_COPY.covers, [
    "New AI tools", "AI threads on HN", "Trending AI projects", "Latest AI news", "Official announcements", "Viral posts on X",
  ]);
  assert.equal(PROMPT_COPY.proof, "Read by 2,000+ developers at companies like Amazon, Google, OpenAI, Nvidia and Stripe.");
  assert.equal(PROMPT_COPY.builtBy, "Built by a former YC founder");
  const html = render(initialPrompt);
  for (const line of [PROMPT_COPY.lead, ...PROMPT_COPY.covers, PROMPT_COPY.proof, PROMPT_COPY.builtBy]) {
    assert.ok(html.includes(line), line);
  }
});

test("saving disables Subscribe, and failed announces the failure line", () => {
  const saving = render({ status: "saving" });
  assert.match(saving, /disabled=""/);
  assert.match(saving, /Subscribing…/);
  assert.doesNotMatch(saving, /role="alert"/);
  const failed = render({ status: "failed" });
  assert.match(failed, /role="alert"/);
  assert.match(failed, /Could not subscribe\. Check your connection and try again\./);
  assert.match(failed, />Subscribe</);
});
