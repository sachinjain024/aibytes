// The store screenshots' script (AIB-76n T21): the shot list, filling a
// frame, reading a PNG's size, and finding the versions under assets/.
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { HEIGHT, RAW, SHOTS, WIDTH, fillFrame, pngSize, versions } from "./screenshots.mjs";

test("five shots at 1280×800, each framing raw captures that exist", () => {
  assert.equal(WIDTH, 1280);
  assert.equal(HEIGHT, 800);
  assert.deepEqual(SHOTS.map((s) => s.n), [1, 2, 3, 4, 5]);
  const names = new Set(RAW.map((r) => r.name));
  for (const shot of SHOTS) {
    assert.ok(shot.title && shot.subtitle, `shot ${shot.n} has words`);
    assert.ok(shot.raw.length <= 3);
    assert.equal(shot.raw.length === 0, shot.layout === "art", `shot ${shot.n}: only the art shot frames no capture`);
    for (const name of shot.raw) assert.ok(names.has(name), `${name} is captured`);
  }
});

test("fillFrame fills every placeholder, escapes the words and adds the fonts", () => {
  const shot = { n: 2, layout: "pair", theme: "light", title: "Repos <b>& gists</b>", subtitle: "It's \"real\"" };
  const html = fillFrame("<html><head></head><body data-layout=\"{{LAYOUT}}\">{{TITLE}}|{{SUBTITLE}}|{{SHOT1}} {{SHOT1_W}}x{{SHOT1_H}}|{{SHOT2}}|{{SHOT3}}{{SHOT3_W}}|{{N}}{{THEME}}{{ICON}}|{{CAPTION}}</body></html>",
    shot, [{ src: "/raw/a.png", width: 642, height: 582 }, { src: "/raw/b.png", width: 642, height: 582 }]);
  assert.match(html, /data-layout="pair"/);
  assert.match(html, /Repos &lt;b&gt;&amp; gists&lt;\/b&gt;\|It&#39;s &quot;real&quot;/);
  assert.match(html, /\/raw\/a\.png 642x582\|\/raw\/b\.png\|0\|2light\/icon\.png/);
  assert.match(html, /<head><style>@font-face/);
  assert.doesNotMatch(html, /\{\{[A-Z0-9_]+\}\}/);
});

test("fillFrame marks the accent and turns a capture's rows into CSS variables", () => {
  const shot = { n: 4, layout: "annotated", theme: "light", title: "News in one list", accent: "one list", subtitle: "s" };
  const html = fillFrame("<head></head>{{TITLE_HTML}}", shot, [{ src: "/raw/4.png", width: 552, height: 582, rows: { "Hacker News": { x: 1, y: 49, width: 550, height: 115.5 } } }]);
  assert.match(html, /News in <em>one list<\/em>/);
  assert.match(html, /:root\{--row-hacker-news-x:1px;--row-hacker-news-y:49px;--row-hacker-news-w:550px;--row-hacker-news-h:115.5px\}/);
});

test("pngSize reads the IHDR width and height", () => {
  const png = Buffer.alloc(24);
  png.writeUInt32BE(2560, 16);
  png.writeUInt32BE(1600, 20);
  assert.deepEqual(pngSize(png), { width: 2560, height: 1600 });
});

test("versions lists vN folders in number order and ignores the rest", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "store-assets-"));
  try {
    for (const name of ["v1", "v10", "v2", "references", "vx"]) await mkdir(path.join(dir, name));
    assert.deepEqual(await versions(dir), [1, 2, 10]);
    assert.deepEqual(await versions(path.join(dir, "missing")), []);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
