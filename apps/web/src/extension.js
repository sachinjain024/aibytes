// The extension, as the site sees it (spec AIB-76n site-extension). The flag
// keeps "Add to Chrome" off the site until the store update is live: the
// store-listing module turns it on. T20 adds the install box's helpers here.
import { EXTENSION_ID } from "./extensionBridge.js";

export const EXTENSION_LIVE = false;

/** The Chrome Web Store listing the extension replaces. */
export const STORE_URL = `https://chromewebstore.google.com/detail/${EXTENSION_ID}`;
