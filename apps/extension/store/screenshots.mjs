// The Chrome Web Store screenshots (spec AIB-76n store-listing, "Screenshots"):
// five PNGs at exactly 1280×800, framing captures of the real UI. Every run
// writes a new version under store/assets/ and never deletes or overwrites an
// earlier one (the proj-generate-chrome-store-screenshots skill drives it):
//
//   node apps/extension/store/screenshots.mjs raw                 # → assets/vN/raw/*.png, N = next version
//   node apps/extension/store/screenshots.mjs frame               # assets/vN/raw → assets/vN/claude/screenshot-*.png
//   node apps/extension/store/screenshots.mjs frame --tool grok   # frames with assets/vN/grok/frame.html
//
// raw: Vite builds store/stage.html (the real popup on the fixed edition in
// fixture.js), a local server serves it with content/, and headless Chrome
// captures each RAW entry at 2x, with a .json of where each source's row sits. frame: a frame template (store/frame.html for Claude; each
// other tool's own frame.html) is filled in per shot and captured at
// 1280×800. A frame never draws UI: the UI is always a raw capture.
//
// It drives headless Chrome over the DevTools protocol (Node's own WebSocket),
// as packages/design-system/scripts/extension-icons.mjs does, so it adds no
// dependency. CHROME overrides the browser's path.
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { FIXTURE_DATE } from "./fixture.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "../../..");
const CONTENT = path.join(ROOT, "content");
const STAGE = path.join(here, ".stage");
export const ASSETS = path.join(here, "assets");
export const TOOLS = ["claude", "chatgpt", "grok", "gemini"];
const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
export const WIDTH = 1280;
export const HEIGHT = 800;
const SCALE = 2;

/** The raw captures, each the real popup: the stage with these query params.
 * Each also gets a .json of where every source's first row sits. */
export const RAW = [
  { name: "1-today", query: { shot: "list" } },
  { name: "2-github-list", query: { shot: "list", source: "github" } },
  { name: "3-github-gist", query: { shot: "gist", source: "github" } },
  { name: "4-mixed", query: { shot: "list", source: "hackernews,techcrunch,producthunt" } },
];

/** The five screenshots, in the listing's order (the AIB-76n ticket's
 * "Chrome Store Screenshots" comment): which captures each frames, and its
 * words. S5 frames no capture: it is art only. */
export const SHOTS = [
  { n: 1, name: "feed", layout: "sources", theme: "light", raw: ["1-today"],
    title: "Your daily AI feed, from the best sources", accent: "the best sources",
    subtitle: "AI news, trending GitHub repos, Hacker News threads and Product Hunt launches, ranked into one feed every morning." },
  { n: 2, name: "github", layout: "single", theme: "light", raw: ["2-github-list"],
    title: "Trending GitHub repos, every day", accent: "GitHub repos",
    subtitle: "The fastest-rising AI repos, ranked by the stars they gained." },
  { n: 3, name: "gist", layout: "single", theme: "light", raw: ["3-github-gist"],
    title: "Get the gist of any repo", accent: "the gist",
    subtitle: "What it does, its stats and why it matters, without leaving your tab." },
  { n: 4, name: "sources", layout: "annotated", theme: "light", raw: ["4-mixed"],
    title: "Threads, news and launches in one list", accent: "one list",
    subtitle: "Hacker News threads, AI news and Product Hunt launches, ranked together." },
  { n: 5, name: "everywhere", layout: "art", theme: "light", raw: [],
    title: "Stay current with AI, three ways", accent: "three ways",
    subtitle: "The daily feed on aibytes.io, this extension, and the weekly aiBytes_ newsletter." },
];

