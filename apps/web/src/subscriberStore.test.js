// subscribe and isSubscribed against the Firestore emulator, with firestore.rules
// in force (spec AIB-140p). Run by `npm run test:rules -w @aibytes/web`; under a
// plain `npm test` there is no emulator, and these skip.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, beforeEach, describe, test } from "node:test";
import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc } from "firebase/firestore";
import { isSubscribed, subscribe } from "./subscriber.js";

const host = process.env.FIRESTORE_EMULATOR_HOST;
const skip = host ? false : "needs the Firestore emulator: npm run test:rules -w @aibytes/web";
const email = "ada@example.com";

describe("subscriber store", { skip }, () => {
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
  beforeEach(() => {
    uid = `reader-${++n}`;
    db = env.authenticatedContext(uid, { email, email_verified: true }).firestore();
  });
  after(() => env?.cleanup());

  const stored = async () => {
    let data;
    await env.withSecurityRulesDisabled(async (ctx) => {
      data = (await getDoc(doc(ctx.firestore(), "subscribers", uid))).data();
    });
    return data;
  };

  test("subscribe creates the document, a second call leaves it, and the read follows", async () => {
    assert.equal(await isSubscribed(db, uid), false);
    assert.equal(await subscribe(db, { uid, email }), "ok");
    assert.equal(await isSubscribed(db, uid), true);
    const first = await stored();
    assert.equal(first.email, email);
    assert.equal(first.source, "signin-prompt");
    assert.equal(await subscribe(db, { uid, email }), "ok");
    const second = await stored();
    assert.equal(second.created_at.toMillis(), first.created_at.toMillis());
    assert.equal(second.email, first.email);
    assert.equal(second.source, first.source);
  });

  test("a write that never settles resolves timeout without waiting", async () => {
    let fire;
    const pending = subscribe(db, { uid, email }, {
      writeDoc: () => new Promise(() => {}),
      setTimer: (fn) => { fire = fn; return 1; },
      clearTimer: () => {},
    });
    fire();
    assert.deepEqual(await pending, { failed: "timeout" });
    assert.equal(await stored(), undefined);
  });

  test("a refused write on a missing document is permission-denied", async () => {
    const unverified = env.authenticatedContext(uid, { email, email_verified: false }).firestore();
    assert.deepEqual(await subscribe(unverified, { uid, email }), { failed: "permission-denied" });
    assert.equal(await stored(), undefined);
  });
});
