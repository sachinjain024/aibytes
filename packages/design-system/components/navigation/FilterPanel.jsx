import React from "react";
import { Icon } from "./icons.jsx";

// The filter panel the Toolbar's Filters button opens. Changes apply as they
// are made; the tag search only narrows the list of tags shown, it does not
// filter the feed.
export function FilterPanel({ groups = [], filters, onChange, sources = [] }) {
  const [query, setQuery] = React.useState("");
  const ref = React.useRef(null);
  // Move focus into the panel only when it was opened from the keyboard.
  React.useEffect(() => {
    if (document.documentElement.dataset.inputModality === "keyboard") ref.current?.querySelector("input")?.focus();
  }, []);
  const toggle = (key, value) => onChange({
    ...filters,
    [key]: filters[key].includes(value) ? filters[key].filter(v => v !== value) : [...filters[key], value],
  });

  return (
    <section className="redesign-filters" aria-label="Filter this edition" ref={ref}>
      <div className="pop-title">
        Filter this edition <button onClick={() => onChange({ ...filters, tags: [], sources: [] })}>Reset</button>
      </div>
      <div className="tags-legend">
        <span>Tags</span>
        <label className="compact-tag-search">
          <Icon name="search" />
          <input type="search" placeholder="Find a tag" aria-label="Search tags" value={query} onChange={e => setQuery(e.target.value)} />
        </label>
      </div>
      {groups.map(g => {
        const tags = g.tags.filter(t => t.name.toLowerCase().includes(query.toLowerCase()));
        if (!tags.length) return null;
        return (
          <fieldset className="redesign-tag-group" key={g.name}>
            <legend>{g.name}</legend>
            {tags.map(t => (
              <label key={t.name}>
                <input type="checkbox" checked={filters.tags.includes(t.name)} onChange={() => toggle("tags", t.name)} />
                {t.name}
              </label>
            ))}
          </fieldset>
        );
      })}
      <fieldset className="redesign-tag-group">
        <legend>Discovered on</legend>
        {sources.map(s => (
          <label key={s.key}>
            <input type="checkbox" checked={filters.sources.includes(s.key)} onChange={() => toggle("sources", s.key)} />
            {s.label}
          </label>
        ))}
      </fieldset>
      <p className="filter-help">Selections apply instantly.</p>
    </section>
  );
}