const FONT_FILES = {
  inter: path.join(ROOT, "node_modules/@fontsource/inter/files"),
  bricolage: path.join(ROOT, "node_modules/@fontsource/bricolage-grotesque/files"),
};
// The faces a frame may use, served locally: no request leaves for fonts.
const FONT_FACES = [
  ...[400, 500, 600, 700].map((w) => `@font-face{font-family:'Inter';font-weight:${w};src:url(/fonts/inter/inter-latin-${w}-normal.woff2) format('woff2')}`),
  ...[500, 700, 800].map((w) => `@font-face{font-family:'Bricolage Grotesque';font-weight:${w};src:url(/fonts/bricolage/bricolage-grotesque-latin-${w}-normal.woff2) format('woff2')}`),
].join("\n");

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Fills a frame template's placeholders for one shot. `images` are the
 * shot's captures in order, each { src, width, height, rows } in CSS px;
 * `rows` (from the capture's .json) becomes --row-<source>-x/y/w/h on :root. */
export function fillFrame(template, shot, images) {
  const title = escapeHtml(shot.title);
  const accent = shot.accent ? escapeHtml(shot.accent) : "";
  const rows = Object.entries(images[0]?.rows ?? {}).map(([name, r]) =>
    ["x", "y", "w", "h"].map((k, i) => `--row-${slug(name)}-${k}:${[r.x, r.y, r.width, r.height][i]}px`).join(";")).join(";");
  const values = {
    TITLE: title, CAPTION: title, SUBTITLE: escapeHtml(shot.subtitle), THEME: shot.theme, N: String(shot.n), LAYOUT: shot.layout, ICON: "/icon.png",
    TITLE_HTML: accent && title.includes(accent) ? title.replace(accent, `<em>${accent}</em>`) : title,
    ROWS_CSS: rows,
  };
  [1, 2, 3].forEach((i) => {
    const image = images[i - 1];
    values[`SHOT${i}`] = image?.src ?? "";
    values[`SHOT${i}_W`] = String(image?.width ?? 0);
    values[`SHOT${i}_H`] = String(image?.height ?? 0);
  });
  const filled = template.replace(/\{\{([A-Z0-9_]+)\}\}/g, (match, key) => values[key] ?? match);
  const fonts = `<style>${FONT_FACES}${rows ? `:root{${rows}}` : ""}</style>`;
  return /<head[^>]*>/i.test(filled) ? filled.replace(/<head[^>]*>/i, (m) => m + fonts) : fonts + filled;
}

/** A PNG's width and height, from its IHDR chunk. */
export function pngSize(buffer) {
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

/** The version numbers under assets/ (v1, v2, ...), ascending. */
export async function versions(assets = ASSETS) {
  const names = await readdir(assets).catch(() => []);
  return names.map((n) => /^v(\d+)$/.exec(n)?.[1]).filter(Boolean).map(Number).sort((a, b) => a - b);
}

const pngsIn = async (dir) => (await readdir(dir).catch(() => [])).filter((n) => n.endsWith(".png"));

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: { version: { type: "string" }, tool: { type: "string" }, frame: { type: "string" }, replace: { type: "boolean" } },
  });
  const mode = positionals[0];
  if (mode !== "raw" && mode !== "frame") throw new Error("usage: screenshots.mjs raw|frame [--version N] [--tool claude|chatgpt|grok|gemini] [--frame f.html] [--replace]");
  const known = await versions();
  const version = values.version ? Number(values.version) : mode === "raw" ? (known.at(-1) ?? 0) + 1 : await latestWithRaw(known);
  if (!Number.isInteger(version) || version < 1) throw new Error(`no version to use: ${values.version ?? "none has a raw/ folder"}`);
  const dir = path.join(ASSETS, `v${version}`);
  const rawDir = path.join(dir, "raw");

  if (mode === "raw") {
    // A new version every time: an earlier version's captures are never touched.
    if ((await pngsIn(rawDir)).length) throw new Error(`v${version}/raw already has captures; run raw without --version for a new version`);
    for (const tool of TOOLS) await mkdir(path.join(dir, tool), { recursive: true });
    for (const tool of TOOLS.slice(1)) await writeFile(path.join(dir, tool, ".gitkeep"), "");
    await mkdir(rawDir, { recursive: true });
    await captureRaw(rawDir);
    console.log(`v${version}: raw captures in ${path.relative(ROOT, rawDir)}`);
    return;
  }

  const tool = values.tool ?? "claude";
  if (!TOOLS.includes(tool)) throw new Error(`--tool must be one of ${TOOLS.join(", ")}`);
  const outDir = path.join(dir, tool);
  const framePath = path.resolve(values.frame ?? (tool === "claude" ? path.join(here, "frame.html") : path.join(outDir, "frame.html")));
  const existing = (await pngsIn(outDir)).filter((n) => n.startsWith("screenshot-"));
  if (existing.length && !values.replace) throw new Error(`v${version}/${tool} already has screenshots; pass --replace to redo this version's ${tool} set, or capture a new version`);
  await mkdir(outDir, { recursive: true });
  await frameShots(rawDir, outDir, await readFile(framePath, "utf8"));
}

