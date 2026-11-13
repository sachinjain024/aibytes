import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { writeGistSite } from "./buildGistSite.js";

function content(slug) {
  const dir = mkdtempSync(path.join(tmpdir(), "aibytes-slug-"));
  for (const sub of ["editions", "gists"]) mkdirSync(path.join(dir, sub), { recursive: true });
  const w = (file, data) => writeFileSync(path.join(dir, file), JSON.stringify(data));
  w("index.json", { editions: [{ date: "2026-08-27" }] });
  w("editions/2026-08-27.json", { items: [{ id: "a", rank: 1, hidden: false }] });
  w("gists/x.json", { slug, kind: "hn", depth: "full", appearances: [{ item_id: "a", edition_date: "2026-08-27" }], updated_at: "2026-08-28T00:00:00Z" });
  return dir;
}

test("a gist whose slug is not a plain slug never reaches the file system", async () => {
  for (const slug of ["../evil", "a/b", "A-b", "-a", "a b", ""]) {
    const dir = content(slug);
    const out = mkdtempSync(path.join(tmpdir(), "aibytes-out-"));
    await assert.rejects(writeGistSite({ outDir: out, contentDir: dir, html: '<div id="root"></div>', renderGistPage: () => "" }), /slug/, JSON.stringify(slug));
    rmSync(dir, { recursive: true, force: true });
    rmSync(out, { recursive: true, force: true });
  }
});

test("a plain slug is written", async () => {
  const dir = content("ok-slug");
  const out = mkdtempSync(path.join(tmpdir(), "aibytes-out-"));
  const done = await writeGistSite({ outDir: out, contentDir: dir, html: '<html><head><title>x</title></head><body><div id="root"></div></body></html>', renderGistPage: () => "<p>hi</p>" });
  assert.equal(done.pages, 1);
  rmSync(dir, { recursive: true, force: true });
  rmSync(out, { recursive: true, force: true });
});
