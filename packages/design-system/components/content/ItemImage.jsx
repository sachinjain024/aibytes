import React from "react";
import { SourceMark } from "../brand/SourceMark.jsx";
import { sizedImageUrl } from "./imageUrl.js";

// The fixed image slot on a Card (40px) or a ListRow (24px). The source mark
// fills it when an item has no image, and also when its image fails to load,
// so a dead URL never shows a broken-image icon. Always lazy-loaded, always
// sized up front so nothing shifts as images arrive.
export function ItemImage({ item, size, className, circleClassName }) {
  const img = item.image || {};
  const src = img.url && img.type !== "none" ? sizedImageUrl(img.url, size) : null;
  const [failed, setFailed] = React.useState(null);
  if (!src || failed === src) {
    return <SourceMark source={item.source} size={size} className={className + (item.source === "github" && circleClassName ? " " + circleClassName : "")} />;
  }
  return (
    <img className={className + (img.type === "avatar" && circleClassName ? " " + circleClassName : "")}
      src={src} alt="" width={size} height={size} loading="lazy" decoding="async"
      onError={() => setFailed(src)} />);
}
