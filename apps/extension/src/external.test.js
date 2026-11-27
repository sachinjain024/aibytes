// aibytes.io's messages to the extension (spec AIB-76n extension-auth, "The
// contract"): every row of the table, the origin and shape checks, the merge
// order, the pin port, and that the token never leaves the sign-in call.
import test from "node:test";
import assert from "node:assert/strict";
import { SIGNOUT_KEY, SIGNOUT_TTL_MS, TOKEN_MAX, allowedOrigins, handleExternal, handlePort, mergeSignedOut } from "./external.js";
import { SAVES_KEY } from "@aibytes/app-core/saves.js";

const TOKEN = "eyJ-TOKEN-MARKER-xyz";
const SITE = { origin: "https://aibytes.io", url: "https://aibytes.io/extension-onboarding" };
const allowed = ["https://aibytes.io"];

function fakeChrome({ local = {}, pinned = true, settingsEvent = true } = {}) {
  const store = { ...local };
  const listeners = new Set();
  return {
    store,
    listeners,
    runtime: { id: "faamldnehjdjdobapchedpmldfjjfife", getManifest: () => ({ version: "0.1.0" }) },
    storage: {
      local: {
        get: async (key) => (key in store ? { [key]: store[key] } : {}),
        set: async (obj) => { Object.assign(store, obj); },
        remove: async (key) => { delete store[key]; },
      },
    },
    action: {
      getUserSettings: async () => ({ isOnToolbar: pinned }),
      ...(settingsEvent && {
        onUserSettingsChanged: { addListener: (fn) => listeners.add(fn), removeListener: (fn) => listeners.delete(fn) },
      }),
    },
  };
}

function fakeAccount({ uid = null, failSignIn } = {}) {
  const calls = [];
  const account = {
    calls,
    uid,
    ready: async () => account.uid,
    signIn: async (token) => {
      calls.push(["signIn", token === TOKEN ? "TOKEN" : token]);
      if (failSignIn) throw Object.assign(new Error(`bad token ${token}`), { code: failSignIn });
      account.uid = "reader-1";
      return "reader-1";
    },
    signOut: async () => { calls.push(["signOut"]); account.uid = null; },
  };
  return account;
}

// Every console call during `fn`, as text.
async function consoleDuring(t, fn) {
  const lines = [];
  for (const level of ["log", "info", "warn", "error", "debug"]) {
    t.mock.method(console, level, (...args) => lines.push(args.map((a) => (a instanceof Error ? `${a.message} ${a.stack}` : String(a))).join(" ")));
  }
  await fn();
  return lines;
}

test("allowedOrigins reads the manifest's externally_connectable matches", () => {
  assert.deepEqual(allowedOrigins({ externally_connectable: { matches: ["https://aibytes.io/*", "http://localhost:5173/*"] } }), ["https://aibytes.io", "http://localhost:5173"]);
  assert.deepEqual(allowedOrigins({}), []);
});

test("status: installed, version, pinned, uid and signoutPending", async () => {
  const chrome = fakeChrome({ pinned: false });
  const reply = await handleExternal({ type: "status" }, SITE, { allowed, chrome, account: fakeAccount({ uid: "reader-1" }), merge: async () => 0 });
  assert.deepEqual(reply, { installed: true, version: "0.1.0", pinned: false, uid: "reader-1", signoutPending: false });
});

test("status: signoutPending is true while the flag is fresh, false once it expires", async () => {
  const now = 1_000_000;
  const chrome = fakeChrome({ local: { [SIGNOUT_KEY]: { at: now - 1000 } } });
  const deps = { allowed, chrome, account: fakeAccount(), merge: async () => 0 };
  assert.equal((await handleExternal({ type: "status" }, SITE, { ...deps, now: () => now })).signoutPending, true);
  assert.equal((await handleExternal({ type: "status" }, SITE, { ...deps, now: () => now + SIGNOUT_TTL_MS })).signoutPending, false);
});

test("status: pinned is null where getUserSettings is missing", async () => {
  const chrome = fakeChrome();
  delete chrome.action.getUserSettings;
  const reply = await handleExternal({ type: "status" }, SITE, { allowed, chrome, account: fakeAccount(), merge: async () => 0 });
  assert.equal(reply.pinned, null);
});

test("signin: signs in, then merges, and replies with the uid and the count", async () => {
  const order = [];
  const account = fakeAccount();
  const signIn = account.signIn;
  account.signIn = async (token) => { order.push("signIn"); return signIn(token); };
  const merge = async (uid) => { order.push(`merge ${uid}`); return 3; };
  const reply = await handleExternal({ type: "signin", token: TOKEN }, SITE, { allowed, chrome: fakeChrome(), account, merge });
  assert.deepEqual(reply, { ok: true, uid: "reader-1", merged: 3 });
  assert.deepEqual(order, ["signIn", "merge reader-1"]);
});

