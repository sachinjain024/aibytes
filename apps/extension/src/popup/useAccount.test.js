// The popup signed in (spec AIB-76n extension-auth, "The session" and "Signing
// out from the popup"): the reader as the header shows them, and Sign out's
// order: the worker's flag first, then this popup's own sign-out, then the tab.
import test from "node:test";
import assert from "node:assert/strict";
import { SIGNOUT_URL_PATH, signOutByReader, toUser } from "./useAccount.js";

const SITE = "http://localhost:5173";

test("a Firebase user becomes { uid, name, email, photoUrl }", () => {
  assert.deepEqual(
    toUser({ uid: "u1", displayName: "Ada", email: "ada@example.com", photoURL: "https://lh3.example/a.png" }),
    { uid: "u1", name: "Ada", email: "ada@example.com", photoUrl: "https://lh3.example/a.png" },
  );
});

test("a user without a name falls back to the email, then to Reader; missing fields stay undefined", () => {
  assert.deepEqual(toUser({ uid: "u1", displayName: null, email: "ada@example.com", photoURL: null }), { uid: "u1", name: "ada@example.com", email: "ada@example.com", photoUrl: undefined });
  assert.deepEqual(toUser({ uid: "u2", displayName: "", email: null, photoURL: null }), { uid: "u2", name: "Reader", email: undefined, photoUrl: undefined });
  assert.equal(toUser(null), null);
});

function fakes({ reply = { ok: true }, fail = false } = {}) {
  const calls = [];
  const chrome = {
    runtime: {
      sendMessage: async (message) => {
        calls.push(["message", message]);
        if (fail) throw new Error("Could not establish connection");
        return reply;
      },
    },
    tabs: { create: async ({ url }) => { calls.push(["tab", url]); } },
  };
  const signOutHere = async () => { calls.push(["here"]); };
  return { chrome, signOutHere, calls };
}

test("Sign out: the worker first, then this popup, then the sign-out tab", async () => {
  const { chrome, signOutHere, calls } = fakes();
  await signOutByReader({ chrome, site: SITE, signOutHere });
  assert.deepEqual(calls, [
    ["message", { type: "signout-by-reader" }],
    ["here"],
    ["tab", `${SITE}${SIGNOUT_URL_PATH}`],
  ]);
  assert.equal(SIGNOUT_URL_PATH, "/extension-onboarding?action=signout");
});

test("Sign out still signs this popup out and opens the tab when the worker cannot be reached", async (t) => {
  const warn = t.mock.method(console, "warn", () => {});
  const { chrome, signOutHere, calls } = fakes({ fail: true });
  await signOutByReader({ chrome, site: SITE, signOutHere });
  assert.deepEqual(calls.map(([kind]) => kind), ["message", "here", "tab"]);
  assert.equal(warn.mock.callCount(), 1);
});

test("Sign out opens the tab even if this popup's own sign-out fails", async (t) => {
  t.mock.method(console, "warn", () => {});
  const { chrome, calls } = fakes();
  await signOutByReader({ chrome, site: SITE, signOutHere: async () => { throw new Error("idb"); } });
  assert.deepEqual(calls.map(([kind]) => kind), ["message", "tab"]);
});
