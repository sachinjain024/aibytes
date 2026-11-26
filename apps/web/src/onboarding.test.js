// The onboarding page's steps (spec AIB-76n site-extension, "The onboarding
// page"): every transition, ?step=signin, ?action=signout with and without
// signoutPending, already pinned, already signed in, and skips.
import test from "node:test";
import assert from "node:assert/strict";
import { initialOnboarding, onboardingReducer as reduce } from "./onboarding.js";

const ADA = { uid: "u1", name: "Ada" };
const STATUS = { installed: true, pinned: false, uid: null, signoutPending: false };
const loaded = (search, status = STATUS, user = null) => reduce(initialOnboarding(search), { type: "loaded", status, user });
const run = (state, ...actions) => actions.reduce(reduce, state);

test("the page starts loading, at step 1, or step 2 with ?step=signin", () => {
  assert.deepEqual(initialOnboarding(""), { view: "loading", start: 1, signout: false, step: 1, next: null, pinned: false, user: null, extension: null, box: true, pressed: false, wantsNewsletter: false, newsletter: null, skipped: [] });
  assert.equal(initialOnboarding("?step=signin").start, 2);
  assert.equal(initialOnboarding("?step=other").start, 1);
  assert.equal(initialOnboarding("?action=signout").signout, true);
});

test("no extension: the not-installed view, whatever the URL asked", () => {
  for (const search of ["", "?step=signin", "?action=signout"]) {
    assert.equal(loaded(search, null).view, "notinstalled");
  }
});

test("installed: step 1, unpinned", () => {
  const s = loaded("");
  assert.equal(s.view, "steps");
  assert.equal(s.step, 1);
  assert.equal(s.pinned, false);
  assert.equal(s.next, null);
});

test("already pinned on arrival: step 1 is ticked at once and step 2 is next", () => {
  const s = loaded("", { ...STATUS, pinned: true });
  assert.equal(s.pinned, true);
  assert.equal(s.next, 2);
  assert.equal(reduce(s, { type: "advance" }).step, 2);
});

test("pinning ticks step 1; advance moves on once, and only when something is next", () => {
  const s = reduce(loaded(""), { type: "pinned" });
  assert.equal(s.pinned, true);
  assert.equal(s.next, 2);
  const two = reduce(s, { type: "advance" });
  assert.equal(two.step, 2);
  assert.equal(two.next, null);
  assert.equal(reduce(two, { type: "advance" }), two);
  assert.equal(reduce(two, { type: "pinned" }), two);
});

test("skip: step 1 to step 2, step 2 to done, each remembered", () => {
  const two = reduce(loaded(""), { type: "skip" });
  assert.equal(two.step, 2);
  assert.deepEqual(two.skipped, [1]);
  const done = reduce(two, { type: "skip" });
  assert.equal(done.step, 3);
  assert.deepEqual(done.skipped, [1, 2]);
  assert.equal(reduce(done, { type: "skip" }), done);
});

test("?step=signin starts at step 2", () => {
  assert.equal(loaded("?step=signin").step, 2);
  assert.equal(loaded("?step=signin", { ...STATUS, pinned: true }).next, null);
});

test("already signed in on both on arrival: step 2 shows the signed-in lines, no subscribe asked, then done", () => {
  const s = loaded("?step=signin", { ...STATUS, uid: "u1" }, ADA);
  assert.equal(s.user, ADA);
  assert.equal(s.extension, "ok");
  assert.equal(s.wantsNewsletter, false);
  assert.equal(s.next, 3);
});

test("signed in on both, arriving at step 1: step 2 is done as soon as it shows", () => {
  const s = run(loaded("", { ...STATUS, uid: "u1", pinned: true }, ADA), { type: "advance" });
  assert.equal(s.step, 2);
  assert.equal(s.next, 3);
});

test("the site's own reconcile signing the extension in finishes step 2 too", () => {
  const s = run(loaded("?step=signin", STATUS, ADA), { type: "extension", ok: true });
  assert.equal(s.next, 3);
});

test("signed in on the site only: the extension is not yet signed in", () => {
  const s = loaded("?step=signin", STATUS, ADA);
  assert.equal(s.extension, null);
});

