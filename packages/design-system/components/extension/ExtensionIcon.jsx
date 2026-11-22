// The aiBytes_ Chrome extension's icon (AIB-76n): the favicon tile, the
// wordmark's bolt in white on cobalt. A logo, so its colours are fixed and the
// same in both themes, like the source marks. The PNGs Chrome needs are drawn
// from the same SVG by scripts/extension-icons.mjs.
import React from "react";

export function ExtensionIcon({ size = 20, title, className = "" }) {
  const label = title ? { role: "img", "aria-label": title } : { "aria-hidden": "true" };
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 32 32" focusable="false" {...label}>
      <rect width="32" height="32" rx="7" fill="#285ed1"/>
      <path d="M18.2 3 7 18.4h7.6L12.8 29 25 13.2h-7.9z" fill="#fff"/>
    </svg>
  );
}
