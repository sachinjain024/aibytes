// The site's side of the extension contract (spec AIB-76n site-extension, "The
// bridge"; the contract is in AIB-76n-extension-auth.md). Chrome gives a page
// chrome.runtime.sendMessage only when an installed extension lists it in
// externally_connectable; no runtime, a lastError or silence all mean "not
// installed". reconcile puts the extension's sign-in in step with the site's.
// The token is minted only when it will be sent, lives in one local, and is
// never logged, stored, put in a URL or returned.

export const EXTENSION_ID = "faamldnehjdjdobapchedpmldfjjfife";
export const STATUS_TIMEOUT_MS = 1500;
// A sign-in includes the extension's Firebase sign-in and the merge of its saves.
export const SEND_TIMEOUT_MS = 10000;

/** One message to the extension: its reply, or null when it is absent, errs or is silent. */
export function sendToExtension(message, { runtime = globalThis.chrome?.runtime, timeoutMs = SEND_TIMEOUT_MS } = {}) {
  if (typeof runtime?.sendMessage !== "function") return Promise.resolve(null);
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), timeoutMs);
    const done = (value) => { clearTimeout(timer); resolve(value); };
    try {
      runtime.sendMessage(EXTENSION_ID, message, (reply) => {
        // Reading lastError marks it handled, so Chrome logs nothing.
        done(runtime.lastError ? null : reply ?? null);
      });
    } catch {
      done(null);
    }
  });
}

/** The extension's status, or null when it is absent, outside Chrome, or slow (1.5 s). */
export async function extensionStatus(runtime = globalThis.chrome?.runtime, { timeoutMs = STATUS_TIMEOUT_MS } = {}) {
  const reply = await sendToExtension({ type: "status" }, { runtime, timeoutMs });
  return reply && typeof reply === "object" ? reply : null;
}

/** A custom token for the signed-in reader, from aibytesExtensionToken. The Functions client loads only now. */
export function mintToken() {
  return import("firebase/functions").then(({ getFunctions, httpsCallable }) => httpsCallable(getFunctions(), "aibytesExtensionToken")())
    .then((result) => result?.data?.token);
}

// The extension's error code, and nothing else from its reply.
const codeOf = (reply) => (reply && typeof reply.code === "string" ? reply.code : "no-reply");

/**
 * Puts the extension's sign-in in step with the site's. user: the site's
 * reader ({ uid }) or null. Resolves to { action, ok?, code? }; action is
 * "absent", "none", "signin" or "signout". Never throws; never logs the token.
 */
export async function reconcile(user, { status = extensionStatus, mintToken: mint = mintToken, send = sendToExtension } = {}) {
  let current;
  try {
    current = await status();
  } catch {
    current = null;
  }
  if (!current) return { action: "absent" };

  if (user?.uid) {
    // A popup Sign out is under way: minting now would sign the extension
    // straight back in from this or another open tab.
    if (current.uid === user.uid || current.signoutPending === true) return { action: "none" };
    let token;
    try {
      token = await mint();
    } catch {
      return { action: "signin", ok: false, code: "mint" };
    }
    if (typeof token !== "string" || !token) return { action: "signin", ok: false, code: "mint" };
    let reply;
    try {
      reply = await send({ type: "signin", token });
    } catch {
      reply = null;
    }
    return reply?.ok === true ? { action: "signin", ok: true } : { action: "signin", ok: false, code: codeOf(reply) };
  }

  if (!current.uid) return { action: "none" };
  let reply;
  try {
    reply = await send({ type: "signout" });
  } catch {
    reply = null;
  }
  return reply?.ok === true ? { action: "signout", ok: true } : { action: "signout", ok: false, code: codeOf(reply) };
}

/** Wraps `fn` so calls run one at a time: each waits for the one before, failed or not. */
export function oneAtATime(fn) {
  let last = Promise.resolve();
  return (...args) => {
    const run = last.then(() => fn(...args));
    last = run.catch(() => {});
    return run;
  };
}
