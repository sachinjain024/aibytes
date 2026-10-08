Filter empty state — an invitation to page back, not mood.

```jsx
<EmptyState category="Repos" prevLabel="Aug 26" prevCount={9} onPrev={goPrev} />
```

Renders: "No Repos in this edition. ← Aug 26 had 9."

Pass `onClear` to add "Clear filters." after it, e.g. when the previous edition
has none either; like every Ledger control, it renders only with its handler.
