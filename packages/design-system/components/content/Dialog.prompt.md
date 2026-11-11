A modal dialog: one question, asked once, that the reader answers or closes. It floats over a scrim, so like the popovers it may carry a soft shadow. Use it sparingly: never for navigation, a form with many fields, or anything a line on the page could say.

```jsx
{asking && (
  <Dialog labelledBy="ask-h" onClose={() => setAsking(false)}>
    <h2 id="ask-h" className="ldg-dialog__title">You're successfully signed in.</h2>
    <p>Get the best of AI in your inbox every Monday</p>
    <div className="ldg-dialog__actions">
      <Button variant="primary" data-autofocus onClick={subscribe}>Subscribe</Button>
    </div>
  </Dialog>
)}
```

Escape, the × and a press on the scrim all call `onClose`; the dialog never closes itself, so the caller decides what closing means. Focus starts on the control marked `data-autofocus` (the primary action), Tab cannot leave, and focus returns to the opener afterwards. One heading (`.ldg-dialog__title`, named by `labelledBy`), sentence case. Buttons go in `.ldg-dialog__actions`, right-aligned on desktop and stacked full-width on phones; a single action spans the width with `.ldg-dialog__actions--one`. A confirmation tick uses `--success` with `--success-fg` for the mark.
