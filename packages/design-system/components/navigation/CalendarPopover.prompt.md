Calendar popover listing available editions (dates + counts). Missing days are absent, not greyed.

```jsx
<CalendarPopover editions={[{ date: "2026-08-27", label: "Wed, Aug 27", count: 39 }]} currentDate="2026-08-27" onSelect={goTo} />
```

Position it inside the edition bar's relative container; it anchors under the date.
