import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import "@aibytes/design-system/styles.css";
import { App } from "./App.jsx";
import { issueRedirect, parseRoute } from "./route.js";

// An old newsletter link (aibytes.io/p/<slug>) reaches the app through
// 404.html once the domain moves. Send it on before rendering anything.
if (parseRoute(window.location.pathname).kind === "issue") {
  window.location.replace(issueRedirect(window.location));
} else {
  const root = document.getElementById("root");
  // A built gist page carries its markup and its data (buildGistSite.js): take the markup over.
  const embedded = document.getElementById("gist-data");
  const tree = (initialGist) => (
    <React.StrictMode>
      <App initialGist={initialGist} />
    </React.StrictMode>
  );
  if (embedded && root.firstElementChild && parseRoute(window.location.pathname).kind === "gist") {
    hydrateRoot(root, tree(JSON.parse(embedded.textContent)));
  } else {
    createRoot(root).render(tree(null));
  }
}
