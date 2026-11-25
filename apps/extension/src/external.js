// aibytes.io's messages to the extension (spec AIB-76n extension-auth, "The
// contract"). Pure: chrome, the account and the merge are passed in, so
// node --test drives every row. The token is used once, for the sign-in call;
// it is never logged, stored or put in a reply. Errors reply with Firebase's
// code only.
import { SAVES_KEY, readSaves } from "@aibytes/app-core/saves.js";

/** The popup's Sign out sets this; the site honours ?action=signout only while it is fresh. */
export const SIGNOUT_KEY = "aibytes-extension-signout";
export const SIGNOUT_TTL_MS = 2 * 60 * 1000;
/** A custom token is about 1 KB; anything this long is not one. */
export const TOKEN_MAX = 4096;

/** The origins the manifest lets message us: externally_connectable's matches, as origins. */
export function allowedOrigins(manifest) {
  return (manifest?.externally_connectable?.matches ?? []).map((match) => new URL(match.replace(/\*$/, "")).origin);
}

const fromAllowed = (sender, allowed) => typeof sender?.origin === "string" && allowed.includes(sender.origin);

export async function signoutPending(chrome, now = Date.now()) {
  const flag = (await chrome.storage.local.get(SIGNOUT_KEY))[SIGNOUT_KEY];
  return typeof flag?.at === "number" && now - flag.at >= 0 && now - flag.at < SIGNOUT_TTL_MS;
}

async function pinned(chrome) {
  if (typeof chrome.action?.getUserSettings !== "function") return null;
  return (await chrome.action.getUserSettings()).isOnToolbar === true;
}

// A Firebase error's code, and nothing else from it: its message could echo input.
const codeOf = (error, fallback) => (typeof error?.code === "string" && /^[\w/-]{1,64}$/.test(error.code) ? error.code : fallback);

async function signIn(token, { account, merge }) {
  let uid;
  try {
    uid = await account.signIn(token);
  } catch (error) {
    return { ok: false, code: codeOf(error, "auth/failed") };
  }
  let merged = null;
  try {
    merged = await merge(uid);
  } catch (error) {
    // The saves stay in chrome.storage.local; the popup retries on its next open.
    console.warn("Merging the signed-out saves failed:", codeOf(error, error?.name ?? "error"));
  }
  return { ok: true, uid, merged };
}

/**
 * One message from a page in externally_connectable. deps: { allowed (origins),
 * chrome, account: { ready() → uid|null, signIn(token) → uid, signOut() },
 * merge(uid) → count, now() }.
 */
export async function handleExternal(message, sender, { allowed, chrome, account, merge, now = Date.now }) {
  if (!fromAllowed(sender, allowed)) return { ok: false, code: "origin" };
  const type = message && typeof message === "object" ? message.type : undefined;
  if (type === "status") {
    return {
      installed: true,
      version: chrome.runtime.getManifest().version,
      pinned: await pinned(chrome),
      uid: (await account.ready()) ?? null,
      signoutPending: await signoutPending(chrome, now()),
    };
  }
  if (type === "signin") {
    const { token } = message;
    if (typeof token !== "string" || !token || token.length >= TOKEN_MAX) return { ok: false, code: "bad-message" };
    return signIn(token, { account, merge });
  }
  if (type === "signout") {
    try {
      await account.signOut();
    } catch (error) {
      return { ok: false, code: codeOf(error, "auth/failed") };
    }
    await chrome.storage.local.remove(SIGNOUT_KEY);
    return { ok: true };
  }
  return { ok: false, code: "bad-message" };
}

/**
 * The page's "pin" port: { pinned } on each toolbar change (Chrome 130+). Where
 * the event is missing the port stays open and quiet; the page polls status.
 */
export function handlePort(port, { allowed, chrome }) {
  if (port.name !== "pin" || !fromAllowed(port.sender, allowed)) {
    port.disconnect();
    return;
  }
  const changed = chrome.action?.onUserSettingsChanged;
  if (!changed) return;
  const post = (settings) => port.postMessage({ pinned: settings?.isOnToolbar === true });
  changed.addListener(post);
  port.onDisconnect.addListener(() => changed.removeListener(post));
}

/**
 * merge(uid) for the worker: the signed-out saves in chrome.storage.local go
 * into the account, and are cleared only once mergeInto has resolved. A star
 * added meanwhile leaves them in place for the next try (the merge is
 * idempotent: the account's copy wins).
 */
export function mergeSignedOut(chrome, mergeInto) {
  return async (uid) => {
    const before = (await chrome.storage.local.get(SAVES_KEY))[SAVES_KEY] ?? null;
    const local = readSaves({ getItem: () => before });
    if (!local.length) return 0;
    const count = await mergeInto(uid, local);
    const after = (await chrome.storage.local.get(SAVES_KEY))[SAVES_KEY] ?? null;
    if (after === before) await chrome.storage.local.remove(SAVES_KEY);
    return count;
  };
}
