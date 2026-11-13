// Build Ledger as the files of a Design System Artifact in Claude
// ("aiBytes_ App Design System"), the home of what used to be the Claude
// Design project. Everything comes from the package as it is: the bundle is
// compiled from components/, tokens.json is read from tokens/token.css, the
// stylesheet is styles.css without the values tokens.json now holds.
//
//   node packages/design-system/artifact/build.mjs --out <dir> [--ref <sha>]
//
// writes <dir>/project/<path> for every file the Artifact holds. Publishing
// them is a separate step (see .design-sync/NOTES.md); this never touches the
// network, and never writes inside the repo unless --out points there.
import { build, transform } from "esbuild";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { BASE_CSS, PRELUDE, PREVIEWS } from "./previews.mjs";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const HERE = join(ROOT, "artifact");
const NAMESPACE = "LedgerAiBytesDesignSystem_b1be4f";
const TITLE = "aiBytes_ App Design System";
const GROUPS = ["brand", "content", "forms", "navigation"];
// Exports that are helpers, not components: no card.
const NOT_COMPONENTS = new Set(["SOURCE_NAMES", "fmtNum", "bubble", "sizedImageUrl", "FeedItem", "Icon", "REACTIONS"]);

// ---------------------------------------------------------------- bundle

async function entry() {
  const lists = await Promise.all(GROUPS.map(async (group) =>
    (await readdir(join(ROOT, "components", group)))
      .filter((f) => /^[A-Z].*\.jsx$/.test(f))
      .map((f) => `export * from "./components/${group}/${f}";`)));
  return lists.flat().join("\n");
}

const globalReact = { name: "global-react", setup(b) {
  b.onResolve({ filter: /^react$/ }, () => ({ path: "react", namespace: "global" }));
  b.onLoad({ filter: /.*/, namespace: "global" }, () => ({ contents: "module.exports = window.React", loader: "js" }));
} };

/** The components the bundle exports, in source order. */
export async function componentNames() {
  const result = await build({
    stdin: { contents: await entry(), resolveDir: ROOT, loader: "js" },
    bundle: true, format: "esm", write: false, metafile: true, jsx: "transform",
    loader: { ".jsx": "jsx", ".js": "jsx" }, plugins: [globalReact],
  });
  const exports = Object.values(result.metafile.outputs)[0].exports;
  // In preview order, which groups them: brand, content, forms, navigation.
  const order = Object.keys(PREVIEWS);
  const rank = (name) => (order.includes(name) ? order.indexOf(name) : order.length);
  return exports.filter((name) => /^[A-Z]/.test(name) && !NOT_COMPONENTS.has(name)).sort((x, y) => rank(x) - rank(y));
}

/** One classic script assigning window.<namespace>, headed by the @ds-bundle line. */
export async function bundleJs(names) {
  const result = await build({
    stdin: { contents: await entry(), resolveDir: ROOT, loader: "js" },
    bundle: true, format: "iife", globalName: "__ledger", write: false, jsx: "transform", minify: true,
    define: { "process.env.NODE_ENV": '"production"' },
    loader: { ".jsx": "jsx", ".js": "jsx" },
    footer: { js: `window.${NAMESPACE} = __ledger;` },
    plugins: [globalReact],
  });
  const header = { format: 4, namespace: NAMESPACE, components: names.map((name) => ({ name })) };
  const js = `/* @ds-bundle: ${JSON.stringify(header)} */\n${result.outputFiles[0].text}`;
  return js.replace(/<\/script/gi, "<\\/script").replace(/<!--/g, "\\x3C!--");
}

// ---------------------------------------------------------------- tokens

/** The declarations of each top-level rule in token.css, by selector. */
function rules(css) {
  const out = new Map();
  const text = css.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const [, selector, body] of text.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const decls = new Map();
    for (const [, name, value] of body.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) decls.set(name, value.trim());
    out.set(selector.trim().replace(/\s+/g, ""), decls);
  }
  return out;
}

const hex = (v) => /^#[0-9a-f]+$/i.test(v) ? v.toLowerCase() : v;
const alias = (v) => { const m = /^var\(--([\w-]+)\)$/.exec(v); return m ? `{${m[1]}}` : null; };