test("the box starts ticked and toggles until sign-in is pressed", () => {
  let s = loaded("?step=signin");
  assert.equal(s.box, true);
  s = reduce(s, { type: "box" });
  assert.equal(s.box, false);
  s = reduce(s, { type: "box" });
  s = reduce(s, { type: "signin" });
  assert.equal(s.wantsNewsletter, true);
  assert.equal(reduce(s, { type: "box" }), s);
  // Unticked when pressed: the box still cannot change afterwards.
  const unticked = run(loaded("?step=signin"), { type: "box" }, { type: "signin" });
  assert.equal(unticked.wantsNewsletter, false);
  assert.equal(reduce(unticked, { type: "box" }), unticked);
});

test("sign-in with the box ticked: done only after both the extension and the subscribe succeed", () => {
  let s = run(loaded("?step=signin"), { type: "signin" }, { type: "user", user: ADA });
  assert.equal(s.user, ADA);
  s = reduce(s, { type: "extension", ok: true });
  assert.equal(s.extension, "ok");
  assert.equal(s.next, null);
  s = reduce(s, { type: "subscribing" });
  assert.equal(s.newsletter, "saving");
  s = reduce(s, { type: "subscribed", ok: true });
  assert.equal(s.newsletter, "ok");
  assert.equal(s.next, 3);
  assert.equal(reduce(s, { type: "advance" }).step, 3);
});

test("the subscribe can land before the extension answers", () => {
  const s = run(loaded("?step=signin"), { type: "signin" }, { type: "user", user: ADA }, { type: "subscribing" }, { type: "subscribed", ok: true }, { type: "extension", ok: true });
  assert.equal(s.next, 3);
});

test("sign-in with the box unticked: done once the extension is signed in", () => {
  const s = run(loaded("?step=signin"), { type: "box" }, { type: "signin" }, { type: "user", user: ADA }, { type: "extension", ok: true });
  assert.equal(s.wantsNewsletter, false);
  assert.equal(s.next, 3);
});

test("a failed subscribe stays on step 2 for the retry", () => {
  let s = run(loaded("?step=signin"), { type: "signin" }, { type: "user", user: ADA }, { type: "extension", ok: true }, { type: "subscribing" }, { type: "subscribed", ok: false });
  assert.equal(s.newsletter, "failed");
  assert.equal(s.next, null);
  s = run(s, { type: "subscribing" }, { type: "subscribed", ok: true });
  assert.equal(s.next, 3);
});

test("the extension's failure stays on step 2 with the error", () => {
  const s = run(loaded("?step=signin"), { type: "box" }, { type: "signin" }, { type: "user", user: ADA }, { type: "extension", ok: false });
  assert.equal(s.extension, "failed");
  assert.equal(s.next, null);
});

test("a sign-in that was cancelled leaves the button", () => {
  const s = run(loaded("?step=signin"), { type: "signin" }, { type: "signinFailed" });
  assert.equal(s.wantsNewsletter, false);
  assert.equal(s.pressed, false);
  assert.equal(s.user, null);
  assert.equal(reduce(s, { type: "box" }).box, false);
});

test("the site signing out on another tab clears the reader and the extension's state", () => {
  const s = run(loaded("?step=signin", { ...STATUS, uid: "u1" }, ADA), { type: "user", user: null });
  assert.equal(s.user, null);
  assert.equal(s.extension, null);
});

test("?action=signout with signoutPending: the signing-out view, then the signed-out view", () => {
  const s = loaded("?action=signout", { ...STATUS, uid: null, signoutPending: true }, ADA);
  assert.equal(s.view, "signingout");
  const out = reduce(s, { type: "signedOut" });
  assert.equal(out.view, "signedout");
  assert.equal(out.step, 2);
  assert.equal(out.user, null);
  assert.equal(out.extension, null);
  // Sign in again from there, or skip to done.
  assert.equal(reduce(out, { type: "skip" }).step, 3);
  assert.equal(reduce(out, { type: "skip" }).view, "steps");
});

test("?action=signout without signoutPending is ignored: the normal state, nobody signed out", () => {
  const s = loaded("?action=signout", { ...STATUS, uid: "u1" }, ADA);
  assert.equal(s.view, "steps");
  assert.equal(s.step, 1);
  assert.equal(s.user, ADA);
  assert.equal(reduce(s, { type: "signedOut" }), s);
});

test("loaded only once; unknown actions change nothing", () => {
  const s = loaded("");
  assert.equal(reduce(s, { type: "loaded", status: null, user: null }), s);
  assert.equal(reduce(s, { type: "nope" }), s);
});
