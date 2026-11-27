A step on the extension's onboarding page (AIB-76n, pick E2: one step at a time, "Step n of 2" at the right). Lay the page out in `.ldg-onb`: an `h1.ldg-onb__h1` (with a `span.ldg-onb__check` tick once installed), `p.ldg-onb__sub`, then the step.

```jsx
<OnboardingStep n={1} total={2} title="Pin aiBytes_ to your toolbar" done={pinned}>
  <p>Chrome puts new extensions behind the puzzle icon. Pin aiBytes_ so today's edition is one click away.</p>
  {pinned
    ? <OnboardingStatus>Pinned. Select <ExtensionIcon size={16} /> in the toolbar any time.</OnboardingStatus>
    : <><PinAnimation captions={pinCaptions} /><p className="ldg-onb-wait">This step ticks itself when you pin. <button className="ldg-onb-skip">Skip</button></p></>}
</OnboardingStep>
```

- `done` turns the number into a `--success` tick and the border `--success`. `OnboardingStatus` is the same tick before a line of text.
- Step 2's sign-in sits in `.ldg-onb-signin`: `<Button variant="google" size="lg">`, the newsletter box as `label.ldg-onb-check` around a checkbox, and `button.ldg-onb-skip` ("Skip for now"). Already signed in on the site: `<Button size="lg">Continue as {name}</Button>` and `<Button variant="secondary" size="lg">Use a different account</Button>` in `.ldg-onb-signin__row`.
- The closing card is `.ldg-onb-step.ldg-onb-step--end` (dashed) with its own `h2`, not an `OnboardingStep`: it has no number.
- After Sign out in the popup, `p.ldg-onb__notice` above step 2 says so.
