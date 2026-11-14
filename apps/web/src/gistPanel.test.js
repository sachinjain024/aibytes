import assert from "node:assert/strict";
import { test } from "node:test";
import { focusMainAfterClose, isOpenCard, keepGist, panelPage, planClose, planOpen, targetFor, withGist, withoutGist } from "./gistPanel.js";

const at = (pathname, search = "") => ({ pathname, search });

test("opening a gist adds ?gist= and keeps the path and every filter", () => {
  assert.equal(withGist(at("/2026-11-13"), "tinyeval"), "/2026-11-13?gist=tinyeval");
  assert.equal(withGist(at("/", "?c=repos&t=agents,open-source&s=github&q=claude"), "x1"), "/?c=repos&t=agents,open-source&s=github&q=claude&gist=x1");
  assert.equal(withGist(at("/weekly/issue-16", "?gist=old"), "new"), "/weekly/issue-16?gist=new");
  assert.equal(withGist(at("/saved", "?q=a%20b"), "x1"), "/saved?q=a+b&gist=x1");
});

test("closing removes only ?gist=", () => {
  assert.equal(withoutGist(at("/2026-11-13", "?gist=tinyeval")), "/2026-11-13");
  assert.equal(withoutGist(at("/", "?c=repos&gist=x1&t=agents,open-source")), "/?c=repos&t=agents,open-source");
  assert.equal(withoutGist(at("/", "?c=repos")), "/?c=repos");
});

test("a filter change keeps the open gist; a new day does not", () => {
  assert.equal(keepGist("?gist=x1", "?c=repos"), "?c=repos&gist=x1");
  assert.equal(keepGist("?c=news&gist=x1", ""), "?gist=x1");
  assert.equal(keepGist("?c=news", "?c=repos"), "?c=repos");
  assert.equal(keepGist("?gist=Bad", "?c=repos"), "?c=repos");
});

test("the event says whether the opening card was on a daily or a weekly page", () => {
  assert.equal(panelPage({ edition_date: "2026-11-13" }), "daily");
  assert.equal(panelPage({ issue_slug: "issue-16" }), "weekly");
  assert.equal(panelPage(undefined), "daily");
});

const A = { id: "gh-x-2026-11-13", gist: "gh-x" };
const B = { id: "gh-x-issue-17", gist: "gh-x" };
const C = { id: "hn-y-2026-11-13", gist: "hn-y" };
const day = { edition_date: "2026-11-13" };
const issue = { issue_slug: "issue-17" };
const none = { slug: null, opened: null };

test("opening from a closed panel pushes, remembers the list it was on, and counts one event", () => {
  const plan = planOpen(none, A, day, at("/2026-11-13", "?c=repos"));
  assert.deepEqual(plan.opened, { slug: "gh-x", id: A.id, from: day });
  assert.deepEqual(plan.event, { slug: "gh-x", page: "daily" });
  assert.deepEqual(plan.nav, { to: "/2026-11-13?c=repos&gist=gh-x", replace: false, state: { gist: true, base: "/2026-11-13?c=repos" } });
});

test("opening another gist with the panel open replaces the entry and counts an event", () => {
  const plan = planOpen({ slug: "gh-x", opened: { slug: "gh-x", id: A.id, from: day } }, C, issue, at("/weekly/issue-17", "?gist=gh-x"));
  assert.equal(plan.nav.replace, true);
  assert.equal(plan.nav.to, "/weekly/issue-17?gist=hn-y");
  assert.deepEqual(plan.event, { slug: "hn-y", page: "weekly" });
});

test("the card that is already open does nothing", () => {
  assert.equal(planOpen({ slug: "gh-x", opened: { slug: "gh-x", id: A.id, from: day } }, A, day, at("/2026-11-13", "?gist=gh-x")), null);
});

test("a second card with the same gist moves the save row and the marker, not the URL or the count", () => {
  const plan = planOpen({ slug: "gh-x", opened: { slug: "gh-x", id: A.id, from: day } }, B, issue, at("/saved", "?gist=gh-x"));
  assert.deepEqual(plan.opened, { slug: "gh-x", id: B.id, from: issue });
  assert.equal(plan.nav, undefined);
  assert.equal(plan.event, undefined);
});

test("a click on a card whose gist a reload already opened picks that card without a new URL", () => {
  const plan = planOpen({ slug: "gh-x", opened: null }, B, issue, at("/saved", "?gist=gh-x"));
  assert.deepEqual(plan.opened, { slug: "gh-x", id: B.id, from: issue });
  assert.equal(plan.nav, undefined);
});

test("only the clicked card is marked open; after a reload every card of that gist is", () => {
  const opened = { slug: "gh-x", id: B.id, from: issue };
  assert.equal(isOpenCard(opened, "gh-x", B), true);
  assert.equal(isOpenCard(opened, "gh-x", A), false);
  assert.equal(isOpenCard(opened, "gh-x", C), false);
  assert.equal(isOpenCard(null, "gh-x", A), true);
  assert.equal(isOpenCard(null, "gh-x", B), true);
  assert.equal(isOpenCard({ slug: "old", id: A.id, from: day }, "gh-x", B), true, "a remembered card of another gist is stale");
  assert.equal(isOpenCard(null, null, A), false);
});

test("the save row presses the clicked card, or the gist's first appearance when none was clicked", () => {
  const gist = { appearances: [{ item_id: "gh-x-2026-11-12", edition_date: "2026-11-12" }, { item_id: B.id, issue_slug: "issue-17" }] };
  assert.deepEqual(targetFor({ slug: "gh-x", id: B.id, from: issue }, "gh-x", gist), { id: B.id, from: issue });
  assert.deepEqual(targetFor(null, "gh-x", gist), { id: "gh-x-2026-11-12", from: { edition_date: "2026-11-12" } });
  assert.deepEqual(targetFor({ slug: "old", id: A.id, from: day }, "gh-x", gist), { id: "gh-x-2026-11-12", from: { edition_date: "2026-11-12" } });
  assert.deepEqual(targetFor(null, "gh-x", { appearances: [{ item_id: "i", issue_slug: "issue-9" }] }), { id: "i", from: { issue_slug: "issue-9" } });
});

test("closing goes Back only when this page view pushed the panel on the same list", () => {
  assert.equal(planClose({ gist: true, base: "/2026-11-13?c=repos" }, at("/2026-11-13", "?c=repos&gist=x")), "back");
  assert.equal(planClose({ gist: true, base: "/2026-11-13" }, at("/2026-11-13", "?q=a&gist=x")), "replace", "a filter changed meanwhile");
  assert.equal(planClose(null, at("/2026-11-13", "?gist=x")), "replace", "a reload or shared link");
  assert.equal(planClose({}, at("/2026-11-13", "?gist=x")), "replace");
});

test("closing a panel that no card opened puts focus on the main region, once, and only if it was lost", () => {
  const body = { tag: "body" }, card = { tag: "a" };
  assert.equal(focusMainAfterClose("gh-x", null, body, body), true, "closed, focus on the page");
  assert.equal(focusMainAfterClose("gh-x", null, null, body), true);
  assert.equal(focusMainAfterClose("gh-x", null, card, body), false, "a card has focus: the panel already returned it");
  assert.equal(focusMainAfterClose(null, null, body, body), false, "it was never open");
  assert.equal(focusMainAfterClose("gh-x", "hn-y", body, body), false, "still open on another gist");
});
