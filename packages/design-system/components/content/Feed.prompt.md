The feed's containers, and the line that stands in for it.

```jsx
<CardGrid>{items.map(i => <Card key={i.id} item={i} />)}</CardGrid>
<RowList>{items.map(i => <ListRow key={i.id} item={i} />)}</RowList>
<StatusMessage role="alert">Could not load the edition.</StatusMessage>
```

`CardGrid` is the grid view: columns of at least 300px (360px from a 900px window), so a narrow screen gets one column; at one column hide the List | Grid toggle, since the two look alike. `RowList` is the list view. In Grouped order, give each category a `SectionHeading` followed by its own `CardGrid` or `RowList`. End the feed with `EndCard`; use `EmptyState` when filters or a search leave nothing, and `StatusMessage` for loading, errors and addresses with no edition.
