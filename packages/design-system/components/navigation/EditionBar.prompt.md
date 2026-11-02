The edition bar — Ledger's signature element: the edition's date, and the way to every other edition. By default it is the date picker the app puts at the far right of the `Toolbar`: compact, no arrows, not a heading. Clicking the date opens `CalendarPopover`.

```jsx
<EditionBar dateLabel="Wed, Aug 27" onDateClick={toggleCal} calendarOpen={calOpen} editions={editions} currentDate="2026-08-27" onSelectEdition={goTo} />
```

That is what to pass as the `Toolbar`'s `date`. The full bar is still there for a page that leads with the date: `asH1 compact={false} arrows` with `prevLabel` / `nextLabel` (omit `nextLabel` on the latest edition and that arrow disables) and `updatedAgo`. Give it presence; keep everything around it quiet.
