import React from "react";
import { createRoot } from "react-dom/client";
import "@aibytes/design-system/styles.css";
import "./app.css";
import { App } from "./App.jsx";
import { issueRedirect, parseRoute } from "./route.js";

// An old newsletter link (aibytes.io/p/<slug>) reaches the app through
// 404.html once the domain moves. Send it on before rendering anything.
if (parseRoute(window.location.pathname).kind === "issue") {
  window.location.replace(issueRedirect(window.location));
} else {
  createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
