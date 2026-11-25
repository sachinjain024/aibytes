// The built extension (spec AIB-76n extension-popup, testing strategy): a
// production build's manifest asks for `storage` only, carries the key that
// gives the store's ID, and nothing in dist/ reaches for Google Fonts.
// The permission set was frozen by extension-auth's gate on 25 Nov 2026:
// `storage`, no host permissions. A new permission with a warning disables the
// extension for its existing users, so this test changes only with the
// publisher's yes. externally_connectable (T14) is a manifest key and brings no warning.
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";
import { EXTENSION_ID } from "./manifest.config.js";
import { stripGoogleFonts } from "./build-plugins.js";

const here = path.dirname(fileURLToPath(import.meta.url));

// Chrome's ID for a key: the SHA-256 of the DER public key, first 32 hex
// digits, each mapped 0-f to a-p.
function idFromKey(key) {
  const hex = createHash("sha256").update(Buffer.from(key, "base64")).digest("hex").slice(0, 32);
  return [...hex].map((c) => String.fromCharCode(97 + parseInt(c, 16))).join("");
}

async function files(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true, recursive: true })) {
    if (entry.isFile()) out.push(path.join(entry.parentPath, entry.name));
  }
  return out;
}

async function buildTo(mode) {
  const outDir = await mkdtemp(path.join(tmpdir(), `aibytes-extension-${mode}-`));
  await build({ configFile: path.join(here, "vite.config.js"), mode, logLevel: "silent", build: { outDir } });
  return outDir;
}

test("stripGoogleFonts drops Ledger's @import and keeps the rest", () => {
  const css = `@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400&display=swap");\n@import './tokens/token.css';\nbody{color:red}`;
  assert.equal(stripGoogleFonts(css), `\n@import './tokens/token.css';\nbody{color:red}`);
});

test("the production build", async (t) => {
  const dist = await buildTo("production");
  t.after(() => rm(dist, { recursive: true, force: true }));
  const manifest = JSON.parse(await readFile(path.join(dist, "manifest.json"), "utf8"));
  const all = await files(dist);
  const rel = all.map((f) => path.relative(dist, f));

  await t.test("asks for storage only, with no host permissions", () => {
    assert.deepEqual(manifest.permissions, ["storage"]);
    assert.equal(manifest.host_permissions, undefined);
    assert.equal(manifest.optional_permissions, undefined);
  });

  await t.test("lets aibytes.io, and only aibytes.io, message the worker", () => {
    assert.deepEqual(manifest.externally_connectable, { matches: ["https://aibytes.io/*"] });
  });

  await t.test("carries the key that gives the store's ID", () => {
    assert.equal(idFromKey(manifest.key), EXTENSION_ID);
    assert.equal(EXTENSION_ID, "faamldnehjdjdobapchedpmldfjjfife");
  });

  await t.test("names files that are in the build", () => {
    assert.equal(manifest.manifest_version, 3);
    assert.equal(manifest.background.type, "module");
    for (const f of [manifest.background.service_worker, manifest.action.default_popup, ...Object.values(manifest.icons)]) {
      assert.ok(rel.includes(f), `${f} is in dist/`);
    }
    assert.equal(manifest.name, "aiBytes – AI News Feed for Developers");
  });

  await t.test("bundles its fonts and sends nothing to Google Fonts or localhost", async () => {
    assert.equal(rel.filter((f) => f.endsWith(".woff2")).length, 7);
    for (const f of all.filter((f) => /\.(css|js|html|json)$/.test(f))) {
      const text = await readFile(f, "utf8");
      assert.doesNotMatch(text, /fonts\.(googleapis|gstatic)\.com/, f);
      assert.doesNotMatch(text, /localhost/, f);
    }
  });

  await t.test("has no source maps", () => {
    assert.deepEqual(rel.filter((f) => f.endsWith(".map")), []);
  });
});

test("the dev build points at the dev server and keeps the same ID", async (t) => {
  const dist = await buildTo("development");
  t.after(() => rm(dist, { recursive: true, force: true }));
  const manifest = JSON.parse(await readFile(path.join(dist, "manifest.json"), "utf8"));
  assert.equal(idFromKey(manifest.key), EXTENSION_ID);
  assert.deepEqual(manifest.permissions, ["storage"]);
  assert.deepEqual(manifest.externally_connectable, { matches: ["https://aibytes.io/*", "http://localhost:5173/*"] });
  const js = (await files(dist)).filter((f) => f.endsWith(".js"));
  const text = (await Promise.all(js.map((f) => readFile(f, "utf8")))).join("\n");
  assert.match(text, /http:\/\/localhost:5173/);
});