test("signin: a failed merge still replies ok, with merged null", async (t) => {
  const lines = await consoleDuring(t, async () => {
    const reply = await handleExternal({ type: "signin", token: TOKEN }, SITE, {
      allowed, chrome: fakeChrome(), account: fakeAccount(), merge: async () => { throw Object.assign(new Error("offline"), { code: "unavailable" }); },
    });
    assert.deepEqual(reply, { ok: true, uid: "reader-1", merged: null });
  });
  assert.ok(lines.some((l) => l.includes("unavailable")));
});

test("signin: a failed sign-in replies with Firebase's code only, and merges nothing", async (t) => {
  let merged = false;
  let reply;
  const lines = await consoleDuring(t, async () => {
    reply = await handleExternal({ type: "signin", token: TOKEN }, SITE, {
      allowed, chrome: fakeChrome(), account: fakeAccount({ failSignIn: "auth/invalid-custom-token" }), merge: async () => { merged = true; },
    });
  });
  assert.deepEqual(reply, { ok: false, code: "auth/invalid-custom-token" });
  assert.equal(merged, false);
  assert.deepEqual(lines.filter((l) => l.includes(TOKEN)), []);
});

test("signin: refused while signoutPending is fresh, allowed once it expires", async () => {
  const now = Date.now();
  const chrome = fakeChrome({ local: { [SIGNOUT_KEY]: { at: now } } });
  const account = fakeAccount();
  let merged = false;
  const deps = { allowed, chrome, account, merge: async () => { merged = true; return 0; } };
  assert.deepEqual(await handleExternal({ type: "signin", token: TOKEN }, SITE, { ...deps, now: () => now + 1000 }), { ok: false, code: "signout-pending" });
  assert.deepEqual(account.calls, []);
  assert.equal(merged, false);
  assert.equal((await handleExternal({ type: "signin", token: TOKEN }, SITE, { ...deps, now: () => now + SIGNOUT_TTL_MS })).ok, true);
});

test("signin: an error without a string code replies auth/failed", async () => {
  const account = fakeAccount();
  account.signIn = async () => { throw new Error(`no ${TOKEN}`); };
  const reply = await handleExternal({ type: "signin", token: TOKEN }, SITE, { allowed, chrome: fakeChrome(), account, merge: async () => 0 });
  assert.deepEqual(reply, { ok: false, code: "auth/failed" });
});

test("no reply and no console call carries the token, on any path", async (t) => {
  const replies = [];
  const lines = await consoleDuring(t, async () => {
    const deps = { allowed, chrome: fakeChrome(), merge: async () => { throw new Error("merge failed"); } };
    replies.push(await handleExternal({ type: "signin", token: TOKEN }, SITE, { ...deps, account: fakeAccount() }));
    replies.push(await handleExternal({ type: "signin", token: TOKEN }, SITE, { ...deps, account: fakeAccount({ failSignIn: "auth/x" }) }));
    replies.push(await handleExternal({ type: "signin", token: TOKEN }, { origin: "https://evil.example" }, { ...deps, account: fakeAccount() }));
    replies.push(await handleExternal({ type: "signin", token: TOKEN, extra: 1 }, SITE, { ...deps, account: fakeAccount() }));
    replies.push(await handleExternal({ type: "status", token: TOKEN }, SITE, { ...deps, account: fakeAccount() }));
  });
  assert.deepEqual(replies.filter((r) => JSON.stringify(r).includes(TOKEN)), []);
  assert.deepEqual(lines.filter((l) => l.includes(TOKEN)), []);
});

test("signout: signs out, clears signoutPending, replies ok", async () => {
  const chrome = fakeChrome({ local: { [SIGNOUT_KEY]: { at: Date.now() } } });
  const account = fakeAccount({ uid: "reader-1" });
  assert.deepEqual(await handleExternal({ type: "signout" }, SITE, { allowed, chrome, account, merge: async () => 0 }), { ok: true });
  assert.deepEqual(account.calls, [["signOut"]]);
  assert.equal(SIGNOUT_KEY in chrome.store, false);
});

test("anything else is a bad message", async () => {
  const deps = { allowed, chrome: fakeChrome(), account: fakeAccount(), merge: async () => 0 };
  for (const message of [undefined, null, "status", 42, {}, { type: "signout-by-reader" }, { type: "STATUS" }, { type: "constructor" }]) {
    assert.deepEqual(await handleExternal(message, SITE, deps), { ok: false, code: "bad-message" }, JSON.stringify(message));
  }
});

test("signin's token must be a string under 4 KB", async () => {
  const account = fakeAccount();
  const deps = { allowed, chrome: fakeChrome(), account, merge: async () => 0 };
  for (const token of [undefined, 42, "", { t: TOKEN }, "x".repeat(TOKEN_MAX)]) {
    assert.deepEqual(await handleExternal({ type: "signin", token }, SITE, deps), { ok: false, code: "bad-message" });
  }
  assert.deepEqual(account.calls, []);
});