async function latestWithRaw(known) {
  for (const v of [...known].reverse()) if ((await pngsIn(path.join(ASSETS, `v${v}`, "raw"))).length) return v;
  return 0;
}

// Static files from `root`, with a directory's index.html; never outside it.
async function serveFile(res, root, pathname) {
  let file = path.join(root, decodeURIComponent(pathname));
  if (!path.resolve(file).startsWith(root)) return send(res, 403, "text/plain", "no");
  if ((await stat(file).catch(() => null))?.isDirectory()) file = path.join(file, "index.html");
  send(res, 200, TYPES[path.extname(file)] ?? "application/octet-stream", await readFile(file));
}

async function withBrowser(handler, fn) {
  const server = createServer(async (req, res) => {
    try {
      await handler(req, res, new URL(req.url, "http://x"));
    } catch {
      send(res, 404, "text/plain", "not found");
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const port = 9400 + Math.floor(Math.random() * 400);
  const profile = await mkdtemp(path.join(tmpdir(), "aibytes-shots-"));
  const chrome = spawn(CHROME, [
    "--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
    "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--force-color-profile=srgb", "about:blank",
  ], { stdio: "ignore" });
  try {
    const cdp = await connect(port);
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await fn(cdp, origin);
    cdp.close();
  } finally {
    server.close();
    const exited = new Promise((resolve) => chrome.once("exit", resolve));
    chrome.kill();
    await exited;
    await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
}

async function captureRaw(rawDir) {
  const { build } = await import("vite");
  const { default: react } = await import("@vitejs/plugin-react");
  const { bundledFonts } = await import("../build-plugins.js");
  await build({
    configFile: false, root: here, base: "./", logLevel: "warn",
    plugins: [bundledFonts(), react()],
    build: { outDir: STAGE, emptyOutDir: true, rollupOptions: { input: path.join(here, "stage.html") } },
  });

  await withBrowser(async (req, res, url) => {
    if (url.pathname === "/content/index.json") {
      // Pinned to the fixture: the popup's "today" is FIXTURE_DATE.
      const index = JSON.parse(await readFile(path.join(CONTENT, "index.json"), "utf8"));
      index.editions = index.editions.filter((e) => e.date <= FIXTURE_DATE);
      return send(res, 200, "application/json", JSON.stringify(index));
    }
    if (url.pathname.startsWith("/content/")) return serveFile(res, CONTENT, url.pathname.slice(8));
    return serveFile(res, STAGE, url.pathname);
  }, async (cdp, origin) => {
    for (const raw of RAW) {
      const theme = raw.query.theme ?? "light";
      await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: theme }] });
      // The popup's own window size (550×580, plus the stage's 1px border), so
      // the same media queries apply as in Chrome's popup.
      await cdp.send("Emulation.setDeviceMetricsOverride", { width: 552, height: 582, deviceScaleFactor: SCALE, mobile: false });
      await cdp.send("Page.navigate", { url: `${origin}/stage.html?${new URLSearchParams({ theme, ...raw.query })}` });
      await waitFor(cdp, "document.documentElement.dataset.ready === 'true' || document.documentElement.dataset.error", `${raw.name} to render`);
      const error = await evaluate(cdp, "document.documentElement.dataset.error || ''");
      if (error) throw new Error(`${raw.name}: ${error}`);
      const clip = await evaluate(cdp, "(() => { const r = document.getElementById('stage').getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; })()");
      const { data } = await cdp.send("Page.captureScreenshot", { format: "png", clip: { ...clip, scale: 1 } });
      const out = path.join(rawDir, `${raw.name}.png`);
      await writeFile(out, Buffer.from(data, "base64"));
      await writeFile(path.join(rawDir, `${raw.name}.json`), JSON.stringify({ width: clip.width, height: clip.height, rows: await evaluate(cdp, "window.__rows") }, null, 2) + "\n");
      console.log(`wrote ${path.relative(ROOT, out)} (${clip.width}×${clip.height} at ${SCALE}x)`);
    }
  });
}

