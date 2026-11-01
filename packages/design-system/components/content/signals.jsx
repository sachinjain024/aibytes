import React from "react";
export const SOURCE_NAMES = { producthunt: "Product Hunt", hackernews: "Hacker News", github: "GitHub", techcrunch: "TechCrunch" };
const LANG = { Python: "var(--lang-python)", TypeScript: "var(--lang-ts)", JavaScript: "var(--lang-ts)", Rust: "var(--lang-rust)", Go: "var(--lang-go)", "C++": "var(--lang-cpp)", Shell: "var(--lang-shell)", "Jupyter Notebook": "var(--lang-jupyter)" };
export const fmtNum = n => n >= 1000 ? ((n / 1000).toFixed(1).replace(/\.0$/, "") + "k") : String(n);
export const bubble = (
  <svg width="11" height="11" viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 2.5h11v8h-6l-3 2.5v-2.5h-2z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>);
export function Signals({ signals = {}, ariaHidden }) {
  const parts = [];
  const pts = signals.upvotes ?? signals.points;
  if (pts != null) parts.push(<span key="p" title="Upvotes">▲{fmtNum(pts)}</span>);
  if (signals.stars_gained != null) parts.push(<span key="s" title="Stars gained today">+{fmtNum(signals.stars_gained)} ★</span>);
  if (signals.comments != null) parts.push(<span key="c" title="Comments">{bubble} {fmtNum(signals.comments)}</span>);
  if (!parts.length) return null;
  return <span className="ldg-signals" aria-hidden={ariaHidden}>{parts}</span>;
}
export function LangDot({ language }) {
  if (!language) return null;
  return <span className="ldg-lang"><i style={{ background: LANG[language] || "var(--lang-other)" }}></i>{language}</span>;
}
