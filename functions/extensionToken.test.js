// aibytesExtensionToken (spec AIB-76n extension-auth): who may get a token,
// and that the callable returns it without logging it.
const assert = require("node:assert/strict");
const Module = require("node:module");
const { test } = require("node:test");
const { prepareToken } = require("./extensionToken.js");

const google = { uid: "reader-1", token: { firebase: { sign_in_provider: "google.com" } } };

test("no auth is refused as unauthenticated", () => {
  for (const auth of [undefined, null, {}, { uid: "" }]) {
    const decision = prepareToken(auth);
    assert.equal(decision.ok, false);
    assert.equal(decision.code, "unauthenticated");
  }
});

test("a session from a custom token, or any provider but Google, is refused", () => {
  for (const provider of ["custom", "password", "anonymous", undefined]) {
    const decision = prepareToken({ uid: "reader-1", token: { firebase: { sign_in_provider: provider } } });
    assert.equal(decision.ok, false, String(provider));
    assert.equal(decision.code, "permission-denied");
  }
  assert.equal(prepareToken({ uid: "reader-1" }).code, "permission-denied");
});

test("a Google session gets its own uid, and nothing else", () => {
  assert.deepEqual(prepareToken(google), { ok: true, uid: "reader-1" });
});

// index.js with Firebase stubbed: onCall hands back the handler, and
// createCustomToken returns a marker that must not appear in any log.
function loadCallable(minted) {
  const handlers = {};
  const fakes = {
    "firebase-functions/v2/https": {
      onCall: (opts, fn) => fn ?? opts,
      HttpsError: class HttpsError extends Error {
        constructor(code, message) { super(message); this.code = code; }
      },
    },
    "firebase-functions/params": { defineSecret: (name) => ({ name, value: () => "" }) },
    "firebase-admin/app": { initializeApp: () => {} },
    "firebase-admin/firestore": { getFirestore: () => ({}) },
    "firebase-admin/auth": { getAuth: () => ({ createCustomToken: async (uid) => { minted.push(uid); return "TOKEN-MARKER"; } }) },
    "firebase-functions/logger": new Proxy({}, { get: () => (...args) => console.log(...args) }),
  };
  const load = Module._load;
  Module._load = function (request, ...rest) {
    return request in fakes ? fakes[request] : load.call(this, request, ...rest);
  };
  try {
    delete require.cache[require.resolve("./index.js")];
    Object.assign(handlers, require("./index.js"));
  } finally {
    Module._load = load;
  }
  return handlers;
}

test("the callable returns the token for the caller's uid and logs nothing", async (t) => {
  const minted = [];
  const lines = [];
  for (const level of ["log", "info", "warn", "error", "debug"]) {
    t.mock.method(console, level, (...args) => lines.push(args.map(String).join(" ")));
  }
  const { aibytesExtensionToken } = loadCallable(minted);
  assert.deepEqual(await aibytesExtensionToken({ auth: google, data: { uid: "someone-else" } }), { token: "TOKEN-MARKER" });
  assert.deepEqual(minted, ["reader-1"]);
  await assert.rejects(aibytesExtensionToken({ auth: null }), { code: "unauthenticated" });
  await assert.rejects(aibytesExtensionToken({ auth: { uid: "reader-1", token: { firebase: { sign_in_provider: "custom" } } } }), { code: "permission-denied" });
  assert.deepEqual(minted, ["reader-1"]);
  assert.deepEqual(lines.filter((l) => l.includes("TOKEN-MARKER")), []);
});
