import assert from "node:assert/strict";
import { test } from "node:test";
import { headerAccount } from "./header.js";

const signIn = () => {};
const signOut = () => {};
const openSaved = () => {};

test("while the session restores, neither Sign in nor the avatar", () => {
  assert.deepEqual(headerAccount(undefined, { signIn, signOut, openSaved }), {});
});

test("signed out: Sign in only", () => {
  assert.deepEqual(headerAccount(null, { signIn, signOut, openSaved }), { onSignIn: signIn });
});

test("signed in: the avatar, with Saved and Sign out in its menu", () => {
  const user = { uid: "u1", name: "Sachin", photoUrl: "https://lh3.googleusercontent.com/a/x" };
  assert.deepEqual(headerAccount(user, { signIn, signOut, openSaved }),
    { user: { name: "Sachin", photoUrl: "https://lh3.googleusercontent.com/a/x" }, onSignOut: signOut, onSaved: openSaved });
});

test("signed in without a photo: the initial shows", () => {
  assert.deepEqual(headerAccount({ uid: "u1", name: "Sachin" }, { signIn, signOut, openSaved }).user, { name: "Sachin" });
});
