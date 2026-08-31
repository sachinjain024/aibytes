import React from "react";
export function EndCard({ dateLabel, prevLabel, onPrev }) {
  return (
    <div className="ldg-endcard" style={{ textAlign: "center" }}>
      <b style={{ marginRight: 20 }}>Thank you for reading. That's it for today.</b>{prevLabel != null && <a href="#prev" onClick={e => { e.preventDefault(); onPrev && onPrev(); }}>View Yesterday's bites</a>}
    </div>);
}
