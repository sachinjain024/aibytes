// The extension's build (spec AIB-76n extension-popup): the popup page and the
// module service worker, the manifest by mode, and bundled fonts.
// `npm run dev` rebuilds dist/ on save in development mode; load dist/ unpacked.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { bundledFonts, extensionManifest } from "./build-plugins.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const { version } = JSON.parse(readFileSync(path.join(here, "package.json"), "utf8"));

// Where the worker and the popup send the reader: the dev build points at
// `npm run dev:web`.
const SITE = { development: "http://localhost:5173", production: "https://aibytes.io" };

export default defineConfig(({ mode }) => {
  const dev = mode === "development";
  return {
    root: here,
    // Extension pages load from chrome-extension://<id>/, so assets are relative.
    base: "./",
    plugins: [bundledFonts(), react(), extensionManifest({ mode, version })],
    define: { __AIBYTES_SITE__: JSON.stringify(dev ? SITE.development : SITE.production) },
    build: {
      outDir: "dist",
      emptyOutDir: true,
      sourcemap: dev,
      minify: !dev,
      // MV3 forbids remote code; inline nothing as data: either, so the CSP is never in question.
      assetsInlineLimit: 0,
      rollupOptions: {
        input: { popup: path.join(here, "popup.html"), background: path.join(here, "src/background.js") },
        // The worker must sit at the path the manifest names.
        output: { entryFileNames: (chunk) => (chunk.name === "background" ? "background.js" : "assets/[name]-[hash].js") },
      },
    },
  };
});
