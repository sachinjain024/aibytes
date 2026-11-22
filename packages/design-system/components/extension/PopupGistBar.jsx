// The top of a gist in the extension popup (AIB-76n, D2): one back button,
// to Today or to Saved. The save and the site link sit at the bottom
// (PopupActionBar).
import React from "react";

export function PopupGistBar({ backLabel = "← Today", onBack }) {
  return (
    <div className="ldg-popup-gistbar">
      <button type="button" className="ldg-popup-back" onClick={onBack}>{backLabel}</button>
    </div>
  );
}
