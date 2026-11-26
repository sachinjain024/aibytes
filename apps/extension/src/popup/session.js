// The popup's Firebase (spec AIB-76n extension-auth, "The session"). Imported
// with import() after the first paint, so it is its own chunk and never delays
// the cached edition. The session is the one the worker signed in: Auth from
// firebase/auth/web-extension keeps it in the extension's IndexedDB, so the
// popup reads it with no token and no visit to aibytes.io.
import { onAuthStateChanged, signOut } from "firebase/auth/web-extension";
import { accountSaves, mergeInto } from "@aibytes/app-core/accountSaves.js";
import { auth, db } from "../firebase.js";
import { mergeSignedOut } from "../external.js";

/** Calls `listener` with the Firebase user or null, first once the session has restored. */
export const onUser = (listener) => onAuthStateChanged(auth, listener);

/** The account's saves: the same interface as localSaves. */
export const openAccountSaves = (uid) => accountSaves(db, uid, { onError: (error) => console.warn("Saves:", error?.code ?? error) });

/** This popup's own Auth, signed out; the worker has already signed out the shared session. */
export const signOutHere = () => signOut(auth);

/**
 * The merge retry: signed-out saves still in chrome.storage.local (a failed or
 * interrupted sign-in merge, or a star made before the session restored) go
 * into the account, and are cleared only once the merge has committed.
 */
export const mergeLocal = (chrome) => mergeSignedOut(chrome, (uid, local) => mergeInto(db, uid, local));
