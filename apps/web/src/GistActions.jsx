import React from "react";
import { SavedNote } from "@aibytes/design-system/components/content/SavedNote.jsx";
import { SaveStar } from "@aibytes/design-system/components/content/SaveStar.jsx";
import { savedPath } from "./route.js";

// The save row under a gist: the star, its label, and once saved the "Added to
// your Saved items" line. The page and the panel both draw it, so the two cannot
// drift. Nothing here reads the browser while rendering (the page is server-rendered).
export function GistActions({ saved, onToggle }) {
  return (
    <div className="gist-actions">
      <div className="gist-actions-row">
        <span className={"gist-save" + (saved ? " gist-save--on" : "")}>
          <SaveStar saved={saved} onToggle={onToggle} />
          <button type="button" className="gist-save-label" onClick={onToggle}>{saved ? "Saved" : "Save"}</button>
        </span>
      </div>
      {saved && <SavedNote href={savedPath()} />}
    </div>);
}
