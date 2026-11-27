// The extension's service worker (spec AIB-76n): onboarding on install
// (extension-popup), and aibytes.io's sign-in contract and the popup's Sign
// out (extension-auth). The handlers are pure (external.js, internal.js);
// this file gives them the real Chrome, Firebase Auth and the merge.
// Listeners are registered at the top level, as MV3 requires.
import { signInWithCustomToken, signOut } from "firebase/auth/web-extension";
import { mergeInto } from "@aibytes/app-core/accountSaves.js";
import { auth, db } from "./firebase.js";
import { onInstalledHandler } from "./install.js";
import { allowedOrigins, handleExternal, handlePort, mergeSignedOut } from "./external.js";
import { handleInternal } from "./internal.js";

// The site the worker opens: aibytes.io, or the dev server in a dev build
// (vite.config.js defines it by mode).
chrome.runtime.onInstalled.addListener(onInstalledHandler(chrome, __AIBYTES_SITE__));

const account = {
  async ready() {
    await auth.authStateReady();
    return auth.currentUser?.uid ?? null;
  },
  signIn: async (token) => (await signInWithCustomToken(auth, token)).user.uid,
  signOut: () => signOut(auth),
};
const allowed = allowedOrigins(chrome.runtime.getManifest());
const merge = mergeSignedOut(chrome, (uid, local) => mergeInto(db, uid, local));

// Answers through sendResponse once the handler settles. `true` keeps the
// channel open for that.
function answer(promise, sendResponse) {
  promise.then(sendResponse, (error) => {
    console.warn("Message failed:", error?.code ?? error?.name ?? "error");
    sendResponse({ ok: false, code: "internal" });
  });
  return true;
}

chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) =>
  answer(handleExternal(message, sender, { allowed, chrome, account, merge }), sendResponse));

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "signout-by-reader") return false;
  return answer(handleInternal(message, sender, { chrome, account }), sendResponse);
});

chrome.runtime.onConnectExternal.addListener((port) => handlePort(port, { allowed, chrome }));
