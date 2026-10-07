import { cp, readdir, readFile, stat } from "node:fs/promises";
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

export default defineConfig({
  base: BASE,
  plugins: [react(), content()],
});