// Where each token is used. Values come from token.css; only these words are ours.
const USAGE = {
  paper: "The page ground: `bg` resolves to it.", surface: "Raised fills: cards' popovers, menus, inputs.",
  ink: "Body text on `paper` and `surface`; `text` resolves to it.", muted: "Secondary text (summaries, meta, labels) on `paper` and `surface`; `text-2` resolves to it.",
  line: "The 1px hairline between rows and around cards; `border` resolves to it.", blue: "Links in running text and the focus ring (`link`, `focus-ring`). Near-white in dark, so links read as text with an underline.",
  accent: "Filled actions (primary Button); text on it is `accent-fg`. Neutral grey in dark.", "accent-hover": "Hover on `accent` fills.", "accent-active": "Pressed `accent` fills.",
  "accent-fg": "Text and icons on `accent` fills.", soft: "Tints: selected rows, chip washes, the active category; `surface-2` and `accent-tint` resolve to it.",
  hover: "Row and control hover wash.", shadow: "The one soft shadow colour, for popovers and the selected Sidebar category only.",
  "control-border": "Borders of inputs, checkboxes and segmented controls (3:1 on `paper`).", hot: "\"Top today\" left edge and the HN tile only.",
  "hot-tint": "Ground behind `hot` accents.", "hot-text": "The TOP label: the AA-safe text shade of `hot`.", save: "The filled save star only.",
  disabled: "Disabled text and controls.", bg: "Alias of `paper`: the page ground.", text: "Alias of `ink`.", "text-2": "Alias of `muted`.",
  border: "Alias of `line`.", "surface-2": "Alias of `soft`.", link: "Alias of `blue`: in-sentence links (1px underline, 2px on hover).",
  "focus-ring": "Alias of `blue`: the 2px focus ring, 2px offset.", "accent-tint": "Alias of `soft`.",
  "lang-other": "Repo language dot for any language without its own hue; alias of `text-2`.",
  "card-pad": "Padding inside a Card.", "grid-gap": "Gap between Cards in CardGrid.", "section-gap": "Gap between grouped sections (0: headings carry the space).",
  "border-w": "Every border.", "focus-w": "Focus ring width.", "focus-offset": "Focus ring offset.", "content-max": "Maximum reading column.",
  "gutter-mobile": "Side gutters on phones.", "img-slot": "The card image slot.", "img-slot-list": "The list-row image slot.",
  "redesign-rail": "Desktop Sidebar rail width.", "redesign-header": "AppHeader height; the Toolbar sticks under it.",
  "radius-card": "Cards and panels.", "radius-chip": "Chips, pills, menus, buttons.", "radius-img": "Item images.",
  "tracking-heading": "Bricolage headings.", "tracking-body": "Inter body and UI.", "tracking-mono": "Small numeric labels.",
  transition: "Every colour, border and transform change. Drop the lift under prefers-reduced-motion.", lift: "Card hover: 1px up.",
  "z-header": "AppHeader.", "z-popover": "Calendar, filter panel, menus.", "z-banner": "The sticky SaveBanner.",
};
const usage = (name) => USAGE[name] ?? (name.startsWith("lang-") ? `Repo language dot for ${name.slice(5)}.` : name.startsWith("space-") ? "Step of the 4px spacing scale." : undefined);
const withUsage = (t) => (usage(t.name) ? { ...t, usage: usage(t.name) } : t);

// Root variables tokens.json cannot hold; they stay in bundle.css.
const KEEP_IN_CSS = new Set(["mono-features", "redesign-top"]);

export function tokensFromCss(css, meta) {
  const r = rules(css);
  const root = r.get(":root");
  const light = r.get(':root,[data-theme="light"]');
  const dark = r.get('[data-theme="dark"]');
  const aliases = r.get(":root,[data-theme]");

  const color = [];
  for (const [name, v] of light) color.push(withUsage({ name, value: { light: hex(v), dark: hex(dark.get(name)) } }));
  for (const [name, v] of aliases) color.push(withUsage({ name, value: alias(v) ?? hex(v) }));

  const families = {}, sizes = [], lines = [], spacing = [], radius = [], tracking = [], other = [], zIndex = [];
  for (const [name, v] of root) {
    if (KEEP_IN_CSS.has(name)) continue;
    if (name.startsWith("font-")) families[name.slice(5)] = v;
    else if (name.startsWith("lang-")) color.push(withUsage({ name, value: alias(v) ?? hex(v) }));
    else if (/^text-\d+$/.test(name)) sizes.push({ name, value: v });
    else if (/^lh-\d+$/.test(name)) lines.push({ name, value: v });
    else if (name.startsWith("tracking-")) tracking.push(withUsage({ name, value: v }));
    else if (name.startsWith("radius-")) radius.push(withUsage({ name, value: v }));
    else if (name.startsWith("z-")) zIndex.push(withUsage({ name, value: v }));
    else if (name === "transition" || name === "lift") other.push(withUsage({ name, value: v }));
    else spacing.push(withUsage({ name, value: v }));
  }
  const styles = sizes.map(({ name, value }) => ({
    name: `ui-${name.slice(5)}`, fontSize: value, lineHeight: root.get(`lh-${name.slice(5)}`),
    letterSpacing: root.get("tracking-body"), usage: `Inter at --${name} / --lh-${name.slice(5)}.`,
  }));
  return {
    name: TITLE, version: 1, meta,
    color: { themes: [{ id: "light", name: "Light" }, { id: "dark", name: "Dark" }], tokens: color },
    type: {
      fonts: [], families,
      groups: [{ name: "Type scale", family: "body", styles },
        { name: "Display", family: "display", styles: [{ name: "edition-heading", fontSize: "28px", lineHeight: "34px", fontWeight: 800, letterSpacing: root.get("tracking-heading"), usage: "The wordmark and the edition heading, Bricolage Grotesque." }] }],
    },
    spacing: { tokens: spacing }, radius: { tokens: radius },
    letterSpacing: { tokens: tracking }, fontSize: { tokens: sizes }, lineHeight: { tokens: lines },
    zIndex: { tokens: zIndex }, other: { tokens: other },
  };
}

