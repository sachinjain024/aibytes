// The store's promo images (spec AIB-76n store-listing, "The promo images"):
// the small promo tile (440×280) and the marquee (1400×560). Candidates from
// every tool go in store/candidates/ (git-ignored) as <tool>-<tile|marquee>-<n>
// .png, or .html for a tool that answers in HTML; only the two picks are
// committed.
//
//   node apps/extension/store/promo.mjs render             # candidates/*.html → .png at the exact size
//   node apps/extension/store/promo.mjs review             # candidates/review.html: every PNG, numbered T1…/M1…
//   node apps/extension/store/promo.mjs finish --tile candidates/claude-tile-1.png --marquee candidates/grok-marquee-2.png
//   node apps/extension/store/promo.mjs icon               # store-icon.html → assets/store-icon/vN/ (128×128, transparent margin)
//
// render: each HTML candidate is captured in headless Chrome with the faces
// the screenshots use (Bricolage Grotesque, Inter) and the extension icon at
// /icon.png (and its vector source at /icon.svg, sharp at any size), and
// the source marks at /marks/<name>.svg. No popup capture is offered: the real UI carries third-party
// names and logos, which promo images must not show. finish: each
// pick is drawn to cover its exact size, opaque (the store refuses alpha), and
// written as a new version, assets/promo-tile/vN/promo-tile.png and
// assets/marquee/vN/marquee.png, with the pick's HTML source beside it when it
// has one. An earlier version, one already uploaded, is never touched. No
// dependency is added.
import { copyFile, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { ASSETS, FONT_FACES, FONT_FILES, ROOT, TOOLS, evaluate, pngSize, send, versions, waitFor, withBrowser } from "./screenshots.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
export const CANDIDATES = path.join(here, "candidates");

export const PROMO = {
  tile: { width: 440, height: 280, dir: "promo-tile", file: "promo-tile.png" },
  marquee: { width: 1400, height: 560, dir: "marquee", file: "marquee.png" },
  // The store icon keeps its transparent margin (the guidelines ask for one).
  icon: { width: 128, height: 128, dir: "store-icon", file: "store-icon.png", alpha: true },
};

/** Where a finished pick goes: the version after the highest under assets/<dir>/. */
export async function nextPromoDir(kind, assets = ASSETS) {
  const base = path.join(assets, PROMO[kind].dir);
  const known = await versions(base);
  return path.join(base, `v${(known.at(-1) ?? 0) + 1}`);
}

/** A candidate's file name, read: { tool, kind, n, ext }, or null if it is not one. */
export function candidate(name) {
  const m = /^([a-z]+)-(tile|marquee)-(\d+)\.(png|html)$/.exec(name);
  if (!m || !TOOLS.includes(m[1])) return null;
  return { tool: m[1], kind: m[2], n: Number(m[3]), ext: m[4] };
}

/** A PNG's colour type from its IHDR chunk: 2 is RGB, 6 is RGB with alpha. */
export function pngColourType(buffer) {
  return buffer[25];
}

async function capture(cdp, origin, page, { width, height, alpha = false }) {
  await cdp.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
  await cdp.send("Emulation.setDefaultBackgroundColorOverride", alpha ? { color: { r: 0, g: 0, b: 0, a: 0 } } : {});
  await cdp.send("Page.navigate", { url: `${origin}${page}` });
  await waitFor(cdp, "document.readyState === 'complete'", `${page} to load`);
  await evaluate(cdp, "document.fonts.ready.then(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {})))).then(() => true)");
  const { data } = await cdp.send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width, height, scale: 1 } });
  const png = Buffer.from(data, "base64");
  const size = pngSize(png);
  if (size.width !== width || size.height !== height) throw new Error(`${page} is ${size.width}×${size.height}, not ${width}×${height}`);
  if (!alpha && pngColourType(png) !== 2) throw new Error(`${page} has an alpha channel; the store wants an opaque PNG`);
  if (alpha && pngColourType(png) !== 6) throw new Error(`${page} has no alpha channel; the icon's margin must be transparent`);
  return png;
}

// The store icon: store/store-icon.html, captured on a transparent ground and
// written as the next version, assets/store-icon/vN/, with its HTML source.
async function icon() {
  const source = path.join(here, "store-icon.html");
  const pages = new Map([["/icon", await readFile(source, "utf8")]]);
  await withBrowser((req, res, url) => serve(req, res, url, { pages, files: new Map() }), async (cdp, origin) => {
    const png = await capture(cdp, origin, "/icon", PROMO.icon);
    const dir = await nextPromoDir("icon");
    await mkdir(dir, { recursive: true });
    const out = path.join(dir, PROMO.icon.file);
    await writeFile(out, png);
    await copyFile(source, path.join(dir, "store-icon.html"));
    console.log(`wrote ${path.relative(ROOT, out)} (128×128, transparent margin)`);
  });
}

