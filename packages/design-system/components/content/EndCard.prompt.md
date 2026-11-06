End-of-edition footer card — there is no infinite scroll; editions end.

```jsx
<EndCard dateLabel="Aug 27" prevLabel="Aug 26" onPrev={goPrev} />
```

Renders: "That's Aug 27. ← Read Aug 26"

A weekly issue passes its own copy:

```jsx
<EndCard dateLabel="Issue #16" prevLabel="Issue #15" onPrev={goPrev}
  note="That's the week. Next issue Monday." prevText="Previous issue" />
```
