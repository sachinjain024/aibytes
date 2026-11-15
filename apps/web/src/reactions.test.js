// The reactions store (spec AIB-145y-app-reactions, T32). The key table, the adapter
// and the press arithmetic are pure and run under a plain `npm test`. The store is
// driven against the Firestore emulator with firestore.rules in force
// (`npm run test:rules -w @aibytes/web`), so every write here is one the deployed
// rules allow; without an emulator those tests skip.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, beforeEach, describe, test } from "node:test";
import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc } from "firebase/firestore";
import { barProps, KEYS, LEDGER_EMOJI, pressed, reactions, zeroTotals } from "./reactions.js";

const host = process.env.FIRESTORE_EMULATOR_HOST;
const skip = host ? false : "needs the Firestore emulator: npm run test:rules -w @aibytes/web";
const SLUG = "ph-plurai-simulation";

describe("the key table", () => {
  test("eight keys, in the Ledger order, each with its emoji", () => {
    assert.deepEqual(KEYS.map((k) => k.key), ["plus1", "minus1", "laugh", "hooray", "confused", "heart", "rocket", "eyes"]);
    assert.deepEqual(KEYS.map((k) => k.emoji), LEDGER_EMOJI);
  });
  test("zeroTotals has all eight keys at zero", () => {
    assert.deepEqual(Object.keys(zeroTotals()).sort(), KEYS.map((k) => k.key).sort());
    assert.ok(Object.values(zeroTotals()).every((n) => n === 0));
  });
});

describe("pressed: the screen's change for one press", () => {
  const state = { totals: { ...zeroTotals(), plus1: 2 }, mine: ["plus1"] };
  test("adds the key and one to its total", () => {
    const next = pressed(state, "heart");
    assert.deepEqual(next.mine, ["plus1", "heart"]);
    assert.equal(next.totals.heart, 1);
    assert.equal(next.totals.plus1, 2);
  });
  test("removes a held key and takes one off its total", () => {
    const next = pressed(state, "plus1");
    assert.deepEqual(next.mine, []);
    assert.equal(next.totals.plus1, 1);
  });
  test("never goes below zero, and leaves the old state alone", () => {
    assert.equal(pressed({ totals: zeroTotals(), mine: ["eyes"] }, "eyes").totals.eyes, 0);
    assert.deepEqual(state.mine, ["plus1"]);
  });
});

describe("barProps: the adapter between the store and ReactionBar", () => {
  test("the bar's counts are everyone else's, keyed by emoji: a signed-in 👍 with total 1 shows 1, not 2", () => {
    const { counts, mine } = barProps({ totals: { ...zeroTotals(), plus1: 1, heart: 3 }, mine: ["plus1"] });
    assert.equal(counts["👍"], 0); // the bar adds mine on top: 0 + 1
    assert.equal(counts["❤️"], 3);
    assert.deepEqual(mine, ["👍"]);
    assert.equal(counts["👍"] + (mine.includes("👍") ? 1 : 0), 1);
  });
  test("a signed-out reader's totals pass through whole", () => {
    const { counts, mine } = barProps({ totals: { ...zeroTotals(), rocket: 4 }, mine: [] });
    assert.equal(counts["🚀"], 4);
    assert.deepEqual(mine, []);
  });
  test("every one of the eight emoji is keyed, and nothing else", () => {
    assert.deepEqual(Object.keys(barProps({ totals: zeroTotals(), mine: [] }).counts), LEDGER_EMOJI);
  });
});

describe("the store", { skip }, () => {
  let env;
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
  beforeEach(async () => {
    await env.clearFirestore(); // the counts document is shared by every reader of a slug
    uid = `reader-${++n}`;
    db = env.authenticatedContext(uid, { firebase: { sign_in_provider: "google.com" } }).firestore();
  });
  after(() => env?.cleanup());

  const peek = async (...path) => {
    let data;
    await env.withSecurityRulesDisabled(async (ctx) => { data = (await getDoc(doc(ctx.firestore(), ...path))).data(); });
    return data;
  };
  const countsNow = () => peek("gist_reaction_counts", SLUG);
  const readerNow = (id = uid) => peek("gist_reactions", SLUG, "by", id);

  test("load of a gist nobody reacted to is eight zeros and an empty set", async () => {
    assert.deepEqual(await reactions(db, uid).load(SLUG), { totals: zeroTotals(), mine: [] });
  });

  test("toggle adds one key, writes both documents, and load then sees it", async () => {
    const store = reactions(db, uid);
    await store.load(SLUG);
    await store.toggle(SLUG, "plus1");
    assert.deepEqual(await countsNow(), { ...zeroTotals(), plus1: 1 });
    assert.deepEqual((await readerNow()).picked, ["plus1"]);
    assert.deepEqual(await reactions(db, uid).load(SLUG), { totals: { ...zeroTotals(), plus1: 1 }, mine: ["plus1"] });
  });

  test("two presses in a row stay consistent, and removing the last key deletes the reader document", async () => {
    const store = reactions(db, uid);
    await store.load(SLUG);
    await store.toggle(SLUG, "plus1");
    await store.toggle(SLUG, "heart");
    assert.deepEqual(await countsNow(), { ...zeroTotals(), plus1: 1, heart: 1 });
    await store.toggle(SLUG, "plus1");
    assert.deepEqual((await readerNow()).picked, ["heart"]);
    await store.toggle(SLUG, "heart");
    assert.equal(await readerNow(), undefined);
    assert.deepEqual(await countsNow(), zeroTotals());
  });

  test("two readers add up", async () => {
    const other = env.authenticatedContext("reader-other", { firebase: { sign_in_provider: "google.com" } }).firestore();
    const mine = reactions(db, uid);
    const theirs = reactions(other, "reader-other");
    await mine.load(SLUG);
    await theirs.load(SLUG);
    await mine.toggle(SLUG, "rocket");
    await theirs.toggle(SLUG, "rocket");
    assert.equal((await reactions(db, uid).load(SLUG)).totals.rocket, 2);
  });

  test("toggle does nothing, and writes nothing, until the reader's own set has loaded", async () => {
    const store = reactions(db, uid);
    await store.toggle(SLUG, "plus1");
    assert.equal(await countsNow(), undefined);
    assert.equal(await readerNow(), undefined);
  });

  test("a write the rules refuse rejects and leaves the store as it was", async () => {
    // A sign-in that is not Google may read its own (missing) set but not write.
    const password = env.authenticatedContext("reader-pw", { firebase: { sign_in_provider: "password" } }).firestore();
    const store = reactions(password, "reader-pw");
    assert.deepEqual((await store.load(SLUG)).mine, []);
    await assert.rejects(store.toggle(SLUG, "plus1"));
    assert.equal(await countsNow(), undefined);
    assert.equal(await readerNow("reader-pw"), undefined);
  });

  test("a signed-out store reads the counts and holds no set", async () => {
    await reactions(db, uid).toggle(SLUG, "eyes").catch(() => {});
    const store = reactions(env.unauthenticatedContext().firestore());
    assert.deepEqual((await store.load(SLUG)).mine, []);
  });

  test("a read that fails is reported as null, not as zeros", async () => {
    const failing = { type: "broken" }; // not a Firestore: every read throws
    assert.deepEqual(await reactions(failing, uid).load(SLUG), { totals: null, mine: null });
  });
});