const fonts = `<style>${FONT_FACES}</style>`;
const withFonts = (html) => (/<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (m) => m + fonts) : fonts + html);

async function serve(req, res, url, { pages, files }) {
  if (pages.has(url.pathname)) return send(res, 200, "text/html", pages.get(url.pathname));
  if (files.has(url.pathname)) return send(res, 200, "image/png", await readFile(files.get(url.pathname)));
  if (url.pathname.startsWith("/fonts/")) {
    const [, , family, name] = url.pathname.split("/");
    return send(res, 200, "font/woff2", await readFile(path.join(FONT_FILES[family] ?? "/nonexistent", path.basename(name))));
  }
  if (url.pathname.startsWith("/marks/")) return send(res, 200, "image/svg+xml", await readFile(path.join(ROOT, "packages/design-system/assets/marks", path.basename(url.pathname))));
  if (url.pathname === "/icon.svg") return send(res, 200, "image/svg+xml", await readFile(path.join(ROOT, "apps/web/public/favicon.svg")));
  if (url.pathname === "/icon.png") return send(res, 200, "image/png", await readFile(path.join(ROOT, "packages/design-system/assets/extension/icon-128.png")));
  send(res, 404, "text/plain", "not found");
}

async function render() {
  const names = (await readdir(CANDIDATES).catch(() => [])).filter((n) => candidate(n)?.ext === "html");
  if (!names.length) throw new Error(`no <tool>-<tile|marquee>-<n>.html in ${path.relative(ROOT, CANDIDATES)}`);
  const pages = new Map();
  for (const name of names) pages.set(`/c/${name}`, withFonts(await readFile(path.join(CANDIDATES, name), "utf8")));
  await withBrowser((req, res, url) => serve(req, res, url, { pages, files: new Map() }), async (cdp, origin) => {
    for (const name of names) {
      const png = await capture(cdp, origin, `/c/${name}`, PROMO[candidate(name).kind]);
      const out = path.join(CANDIDATES, name.replace(/\.html$/, ".png"));
      await writeFile(out, png);
      console.log(`wrote ${path.relative(ROOT, out)}`);
    }
  });
}

async function finish(picks) {
  const pages = new Map();
  const files = new Map();
  for (const [kind, file] of Object.entries(picks)) {
    const { width, height } = PROMO[kind];
    files.set(`/pick/${kind}.png`, path.resolve(file));
    pages.set(`/finish/${kind}`, `<!doctype html><style>html,body{margin:0;width:${width}px;height:${height}px;overflow:hidden;background:#fff}img{display:block;width:100%;height:100%;object-fit:cover}</style><img src="/pick/${kind}.png" alt="">`);
  }
  await withBrowser((req, res, url) => serve(req, res, url, { pages, files }), async (cdp, origin) => {
    for (const kind of Object.keys(picks)) {
      const png = await capture(cdp, origin, `/finish/${kind}`, PROMO[kind]);
      const dir = await nextPromoDir(kind);
      await mkdir(dir, { recursive: true });
      const out = path.join(dir, PROMO[kind].file);
      await writeFile(out, png);
      const source = path.resolve(picks[kind]).replace(/\.png$/, ".html");
      if (source.endsWith(".html") && (await stat(source).catch(() => null))) await copyFile(source, path.join(dir, path.basename(source)));
      console.log(`wrote ${path.relative(ROOT, out)} (${PROMO[kind].width}×${PROMO[kind].height}, from ${path.relative(ROOT, path.resolve(picks[kind]))})`);
    }
  });
}

/** The shortlist's numbering: the PNG candidates grouped by tool (in TOOLS
 * order), numbered T1… for tiles and M1… for marquees. */
export function numbered(names) {
  const pngs = names.map((name) => ({ name, ...candidate(name) })).filter((c) => c.ext === "png");
  const order = (c) => [TOOLS.indexOf(c.tool), c.n];
  const out = [];
  for (const kind of ["tile", "marquee"]) {
    pngs.filter((c) => c.kind === kind)
      .sort((a, b) => { const [x, y] = [order(a), order(b)]; return x[0] - y[0] || x[1] - y[1]; })
      .forEach((c, i) => out.push({ ...c, label: `${kind === "tile" ? "T" : "M"}${i + 1}` }));
  }
  return out;
}

const TOOL_NAMES = { claude: "Claude", chatgpt: "ChatGPT", grok: "Grok", gemini: "Gemini" };

