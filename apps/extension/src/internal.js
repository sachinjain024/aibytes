// The popup's Sign out (spec AIB-76n extension-auth, "Signing out from the
// popup"). Pure: chrome and the account are passed in. Only the extension's
// own pages are heard: a content script or another extension is ignored. The
// flag goes first, so the site cannot mint a token between the two steps.
import { SIGNOUT_KEY } from "./external.js";

const ownPage = (sender, chrome) =>
  sender?.id === chrome.runtime.id &&
  !sender.tab &&
  (sender.origin === undefined || sender.origin === `chrome-extension://${chrome.runtime.id}`);

/** Resolves to { ok: true } when handled; undefined when the message is not ours. */
export async function handleInternal(message, sender, { chrome, account, now = Date.now }) {
  if (message?.type !== "signout-by-reader" || !ownPage(sender, chrome)) return undefined;
  await chrome.storage.local.set({ [SIGNOUT_KEY]: { at: now() } });
  await account.signOut();
  return { ok: true };
}
