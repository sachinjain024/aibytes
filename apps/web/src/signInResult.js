// The outcome of Google sign-in (spec AIB-140p). Pure, so node --test covers
// the mapping without Firebase. account.js reads isNewUser off the popup result.

// The reader closing the popup, or a second click while one is open, is not a failure.
const CANCELLED = new Set(["auth/popup-closed-by-user", "auth/cancelled-popup-request", "auth/user-cancelled"]);

/** `{ status: "ok" | "cancelled" | "failed", isNew }` from a popup result or its error. */
export function signInResult(result, error) {
  if (error) return { status: CANCELLED.has(error.code) ? "cancelled" : "failed", isNew: false };
  return { status: "ok", isNew: !!result?.isNewUser };
}