async function frameShots(rawDir, outDir, template) {
  const frames = new Map();
  await withBrowser(async (req, res, url) => {
    if (url.pathname.startsWith("/frame/")) return send(res, 200, "text/html", frames.get(url.pathname.slice(7)) ?? "");
    if (url.pathname.startsWith("/fonts/")) {
      const [, , family, name] = url.pathname.split("/");
      return send(res, 200, "font/woff2", await readFile(path.join(FONT_FILES[family] ?? "/nonexistent", path.basename(name))));
    }
    if (url.pathname.startsWith("/marks/")) return send(res, 200, "image/svg+xml", await readFile(path.join(ROOT, "packages/design-system/assets/marks", path.basename(url.pathname))));
    if (url.pathname === "/icon.png") return send(res, 200, "image/png", await readFile(path.join(ROOT, "packages/design-system/assets/extension/icon-128.png")));
    if (url.pathname.startsWith("/raw/")) return send(res, 200, "image/png", await readFile(path.join(rawDir, path.basename(url.pathname))));
    send(res, 404, "text/plain", "not found");
  }, async (cdp, origin) => {
    for (const shot of SHOTS) {
      const images = [];
      for (const name of shot.raw) {
        const size = pngSize(await readFile(path.join(rawDir, `${name}.png`)));
        const rows = JSON.parse(await readFile(path.join(rawDir, `${name}.json`), "utf8").catch(() => "{}")).rows ?? {};
        images.push({ src: `/raw/${name}.png`, width: size.width / SCALE, height: size.height / SCALE, rows });
      }
      frames.set(String(shot.n), fillFrame(template, shot, images));
      await cdp.send("Emulation.setDeviceMetricsOverride", { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: false });
      await cdp.send("Page.navigate", { url: `${origin}/frame/${shot.n}` });
      await waitFor(cdp, "document.readyState === 'complete'", `frame ${shot.n} to load`);
      await evaluate(cdp, "document.fonts.ready.then(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {})))).then(() => true)");
      const { data } = await cdp.send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT, scale: 1 } });
      const png = Buffer.from(data, "base64");
      const { width, height } = pngSize(png);
      if (width !== WIDTH || height !== HEIGHT) throw new Error(`shot ${shot.n} is ${width}×${height}, not ${WIDTH}×${HEIGHT}`);
      const out = path.join(outDir, `screenshot-${shot.n}-${shot.name}.png`);
      await writeFile(out, png);
      console.log(`wrote ${path.relative(ROOT, out)} (${width}×${height})`);
    }
  });
}

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".webp": "image/webp", ".jpg": "image/jpeg" };
function send(res, status, type, body) {
  res.writeHead(status, { "content-type": type });
  res.end(body);
}

async function evaluate(cdp, expression) {
  const { result, exceptionDetails } = await cdp.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text);
  return result.value;
}

async function waitFor(cdp, expression, what, ms = 20000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    try {
      if (await evaluate(cdp, expression)) return;
    } catch {
      // The page is between documents; ask again.
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  const seen = await evaluate(cdp, "JSON.stringify({ href: location.href, data: { ...document.documentElement.dataset }, text: document.body?.innerText.slice(0, 400), stories: document.querySelectorAll('.story').length })").catch((e) => e.message);
  throw new Error(`timed out waiting for ${what}; the page: ${seen}`);
}

// Waits for Chrome's DevTools endpoint, then attaches to its first page.
async function connect(port) {
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const page = pages.find((p) => p.type === "page");
      if (page) {
        const ws = new WebSocket(page.webSocketDebuggerUrl);
        await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
        let id = 0;
        const pending = new Map();
        ws.addEventListener("message", (event) => {
          const msg = JSON.parse(event.data);
          // The page's own errors, so a stage that never renders says why.
          if (msg.method === "Runtime.exceptionThrown") console.error("page:", msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text);
          if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") console.error("page:", msg.params.args.map((a) => a.value ?? a.description).join(" "));
          if (msg.id && pending.has(msg.id)) {
            const { resolve, reject } = pending.get(msg.id);
            pending.delete(msg.id);
            msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
          }
        });
        return {
          send: (method, params = {}) => new Promise((resolve, reject) => {
            pending.set(++id, { resolve, reject });
            ws.send(JSON.stringify({ id, method, params }));
          }),
          close: () => ws.close(),
        };
      }
    } catch {
      // Not up yet.
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error("headless Chrome did not start");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
