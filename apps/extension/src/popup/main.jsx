// The popup (spec AIB-76n extension-popup): mounts <Popup/> with the browser's
// storage, fetch and the site this build points at.
import React from "react";
import { createRoot } from "react-dom/client";
import "@aibytes/design-system/styles.css";
import "../fonts.css";
import { browserStorage } from "@aibytes/app-core/storage.js";
import { ONBOARDING_PATH } from "../install.js";
import { Popup } from "./Popup.jsx";

const site = __AIBYTES_SITE__;
const fetchJson = (url) => fetch(url);

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
      onSignIn={() => chrome.tabs.create({ url: site + ONBOARDING_PATH + "?step=signin" })}
      onFirstRender={onFirstRender}
    />
  </React.StrictMode>,
);