// The review page: every candidate at real size, numbered, by tool, on a light
// and a dark surround (the store shows both). Written as candidates/review.html.
async function review() {
  const items = numbered(await readdir(CANDIDATES).catch(() => []));
  if (!items.length) throw new Error("no PNG candidates to review; run render first");
  const tools = [...new Set(items.map((c) => c.tool))];
  const section = async (kind, heading, note) => {
    const parts = [];
    for (const tool of tools) {
      const mine = items.filter((c) => c.kind === kind && c.tool === tool);
      if (!mine.length) continue;
      const cards = [];
      for (const c of mine) {
        const src = `data:image/png;base64,${(await readFile(path.join(CANDIDATES, c.name))).toString("base64")}`;
        const { width, height } = PROMO[kind];
        const img = `<img src="${src}" width="${width}" height="${height}" alt="${c.label}, ${TOOL_NAMES[c.tool]} ${kind} ${c.n}">`;
        cards.push(`<figure class="cand"><figcaption><span class="num">${c.label}</span><span class="file">${c.name}</span></figcaption><div class="shows ${kind}"><div class="surround light">${img}</div><div class="surround dark">${img}</div></div></figure>`);
      }
      parts.push(`<div class="tool"><h3>${TOOL_NAMES[tool]}</h3>${cards.join("")}</div>`);
    }
    return `<section><h2>${heading}</h2><p class="note">${note}</p>${parts.join("")}</section>`;
  };
  const html = `<title>aiBytes_ Promo Shortlist</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Inter:wght@400;600;700&display=swap">
<style>
/* Layout: one column; each candidate at its real size on a light and a dark surround, scrolling sideways when wider than the screen. */
:root{--bg:#f6f5f2;--panel:#ffffff;--ink:#1a1a2e;--ink-2:#5a5a6e;--rule:#e2dfd8;--accent:#e06a00;--light:#ffffff;--dark:#202124;
  --display:'Bricolage Grotesque',system-ui,sans-serif;--body:Inter,system-ui,sans-serif;--mono:ui-monospace,'SF Mono',Menlo,monospace}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#15151f;--panel:#1d1d29;--ink:#ecebf2;--ink-2:#a3a2b4;--rule:#2e2e3d;--accent:#ff8a1f;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#15151f;--panel:#1d1d29;--ink:#ecebf2;--ink-2:#a3a2b4;--rule:#2e2e3d;--accent:#ff8a1f;color-scheme:dark}
body{background:var(--bg);color:var(--ink);font:15px/1.55 var(--body);padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
main{max-width:1480px;margin:0 auto;padding-block:40px 64px;display:flex;flex-direction:column;gap:48px}
header{display:flex;flex-direction:column;gap:8px;max-width:68ch}
h1{margin:0;font:800 36px/1.1 var(--display);letter-spacing:-.02em;text-wrap:balance}
h2{margin:0;font:800 26px/1.2 var(--display);letter-spacing:-.01em}
h3{margin:0;font:700 13px/1 var(--body);text-transform:uppercase;letter-spacing:.08em;color:var(--ink-2)}
p{margin:0}.note,header p{color:var(--ink-2)}
section{display:flex;flex-direction:column;gap:20px}
.tool{display:flex;flex-direction:column;gap:20px;padding-top:16px;border-top:1px solid var(--rule)}
.cand{margin:0;display:flex;flex-direction:column;gap:10px}
figcaption{display:flex;align-items:baseline;gap:12px}
.num{font:800 22px/1 var(--display);color:var(--accent);font-variant-numeric:tabular-nums}
.file{font:13px var(--mono);color:var(--ink-2)}
.shows{display:flex;flex-wrap:wrap;gap:16px}
.shows.marquee{flex-direction:column}
.surround{padding:20px;border-radius:10px;border:1px solid var(--rule);overflow-x:auto;max-width:100%}
.surround.light{background:var(--light)}.surround.dark{background:var(--dark)}
.surround img{display:block;max-width:none}
</style>
<main>
<header><h1>Promo tile and marquee</h1><p>The Chrome Web Store's two promo images for aiBytes_ (AIB-76n T22). Every candidate is shown at its real size, on the store's light and dark surrounds. Pick one tile (T) and one marquee (M) by number.</p></header>
${await section("tile", "Small promo tile, 440 × 280", "Shown in search results and category lists, at this size.")}
${await section("marquee", "Marquee, 1400 × 560", "Shown only if the store features the extension. Scroll sideways on a narrow screen to see it whole.")}
</main>`;
  const out = path.join(CANDIDATES, "review.html");
  await writeFile(out, html);
  console.log(`wrote ${path.relative(ROOT, out)} (${items.length} candidates)`);
}

async function main() {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: { tile: { type: "string" }, marquee: { type: "string" } } });
  if (positionals[0] === "render") return render();
  if (positionals[0] === "review") return review();
  if (positionals[0] === "icon") return icon();
  if (positionals[0] === "finish" && (values.tile || values.marquee)) {
    const picks = {};
    if (values.tile) picks.tile = values.tile;
    if (values.marquee) picks.marquee = values.marquee;
    return finish(picks);
  }
  throw new Error("usage: promo.mjs render | review | icon | finish --tile <png> --marquee <png>");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
