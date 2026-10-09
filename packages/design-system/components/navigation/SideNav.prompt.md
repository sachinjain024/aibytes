Side navigation rail — the full-page-layout alternative to header category chips. Date widget (edition pager + "Pick a date" list), Categories with counts, Library / My Starred.

```jsx
<SideNav dateMain="Today" dateNote="(Aug 27, 2026)" prevLabel="Yesterday" onPrev={goPrev} editions={editions} currentDate={date} onSelectEdition={setDate} categories={cats} activeCategory={cat} onCategory={setCat} allCount={39} savedCount={3} onSaved={toggleSaved} />
```

Pair with `<Header showCategories={false} />` and no EditionBar — the rail replaces both. Omit `dateMain` to hide the date widget (saved view). Sticky under the header: set `--ldg-header-h` (sticky-cluster height) on an ancestor, and `--ldg-footer-h` (a sticky footer's height, default `0px`) so the rail stops where the footer starts. The `aside` is labelled "Edition and categories"; the edition list is a labelled group with the current edition `aria-current="date"`. Hidden below 900px — keep header chips on mobile.
