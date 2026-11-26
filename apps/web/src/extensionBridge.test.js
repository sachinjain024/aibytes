// The bridge to the extension (spec AIB-76n site-extension, "The bridge"):
// status against a fake chrome.runtime (absent, lastError, a throw, slow),
// every reconcile case, one at a time, no mint while signoutPending, and the
// token never in a log or the returned value.
import test from "node:test";
import assert from "node:assert/strict";
import { EXTENSION_ID, STATUS_TIMEOUT_MS, extensionStatus, oneAtATime, reconcile, sendToExtension } from "./extensionBridge.js";

const TOKEN = "eyJ-TOKEN-MARKER-site";

// A chrome.runtime whose sendMessage answers through `reply(message)`: a value,
// { lastError }, "never", or a throw.
function fakeRuntime(reply) {
  const runtime = {
    lastError: undefined,
    sent: [],
    sendMessage(id, message, callback) {
      runtime.sent.push([id, message]);
      const answer = reply(message);
      if (answer === "throw") throw new TypeError("Invalid extension id");
      if (answer === "never") return;
      setTimeout(() => {
        if (answer?.lastError) runtime.lastError = { message: answer.lastError };
        callback(answer?.lastError ? undefined : answer);
        runtime.lastError = undefined;
      }, 1);
    },
  };
  return runtime;
}

function spyConsole(t) {
  const lines = [];
  for (const level of ["log", "info", "warn", "error", "debug"]) {
    t.mock.method(console, level, (...args) => lines.push(args.map(String).join(" ")));
  }
  return lines;
}

test("the extension's id is the store listing's", () => {
  assert.equal(EXTENSION_ID, "faamldnehjdjdobapchedpmldfjjfife");
  assert.equal(STATUS_TIMEOUT_MS, 1500);
});

test("status: the extension's reply, sent to its id", async () => {
  const runtime = fakeRuntime(() => ({ installed: true, uid: "u1", signoutPending: false }));
  assert.deepEqual(await extensionStatus(runtime), { installed: true, uid: "u1", signoutPending: false });
  assert.deepEqual(runtime.sent, [[EXTENSION_ID, { type: "status" }]]);
});

test("status is null with no runtime, no sendMessage, a lastError, a throw or a non-object reply", async () => {
  assert.equal(await extensionStatus(undefined), null);
  assert.equal(await extensionStatus({}), null);
  assert.equal(await extensionStatus(fakeRuntime(() => ({ lastError: "Could not establish connection. Receiving end does not exist." }))), null);
  assert.equal(await extensionStatus(fakeRuntime(() => "throw")), null);
  assert.equal(await extensionStatus(fakeRuntime(() => "yes")), null);
});

test("status is null when the extension does not answer in time", async () => {
  const started = Date.now();
  assert.equal(await extensionStatus(fakeRuntime(() => "never"), { timeoutMs: 20 }), null);
  assert.ok(Date.now() - started < 1000);
});

test("send: the reply, or null on a lastError or silence", async () => {
  assert.deepEqual(await sendToExtension({ type: "signout" }, { runtime: fakeRuntime(() => ({ ok: true })) }), { ok: true });
  assert.equal(await sendToExtension({ type: "signout" }, { runtime: fakeRuntime(() => ({ lastError: "gone" })) }), null);
  assert.equal(await sendToExtension({ type: "signout" }, { runtime: fakeRuntime(() => "never"), timeoutMs: 20 }), null);
});

// The deps for reconcile, recording what ran.
function deps({ status = null, reply = { ok: true, uid: "u1", merged: 0 }, mint = async () => TOKEN } = {}) {
  const calls = [];
  return {
    calls,
    status: async () => { calls.push("status"); return status; },
    mintToken: async () => { calls.push("mint"); return mint(); },
    send: async (message) => { calls.push(message.type); return reply; },
  };
}

const READER = { uid: "u1", name: "Ada" };

test("absent extension: nothing else runs, signed in or out", async () => {
  for (const user of [READER, null]) {
    const d = deps({ status: null });
    assert.deepEqual(await reconcile(user, d), { action: "absent" });
    assert.deepEqual(d.calls, ["status"]);
  }
});

