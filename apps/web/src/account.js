// The app's one Firebase entry point (spec AIB-75v app-accounts): Google sign-in
// with Firebase Auth, and the `aibytes` Firestore database for saves. It loads
// on every page (decision 1), so a returning reader's session restores without
// a hint. No Analytics.
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut as signOutOf } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { firebaseConfig, FIRESTORE_DATABASE } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
export const db = getFirestore(app, FIRESTORE_DATABASE);

// The reader closing the popup, or a second click while one is open, is not a failure.
const CANCELLED = new Set(["auth/popup-closed-by-user", "auth/cancelled-popup-request", "auth/user-cancelled"]);

/** Opens Google's sign-in. Resolves to "ok", "cancelled" or "failed"; never rejects. */
export function signIn() {
  return signInWithPopup(auth, new GoogleAuthProvider()).then(
    () => "ok",
    (error) => (CANCELLED.has(error.code) ? "cancelled" : (console.warn("Sign-in failed:", error.code || error), "failed")),
  );
}

export const signOut = () => signOutOf(auth);

/** Calls `listener` with the signed-in reader, { uid, name, photoUrl? }, or null; first once the session has restored. */
export function onUser(listener) {
  return onAuthStateChanged(auth, (user) => listener(user && {
    uid: user.uid,
    name: user.displayName || user.email || "Reader",
    photoUrl: user.photoURL || undefined,
  }));
}
