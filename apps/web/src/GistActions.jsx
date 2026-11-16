import React from "react";
import { SavedNote } from "@aibytes/design-system/components/content/SavedNote.jsx";
import { ReactionBar } from "@aibytes/design-system/components/content/ReactionBar.jsx";
import { SaveStar } from "@aibytes/design-system/components/content/SaveStar.jsx";
import { barProps, KEYS } from "./reactionKeys.js";
import { savedPath } from "./route.js";

// The save row under a gist: the star, its label and, on the same row, the reaction bar;
// then once saved the "Added to your Saved items" line. The page and the panel both draw it, so the two cannot
// drift. Nothing here reads the browser while rendering (the page is server-rendered).
//
// `reactions` is useReactions' result, or absent on the server and the first client
// render, which draw no reaction row. The bar is keyed by slug, so a switch of gist
// never shows the old gist's numbers. It takes everyone else's counts, so the adapter
// (barProps) takes the reader's own press off the store's totals.
export function GistActions({ saved, onToggle, reactions }) {
  return (
    <div className="gist-actions">
      <div className="gist-actions-row">
        <span className={"gist-save" + (saved ? " gist-save--on" : "")}>
          <SaveStar saved={saved} onToggle={onToggle} />
          <button type="button" className="gist-save-label" onClick={onToggle}>{saved ? "Saved" : "Save"}</button>
        </span>
        {reactions && <ReactionBar key={reactions.slug} {...barProps(reactions)} onToggle={(emoji) => reactions.onToggle(KEYS.find((k) => k.emoji === emoji).key)} />}
      </div>
      {saved && <SavedNote href={savedPath()} />}
      {reactions && reactions.askSignIn && (
        <p className="gist-saved" role="status">Please sign in to add your reaction. <button type="button" className="gist-linkbtn" onClick={reactions.onSignIn}>Sign in</button></p>)}
      {reactions && reactions.message && <p className="gist-react-note" role="status">{reactions.message}</p>}
    </div>);
}
