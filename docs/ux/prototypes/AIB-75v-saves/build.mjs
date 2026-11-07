// Bundle App.jsx against the live Ledger sources and inline everything into one
// page, aib-75v-saves.html. Run from the repo root: node docs/ux/prototypes/AIB-75v-saves/build.mjs
import { build } from "esbuild";
import { readFile, writeFile } from "node:fs/promises";

const HERE = new URL(".", import.meta.url).pathname;
const DS = new URL("../../../../packages/design-system", import.meta.url).pathname;

const js = (await build({
  entryPoints: [HERE + "App.jsx"], bundle: true, format: "iife", write: false, minify: true,
  loader: { ".jsx": "jsx", ".js": "jsx" }, jsx: "transform",
  plugins: [{ name: "globals", setup(b) {
    b.onResolve({ filter: /^@ds\// }, a => ({ path: DS + a.path.slice(3) }));
    b.onResolve({ filter: /^react(-dom\/client)?$/ }, a => ({ path: a.path, namespace: "g" }));
    b.onLoad({ filter: /.*/, namespace: "g" }, a => ({ contents: `module.exports = window.${a.path === "react" ? "React" : "ReactDOM"}`, loader: "js" }));
  } }],
})).outputFiles[0].text;

const strip = css => css.replace(/@import[^;]+;/g, "");
const css = [
  strip(await readFile(DS + "/tokens/token.css", "utf8")),
  strip(await readFile(DS + "/components/components.css", "utf8")),
  strip(await readFile(DS + "/styles.css", "utf8")),
  await readFile(HERE + "proto.css", "utf8"),
].join("\n");
const data = await readFile(DS + "/ui_kits/aibytes-app/data.js", "utf8");
const esc = s => s.replace(/<\/script/gi, "<\\/script");

const html = `<title>aiBytes_ Saves Prototype</title>
<meta name="description" content="AIB-75v: anonymous saves, Google sign-in, merge and the Saved view on Ledger">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@500;700;800&family=Inter:wght@400;500;600;700&display=swap">
<style>${css}</style>
<div id="root"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js"></script>
<script>${esc(data)}</script>
<script>${esc(js)}</script>
`;
await writeFile(HERE + "aib-75v-saves.html", html);
console.log("bytes", html.length);
