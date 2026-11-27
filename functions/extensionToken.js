// Who may get a token for the Chrome extension (spec AIB-76n extension-auth).
// Pure: index.js mints the token. Only a reader signed in with Google gets
// one, for their own uid: a session that itself came from a custom token (the
// extension's) cannot mint more.

/** { ok: true, uid } or { ok: false, code, message } with an HttpsError code. */
function prepareToken(auth) {
  if (!auth?.uid) return { ok: false, code: "unauthenticated", message: "Sign in required." };
  if (auth.token?.firebase?.sign_in_provider !== "google.com") {
    return { ok: false, code: "permission-denied", message: "Sign in with Google on aibytes.io." };
  }
  return { ok: true, uid: auth.uid };
}

module.exports = { prepareToken };
