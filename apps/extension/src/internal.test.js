// The popup's Sign out (spec AIB-76n extension-auth, "Signing out from the
// popup"): only the extension's own pages can send it; it signs out and sets
// the two-minute signoutPending flag.
import test from "node:test";
import assert from "node:assert/strict";
import { handleInternal } from "./internal.js";
import { SIGNOUT_KEY } from "./external.js";

const ID = "faamldnehjdjdobapchedpmldfjjfife";

function setup() {
  const store = {};
  const calls = [];
  const chrome = {
    store,
    runtime: { id: ID },
    storage: { local: { set: async (obj) => { calls.push("flag"); Object.assign(store, obj); } } },
  };
  const account = { signOut: async () => { calls.push("signOut"); } };
  return { chrome, account, calls, store };
}

test("the popup's signout-by-reader sets the flag, then signs out", async () => {
  const { chrome, account, calls, store } = setup();
  const reply = await handleInternal({ type: "signout-by-reader" }, { id: ID, origin: `chrome-extension://${ID}` }, { chrome, account, now: () => 1234 });
  assert.deepEqual(reply, { ok: true });
  assert.deepEqual(calls, ["flag", "signOut"]); // flagged first, so the site never mints in between
  assert.deepEqual(store[SIGNOUT_KEY], { at: 1234 });
});

test("a sender without an origin but with the extension's id is accepted", async () => {
  const { chrome, account, calls } = setup();
  assert.deepEqual(await handleInternal({ type: "signout-by-reader" }, { id: ID }, { chrome, account }), { ok: true });
  assert.deepEqual(calls, ["flag", "signOut"]);
});

test("another extension, a web origin or another message does nothing", async () => {
  const { chrome, account, calls } = setup();
  const cases = [
    [{ type: "signout-by-reader" }, { id: "otherextensionidotherextensionid" }],
    [{ type: "signout-by-reader" }, { id: ID, origin: "https://aibytes.io", tab: { id: 1 } }],
    [{ type: "signout-by-reader" }, { id: ID, origin: "https://evil.example" }],
    [{ type: "signout" }, { id: ID }],
    [{ type: "status" }, { id: ID }],
    [null, { id: ID }],
  ];
  for (const [message, sender] of cases) {
    assert.equal(await handleInternal(message, sender, { chrome, account }), undefined, JSON.stringify([message, sender]));
  }
  assert.deepEqual(calls, []);
});
