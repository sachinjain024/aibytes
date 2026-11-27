// The extension, as the site sees it (spec AIB-76n site-extension). The flag
// shows "Add to Chrome" on the site; T24 turned it on (27 Nov 2026, at the
// publisher's ask, with 26.11.27 in review). The install box's rules live here, pure,
// so node --test covers them; App.jsx's useExtensionPromo runs them.
import { EXTENSION_ID } from "./extensionBridge.js";

export const EXTENSION_LIVE = true;

/** The Chrome Web Store listing the extension replaces. */
export const STORE_URL = `https://chromewebstore.google.com/detail/${EXTENSION_ID}`;

/**
 * A desktop Chromium browser that can install from the Chrome Web Store
 * (Chrome, Edge, Brave, Opera, Vivaldi, Arc). userAgentData where it exists:
 * a Chromium brand and not mobile. Otherwise the user agent: Chrome/ present,
 * no Mobile or Android. Never Safari, Firefox or a phone; false with no navigator.
 */
export function isDesktopChromium(nav = globalThis.navigator) {
  const data = nav?.userAgentData;
  if (data && Array.isArray(data.brands)) {
    return data.mobile === false && data.brands.some((b) => b?.brand === "Chromium");
  }
  const ua = typeof nav?.userAgent === "string" ? nav.userAgent : "";
  return ua.includes("Chrome/") && !/Mobile|Android/.test(ua);
}

// "Not now" (map assumption 7): the time it was pressed, and 30 days of quiet.
export const PROMO_KEY = "aibytes-extension-promo";
export const PROMO_HIDE_MS = 30 * 24 * 60 * 60 * 1000;

const storageOf = () => {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
};

/** True while a "Not now" from the last 30 days stands. Junk, a future time or blocked storage: false. */
export function promoDismissed(storage = storageOf(), now = Date.now()) {
  let at;
  try {
    at = Number(storage?.getItem(PROMO_KEY));
  } catch {
    return false;
  }
  return Number.isFinite(at) && at > 0 && at <= now && now - at < PROMO_HIDE_MS;
}

/** Remembers "Not now". Blocked storage hides the box for this visit only. */
export function dismissPromo(storage = storageOf(), now = Date.now()) {
  try {
    storage?.setItem(PROMO_KEY, String(now));
  } catch {
    // Nothing to keep it in; the caller still hides the box now.
  }
}
