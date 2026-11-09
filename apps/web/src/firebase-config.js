// The aibytes.io Firebase web app (project ai-bytes-b42d2). These values are
// public by design: they name the project and grant nothing; firestore.rules
// does the guarding. Only Auth and Firestore are used - no Analytics, so the
// console's measurementId is left out (spec AIB-75v app-accounts; /privacy).
export const firebaseConfig = {
  apiKey: "AIzaSyDJkr-L7n_HPUMNPtWR5-CFjAJZYejxYDo",
  authDomain: "ai-bytes-b42d2.firebaseapp.com",
  projectId: "ai-bytes-b42d2",
  storageBucket: "ai-bytes-b42d2.firebasestorage.app",
  messagingSenderId: "587008022206",
  appId: "1:587008022206:web:f71fe8f9529723962e30ef",
};

// Saves live in their own named Firestore database, not the project's
// (default) one, which predates this work and keeps its own rules.
export const FIRESTORE_DATABASE = "aibytes";
