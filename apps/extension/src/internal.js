// The popup's Sign out (spec AIB-76n extension-auth, "Signing out from the
// popup"). Pure: chrome and the account are passed in. Only the extension's
// own pages are heard, the popup whether it is a popup or open in a tab: a
// content script (our id, a web page's origin) or another extension is
// ignored. The flag goes first, so the site cannot mint a token between the
// two steps.
import { SIGNOUT_KEY } from "./external.js";

// Our origin; where Chrome gives no `origin` (before 80), the page's url instead.
function ownPage(sender, chrome) {
  if (sender?.id !== chrome.runtime.id) return false;
  const own = `chrome-extension://${chrome.runtime.id}`;
  if (sender.origin !== undefined) return sender.origin === own;
  return typeof sender.url === "string" && sender.url.startsWith(own + "/");
}

/** Resolves to { ok: true } when handled; undefined when the message is not ours. */
export async function handleInternal(message, sender, { chrome, account, now = Date.now }) {
  if (message?.type !== "signout-by-reader" || !ownPage(sender, chrome)) return undefined;
  await chrome.storage.local.set({ [SIGNOUT_KEY]: { at: now() } });
  await account.signOut();
  return { ok: true };
}
