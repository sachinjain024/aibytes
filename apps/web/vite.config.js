import { cp, mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const here = path.dirname(fileURLToPath(import.meta.url));
const CONTENT = path.resolve(here, "../../content");
const SCHEMAS = path.resolve(here, "../../packages/feed-schema");

// The app is served from the root of aibytes.io, a custom domain on GitHub
// Pages. Once that domain is set, sachinjain024.github.io/aibytes/ redirects
// to it, so nothing needs the /aibytes/ prefix. Until it is set, a Pages
// deploy will not work: see the Domain section of AIB-8h.
const BASE = "/";

// The edition JSON is not an app asset - curate writes it and the runner
// pushes it - so it is served from the repo's content/ rather than copied into
// public/. Dev reads it live; the build copies it to dist/content/, which is
// the URL the shipped extension reads. The schemas go alongside it, so each
// one is served at the URL its $id names.
// JSON only: content/ also holds a README for repo readers, not for the site.
function isPublished(src) {
  const name = path.basename(src);
  return !name.startsWith(".") && (!path.extname(name) || name.endsWith(".json"));
}

function content() {
  return {
    name: "aibytes-content",
    configureServer(server) {
      server.middlewares.use(BASE + "content/", async (req, res, next) => {
        const rel = decodeURIComponent((req.url || "").split("?")[0]);
        const file = path.resolve(CONTENT, "." + rel);
        if (!file.startsWith(CONTENT + path.sep) || !file.endsWith(".json")) return next();
        try {
          if (!(await stat(file)).isFile()) return next();
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(await readFile(file));
        } catch {
          next();
        }
      });
    },
    async writeBundle(options) {
      const out = path.join(options.dir, "content");
      await cp(CONTENT, out, { recursive: true, filter: isPublished });
      for (const name of await readdir(SCHEMAS)) {
        if (name.endsWith(".schema.json")) await cp(path.join(SCHEMAS, name), path.join(out, name));
      }
    },
  };
}

// One real page per edition, so /2026-10-07 is a 200 on GitHub Pages rather
// than a 404 that happens to render. Each is the same index.html: the app reads
// the date from the URL. Assets are absolute (/assets/...), so the copy works
// one directory down. 404.html catches everything else, including old
// /p/<slug> newsletter links, which the app sends on to newsletter.aibytes.io.
// A new edition needs a rebuild to get its page; the Pages deploy on push does that.
function editionPages() {
  return {
    name: "aibytes-edition-pages",
    async writeBundle(options) {
      const html = await readFile(path.join(options.dir, "index.html"));
      const index = JSON.parse(await readFile(path.join(CONTENT, "index.json"), "utf8"));
      for (const { date } of index.editions) {
        await mkdir(path.join(options.dir, date), { recursive: true });
        await writeFile(path.join(options.dir, date, "index.html"), html);
      }
      await writeFile(path.join(options.dir, "404.html"), html);
    },
  };
}

export default defineConfig({
  base: BASE,
  plugins: [react(), content(), editionPages()],
});
