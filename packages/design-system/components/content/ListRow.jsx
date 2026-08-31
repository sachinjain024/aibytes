import React from "react";
import { SourceMark } from "../brand/SourceMark.jsx";
import { SaveStar } from "./SaveStar.jsx";
import { CardMenu } from "./CardMenu.jsx";
import { SOURCE_NAMES, fmtNum, bubble } from "./Card.jsx";
export function ListRow({ item, saved = false, onToggleSave }) {
  const img = item.image || {};
  const hasImg = img.url && img.type !== "none";
  const sig = item.signals || {};
  const pts = sig.upvotes ?? sig.points;
  return (
    <div className="ldg-row">
      {hasImg
        ? <img className={"ldg-row__img" + (img.type === "avatar" ? " ldg-row__img--circle" : "")} src={img.url} alt="" width="24" height="24" loading="lazy" />
        : <SourceMark source={item.source} size={24} className="ldg-row__img" />}
      <span className="ldg-row__main">
        <span className="ldg-row__top"><a className="ldg-row__title" href={item.url} target="_blank" rel="noopener noreferrer">{item.title}</a></span>
        <span className="ldg-row__summary">{item.summary}</span>
      </span>
      <span className="ldg-row__meta">
        {SOURCE_NAMES[item.source]}
        {pts != null && <React.Fragment> · ▲{fmtNum(pts)}</React.Fragment>}
        {sig.stars_gained != null && <React.Fragment> · +{fmtNum(sig.stars_gained)} ★</React.Fragment>}
        {sig.comments != null && <React.Fragment> · {bubble} {fmtNum(sig.comments)}</React.Fragment>}
      </span>
      <SaveStar saved={saved} onToggle={() => onToggleSave && onToggleSave(item.id)} />
      <CardMenu item={item} up={false} />
    </div>);
}
