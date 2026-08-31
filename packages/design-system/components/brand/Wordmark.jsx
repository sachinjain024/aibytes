import React from "react";
export function Wordmark({ variant = "full", href = "/" }) {
  if (variant === "icon") return <span className="ldg-wordmark ldg-wordmark--icon" role="img" aria-label="aiBytes_">aB<em>_</em></span>;
  const cls = "ldg-wordmark ldg-wordmark--" + variant;
  return <a className={cls} href={href} aria-label="aiBytes_ — latest edition">⚡ aiBytes<em>_</em></a>;
}