test("site signed in, extension signed out: mint, then signin", async (t) => {
  const lines = spyConsole(t);
  const d = deps({ status: { uid: null, signoutPending: false } });
  let sent;
  d.send = async (message) => { d.calls.push(message.type); sent = message; return { ok: true, uid: "u1", merged: 2 }; };
  const result = await reconcile(READER, d);
  assert.deepEqual(result, { action: "signin", ok: true });
  assert.deepEqual(d.calls, ["status", "mint", "signin"]);
  assert.deepEqual(sent, { type: "signin", token: TOKEN });
  assert.ok(!JSON.stringify(result).includes(TOKEN));
  assert.ok(lines.every((line) => !line.includes(TOKEN)));
});

test("site signed in as another reader: signin with the site's reader", async () => {
  const d = deps({ status: { uid: "someone-else", signoutPending: false } });
  assert.deepEqual(await reconcile(READER, d), { action: "signin", ok: true });
  assert.deepEqual(d.calls, ["status", "mint", "signin"]);
});

test("same reader on both: nothing", async () => {
  const d = deps({ status: { uid: "u1", signoutPending: false } });
  assert.deepEqual(await reconcile(READER, d), { action: "none" });
  assert.deepEqual(d.calls, ["status"]);
});

test("signoutPending: no mint, even when the uids differ", async () => {
  for (const uid of [null, "someone-else"]) {
    const d = deps({ status: { uid, signoutPending: true } });
    assert.deepEqual(await reconcile(READER, d), { action: "none" });
    assert.deepEqual(d.calls, ["status"]);
  }
});

test("site signed out, extension signed in: signout", async () => {
  const d = deps({ status: { uid: "u1", signoutPending: false }, reply: { ok: true } });
  assert.deepEqual(await reconcile(null, d), { action: "signout", ok: true });
  assert.deepEqual(d.calls, ["status", "signout"]);
});

test("both signed out: nothing", async () => {
  const d = deps({ status: { uid: null, signoutPending: false } });
  assert.deepEqual(await reconcile(null, d), { action: "none" });
  assert.deepEqual(d.calls, ["status"]);
});

test("a failed mint is reported, not thrown, and carries no detail", async (t) => {
  const lines = spyConsole(t);
  const d = deps({ status: { uid: null, signoutPending: false }, mint: async () => { throw Object.assign(new Error(`bad ${TOKEN}`), { code: "functions/unavailable" }); } });
  assert.deepEqual(await reconcile(READER, d), { action: "signin", ok: false, code: "mint" });
  assert.deepEqual(d.calls, ["status", "mint"]);
  assert.ok(lines.every((line) => !line.includes(TOKEN)));
});

test("a mint without a token string sends nothing", async () => {
  const d = deps({ status: { uid: null, signoutPending: false }, mint: async () => undefined });
  assert.deepEqual(await reconcile(READER, d), { action: "signin", ok: false, code: "mint" });
  assert.deepEqual(d.calls, ["status", "mint"]);
});

test("the extension's refusal or silence comes back as ok: false with its code only", async () => {
  const refused = deps({ status: { uid: null, signoutPending: false }, reply: { ok: false, code: "auth/invalid-custom-token" } });
  assert.deepEqual(await reconcile(READER, refused), { action: "signin", ok: false, code: "auth/invalid-custom-token" });
  const silent = deps({ status: { uid: "u1", signoutPending: false }, reply: null });
  assert.deepEqual(await reconcile(null, silent), { action: "signout", ok: false, code: "no-reply" });
});

test("a status or send that throws never escapes", async () => {
  const d = deps();
  d.status = async () => { throw new Error("boom"); };
  assert.deepEqual(await reconcile(READER, d), { action: "absent" });
  const e = deps({ status: { uid: "u1", signoutPending: false } });
  e.send = async () => { throw new Error("boom"); };
  assert.deepEqual(await reconcile(null, e), { action: "signout", ok: false, code: "no-reply" });
});

test("one at a time: a second run waits for the first", async () => {
  const order = [];
  let release;
  const gate = new Promise((r) => { release = r; });
  const run = oneAtATime(async (name) => {
    order.push(`start ${name}`);
    if (name === "a") await gate;
    order.push(`end ${name}`);
    return name;
  });
  const a = run("a");
  const b = run("b");
  await new Promise((r) => setTimeout(r, 5));
  assert.deepEqual(order, ["start a"]);
  release();
  assert.deepEqual(await Promise.all([a, b]), ["a", "b"]);
  assert.deepEqual(order, ["start a", "end a", "start b", "end b"]);
});

test("one at a time: a rejected run does not block the next", async () => {
  const run = oneAtATime(async (fail) => { if (fail) throw new Error("x"); return "ok"; });
  await assert.rejects(run(true));
  assert.equal(await run(false), "ok");
});
