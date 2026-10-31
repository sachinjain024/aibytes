import React from "react";
import { FeedItem } from "./FeedItem.jsx";
export { SOURCE_NAMES, fmtNum, bubble, Signals, LangDot } from "./signals.jsx";
export function Card({ item, topToday = false, saved = false, onToggleSave,
  signalsPos = "logo", tagStyle = "dots", maxTags = 3 }) {
  return <FeedItem item={item} grid saved={saved} onToggleSave={onToggleSave}
    topToday={topToday} signalsPos={signalsPos} tagStyle={tagStyle} maxTags={maxTags} />;
}
