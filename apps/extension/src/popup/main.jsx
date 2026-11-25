// The popup (spec AIB-76n extension-popup). T7's placeholder: Ledger's frame
// and header, with Sign in opening the onboarding page. T9 adds the edition.
import React from "react";
import { createRoot } from "react-dom/client";
import "@aibytes/design-system/styles.css";
import "../fonts.css";
import { PopupHeader } from "@aibytes/design-system/components/extension/PopupHeader.jsx";
import { ONBOARDING_PATH } from "../install.js";

function Popup() {
  return (
    <div className="ldg-popup">
      <PopupHeader onSignIn={() => chrome.tabs.create({ url: __AIBYTES_SITE__ + ONBOARDING_PATH + "?step=signin" })} />
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>,
);
