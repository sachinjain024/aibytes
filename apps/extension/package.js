// The store zip (spec AIB-76n, T12): `npm run package:extension` makes a
// production build in a temp folder, checks it, and zips it to
// apps/extension/builds/aibytes-extension-<version>.zip (git-ignored).
// It never touches dist/, which the dev profile loads unpacked: a production
// build there would quietly point that profile at aibytes.io.
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { build } from "vite";

const run = promisify(execFile);
const here = path.dirname(fileURLToPath(import.meta.url));

// Everything a store build may hold. Anything else (a source map, a stray
// dev file) stops the package.
const ALLOWED = [
  /^manifest\.json$/,
  /^popup\.html$/,
  /^background\.js$/,
  /^icons\/icon-\d+\.png$/,
  /^assets\/[\w.-]+\.(js|css|woff2)$/,
];

async function filesIn(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true, recursive: true })) {
    if (entry.isFile()) out.push(path.relative(dir, path.join(entry.parentPath, entry.name)).split(path.sep).join("/"));
  }
  return out.sort();
}

/** The problems that keep a built folder out of the store; [] when it may ship. */
export async function storeProblems(dir) {
  const problems = [];
  const files = await filesIn(dir);
  for (const f of files) {
    if (!ALLOWED.some((re) => re.test(f))) problems.push(`${f}: not a store file`);
    if (/\.(js|css|html|json)$/.test(f)) {
      const text = await readFile(path.join(dir, f), "utf8");
      if (/localhost|127\.0\.0\.1/.test(text)) problems.push(`${f}: names localhost`);
      if (/sourceMappingURL/.test(text)) problems.push(`${f}: points at a source map`);
    }
  }
  if (!files.includes("manifest.json")) problems.push("manifest.json: missing");
  return problems;
}

/** Builds, checks and zips. Returns the zip's path. */
export async function packageExtension({ outDir = path.join(here, "builds"), logLevel = "warn" } = {}) {
  const { version } = JSON.parse(await readFile(path.join(here, "package.json"), "utf8"));
  const buildDir = await mkdtemp(path.join(tmpdir(), "aibytes-extension-store-"));
  try {
    await build({ configFile: path.join(here, "vite.config.js"), mode: "production", logLevel, build: { outDir: buildDir } });
    const problems = await storeProblems(buildDir);
    if (problems.length) throw new Error(`Not packaged:\n  ${problems.join("\n  ")}`);
    await mkdir(outDir, { recursive: true });
    const zip = path.join(outDir, `aibytes-extension-${version}.zip`);
    await rm(zip, { force: true });
    // -X: no extra file attributes; manifest.json at the zip's root, as the store wants.
    await run("zip", ["-r", "-X", "-q", zip, "."], { cwd: buildDir });
    return zip;
  } finally {
    await rm(buildDir, { recursive: true, force: true });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  packageExtension({ logLevel: "info" }).then(
    (zip) => console.log(`Packaged ${path.relative(process.cwd(), zip)}`),
    (error) => { console.error(error.message); process.exitCode = 1; },
  );
}
