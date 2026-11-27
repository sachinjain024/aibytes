// The store screenshots' stage (spec AIB-76n store-listing, "Screenshots"):
// the real popup on a fixed edition: ?shot=list or gist, ?source= to show one
// source's items, ?theme=. screenshots.mjs serves this page and the repo's content/, waits
// for <html data-ready>, and captures #stage. Nothing here is drawn by hand:
// every pixel is a shipped component.
import React from "react";
import { createRoot } from "react-dom/client";
import "@aibytes/design-system/styles.css";
import "../src/fonts.css";
import { localSaves } from "@aibytes/app-core/saves.js";
import { Popup } from "../src/popup/Popup.jsx";
import { FIXTURE_SAVES } from "./fixture.js";

const params = new URLSearchParams(location.search);
const shot = params.get("shot") || "list";
const theme = params.get("theme") || "light";
// Some sources' items only (?source=github, or a comma list): the edition
// file is the real one with the other sources' items left out.
const sources = params.get("source")?.split(",") ?? null;
document.documentElement.dataset.theme = theme;

// Links resolve against aibytes.io; the content comes from this server, which
// pins index.json to the fixture edition.
const SITE = "https://aibytes.io";
async function fetchHere(url) {
  const response = await fetch(String(url).replace(SITE, location.origin));
  if (!sources || !/\/content\/editions\/[\d-]+\.json/.test(String(url)) || !response.ok) return response;
  const edition = await response.json();
  edition.items = edition.items.filter((item) => sources.includes(item.source));
  return new Response(JSON.stringify(edition), { status: 200, headers: { "content-type": "application/json" } });
}

// The saves, in memory: a fresh store per load, seeded with the fixture.
function memoryStorage(seed) {
  const map = new Map([["aibytes-saves", JSON.stringify(seed)]]);
  return { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) };
}
const store = localSaves(memoryStorage(FIXTURE_SAVES), new EventTarget());
const openSaves = () => Promise.resolve(store);

const ready = () => { document.documentElement.dataset.ready = "true"; };
const until = async (test, ms = 8000) => {
  const start = performance.now();
  while (!test()) {
    if (performance.now() - start > ms) throw new Error(`stage: timed out waiting for ${shot}`);
    await new Promise((r) => setTimeout(r, 50));
  }
};
// The fonts in, and every image in view loaded or failed. Lazy images below
// the fold never load, so only those on screen count, and none waits past 5 s.
const inView = (img) => img.getBoundingClientRect().top < innerHeight && img.getBoundingClientRect().height > 0;
const settled = async () => {
  await document.fonts.ready;
  const images = [...document.images].filter((img) => !img.complete && inView(img));
  await Promise.race([
    Promise.all(images.map((img) => new Promise((r) => { img.addEventListener("load", r); img.addEventListener("error", r); }))),
    new Promise((r) => setTimeout(r, 5000)),
  ]);
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
};

function PopupShot() {
  React.useEffect(() => {
    (async () => {
      await until(() => document.querySelector(".ldg-popup .story"));
      if (shot === "gist") {
        document.querySelector(".ldg-popup .story--gist h3 a")?.click();
        await until(() => document.querySelector(".ldg-popup__gist"));
      }
      await settled();
      // Where each source's first row sits in the capture, for a frame that
      // annotates them: { source name: { x, y, width, height } } in CSS px.
      const stageBox = document.getElementById("stage").getBoundingClientRect();
      const rows = {};
      for (const row of document.querySelectorAll(".ldg-popup .story")) {
        const name = row.querySelector(".metadata .discussion")?.textContent;
        const r = row.getBoundingClientRect();
        if (name && !rows[name] && r.bottom <= stageBox.bottom) rows[name] = { x: r.x - stageBox.x, y: r.y - stageBox.y, width: r.width, height: r.height };
      }
      window.__rows = rows;
      ready();
    })().catch((error) => { document.documentElement.dataset.error = error.message; });
  }, []);
  return (
    <div id="stage" className="stage-popup">
      <Popup storage={null} fetch={fetchHere} site={SITE} openSaves={openSaves}
        openTab={() => {}} onSignIn={() => {}} user={null} onSignOut={() => {}} />
    </div>
  );
}

const style = document.createElement("style");
style.textContent = `
  html,body{margin:0;background:var(--bg)}
  #stage{display:inline-block;background:var(--bg)}
  .stage-popup{border:var(--border-w) solid var(--border)}
`;
document.head.append(style);

createRoot(document.getElementById("root")).render(<PopupShot />);
