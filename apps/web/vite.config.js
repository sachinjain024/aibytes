import { cp, mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { PRIVACY_HEAD, SAVED_HEAD, WEEKLY_ARCHIVE_HEAD, weeklyIssueHead, withHead } from "./src/pageMeta.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const CONTENT = path.resolve(here, "../../content");
const SCHEMAS = path.resolve(here, "../../packages/feed-schema");
const WEEKLY_INDEX = path.join(CONTENT, "weekly", "index.json");

// The app is served from the root of aibytes.io, a custom domain on GitHub
// Pages, so nothing needs a path prefix. A deploy without that domain set
// would break every URL: the build assumes "/".
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

async function loadWeeklyIssues() {
  try {
    if (!(await stat(WEEKLY_INDEX)).isFile()) return [];
  } catch {
    return [];
  }
  const index = JSON.parse(await readFile(WEEKLY_INDEX, "utf8"));
  return Array.isArray(index.issues) ? index.issues : [];
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

// One real page per edition and weekly issue, so /2026-10-07 and
// /weekly/issue-16 are 200s on GitHub Pages rather than a 404 that happens to
// render. Each is index.html: the app reads the path from the URL. /saved is
// one too, noindex since it is the reader's own, and so is /privacy. Weekly pages
// also get their own title, description, canonical URL and OG tags, since they
// are meant to be indexed and shared. Assets are absolute (/assets/...), so the
// copy works one directory down. 404.html catches everything else, including
// old /p/<slug> newsletter links, which the app sends on to newsletter.aibytes.io.
function editionPages() {
  return {
    name: "aibytes-edition-pages",
    async writeBundle(options) {
      const html = await readFile(path.join(options.dir, "index.html"), "utf8");
      const index = JSON.parse(await readFile(path.join(CONTENT, "index.json"), "utf8"));
      for (const { date } of index.editions) {
        await mkdir(path.join(options.dir, date), { recursive: true });
        await writeFile(path.join(options.dir, date, "index.html"), html);
      }
      await writeFile(path.join(options.dir, "404.html"), html);
      await mkdir(path.join(options.dir, "saved"), { recursive: true });
      await writeFile(path.join(options.dir, "saved", "index.html"), withHead(html, SAVED_HEAD));
      await mkdir(path.join(options.dir, "privacy"), { recursive: true });
      await writeFile(path.join(options.dir, "privacy", "index.html"), withHead(html, PRIVACY_HEAD));

      await mkdir(path.join(options.dir, "weekly"), { recursive: true });
      await writeFile(path.join(options.dir, "weekly", "index.html"), withHead(html, WEEKLY_ARCHIVE_HEAD));
      for (const entry of await loadWeeklyIssues()) {
        const dir = path.join(options.dir, "weekly", entry.slug);
        await mkdir(dir, { recursive: true });
        await writeFile(path.join(dir, "index.html"), withHead(html, weeklyIssueHead(entry)));
      }
    },
  };
}

export default defineConfig({
  base: BASE,
  plugins: [react(), content(), editionPages()],
});
