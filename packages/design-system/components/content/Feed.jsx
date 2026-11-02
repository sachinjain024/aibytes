import React from "react";

/** The grid view: Cards in as many columns of at least --app-card-min (300px, 360px from a 900px window) as fit. */
export function CardGrid({ children }) {
  return <div className="app-grid">{children}</div>;
}

/** The list view: ListRows stacked, a border between each. */
export function RowList({ children }) {
  return <div className="app-rows">{children}</div>;
}

/** A one-line message where the feed would be: loading, an error (role "alert"), or nowhere to go. */
export function StatusMessage({ role, children }) {
  return <div className="ldg-endcard" role={role}>{children}</div>;
}
