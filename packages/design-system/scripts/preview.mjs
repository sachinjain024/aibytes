// Serve Ledger's preview pages with a bundle compiled from the sources.
//
// The committed _ds_bundle.js is Claude Design's, regenerated only when the
// project is synced and opened, so it lags the sources. This server answers
// /_ds_bundle.js with a fresh esbuild bundle of the same shape (React from
// window.React, components on window.LedgerAiBytesDesignSystem_b1be4f),
// rebuilt on every request, and serves every other file as is. The committed
// bundle is never read or written.
import { build } from "esbuild";
import { createServer } from "node:http";
import { readFile, readdir } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const PORT = Number(process.env.PORT) || 4300;
const NAMESPACE = "LedgerAiBytesDesignSystem_b1be4f";
const GROUPS = ["brand", "content", "forms", "navigation"];
const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".jsx": "text/babel; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png",
  ".md": "text/markdown; charset=utf-8", ".woff2": "font/woff2",
};

// Every component module, as Claude Design bundles them: the capitalised .jsx files.
async function entry() {
  const lists = await Promise.all(GROUPS.map(async (group) =>
    (await readdir(join(ROOT, "components", group)))
      .filter((f) => /^[A-Z].*\.jsx$/.test(f))
      .map((f) => `export * from "./components/${group}/${f}";`)));
  return lists.flat().join("\n");
}

async function bundle() {
  const result = await build({
    stdin: { contents: await entry(), resolveDir: ROOT, loader: "js" },
    bundle: true, format: "iife", globalName: "__ledger", write: false, jsx: "transform",
    loader: { ".jsx": "jsx", ".js": "jsx" },
    footer: { js: `window.${NAMESPACE} = __ledger;` },
    plugins: [{ name: "global-react", setup(b) {
      b.onResolve({ filter: /^react$/ }, () => ({ path: "react", namespace: "global" }));
      b.onLoad({ filter: /.*/, namespace: "global" }, () => ({ contents: "module.exports = window.React", loader: "js" }));
    } }],
  });
  return result.outputFiles[0].text;
}

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  try {
    if (path === "/_ds_bundle.js") {
      res.writeHead(200, { "content-type": TYPES[".js"], "cache-control": "no-store" });
      return res.end(await bundle());
    }
    let file = normalize(join(ROOT, path));
    if (file !== ROOT && !file.startsWith(ROOT + sep)) throw Object.assign(new Error("outside root"), { code: "ENOENT" });
    if (path.endsWith("/")) file = join(file, "index.html");
    const body = await readFile(file);
    res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream", "cache-control": "no-store" });
    res.end(body);
  } catch (err) {
    const missing = err.code === "ENOENT" || err.code === "EISDIR";
    res.writeHead(missing ? 404 : 500, { "content-type": "text/plain; charset=utf-8" });
    res.end(missing ? "Not found" : `Build failed:\n${err.message}`);
    if (!missing) console.error(err.message);
  }
}).listen(PORT, () => console.log(`Ledger preview: http://localhost:${PORT}/ui_kits/aibytes-app/ (bundle built from source)`));
