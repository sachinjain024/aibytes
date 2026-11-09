// The account store and the sign-in merge against the Firestore emulator, with
// firestore.rules in force, so every read and write here is one the deployed
// rules allow. Run by `npm run test:rules -w @aibytes/web`; under a plain
// `npm test` there is no emulator, and these skip.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, beforeEach, describe, test } from "node:test";
import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, Timestamp, waitForPendingWrites } from "firebase/firestore";
import { accountSaves, mergeInto } from "./accountSaves.js";

const host = process.env.FIRESTORE_EMULATOR_HOST;
const skip = host ? false : "needs the Firestore emulator: npm run test:rules -w @aibytes/web";

const iso = (day) => `2026-11-0${day}T09:30:00.000Z`;
const local = (item_id, day, from = { edition_date: "2026-11-06" }) => ({ item_id, ...from, created_at: iso(day) });

// Resolves once the store's list satisfies `ok`.
function until(store, ok) {
  return new Promise((resolve) => {
    if (ok(store.list())) return resolve(store.list());
    const stop = store.subscribe(() => { if (ok(store.list())) { stop(); resolve(store.list()); } });
  });
}

describe("account saves", { skip }, () => {
  let env;
  // Each test is a new reader with its own client, so no write still pending
  // from one test can land in the next.
  let n = 0;
  let uid;
  let db;
  before(async () => {
    const [hostname, port] = host.split(":");
    env = await initializeTestEnvironment({
      projectId: "demo-aibytes",
      firestore: { host: hostname, port: Number(port), rules: readFileSync(new URL("../../../firestore.rules", import.meta.url), "utf8") },
    });
  });
  beforeEach(() => {
    uid = `reader-${++n}`;
    db = env.authenticatedContext(uid).firestore();
  });
  after(() => env?.cleanup());

  // The document as the server has it, once this client's writes have landed.
  const stored = async (id) => {
    await waitForPendingWrites(db);
    let data;
    await env.withSecurityRulesDisabled(async (ctx) => { data = (await getDoc(doc(ctx.firestore(), "users", uid, "saves", id))).data(); });
    return data;
  };

  test("toggle saves and unsaves, and the list follows, newest first", async () => {
    const store = accountSaves(db, uid);
    const stop = store.subscribe(() => {});
    assert.deepEqual(store.toggle({ id: "a" }, { edition_date: "2026-11-06" }), { saved: true, kept: true });
    await until(store, (l) => l.length === 1);
    store.toggle({ id: "w" }, { issue_slug: "issue-9" });
    const list = await until(store, (l) => l.length === 2);
    assert.deepEqual(list.map((s) => s.item_id), ["w", "a"]);
    assert.equal(list[0].issue_slug, "issue-9");
    assert.ok(store.has("a"));
    assert.ok((await stored("a")).created_at instanceof Timestamp);
    assert.deepEqual(store.toggle({ id: "a" }, { edition_date: "2026-11-06" }), { saved: false, kept: true });
    await until(store, (l) => l.length === 1);
    assert.equal(await stored("a"), undefined);
    stop();
  });

  test("the list keeps its identity until a snapshot changes it", async () => {
    const store = accountSaves(db, uid);
    const stop = store.subscribe(() => {});
    store.toggle({ id: "a" }, { edition_date: "2026-11-06" });
    const first = await until(store, (l) => l.length === 1);
    assert.equal(store.list(), first);
    stop();
  });

  test("a save made elsewhere arrives without asking", async () => {
    const store = accountSaves(db, uid);
    const stop = store.subscribe(() => {});
    await setDoc(doc(env.authenticatedContext(uid).firestore(), "users", uid, "saves", "b"),
      { item_id: "b", edition_date: "2026-11-05", created_at: Timestamp.now() });
    const list = await until(store, (l) => l.length === 1);
    assert.equal(list[0].item_id, "b");
    stop();
  });

  test("toggle refuses a save the rules would refuse, before writing", () => {
    const store = accountSaves(db, uid);
    assert.throws(() => store.toggle({ id: "a" }, {}), /exactly one/);
  });

  test("mergeInto adds only what the account lacks, keeping created_at and the account's copy", async () => {
    await setDoc(doc(db, "users", uid, "saves", "b"), { item_id: "b", edition_date: "2026-01-01", created_at: Timestamp.fromDate(new Date(iso(1))) });
    const added = await mergeInto(db, uid, [local("c", 7), local("b", 6, { issue_slug: "issue-9" }), local("a", 5)]);
    assert.equal(added, 2);
    assert.equal((await stored("c")).created_at.toDate().toISOString(), iso(7));
    assert.equal((await stored("a")).edition_date, "2026-11-06");
    assert.equal((await stored("b")).edition_date, "2026-01-01", "the account's copy wins");
  });

  test("mergeInto with nothing local, or nothing new, writes nothing", async () => {
    assert.equal(await mergeInto(db, uid, []), 0);
    await mergeInto(db, uid, [local("a", 5)]);
    assert.equal(await mergeInto(db, uid, [local("a", 5)]), 0);
  });

  test("mergeInto into someone else's account is refused, and rejects", async () => {
    await assert.rejects(mergeInto(db, "someone-else", [local("a", 5)]));
  });
});
