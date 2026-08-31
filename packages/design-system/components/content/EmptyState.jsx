import React from "react";
export function EmptyState({ category, prevLabel, prevCount, onPrev }) {
  return (
    <div className="ldg-endcard" role="status">
      No {category} in this edition.{prevLabel != null && <React.Fragment> <a href="#prev" onClick={e => { e.preventDefault(); onPrev && onPrev(); }}>← {prevLabel} had {prevCount}.</a></React.Fragment>}
    </div>);
}
