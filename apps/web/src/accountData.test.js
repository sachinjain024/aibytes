import assert from "node:assert/strict";
import { test } from "node:test";
import { toDoc, toSave } from "./accountData.js";

const at = "2026-11-07T09:30:00.000Z";
// What Firestore hands back for a stored Date: a Timestamp with toDate().
const timestamp = (iso) => ({ toDate: () => new Date(iso) });

test("an edition save goes to a document and back", () => {
  const doc = toDoc({ id: "ph-glasshand-2026-11-06" }, { edition_date: "2026-11-06" }, new Date(at));
  assert.deepEqual(doc, { item_id: "ph-glasshand-2026-11-06", edition_date: "2026-11-06", created_at: new Date(at) });
  assert.deepEqual(toSave(doc.item_id, { ...doc, created_at: timestamp(at) }),
    { item_id: "ph-glasshand-2026-11-06", edition_date: "2026-11-06", created_at: at });
});

test("a weekly save goes to a document and back", () => {
  const doc = toDoc({ id: "hn-rubygems" }, { issue_slug: "issue-9" }, new Date(at));
  assert.deepEqual(doc, { item_id: "hn-rubygems", issue_slug: "issue-9", created_at: new Date(at) });
  assert.deepEqual(toSave("hn-rubygems", { ...doc, created_at: timestamp(at) }),
    { item_id: "hn-rubygems", issue_slug: "issue-9", created_at: at });
});

test("a document with a plain Date (a write not yet echoed back) reads the same", () => {
  assert.equal(toSave("a", { item_id: "a", edition_date: "2026-11-06", created_at: new Date(at) }).created_at, at);
});

test("toDoc keeps only the save's fields, and defaults the time to now", () => {
  const doc = toDoc({ id: "a", title: "x", rank: 3 }, { edition_date: "2026-11-06" });
  assert.deepEqual(Object.keys(doc), ["item_id", "edition_date", "created_at"]);
  assert.ok(doc.created_at instanceof Date && Math.abs(doc.created_at - Date.now()) < 5000);
});

test("toDoc refuses what the rules would refuse", () => {
  assert.throws(() => toDoc({ id: "a" }, {}), /exactly one/);
  assert.throws(() => toDoc({ id: "a" }, { edition_date: "2026-11-06", issue_slug: "issue-9" }), /exactly one/);
  assert.throws(() => toDoc({ id: "a" }, { edition_date: "2026-02-30" }), /exactly one/);
  assert.throws(() => toDoc({ id: "" }, { edition_date: "2026-11-06" }), /id/);
});

test("toSave drops a document that is not a save", () => {
  assert.equal(toSave("a", { item_id: "b", edition_date: "2026-11-06", created_at: timestamp(at) }), null, "id mismatch");
  assert.equal(toSave("a", { item_id: "a", created_at: timestamp(at) }), null, "no source");
  assert.equal(toSave("a", { item_id: "a", issue_slug: "nine", created_at: timestamp(at) }), null, "bad slug");
  assert.equal(toSave("a", { item_id: "a", edition_date: "2026-11-06" }), null, "no time");
  assert.equal(toSave("a", { item_id: "a", edition_date: "2026-11-06", created_at: "soon" }), null, "bad time");
  assert.equal(toSave("a", null), null);
});
