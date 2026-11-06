import React from "react";
// `note` and `prevText` default to the daily edition's copy; a weekly issue
// passes its own, since it is neither tomorrow's nor an edition.
export function EndCard({ dateLabel, prevLabel, onPrev, note = "A little more informed. See you tomorrow.", prevText = "Previous edition" }) {
  return <div className="end-note"><span className="end-icon" aria-hidden="true">✓</span><div><strong>You're all caught up.</strong><p>{note}</p></div>{prevLabel && <button type="button" onClick={onPrev}>{prevText} <span aria-hidden="true">↗</span></button>}</div>;
}
