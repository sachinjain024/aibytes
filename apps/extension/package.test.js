// The store zip (T12): what goes in, and what stops it.
import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { packageExtension, storeProblems } from "./package.js";
import { EXTENSION_ID } from "./manifest.config.js";
import { createHash } from "node:crypto";

const run = promisify(execFile);

async function folder(files) {
  const dir = await mkdtemp(path.join(tmpdir(), "aibytes-store-check-"));
  for (const [name, text] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(dir, name)), { recursive: true });
    await writeFile(path.join(dir, name), text);
  }
  return dir;
}

const good = {
  "manifest.json": "{}",
  "popup.html": "<div></div>",
  "background.js": "x",
  "icons/icon-16.png": "png",
  "assets/popup-abc123.js": "y",
  "assets/popup-abc123.css": "z",
  "assets/inter-latin-400-normal-Ab1.woff2": "w",
};

test("storeProblems passes a store build", async (t) => {
  const dir = await folder(good);
  t.after(() => rm(dir, { recursive: true, force: true }));
  assert.deepEqual(await storeProblems(dir), []);
});

test("storeProblems stops source maps, localhost and stray files", async (t) => {
  const dir = await folder({
    ...good,
    "background.js.map": "{}",
    "assets/popup-abc123.js": "fetch('http://localhost:5173/content/')\n//# sourceMappingURL=popup.js.map",
    ".DS_Store": "",
    "src/Popup.jsx": "",
  });
  t.after(() => rm(dir, { recursive: true, force: true }));
  assert.deepEqual(await storeProblems(dir), [
    ".DS_Store: not a store file",
    "assets/popup-abc123.js: names localhost",
    "assets/popup-abc123.js: points at a source map",
    "background.js.map: not a store file",
    "src/Popup.jsx: not a store file",
  ]);
});

test("the zip holds the production build, manifest at its root, with the store's key", async (t) => {
  const out = await mkdtemp(path.join(tmpdir(), "aibytes-store-zip-"));
  t.after(() => rm(out, { recursive: true, force: true }));
  const zip = await packageExtension({ outDir: out, logLevel: "silent" });
  const { version } = JSON.parse(await readFile(new URL("./package.json", import.meta.url), "utf8"));
  assert.equal(path.basename(zip), `aibytes-extension-${version}.zip`);
  const names = (await run("unzip", ["-Z1", zip])).stdout.trim().split("\n").filter((n) => !n.endsWith("/"));
  assert.ok(names.includes("manifest.json"));
  assert.ok(names.includes("popup.html"));
  assert.deepEqual(names.filter((n) => n.endsWith(".map")), []);
  const manifest = JSON.parse((await run("unzip", ["-p", zip, "manifest.json"])).stdout);
  const hex = createHash("sha256").update(Buffer.from(manifest.key, "base64")).digest("hex").slice(0, 32);
  assert.equal([...hex].map((c) => String.fromCharCode(97 + parseInt(c, 16))).join(""), EXTENSION_ID);
  assert.deepEqual(manifest.permissions, ["storage"]);
});
