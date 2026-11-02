The toolbar: the actions for the screen you are on, in one row under the `AppHeader`. Count first, then search, Filters, Ranked | Grouped, List | Grid, and the date picker last, at the far right.

```jsx
<Toolbar count="32 items" query={q} onQuery={setQ} filterCount={2} open={panelOpen} onFilters={togglePanel}
  mode="ranked" onMode={setMode} view="grid" onView={setView}
  date={<EditionBar dateLabel="Wed, Aug 27" onDateClick={toggleCal} calendarOpen={calOpen} editions={editions} currentDate="2026-08-27" onSelectEdition={goTo} />} />
```

Render the `FilterPanel` right after it while `open`, and `ActiveFilters` under that. In the app it sits in a `.toolbar-slot` that sticks under the 52px header from a 1001px window. It has no borders, so it reads as the top of the content rather than a second header. Omit a handler and its control disappears: a screen without filters shows no Filters button.