test("a wrong origin runs nothing", async () => {
  const chrome = fakeChrome({ local: { [SIGNOUT_KEY]: { at: Date.now() } } });
  const account = fakeAccount({ uid: "reader-1" });
  let merged = false;
  const deps = { allowed, chrome, account, merge: async () => { merged = true; } };
  for (const sender of [{ origin: "https://evil.example" }, { origin: "http://localhost:5173" }, { origin: "https://aibytes.io.evil.example" }, {}, { url: "https://aibytes.io/" }]) {
    for (const message of [{ type: "status" }, { type: "signin", token: TOKEN }, { type: "signout" }]) {
      assert.deepEqual(await handleExternal(message, sender, deps), { ok: false, code: "origin" });
    }
  }
  assert.deepEqual(account.calls, []);
  assert.equal(merged, false);
  assert.ok(SIGNOUT_KEY in chrome.store);
});

// The merge: chrome.storage.local's saves into the account, cleared after.
const saves = JSON.stringify([
  { item_id: "a", edition_date: "2026-11-19", created_at: "2026-11-25T10:00:00.000Z" },
  { item_id: "b", issue_slug: "issue-18", created_at: "2026-11-24T10:00:00.000Z" },
]);

test("mergeSignedOut merges the saves, then clears them", async () => {
  const chrome = fakeChrome({ local: { [SAVES_KEY]: saves } });
  const seen = [];
  const count = await mergeSignedOut(chrome, async (uid, local) => {
    seen.push([uid, local.map((s) => s.item_id), SAVES_KEY in chrome.store]);
    return 2;
  })("reader-1");
  assert.equal(count, 2);
  assert.deepEqual(seen, [["reader-1", ["a", "b"], true]]); // still there while merging
  assert.equal(SAVES_KEY in chrome.store, false);
});

test("mergeSignedOut keeps the saves when the merge fails", async () => {
  const chrome = fakeChrome({ local: { [SAVES_KEY]: saves } });
  await assert.rejects(mergeSignedOut(chrome, async () => { throw new Error("offline"); })("reader-1"), /offline/);
  assert.equal(chrome.store[SAVES_KEY], saves);
});

test("mergeSignedOut with no saves merges nothing", async () => {
  let called = false;
  assert.equal(await mergeSignedOut(fakeChrome(), async () => { called = true; return 0; })("reader-1"), 0);
  assert.equal(called, false);
});

test("mergeSignedOut keeps a star added while it merged, for the next try", async () => {
  const chrome = fakeChrome({ local: { [SAVES_KEY]: saves } });
  const newer = JSON.stringify([{ item_id: "c", edition_date: "2026-11-24", created_at: "2026-11-25T11:00:00.000Z" }, ...JSON.parse(saves)]);
  await mergeSignedOut(chrome, async () => { chrome.store[SAVES_KEY] = newer; return 2; })("reader-1");
  assert.equal(chrome.store[SAVES_KEY], newer);
});

// The pin port.
function fakePort(name, origin) {
  const posted = [];
  const onDisconnect = new Set();
  return {
    name, sender: { origin }, posted, disconnected: false,
    postMessage: (m) => posted.push(m),
    disconnect() { this.disconnected = true; },
    onDisconnect: { addListener: (fn) => onDisconnect.add(fn) },
    close: () => onDisconnect.forEach((fn) => fn()),
  };
}

test("the pin port posts { pinned } on each settings change, and stops when the page goes", () => {
  const chrome = fakeChrome();
  const port = fakePort("pin", "https://aibytes.io");
  handlePort(port, { allowed, chrome });
  assert.equal(chrome.listeners.size, 1);
  chrome.listeners.forEach((fn) => fn({ isOnToolbar: true }));
  chrome.listeners.forEach((fn) => fn({ isOnToolbar: false }));
  assert.deepEqual(port.posted, [{ pinned: true }, { pinned: false }]);
  port.close();
  assert.equal(chrome.listeners.size, 0);
});

test("the pin port does nothing where onUserSettingsChanged is missing", () => {
  const chrome = fakeChrome({ settingsEvent: false });
  const port = fakePort("pin", "https://aibytes.io");
  handlePort(port, { allowed, chrome });
  assert.deepEqual(port.posted, []);
  assert.equal(port.disconnected, false);
});

test("a port from a wrong origin, or with another name, is closed", () => {
  for (const port of [fakePort("pin", "https://evil.example"), fakePort("other", "https://aibytes.io")]) {
    const chrome = fakeChrome();
    handlePort(port, { allowed, chrome });
    assert.equal(port.disconnected, true);
    assert.equal(chrome.listeners.size, 0);
  }
});
