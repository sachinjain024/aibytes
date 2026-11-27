The popup's footer under Today and Saved (AIB-76n): `--surface-2`, a top border, 44px. The meta (the edition's short date and the item count) is mono with tabular numerals; the link sits at the right.

```jsx
<PopupFooter meta={`${shortDate(date)} · ${items.length} items`}>
  <a className="ldg-popup-link" href={siteUrl}>View on Web</a>
</PopupFooter>
```

It is fixed chrome under the scrolling list, not the last row.
