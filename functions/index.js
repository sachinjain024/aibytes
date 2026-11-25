// aibytesReportSubscribeFailure (spec AIB-140p). A signed-in reader reports
// one failed newsletter subscribe. The email and uid come from the token.
// At most three posts per reader per day, counted in alert_limits/{uid} in
// the aibytes database. The webhook is the secret AIBYTES_SLACK_WEBHOOK.
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const { prepareReport } = require("./alert.js");
const { prepareToken } = require("./extensionToken.js");

initializeApp();
const webhook = defineSecret("AIBYTES_SLACK_WEBHOOK");
const db = () => getFirestore("aibytes");

exports.aibytesReportSubscribeFailure = onCall({ secrets: [webhook] }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Sign in required.");
  const day = new Date().toISOString().slice(0, 10);
  const ref = db().doc(`alert_limits/${request.auth.uid}`);
  const report = await db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const decision = prepareReport({ auth: request.auth, data: request.data, stored: snap.data(), day });
    if (!decision.ok) return decision;
    tx.set(ref, { day, count: decision.count + 1 });
    return decision;
  });
  if (!report.ok) return { reported: false };
  const response = await fetch(webhook.value(), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text: report.text }),
  });
  if (!response.ok) throw new HttpsError("internal", "Could not send the alert.");
  return { reported: true };
});

// aibytesExtensionToken (spec AIB-76n extension-auth). A reader signed in with
// Google on aibytes.io gets a Firebase custom token for their own uid, to hand
// to the Chrome extension. No claims. The token is returned, never logged.
exports.aibytesExtensionToken = onCall(async (request) => {
  const decision = prepareToken(request.auth);
  if (!decision.ok) throw new HttpsError(decision.code, decision.message);
  return { token: await getAuth().createCustomToken(decision.uid) };
});
