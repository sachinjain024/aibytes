Filters for the edition: tags (grouped, with a search box that only narrows the list) and sources, as checkboxes. No Apply button; every change applies at once.

```jsx
{panelOpen && <FilterPanel groups={tagGroups} filters={filters} onChange={setFilters} sources={[{ key: "github", label: "GitHub" }]} />}
```

Render it right after the `Toolbar` while the Filters button is open, and pass the same `filters` to `ActiveFilters`. It moves focus into itself only when opened from the keyboard.
