import React from "react";
import { FeedItem } from "./FeedItem.jsx";
export { SOURCE_NAMES, fmtNum, bubble, Signals, LangDot } from "./signals.jsx";
export function Card({ item, topToday = false, front = false, saved = false, onToggleSave,
  signalsPos = "source", tagStyle = "dots", maxTags = 0, starPos = "actions",
  gistHref, onOpenGist, open = false }) {
  return <FeedItem item={item} grid saved={saved} onToggleSave={onToggleSave}
    topToday={topToday} front={front} signalsPos={signalsPos} tagStyle={tagStyle} maxTags={maxTags} starPos={starPos}
    gistHref={gistHref} onOpenGist={onOpenGist} open={open} />;
}
