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

test("the popup opened as a tab is still the extension's own page", async () => {
  const { chrome, account, calls } = setup();
  const sender = { id: ID, origin: `chrome-extension://${ID}`, url: `chrome-extension://${ID}/popup.html`, tab: { id: 7 } };
  assert.deepEqual(await handleInternal({ type: "signout-by-reader" }, sender, { chrome, account }), { ok: true });
  assert.deepEqual(calls, ["flag", "signOut"]);
});

test("without an origin (older Chrome), the page's url must be the extension's", async () => {
  const { chrome, account, calls } = setup();
  assert.deepEqual(await handleInternal({ type: "signout-by-reader" }, { id: ID, url: `chrome-extension://${ID}/popup.html` }, { chrome, account }), { ok: true });
  assert.equal(await handleInternal({ type: "signout-by-reader" }, { id: ID, url: "https://aibytes.io/", tab: { id: 1 } }, { chrome, account }), undefined);
  assert.equal(await handleInternal({ type: "signout-by-reader" }, { id: ID }, { chrome, account }), undefined);
  assert.deepEqual(calls, ["flag", "signOut"]);
});

test("another extension, a web origin or another message does nothing", async () => {
  const { chrome, account, calls } = setup();
  const cases = [
    [{ type: "signout-by-reader" }, { id: "otherextensionidotherextensionid" }],
    // A content script: our id, but a web page's origin and tab.
    [{ type: "signout-by-reader" }, { id: ID, origin: "https://aibytes.io", url: "https://aibytes.io/", tab: { id: 1 } }],
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
