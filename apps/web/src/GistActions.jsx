import React from "react";
import { SavedNote } from "@aibytes/design-system/components/content/SavedNote.jsx";
import { ReactionBar } from "@aibytes/design-system/components/content/ReactionBar.jsx";
import { SaveStar } from "@aibytes/design-system/components/content/SaveStar.jsx";
import { barProps, KEYS } from "./reactionKeys.js";
import { savedPath } from "./route.js";

// The save row under a gist: the star, its label and, on the same row, the reaction bar;
// then one feedback line under it. The page and the panel both draw it, so the two cannot
// drift. Nothing here reads the browser while rendering (the page is server-rendered).
//
// `reactions` is useReactions' result, or absent on the server and the first client
// render, which draw no reaction row. The bar is keyed by slug, so a switch of gist
// never shows the old gist's numbers. It takes everyone else's counts, so the adapter
// (barProps) takes the reader's own press off the store's totals.
export function GistActions({ saved, onToggle, reactions }) {
  // Two rows only: Save + the reactions, then ONE line of feedback. The line is whatever
  // the reader touched last: a Save press brings back the saved line (or clears it), a
  // reaction press brings back the sign-in or error line. Before either, the saved line
  // wins over a load error.
  const [last, setLast] = React.useState(null);
  const reactionLine = !reactions ? null
    : reactions.askSignIn ? (
      <p className="gist-saved" role="status">Please sign in to add your reaction. <button type="button" className="gist-linkbtn" onClick={reactions.onSignIn}>Sign in</button></p>)
    : reactions.message ? <p className="gist-react-note" role="status">{reactions.message}</p>
    : null;
  const savedLine = saved ? <SavedNote href={savedPath()} /> : null;
  let line;
  if (last === "react") line = reactionLine || savedLine;
  else if (last === "save") line = savedLine;
  else line = savedLine || reactionLine;
  return (
    <div className="gist-actions">
      <div className="gist-actions-row">
        <span className={"gist-save" + (saved ? " gist-save--on" : "")}>
          <SaveStar saved={saved} onToggle={() => { setLast("save"); onToggle(); }} />
          <button type="button" className="gist-save-label" onClick={() => { setLast("save"); onToggle(); }}>{saved ? "Saved" : "Save"}</button>
        </span>
        {reactions && (
          <ReactionBar key={reactions.slug} {...barProps(reactions)}
            onToggle={(emoji) => { setLast("react"); reactions.onToggle(KEYS.find((k) => k.emoji === emoji).key); }} />)}
      </div>
      {line}
    </div>);
}
