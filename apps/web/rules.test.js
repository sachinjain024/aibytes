// firestore.rules against the Firestore emulator (spec AIB-75v app-accounts,
// decision 2). Run with `npm run test:rules -w @aibytes/web`, which starts the
// emulator for a demo project, so no real Firebase project is touched. Under a
// plain `npm test` there is no emulator, and every test here skips.
import { readFileSync } from "node:fs";
import { after, before, beforeEach, describe, test } from "node:test";
import { assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, Timestamp, updateDoc } from "firebase/firestore";

const host = process.env.FIRESTORE_EMULATOR_HOST;
const skip = host ? false : "needs the Firestore emulator: npm run test:rules -w @aibytes/web";

const at = Timestamp.fromDate(new Date("2026-11-07T09:30:00Z"));
const editionSave = (item_id) => ({ item_id, edition_date: "2026-11-06", created_at: at });
const issueSave = (item_id) => ({ item_id, issue_slug: "issue-9", created_at: at });

describe("firestore.rules", { skip }, () => {
  let env;
  const as = (uid) => (uid ? env.authenticatedContext(uid) : env.unauthenticatedContext()).firestore();
  const save = (db, uid, id) => doc(db, "users", uid, "saves", id);

  before(async () => {
    const [hostname, port] = host.split(":");
    env = await initializeTestEnvironment({
      projectId: "demo-aibytes",
      firestore: { host: hostname, port: Number(port), rules: readFileSync(new URL("../../firestore.rules", import.meta.url), "utf8") },
    });
  });
  beforeEach(() => env.clearFirestore());
  after(() => env?.cleanup());

  // A stored save for alice, written past the rules.
  const seed = (id = "a", data = editionSave(id)) =>
    env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), "users", "alice", "saves", id), data));

  test("the owner creates an edition save and a weekly save", async () => {
    await assertSucceeds(setDoc(save(as("alice"), "alice", "a"), editionSave("a")));
    await assertSucceeds(setDoc(save(as("alice"), "alice", "w"), issueSave("w")));
  });

  test("the owner reads one save and lists them", async () => {
    await seed();
    await assertSucceeds(getDoc(save(as("alice"), "alice", "a")));
    await assertSucceeds(getDocs(collection(as("alice"), "users", "alice", "saves")));
  });

  test("the owner rewrites and deletes a save", async () => {
    await seed();
    await assertSucceeds(setDoc(save(as("alice"), "alice", "a"), { ...editionSave("a"), edition_date: "2026-11-05" }));
    await assertSucceeds(deleteDoc(save(as("alice"), "alice", "a")));
  });

  test("another user can do none of it", async () => {
    await seed();
    const bob = as("bob");
    await assertFails(getDoc(save(bob, "alice", "a")));
    await assertFails(getDocs(collection(bob, "users", "alice", "saves")));
    await assertFails(setDoc(save(bob, "alice", "b"), editionSave("b")));
    await assertFails(updateDoc(save(bob, "alice", "a"), { edition_date: "2026-11-05" }));
    await assertFails(deleteDoc(save(bob, "alice", "a")));
  });

  test("a signed-out reader can do none of it", async () => {
    await seed();
    const anon = as(null);
    await assertFails(getDoc(save(anon, "alice", "a")));
    await assertFails(getDocs(collection(anon, "users", "alice", "saves")));
    await assertFails(setDoc(save(anon, "alice", "b"), editionSave("b")));
    await assertFails(deleteDoc(save(anon, "alice", "a")));
  });

  test("a document that is not exactly a save is refused, on create and on update", async () => {
    await seed();
    const db = as("alice");
    const bad = {
      "no source": { item_id: "x", created_at: at },
      "both sources": { ...editionSave("x"), issue_slug: "issue-9" },
      "an extra field": { ...editionSave("x"), title: "x" },
      "no created_at": { item_id: "x", edition_date: "2026-11-06" },
      "created_at as a string": { ...editionSave("x"), created_at: "2026-11-07T09:30:00Z" },
      "a bad date": { ...editionSave("x"), edition_date: "Nov 6" },
      "a bad slug": { ...issueSave("x"), issue_slug: "nine" },
      "a date that is not a string": { ...editionSave("x"), edition_date: 20261106 },
      "item_id not the document id": editionSave("y"),
    };
    for (const [why, data] of Object.entries(bad)) {
      await assertFails(setDoc(save(db, "alice", "x"), data)).catch((e) => { throw new Error(`create, ${why}: ${e.message}`); });
      await assertFails(setDoc(save(db, "alice", "a"), { ...data, item_id: data.item_id === "y" ? "y" : "a" }))
        .catch((e) => { throw new Error(`update, ${why}: ${e.message}`); });
    }
    await assertFails(updateDoc(save(db, "alice", "a"), { title: "x" }));
  });

  test("an id over 200 characters is refused", async () => {
    const id = "x".repeat(201);
    await assertFails(setDoc(save(as("alice"), "alice", id), editionSave(id)));
  });

  test("nothing outside users/{uid}/saves is open, even to the owner", async () => {
    const db = as("alice");
    await assertFails(setDoc(doc(db, "users", "alice"), { name: "Alice" }));
    await assertFails(getDoc(doc(db, "users", "alice")));
    await assertFails(setDoc(doc(db, "users", "alice", "notes", "n"), { text: "x" }));
    await assertFails(setDoc(doc(db, "stats", "2026-11-06"), { saves: 1 }));
    await assertFails(getDocs(collection(db, "users")));
  });
});
