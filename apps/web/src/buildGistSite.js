// The file work behind the gist pages, sitemap.xml and robots.txt (spec
// AIB-145y-app-gist-pages), kept out of vite.config.js so it can be read and
// tested on its own. Node only. `renderGistPage` is the server build's export.
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { backLink, moreFrom, robotsTxt, shownGists, siteEntries, sitemapXml } from "./gistSite.js";
import { gistHead, withHead } from "./pageMeta.js";

const readJson = async (file) => JSON.parse(await readFile(file, "utf8"));
const readJsonIf = async (file, fallback) => { try { return await readJson(file); } catch (err) { if (err.code === "ENOENT") return fallback; throw err; } };

/** Every gist file under content/gists, except the index. */
async function loadGists(contentDir) {
  let names = [];
  try { names = await readdir(path.join(contentDir, "gists")); } catch (err) { if (err.code !== "ENOENT") throw err; }
  const files = names.filter((n) => n.endsWith(".json") && n !== "index.json").sort();
  return Promise.all(files.map((n) => readJson(path.join(contentDir, "gists", n))));
}

/**
 * Writes dist/gists/<slug>/index.html for every shown gist, dist/sitemap.xml and
 * dist/robots.txt. `html` is the built index.html. Returns what it wrote.
 */
export async function writeGistSite({ outDir, contentDir, html, renderGistPage }) {
  const index = await readJson(path.join(contentDir, "index.json"));
  const weekly = await readJsonIf(path.join(contentDir, "weekly", "index.json"), { issues: [] });

  // Items by id, and the item lists the "More from" rows come from.
  const itemsById = {};
  const listOf = new Map();
  for (const ref of index.editions) {
    const edition = await readJson(path.join(contentDir, "editions", ref.date + ".json"));
    listOf.set("edition:" + ref.date, edition.items);
    for (const item of edition.items) itemsById[item.id] = item;
  }
  for (const ref of weekly.issues) {
    const issue = await readJson(path.join(contentDir, "weekly", "issues", ref.slug + ".json"));
    listOf.set("issue:" + ref.slug, issue.items);
    for (const item of issue.items) itemsById[item.id] = item;
  }

  const gists = shownGists(await loadGists(contentDir), itemsById);
  for (const gist of gists) {
    const first = gist.appearances[0];
    const items = first ? listOf.get(first.edition_date ? "edition:" + first.edition_date : "issue:" + first.issue_slug) : undefined;
    const markup = renderGistPage({ gist, more: moreFrom(gist, items) });
    const page = withHead(html, gistHead(gist)).replace('<div id="root"></div>', () => `<div id="root">${markup}</div>`);
    const dir = path.join(outDir, "gists", gist.slug);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, "index.html"), page);
  }

  const entries = siteEntries({ editions: index.editions, issues: weekly.issues, gists });
  await writeFile(path.join(outDir, "sitemap.xml"), sitemapXml(entries));
  await writeFile(path.join(outDir, "robots.txt"), robotsTxt());
  return { pages: gists.length, sitemap: entries.length };
}
