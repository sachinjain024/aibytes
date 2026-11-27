// The popup's account (spec AIB-76n extension-auth, "The session" and "Signing
// out from the popup"). Firebase loads after the first paint, as on the site;
// until it reports a reader the stars are this browser's (chrome.storage.local).
// Signed in, they are users/{uid}/saves, the header shows the avatar, and any
// signed-out saves still here are merged once per open. Sign out shows Sign in
// at once.
import React from "react";
import { ONBOARDING_PATH } from "../install.js";

export const SIGNOUT_URL_PATH = `${ONBOARDING_PATH}?action=signout`;

/** The reader as the header shows them, or null. */
export function toUser(user) {
  if (!user) return null;
  return {
    uid: user.uid,
    name: user.displayName || user.email || "Reader",
    email: user.email || undefined,
    photoUrl: user.photoURL || undefined,
  };
}

/**
 * Sign out, in this order: the worker sets the two-minute signoutPending flag
 * and signs the extension out (awaited, so the site can never mint a token in
 * between); this popup's own Auth follows; then the site's sign-out tab, which
 * the site honours only while the flag is set. A failure at one step is logged
 * and the next still runs.
 */
export async function signOutByReader({ chrome, site, signOutHere }) {
  try {
    await chrome.runtime.sendMessage({ type: "signout-by-reader" });
  } catch (error) {
    console.warn("The worker did not take the sign-out:", error?.message ?? error);
  }
  try {
    await signOutHere();
  } catch (error) {
    console.warn("Signing the popup out failed:", error?.code ?? error?.name ?? error);
  }
  await chrome.tabs.create({ url: site + SIGNOUT_URL_PATH });
}

// After the browser has painted and gone idle, or at most a second later.
function afterPaint(callback) {
  if (typeof requestIdleCallback === "function") {
    const id = requestIdleCallback(callback, { timeout: 1000 });
    return () => cancelIdleCallback(id);
  }
  const id = setTimeout(callback, 1);
  return () => clearTimeout(id);
}

/**
 * { user, openSaves, signOut }. user: undefined while the session restores,
 * null signed out, { uid, name, email?, photoUrl? } signed in. openSaves
 * resolves to the store for that user and changes when the user does.
 * loadSession: () => import("./session.js"); openLocal: the signed-out store.
 */
export function useAccount({ chrome, site, loadSession, openLocal }) {
  const [session, setSession] = React.useState(null);
  const [user, setUser] = React.useState(undefined);
  // Set by Sign out until Auth agrees, so the header shows Sign in at once.
  const [signingOut, setSigningOut] = React.useState(false);

  React.useEffect(() => afterPaint(() => loadSession().then(setSession, (error) => {
    console.warn("Could not load sign-in:", error?.message ?? error);
    setUser(null);
  })), [loadSession]);

  React.useEffect(() => (session ? session.onUser((u) => {
    setUser(toUser(u));
    if (!u) setSigningOut(false);
  }) : undefined), [session]);

  const shown = signingOut ? null : user;
  const uid = shown?.uid;

  const openSaves = React.useMemo(
    () => (uid && session ? () => Promise.resolve(session.openAccountSaves(uid)) : openLocal),
    [uid, session, openLocal],
  );

  // The merge retry, once per uid per open (StrictMode runs effects twice).
  const merged = React.useRef(null);
  React.useEffect(() => {
    if (!uid || !session || merged.current === uid) return;
    merged.current = uid;
    session.mergeLocal(chrome)(uid).catch((error) => console.warn("Merging the signed-out saves failed; they stay for the next open:", error?.code ?? error?.name ?? "error"));
  }, [uid, session, chrome]);

  const signOut = React.useCallback(() => {
    setSigningOut(true);
    signOutByReader({ chrome, site, signOutHere: session ? session.signOutHere : async () => {} });
  }, [chrome, site, session]);

  return { user: shown, openSaves, signOut };
}