/** tokens.css, laid out as the page compiles it from tokens.json. */
export function tokensCss(t) {
  const first = t.color.themes[0].id;
  const val = (v) => (v.startsWith("{") ? `var(--${v.slice(1, -1)})` : v);
  const lines = [`/* ${TITLE} — generated from tokens.json */`, `:root, [data-theme="${first}"] {`];
  for (const tok of t.color.tokens) lines.push(`  --${tok.name}: ${val(typeof tok.value === "string" ? tok.value : tok.value[first])};`);
  lines.push("}");
  for (const theme of t.color.themes.slice(1)) {
    lines.push(`[data-theme="${theme.id}"] {`);
    for (const tok of t.color.tokens) {
      const v = typeof tok.value === "string" ? tok.value : tok.value[theme.id];
      if (v && (typeof tok.value !== "string" || v.startsWith("{"))) lines.push(`  --${tok.name}: ${val(v)};`);
    }
    lines.push("}");
  }
  lines.push(":root {");
  for (const fam of ["spacing", "radius", "letterSpacing", "fontSize", "lineHeight", "zIndex", "other"]) {
    for (const tok of t[fam].tokens) lines.push(`  --${tok.name}: ${tok.value};`);
  }
  for (const [key, stack] of Object.entries(t.type.families)) lines.push(`  --font-${key}: ${stack};`);
  lines.push("}");
  for (const group of t.type.groups) {
    for (const s of group.styles) {
      lines.push(`.${s.name} {`, `  font-family: var(--font-${s.family ?? group.family});`, `  font-size: ${s.fontSize};`,
        `  line-height: ${s.lineHeight};`, `  font-weight: ${s.fontWeight ?? 400};`, `  letter-spacing: ${s.letterSpacing ?? 0};`, "}");
    }
  }
  return lines.join("\n") + "\n";
}

