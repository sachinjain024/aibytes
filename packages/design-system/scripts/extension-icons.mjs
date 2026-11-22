// Draws the Chrome extension's icons (AIB-76n) from aibytes.io's favicon:
// assets/extension/icon-{16,32,48,128}.png, transparent outside the tile.
// Chrome's toolbar and the store take PNG, not SVG. The PNGs are committed;
// rerun this only if apps/web/public/favicon.svg changes:
//
//   node packages/design-system/scripts/extension-icons.mjs
//
// It drives headless Chrome over the DevTools protocol (Node's own WebSocket),
// so it adds no dependency. CHROME overrides the browser's path.
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SIZES = [16, 32, 48, 128];
const ROOT = new URL("../../../", import.meta.url);
const FAVICON = new URL("apps/web/public/favicon.svg", ROOT);
const OUT = new URL("../assets/extension/", import.meta.url);
const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9400 + Math.floor(Math.random() * 400);

const svg = await readFile(FAVICON, "utf8");
const profile = await mkdtemp(join(tmpdir(), "aibytes-icons-"));
const chrome = spawn(CHROME, [
  "--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "about:blank",
], { stdio: "ignore" });

try {
  const ws = await connect();
  let id = 0;
  const pending = new Map();
  ws.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
    }
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    pending.set(++id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });

  await send("Emulation.setDefaultBackgroundColorOverride", { color: { r: 0, g: 0, b: 0, a: 0 } });
  await mkdir(OUT, { recursive: true });
  for (const size of SIZES) {
    // The SVG at its exact pixel size in the top-left corner, nothing else on the page.
    const html = `<!doctype html><html><head><style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style></head><body>${svg}</body></html>`;
    await send("Page.navigate", { url: "data:text/html;base64," + Buffer.from(html).toString("base64") });
    await new Promise((r) => setTimeout(r, 300));
    const { data } = await send("Page.captureScreenshot", {
      format: "png", captureBeyondViewport: false,
      clip: { x: 0, y: 0, width: size, height: size, scale: 1 },
    });
    const file = new URL(`icon-${size}.png`, OUT);
    await writeFile(file, Buffer.from(data, "base64"));
    console.log(`wrote ${file.pathname.replace(ROOT.pathname, "")}`);
  }
  ws.close();
} finally {
  // Chrome keeps writing its profile until it exits, so wait before removing it.
  const exited = new Promise((resolve) => chrome.once("exit", resolve));
  chrome.kill();
  await exited;
  await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}

// Waits for Chrome's DevTools endpoint, then attaches to its first page.
async function connect() {
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      const pages = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = pages.find((p) => p.type === "page");
      if (page) {
        const ws = new WebSocket(page.webSocketDebuggerUrl);
        await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
        return ws;
      }
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`Chrome's DevTools endpoint did not come up on port ${PORT}`);
}
