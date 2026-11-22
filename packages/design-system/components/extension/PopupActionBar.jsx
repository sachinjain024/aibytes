// The bottom of a gist in the extension popup (AIB-76n, D2): the star, its
// label, and the link to the site. The popup owns what saving does and where
// the link goes.
import React from "react";
import { SaveStar } from "../content/SaveStar.jsx";

export function PopupActionBar({ saved = false, onToggleSave, labels = {}, children }) {
  const { save = "Save", saved: savedLabel = "Saved" } = labels;
  return (
    <div className="ldg-popup-actions">
      <SaveStar saved={saved} onToggle={onToggleSave} />
      <span className="ldg-popup-actions__label">{saved ? savedLabel : save}</span>
      {children}
    </div>
  );
}