/** styles.css with its imports inlined and token.css reduced to what tokens.json cannot hold. */
export async function bundleCss() {
  const tokens = rules(await readFile(join(ROOT, "tokens/token.css"), "utf8")).get(":root");
  const kept = [...KEEP_IN_CSS].map((n) => `--${n}:${tokens.get(n)}`).join(";");
  const remnant = `/* tokens/token.css: its values live in tokens.json (tokens.css); these two cannot. */\n:root{${kept}}\n:root,[data-theme="light"]{color-scheme:light}\n[data-theme="dark"]{color-scheme:dark}\n`;
  let css = await readFile(join(ROOT, "styles.css"), "utf8");
  css = css.replace("@import './tokens/token.css';", remnant)
    .replace("@import './components/components.css';", await readFile(join(ROOT, "components/components.css"), "utf8"));
  if (/@import\s+['"]\./.test(css)) throw new Error("styles.css has a local @import build.mjs does not inline");
  if (/<\/style/i.test(css)) throw new Error("bundle.css contains </style");
  return css;
}

// ---------------------------------------------------------------- components

async function componentFiles() {
  const byName = new Map();
  for (const group of GROUPS) {
    for (const f of await readdir(join(ROOT, "components", group))) {
      const m = /^([A-Z]\w*)\.(d\.ts|prompt\.md)$/.exec(f);
      if (!m) continue;
      const entry = byName.get(m[1]) ?? { group };
      entry[m[2] === "d.ts" ? "dts" : "prompt"] = await readFile(join(ROOT, "components", group, f), "utf8");
      byName.set(m[1], entry);
    }
  }
  return byName;
}

// The doc comment above a declaration in a .d.ts, as one line.
const docOf = (dts, name) => {
  const m = new RegExp(`/\\*\\*((?:(?!\\*/)[\\s\\S])*)\\*/\\s*export (?:declare function|interface) ${name}(?:Props)?\\b`).exec(dts ?? "");
  return m ? m[1].replace(/^\s*\*\s?/gm, "").replace(/@startingPoint.*$/m, "").trim() : null;
};

// Components that share another's source file or have none of their own.
const SHARED = {
  CardGrid: "Feed", RowList: "Feed", StatusMessage: "Feed", AccountMenuPanel: "AppHeader",
};
const OWN_DOCS = {
  Signals: "The mono signal row on a card or list row: ▲ upvotes or points, ★ stars gained, then the comment bubble, each only when present, with tabular numerals.\n\n```jsx\n<Signals signals={{ upvotes: 776, comments: 42 }} />\n```\n\nCard and ListRow render it; use it directly only to show an item's counts elsewhere.",
  LangDot: "The repo language dot beside a GitHub item's meta: one of the reduced `--lang-*` hues, `--lang-other` for anything else, so dots never outshine the accent.\n\n```jsx\n<LangDot language=\"Python\" />\n```",
};
const EXTRA_DTS = `/** The mono signal row: upvotes or points, stars gained, comments; each only when present. */
export declare function Signals(props: { signals?: { upvotes?: number; points?: number; stars_gained?: number; comments?: number }; ariaHidden?: boolean }): JSX.Element;
/** The repo language dot, in the reduced --lang-* palette. */
export declare function LangDot(props: { language?: string | null }): JSX.Element | null;
`;

function readmeFor(name, files) {
  if (OWN_DOCS[name]) return OWN_DOCS[name] + "\n";
  const own = files.get(name);
  if (own?.prompt) return own.prompt;
  const shared = files.get(SHARED[name]);
  const doc = docOf(shared?.dts ?? own?.dts, name);
  if (name === "CardGrid") return shared.prompt;
  if (doc) return `${doc}${shared?.prompt ? `\n\nSee ${SHARED[name] === "Feed" ? "CardGrid" : SHARED[name]} for how it fits with the rest.` : ""}\n`;
  throw new Error(`no docs for ${name}`);
}

async function previewHtml(name, spec) {
  const { code } = await transform(PRELUDE + spec.jsx, { loader: "jsx", jsx: "transform", format: "iife" });
  const width = spec.width ? ` width=${spec.width}` : "";
  return `<!-- @dsCard group="${spec.group}" height=${spec.height}${width} -->
<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>${BASE_CSS}</style></head>
<body><div id="root"></div>
<script>${code.replace(/<\/script/gi, "<\\/script")}</script>
</body></html>
`;
}

// ---------------------------------------------------------------- write

async function put(out, path, text) {
  const file = join(out, "project", path);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, text);
}

export async function buildArtifact(out, { ref = "", now = new Date().toISOString() } = {}) {
  await rm(join(out, "project"), { recursive: true, force: true });
  const names = await componentNames();
  const files = await componentFiles();
  const meta = {
    source: "github", repo: "sachinjain024/aibytes", ref, package: "packages/design-system",
    paths: { tokens: ["tokens/token.css"], docs: ["readme.md", "components/**/*.prompt.md"], assets: ["assets/marks"] },
    synced: now.slice(0, 10),
  };
  const tokens = tokensFromCss(await readFile(join(ROOT, "tokens/token.css"), "utf8"), meta);

  await put(out, "components/bundle.js", await bundleJs(names));
  await put(out, "components/bundle.css", await bundleCss());
  await put(out, "tokens.json", JSON.stringify(tokens, null, 2) + "\n");
  await put(out, "tokens.css", tokensCss(tokens));

  const dts = [...files.entries()].filter(([, f]) => f.dts).map(([, f]) => f.dts.replace(/^import type .*\n/gm, ""));
  await put(out, "components/index.d.ts", dts.join("\n") + EXTRA_DTS);

  for (const name of names) {
    const spec = PREVIEWS[name];
    if (!spec) throw new Error(`no preview for ${name}`);
    await put(out, `components/${name}/README.md`, readmeFor(name, files));
    // Each component gets its own folder here, so a sibling import climbs one level.
    if (files.get(name)?.dts) await put(out, `components/${name}/${name}.d.ts`, files.get(name).dts.replace(/from "\.\/(\w+)"/g, 'from "../$1/$1"'));
    await put(out, `components/${name}/preview.html`, await previewHtml(name, spec));
  }

  await put(out, "README.md", await readFile(join(HERE, "README.md"), "utf8"));
  await put(out, "guidelines/extending-ledger.md", await readFile(join(ROOT, "guidelines/extending-ledger.md"), "utf8"));
  await put(out, "components/Cover/preview.html", await readFile(join(HERE, "cover.html"), "utf8"));
  return { names };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : undefined; };
  const out = arg("--out");
  if (!out) { console.error("usage: build.mjs --out <dir> [--ref <sha>]"); process.exit(2); }
  const { names } = await buildArtifact(resolve(out), { ref: arg("--ref") ?? "" });
  console.log(`${names.length} components -> ${join(resolve(out), "project")}`);
}
