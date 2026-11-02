import React from "react";
export function EmptyState({ category, prevLabel, prevCount, onPrev, onClear, query, onClearQuery }) {
  // A search that matches nothing names the search, not a category.
  if (query) return (
    <div className="ldg-endcard" role="status">
      No items match “{query}”. {onClearQuery && <button onClick={onClearQuery}>Clear search</button>}
    </div>);
  return (
    <div className="ldg-endcard" role="status">
      No {category} in this edition.{prevLabel != null && <React.Fragment> <a href="#prev" onClick={e => { e.preventDefault(); onPrev && onPrev(); }}>← {prevLabel} had {prevCount}.</a></React.Fragment>}{onClear && <React.Fragment> <a href="#clear" onClick={e => { e.preventDefault(); onClear(); }}>Clear filters.</a></React.Fragment>}
    </div>);
}
