The edition bar — Ledger's signature element. A dated, pageable ledger of days in JetBrains Mono, sticky under the header.

```jsx
<EditionBar dateLabel="Wed, Aug 27, 2026" itemCount={39} updatedAgo="4h ago" prevLabel="Aug 26" onPrev={goPrev} onDateClick={openCal} calendarOpen={calOpen} editions={editions} currentDate="2026-08-27" onSelectEdition={goTo} />
```

Omit `nextLabel` on the latest edition (arrow disables). `compact` for mobile. Give it presence; keep everything around it quiet.
