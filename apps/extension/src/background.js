// The extension's service worker (spec AIB-76n extension-popup). This module's
// part is onboarding on install; extension-auth adds the message handlers.
import { onInstalledHandler } from "./install.js";

// The site the worker opens: aibytes.io, or the dev server in a dev build
// (vite.config.js defines it by mode).
chrome.runtime.onInstalled.addListener(onInstalledHandler(chrome, __AIBYTES_SITE__));
