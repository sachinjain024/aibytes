import React from "react";
export function EndCard({ dateLabel, prevLabel, onPrev }) {
  return <div className="end-note"><span className="end-icon" aria-hidden="true">✓</span><div><strong>You're all caught up.</strong><p>A little more informed. See you tomorrow.</p></div>{prevLabel && <button type="button" onClick={onPrev}>Previous edition <span aria-hidden="true">↗</span></button>}</div>;
}
