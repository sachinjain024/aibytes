import React from "react";
import { FeedItem } from "./FeedItem.jsx";
export { SOURCE_NAMES, fmtNum, bubble, Signals, LangDot } from "./signals.jsx";
export function Card({ item, topToday = false, saved = false, onToggleSave,
  signalsPos = "source", tagStyle = "dots", maxTags = 0, starPos = "actions" }) {
  return <FeedItem item={item} grid saved={saved} onToggleSave={onToggleSave}
    topToday={topToday} signalsPos={signalsPos} tagStyle={tagStyle} maxTags={maxTags} starPos={starPos} />;
}
