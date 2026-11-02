import React from "react";

// The row under the Toolbar while tags or sources are selected: one pill per
// selection, each removing itself, then Clear filters. Renders nothing when
// nothing is selected.
export function ActiveFilters({ filters, onChange }) {
  const selected = [...filters.tags.map(value => ({ key: "tags", value })), ...filters.sources.map(value => ({ key: "sources", value }))];
  if (!selected.length) return null;
  const remove = (key, value) => onChange({ ...filters, [key]: filters[key].filter(v => v !== value) });
  return (
    <div className="active-filters">
      {selected.map(({ key, value }) => (
        <button key={key + value} aria-label={`Remove ${value} filter`} onClick={() => remove(key, value)}>{value} ×</button>
      ))}
      <button onClick={() => onChange({ ...filters, tags: [], sources: [] })}>Clear filters</button>
    </div>
  );
}
