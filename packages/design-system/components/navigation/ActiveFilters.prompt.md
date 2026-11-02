What is filtered, at a glance, and the one-click way out of each.

```jsx
<ActiveFilters filters={{ tags: ["Agents"], sources: ["github"], category: "all" }} onChange={setFilters} />
```

Goes under the `Toolbar` (and the `FilterPanel`, when open). Pills are small accent-tinted buttons; it shows nothing until something is selected, so always render it.
