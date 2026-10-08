import React from "react";
import { ItemImage } from "./ItemImage.jsx";
import { SaveStar } from "./SaveStar.jsx";
import { CardMenu } from "./CardMenu.jsx";
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
export function Card({ item, topToday = false, saved = false, onToggleSave, signalsPos = "logo", tagStyle = "dots", maxTags = 3 }) {
  const sig = item.signals ? { upvotes: item.signals.upvotes, points: item.signals.points, stars_gained: item.signals.stars_gained } : undefined;
  const corner = signalsPos !== "bottom";
  const tags = (item.tags || []).slice(0, maxTags);
  const lang = item.meta && item.meta.language;
  const tagsEl = tagStyle === "pills"
    ? <span className="ldg-tagpills">{lang ? <LangDot language={lang} /> : null}{tags.map(t => <span key={t} className="ldg-tagpill">{t}</span>)}</span>
    : tagStyle === "hash"
      ? <span className="ldg-tags ldg-tags--hash">{lang ? <LangDot language={lang} /> : null}{tags.map(t => <span key={t} className="ldg-taghash">#{t}</span>)}</span>
      : <span className="ldg-tags">
          {lang ? <React.Fragment><LangDot language={lang} />{tags.length ? " · " : ""}</React.Fragment> : null}
          {tags.join(" · ")}
        </span>;
  return (
    <article className={"ldg-card" + (topToday ? " ldg-card--top" : "") + (corner ? " ldg-card--corner" : "")}>
      <span className={"ldg-card__left" + (signalsPos === "bottom" ? " ldg-card__left--stretch" : "")}>
        <ItemImage item={item} size={40} className="ldg-card__img" circleClassName="ldg-card__img--circle" />
        {signalsPos === "bottom" && <Signals signals={sig} />}
        {signalsPos === "logo" && sig && (sig.upvotes ?? sig.points) != null && <span title="Upvotes" style={{ fontSize: 12, fontFamily: 'var(--font-mono)', letterSpacing: 'var(--tracking-mono)' }}>▲{fmtNum(sig.upvotes ?? sig.points)}</span>}
        {signalsPos === "logo" && sig && sig.stars_gained != null && <Signals signals={{ stars_gained: sig.stars_gained }} />}
      </span>
      <div className="ldg-card__body">
        <div className="ldg-card__srcrow">
          {topToday && <span className="ldg-top-label" title="Top today">TOP</span>}
          <a href={item.source_url} target="_blank" rel="noopener noreferrer">{SOURCE_NAMES[item.source] || item.source}</a>
          {signalsPos === "source" && <Signals signals={sig} />}
        </div>
        <h3 className="ldg-card__title"><a href={item.url} target="_blank" rel="noopener noreferrer">{item.title}</a></h3>
        <p className="ldg-card__summary">{item.summary}</p>
        {signalsPos === "row" && <div className="ldg-card__sigrow"><Signals signals={sig} /></div>}
        <div className="ldg-card__meta">
          {tagsEl}
          {!corner && <span className="ldg-card__actions"><CardMenu item={item} /></span>}
        </div>
      </div>
      {corner
        ? <span className="ldg-card__corner"><CardMenu item={item} />{onToggleSave && <SaveStar saved={saved} onToggle={() => onToggleSave(item.id)} />}</span>
        : onToggleSave && <SaveStar className="ldg-card__star" saved={saved} onToggle={() => onToggleSave(item.id)} />}
    </article>);
}
