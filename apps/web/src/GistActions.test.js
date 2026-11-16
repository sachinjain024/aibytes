// The save row and the reaction bar (spec AIB-145y-app-reactions, T32): the markup
// GistActions draws for each state the hook can hand it. Server-rendered, so each case
// is a first render; presses are the hook's (planPress) and are tested in reactions.test.js.
import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadJsx } from "./loadJsx.js";
import { zeroTotals } from "./reactionKeys.js";

const { GistActions } = await loadJsx(new URL("./GistActions.jsx", import.meta.url));
const reactions = (over = {}) => ({ slug: "gh-caveman", totals: zeroTotals(), mine: [], message: null, askSignIn: false, onToggle() {}, onSignIn() {}, ...over });
const render = (props) => renderToStaticMarkup(React.createElement(GistActions, { saved: false, onToggle() {}, ...props }));
const lines = (html) => (html.match(/role="status"/g) || []).length;
const button = (html, name) => new RegExp(`<button[^>]*aria-label="${name}[^"]*"`).exec(html)?.[0];

test("without reactions (the server render) there is the save row and no bar", () => {
  const html = render({});
  assert.match(html, /Save/);
  assert.doesNotMatch(html, /gist-reacts/);
});

test("Save and the bar share one row", () => {
  const html = render({ reactions: reactions() });
  const start = html.indexOf("gist-actions-row");
  const row = html.slice(start, html.indexOf("gist-reacts") + 1);
  assert.match(row, /gist-save/); // the Save button comes first in the row...
  assert.ok(html.indexOf("gist-reacts") > html.indexOf("gist-save"));
  assert.equal((html.match(/gist-actions-row/g) || []).length, 1); // ...and there is one row, not two
});

test("the adapter: a signed-in 👍 with total 1 shows 1, not 2", () => {
  const html = render({ reactions: reactions({ totals: { ...zeroTotals(), plus1: 1 }, mine: ["plus1"] }) });
  assert.match(button(html, "Thumbs up"), /aria-label="Thumbs up, 1"/);
  assert.match(html, /<button[^>]*aria-pressed="true"/);
});

test("a signed-out reader's totals show whole, nothing pressed", () => {
  const html = render({ reactions: reactions({ totals: { ...zeroTotals(), rocket: 4 } }) });
  assert.match(button(html, "Rocket"), /Rocket, 4/);
  assert.doesNotMatch(html, /aria-pressed="true"/);
});

test("the sign-in line has a Sign in control and no popup is opened by drawing it", () => {
  const html = render({ reactions: reactions({ askSignIn: true }) });
  assert.match(html, /Please sign in to add your reaction\./);
  assert.match(html, /<button[^>]*class="gist-linkbtn"[^>]*>Sign in<\/button>/);
  assert.equal(lines(html), 1);
});

test("only one feedback line shows at a time: the saved line wins over a sign-in line until a reaction is pressed", () => {
  const html = render({ saved: true, reactions: reactions({ askSignIn: true, message: "Could not save your reaction. Try again." }) });
  assert.match(html, /Added to your Saved items/);
  assert.doesNotMatch(html, /Please sign in/);
  assert.doesNotMatch(html, /Could not save/);
  assert.equal(lines(html), 1);
});

test("an error line shows when nothing is saved, and it is the only line", () => {
  const html = render({ reactions: reactions({ message: "Could not save your reaction. Try again." }) });
  assert.match(html, /Could not save your reaction/);
  assert.equal(lines(html), 1);
});
