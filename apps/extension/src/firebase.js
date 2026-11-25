// The extension's Firebase app (spec AIB-76n extension-auth): the same
// project and named database as aibytes.io, with Auth from
// firebase/auth/web-extension, which persists the user in the extension's
// IndexedDB. The worker signs in once; the popup and a restarted worker read
// that user with onAuthStateChanged and no second token.
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth/web-extension";
import { getFirestore } from "firebase/firestore";
import { FIRESTORE_DATABASE, firebaseConfig } from "@aibytes/app-core/firebase-config.js";

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app, FIRESTORE_DATABASE);
