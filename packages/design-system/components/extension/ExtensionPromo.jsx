// The install box in aibytes.io's rail (AIB-76n, H3): the extension's icon and
// name, one line, "Add to Chrome" (the store, in a new tab) and "Not now".
// The app passes it to Sidebar's promo, and only in a desktop Chromium browser
// without the extension; it owns what Not now remembers.
import React from "react";
import { ExtensionIcon } from "./ExtensionIcon.jsx";

export function ExtensionPromo({ href, onDismiss, labels = {} }) {
  const { name = "aiBytes_ for Chrome", body = "Today's edition from your toolbar.", cta = "Add to Chrome", notNow = "Not now" } = labels;
  return (
    <section className="ldg-promo" aria-label={name}>
      <p className="ldg-promo__name"><ExtensionIcon size={16} />{name}</p>
      <p className="ldg-promo__body">{body}</p>
      <a className="ldg-btn ldg-btn--primary ldg-promo__cta" href={href} target="_blank" rel="noreferrer">{cta}</a>
      {onDismiss && <button type="button" className="ldg-promo__dismiss" onClick={onDismiss}>{notNow}</button>}
    </section>
  );
}
