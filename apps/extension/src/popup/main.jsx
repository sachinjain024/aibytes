// The popup (spec AIB-76n extension-popup): mounts <Popup/> with the browser's
// storage, fetch and the site this build points at.
// Imports are hoisted, so this marks the moment the bundle has loaded and run
// its modules: with data-first-render-ms below, it splits an open into
// Chrome's start-up, our script, and React's first render.
performance.mark("popup:script");
import React from "react";
import { createRoot } from "react-dom/client";
import "@aibytes/design-system/styles.css";
import "../fonts.css";
import { browserStorage } from "@aibytes/app-core/storage.js";
import { localSaves } from "@aibytes/app-core/saves.js";
import { ONBOARDING_PATH } from "../install.js";
import { extensionStorage } from "../extensionStorage.js";
import { Popup } from "./Popup.jsx";

const site = __AIBYTES_SITE__;
const fetchJson = (url) => fetch(url);
// Signed-out saves, in chrome.storage.local (T10). Read once per popup.
let saves;
const openSaves = () => (saves ??= extensionStorage(chrome).then(({ storage, events }) => localSaves(storage, events)));

// The cache-paint check (success criterion 2): when the first render ran, in
// ms since the popup opened, and whether it painted a cached edition.
function onFirstRender(ms, fromCache) {
  document.documentElement.dataset.firstRenderMs = ms.toFixed(1);
  document.documentElement.dataset.firstRenderCached = String(fromCache);
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Popup
      storage={browserStorage()}
      fetch={fetchJson}
      site={site}
      openSaves={openSaves}
      openTab={(url) => chrome.tabs.create({ url })}
      onSignIn={() => chrome.tabs.create({ url: site + ONBOARDING_PATH + "?step=signin" })}
      onFirstRender={onFirstRender}
    />
  </React.StrictMode>,
);
