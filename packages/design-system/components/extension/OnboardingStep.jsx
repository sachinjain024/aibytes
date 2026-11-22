// One step card on aibytes.io/extension-onboarding (AIB-76n, E2): the number
// (a tick once done), the title with an "Optional" tag, "Step n of total" at
// the right, then the step's body. OnboardingStatus is a ticked line inside a
// step: "Pinned. Select … in the toolbar any time.", "Signed in as …".
import React from "react";

const TICK = (
  <span className="ldg-onb-tick" aria-hidden="true">
    <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5.2l2 2L8 3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
  </span>
);

export function OnboardingStep({ n, total, title, optional = false, done = false, labels = {}, children }) {
  const { stepOf = "Step {n} of {total}", optional: optionalLabel = "Optional" } = labels;
  const id = React.useId();
  return (
    <section className={"ldg-onb-step" + (done ? " ldg-onb-step--done" : "")} aria-labelledby={id}>
      <div className="ldg-onb-step__head">
        <span className="ldg-onb-step__n">{done ? TICK : n}</span>
        <h2 id={id}>{title}{optional && <> <span className="ldg-onb-step__opt">{optionalLabel}</span></>}</h2>
        {total && <span className="ldg-onb-step__of">{stepOf.replace("{n}", n).replace("{total}", total)}</span>}
      </div>
      {children}
    </section>
  );
}

export function OnboardingStatus({ children }) {
  return <p className="ldg-onb-status">{TICK}<span>{children}</span></p>;
}
