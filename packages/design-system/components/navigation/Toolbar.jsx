import React from "react";
import { Icon } from "./icons.jsx";

// One row: item count, search, Filters, feed order, layout, then the date
// picker on the far right. "/" focuses the search box from anywhere but a field.
// Each control renders only when its handler (or value) is passed.
export function Toolbar({ count, query = "", onQuery, date, mode = "ranked", onMode, view = "grid", onView, filterCount, open = false, onFilters, disabled = false }) {
  const input = React.useRef(null);
  React.useEffect(() => {
    if (!onQuery) return;
    const key = e => {
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [Boolean(onQuery)]);

  return (
    <div className="toolbar">
      {count && <span className="toolbar-count">{count}</span>}
      {onQuery && (
        <label className="search">
          <span><Icon name="search" /></span>
          <input ref={input} type="search" disabled={disabled} value={query} onChange={e => onQuery(e.target.value)} placeholder="Search this edition…" aria-label="Search this edition" />
          <kbd>/</kbd>
        </label>
      )}
      {onFilters && (
        <button className="control" disabled={disabled} aria-expanded={open} onClick={onFilters}>
          <Icon name="filters" />Filters {filterCount || ""}
        </button>
      )}
      {onMode && (
        <div className="feed-modes" role="group" aria-label="Feed order">
          {["ranked", "grouped"].map(m => (
            <button key={m} aria-pressed={mode === m} onClick={() => onMode(m)}>{m === "ranked" ? "Ranked" : "Grouped"}</button>
          ))}
        </div>
      )}
      {onView && (
        <div className="view-toggle" role="group" aria-label="Layout">
          {["list", "grid"].map(v => (
            <button key={v} aria-label={`${v === "list" ? "List" : "Grid"} view`} aria-pressed={view === v} onClick={() => onView(v)}>
              <Icon name={v} />
            </button>
          ))}
        </div>
      )}
      {date && <div className="date-wrap">{date}</div>}
    </div>
  );
}
