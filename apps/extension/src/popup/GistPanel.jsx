// A gist in the popup (spec AIB-76n extension-popup, D2): "← Today" or
// "← Saved" at the top, the gist as the site's panel draws it, and the star,
// "Save"/"Saved" and "View on Web" at the bottom. Every link in it goes to
// aibytes.io or the source, and the popup's click handler opens it in a tab.
import React from "react";
import { PopupGistBar } from "@aibytes/design-system/components/extension/PopupGistBar.jsx";
import { PopupActionBar } from "@aibytes/design-system/components/extension/PopupActionBar.jsx";
import { GistView } from "@aibytes/design-system/components/content/GistView.jsx";
import { appearanceUrl, gistUrl } from "../links.js";
import { t } from "../copy.js";

export function GistPanel({ gist, site, back, saved, onToggleSave, onBack }) {
  const appearanceHref = React.useCallback((appearance) => appearanceUrl(site, appearance), [site]);
  return (
    <>
      <PopupGistBar backLabel={t(back === "saved" ? "pop.back.saved" : "pop.back.today")} onBack={onBack} />
      <div className="ldg-popup__scroll ldg-popup__gist ldg-prose">
        <GistView gist={gist} as="panel" appearanceHref={appearanceHref} />
      </div>
      <PopupActionBar saved={saved} onToggleSave={onToggleSave} labels={{ save: t("pop.gist.save"), saved: t("pop.gist.saved") }}>
        <a className="ldg-popup-link" href={gistUrl(site, gist.slug)} target="_blank" rel="noreferrer">{t("pop.site")}</a>
      </PopupActionBar>
    </>
  );
}
