import React from "react";
import { shortCount } from "./gistFormat.js";

/** The eight reactions, in this order. */
export const REACTIONS = ["👍", "👎", "😄", "🎉", "😕", "❤️", "🚀", "👀"];
const NAMES = { "👍": "Thumbs up", "👎": "Thumbs down", "😄": "Laugh", "🎉": "Hooray", "😕": "Confused", "❤️": "Heart", "🚀": "Rocket", "👀": "Eyes" };

// Eight toggle buttons. `counts` is everyone else's; the reader's own press is
// added on top, so pressing shows at once. The bar knows nothing about sign-in:
// the app decides what a press does for a signed-out reader.
export function ReactionBar({ counts = {}, mine = [], onToggle }) {
  return (
    <span className="gist-reacts" role="group" aria-label="Reactions">
      {REACTIONS.map((emoji) => {
        const pressed = mine.includes(emoji);
        const n = (counts[emoji] || 0) + (pressed ? 1 : 0);
        return (
          <button key={emoji} type="button" className="gist-react" aria-pressed={pressed}
            aria-label={NAMES[emoji] + (n > 0 ? ", " + n : "")} onClick={() => onToggle(emoji)}>
            <span aria-hidden="true">{emoji}</span>{n > 0 && <b>{shortCount(n)}</b>}
          </button>);
      })}
    </span>);
}
