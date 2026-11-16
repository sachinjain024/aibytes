// The gist reaction rules in firestore.rules against the Firestore emulator
// (spec AIB-145y-app-reactions, T31). Run with `npm run test:rules -w @aibytes/web`.
// Under a plain `npm test` there is no emulator, and every test here skips.
//
// Every write goes through press(), which builds the batch the spec gives for the
// app's toggle (T32): the reader document set or deleted, and the counts document
// merged with increment(+1 or -1) on the toggled key and increment(0) on the other
// seven. So these tests prove the rules accept exactly what the app will send.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, beforeEach, describe, test } from "node:test";
import { assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, deleteDoc, doc, getDoc, getDocs, increment, serverTimestamp, setDoc, Timestamp, updateDoc, writeBatch } from "firebase/firestore";

const host = process.env.FIRESTORE_EMULATOR_HOST;
const skip = host ? false : "needs the Firestore emulator: npm run test:rules -w @aibytes/web";

const KEYS = ["plus1", "minus1", "laugh", "hooray", "confused", "heart", "rocket", "eyes"];
const SLUG = "ph-plurai-simulation";
const google = { firebase: { sign_in_provider: "google.com" } };
const zeros = () => Object.fromEntries(KEYS.map((k) => [k, 0]));

describe("firestore.rules: gist reactions", { skip }, () => {
  let env;
  const as = (uid, token = google) => (uid ? env.authenticatedContext(uid, token) : env.unauthenticatedContext()).firestore();
  const reader = (db, uid, slug = SLUG) => doc(db, "gist_reactions", slug, "by", uid);
  const counts = (db, slug = SLUG) => doc(db, "gist_reaction_counts", slug);

  before(async () => {
    const [hostname, port] = host.split(":");
    env = await initializeTestEnvironment({
      projectId: "demo-aibytes",
      firestore: { host: hostname, port: Number(port), rules: readFileSync(new URL("../../firestore.rules", import.meta.url), "utf8") },
    });
  });
  beforeEach(() => env.clearFirestore());
  after(() => env?.cleanup());

  // The app's toggle: `picked` is the reader's set after the press, `delta` +1 or -1 on `key`.
  function press(db, uid, key, picked, delta, { slug = SLUG } = {}) {
    const batch = writeBatch(db);
    if (picked.length) batch.set(reader(db, uid, slug), { picked, updated_at: serverTimestamp() });
    else batch.delete(reader(db, uid, slug));
    batch.set(counts(db, slug), Object.fromEntries(KEYS.map((k) => [k, increment(k === key ? delta : 0)])), { merge: true });
    return batch.commit();
  }
  // withSecurityRulesDisabled resolves to nothing, so a read hands its value out through a variable.
  const seed = (fn) => env.withSecurityRulesDisabled((ctx) => fn(ctx.firestore()));
  const peek = async (ref) => {
    let data;
    await env.withSecurityRulesDisabled(async (ctx) => { data = (await getDoc(ref(ctx.firestore()))).data(); });
    return data;
  };
  const seedReader = (uid, picked) => seed((db) => setDoc(reader(db, uid), { picked, updated_at: Timestamp.fromDate(new Date("2026-11-15T10:00:00Z")) }));
  const seedCounts = (over = {}) => seed((db) => setDoc(counts(db), { ...zeros(), ...over }));
  const countsNow = () => peek((db) => counts(db));
  const readerNow = (uid) => peek((db) => reader(db, uid));

  describe("who may press", () => {
    test("the first reaction to a gist, with no counts document yet, creates both", async () => {
      await assertSucceeds(press(as("alice"), "alice", "plus1", ["plus1"], +1));
      assert.deepEqual(await countsNow(), { ...zeros(), plus1: 1 });
      assert.deepEqual((await readerNow("alice")).picked, ["plus1"]);
    });

    test("signed out cannot press", async () => {
      await assertFails(press(as(null), "alice", "plus1", ["plus1"], +1));
    });

    test("a sign-in that is not Google cannot press", async () => {
      await assertFails(press(as("alice", { firebase: { sign_in_provider: "password" } }), "alice", "plus1", ["plus1"], +1));
      await assertFails(press(as("alice", { firebase: { sign_in_provider: "anonymous" } }), "alice", "plus1", ["plus1"], +1));
    });

    test("a reader cannot press into another reader's document", async () => {
      await assertFails(press(as("bob"), "alice", "plus1", ["plus1"], +1));
    });
  });

  describe("toggling", () => {
    test("a second emoji adds to the set and to its own count", async () => {
      await seedReader("alice", ["plus1"]);
      await seedCounts({ plus1: 1 });
      await assertSucceeds(press(as("alice"), "alice", "heart", ["plus1", "heart"], +1));
      assert.deepEqual(await countsNow(), { ...zeros(), plus1: 1, heart: 1 });
    });

    test("removing one of two keeps the document and subtracts", async () => {
      await seedReader("alice", ["plus1", "heart"]);
      await seedCounts({ plus1: 1, heart: 1 });
      await assertSucceeds(press(as("alice"), "alice", "heart", ["plus1"], -1));
      assert.deepEqual(await countsNow(), { ...zeros(), plus1: 1 });
    });

    test("removing the last emoji deletes the reader document and subtracts", async () => {
      await seedReader("alice", ["rocket"]);
      await seedCounts({ rocket: 1 });
      await assertSucceeds(press(as("alice"), "alice", "rocket", [], -1));
      assert.equal(await readerNow("alice"), undefined);
      assert.deepEqual(await countsNow(), zeros());
    });

    test("two readers add up, and one leaving subtracts only theirs", async () => {
      await assertSucceeds(press(as("alice"), "alice", "plus1", ["plus1"], +1));
      await assertSucceeds(press(as("bob"), "bob", "plus1", ["plus1"], +1));
      assert.equal((await countsNow()).plus1, 2);
      await assertSucceeds(press(as("alice"), "alice", "plus1", [], -1));
      assert.equal((await countsNow()).plus1, 1);
    });

    test("a press when the app's total is stale still lands, because it is an increment", async () => {
      await seedReader("alice", ["plus1"]);
      await seedCounts({ plus1: 7 });
      await assertSucceeds(press(as("alice"), "alice", "heart", ["plus1", "heart"], +1));
      assert.equal((await countsNow()).plus1, 7);
    });
  });

  describe("what a reader may store", () => {
    test("a ninth key, a duplicate, an empty set and a non-list are refused", async () => {
      const db = as("alice");
      const batch = (picked) => {
        const b = writeBatch(db);
        b.set(reader(db, "alice"), { picked, updated_at: serverTimestamp() });
        b.set(counts(db), Object.fromEntries(KEYS.map((k) => [k, increment(k === "plus1" ? 1 : 0)])), { merge: true });
        return b.commit();
      };
      await assertFails(batch(["plus1", "thumbsup"]));
      await assertFails(batch(["plus1", "plus1"]));
      await assertFails(batch([]));
      await assertFails(batch("plus1"));
    });

    test("an extra field on the reader document is refused", async () => {
      const db = as("alice");
      const b = writeBatch(db);
      b.set(reader(db, "alice"), { picked: ["plus1"], updated_at: serverTimestamp(), note: "hi" });
      b.set(counts(db), Object.fromEntries(KEYS.map((k) => [k, increment(k === "plus1" ? 1 : 0)])), { merge: true });
      await assertFails(b.commit());
    });

    test("a stale updated_at is refused", async () => {
      const db = as("alice");
      const b = writeBatch(db);
      b.set(reader(db, "alice"), { picked: ["plus1"], updated_at: Timestamp.fromDate(new Date("2020-01-01T00:00:00Z")) });
      b.set(counts(db), Object.fromEntries(KEYS.map((k) => [k, increment(k === "plus1" ? 1 : 0)])), { merge: true });
      await assertFails(b.commit());
    });

    test("a slug that is not a gist slug is refused", async () => {
      await assertFails(press(as("alice"), "alice", "plus1", ["plus1"], +1, { slug: "Bad_Slug" }));
      await assertFails(press(as("alice"), "alice", "plus1", ["plus1"], +1, { slug: "a".repeat(81) }));
    });
  });

  describe("what the counts may do", () => {
    test("an extra field on the counts document is refused", async () => {
      const db = as("alice");
      const b = writeBatch(db);
      b.set(reader(db, "alice"), { picked: ["plus1"], updated_at: serverTimestamp() });
      b.set(counts(db), { ...Object.fromEntries(KEYS.map((k) => [k, increment(k === "plus1" ? 1 : 0)])), note: "hi" }, { merge: true });
      await assertFails(b.commit());
    });

    test("counts written alone are refused, even by a Google reader", async () => {
      await seedCounts({ plus1: 1 });
      await assertFails(setDoc(counts(as("alice")), { ...zeros(), plus1: 99 }));
      await assertFails(updateDoc(counts(as("alice")), { plus1: increment(1) }));
    });

    test("a reader document written alone is refused", async () => {
      await assertFails(setDoc(reader(as("alice"), "alice"), { picked: ["plus1"], updated_at: serverTimestamp() }));
    });

    test("counts that move by two are refused", async () => {
      const db = as("alice");
      const b = writeBatch(db);
      b.set(reader(db, "alice"), { picked: ["plus1"], updated_at: serverTimestamp() });
      b.set(counts(db), Object.fromEntries(KEYS.map((k) => [k, increment(k === "plus1" ? 2 : 0)])), { merge: true });
      await assertFails(b.commit());
    });

    test("counts that move a key the reader did not touch are refused", async () => {
      const db = as("alice");
      const b = writeBatch(db);
      b.set(reader(db, "alice"), { picked: ["plus1"], updated_at: serverTimestamp() });
      b.set(counts(db), Object.fromEntries(KEYS.map((k) => [k, increment(k === "plus1" || k === "laugh" ? 1 : 0)])), { merge: true });
      await assertFails(b.commit());
    });

    test("counts that do not move at all are refused", async () => {
      const db = as("alice");
      const b = writeBatch(db);
      b.set(reader(db, "alice"), { picked: ["plus1"], updated_at: serverTimestamp() });
      b.set(counts(db), Object.fromEntries(KEYS.map((k) => [k, increment(0)])), { merge: true });
      await assertFails(b.commit());
    });

    test("two keys added in one write are refused, even when each count moves by one", async () => {
      const db = as("alice");
      const b = writeBatch(db);
      b.set(reader(db, "alice"), { picked: ["plus1", "heart"], updated_at: serverTimestamp() });
      b.set(counts(db), Object.fromEntries(KEYS.map((k) => [k, increment(k === "plus1" || k === "heart" ? 1 : 0)])), { merge: true });
      await assertFails(b.commit());
      assert.equal(await readerNow("alice"), undefined);
    });

    test("a swap in one write (one key off, another on) is refused", async () => {
      await seedReader("alice", ["plus1"]);
      await seedCounts({ plus1: 1 });
      const db = as("alice");
      const b = writeBatch(db);
      b.set(reader(db, "alice"), { picked: ["heart"], updated_at: serverTimestamp() });
      b.set(counts(db), Object.fromEntries(KEYS.map((k) => [k, increment(k === "plus1" ? -1 : k === "heart" ? 1 : 0)])), { merge: true });
      await assertFails(b.commit());
      assert.deepEqual((await readerNow("alice")).picked, ["plus1"]);
    });

    test("a count cannot go below zero", async () => {
      await seedReader("alice", ["plus1"]);
      await seedCounts(); // plus1 is 0 though alice holds it: a count that went wrong
      await assertFails(press(as("alice"), "alice", "plus1", [], -1));
    });

    test("a client cannot delete a counts document", async () => {
      await seedCounts({ plus1: 1 });
      await assertFails(deleteDoc(counts(as("alice"))));
    });
  });

  describe("who may read", () => {
    test("anyone, signed out too, gets a counts document", async () => {
      await seedCounts({ plus1: 3 });
      assert.equal((await assertSucceeds(getDoc(counts(as(null))))).data().plus1, 3);
      await assertSucceeds(getDoc(counts(as("bob"))));
    });

    test("nobody lists counts or readers", async () => {
      await seedCounts({ plus1: 1 });
      await seedReader("alice", ["plus1"]);
      await assertFails(getDocs(collection(as(null), "gist_reaction_counts")));
      await assertFails(getDocs(collection(as("alice"), "gist_reaction_counts")));
      await assertFails(getDocs(collection(as("alice"), "gist_reactions", SLUG, "by")));
    });

    test("only the reader gets their own document", async () => {
      await seedReader("alice", ["plus1"]);
      await assertSucceeds(getDoc(reader(as("alice"), "alice")));
      await assertFails(getDoc(reader(as("bob"), "alice")));
      await assertFails(getDoc(reader(as(null), "alice")));
    });

    test("a reader who has not reacted can still get their own (missing) document", async () => {
      await assertSucceeds(getDoc(reader(as("alice"), "alice")));
    });
  });
});
