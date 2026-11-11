// The app's one Firebase entry point (spec AIB-75v app-accounts): Google sign-in
// with Firebase Auth, and the `aibytes` Firestore database for saves. App.jsx
// imports it dynamically just after the first paint (decision 1), so it is its
// own chunk and never delays a page. No Analytics.
import { initializeApp } from "firebase/app";
import { getAdditionalUserInfo, getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut as signOutOf } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { firebaseConfig, FIRESTORE_DATABASE } from "./firebase-config.js";
import { signInResult } from "./signInResult.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
export const db = getFirestore(app, FIRESTORE_DATABASE);

/** Opens Google's sign-in. Resolves to { status, isNew }; never rejects. */
export function signIn() {
  return signInWithPopup(auth, new GoogleAuthProvider()).then(
    (result) => signInResult({ isNewUser: getAdditionalUserInfo(result)?.isNewUser }),
    (error) => {
      const outcome = signInResult(null, error);
      if (outcome.status === "failed") console.warn("Sign-in failed:", error.code || error);
      return outcome;
    },
  );
}

export const signOut = () => signOutOf(auth);

/** Calls `listener` with the signed-in reader, { uid, name, email?, photoUrl? }, or null; first once the session has restored. */
export function onUser(listener) {
  return onAuthStateChanged(auth, (user) => listener(user && {
    uid: user.uid,
    name: user.displayName || user.email || "Reader",
    email: user.email || undefined,
    photoUrl: user.photoURL || undefined,
  }));
}
