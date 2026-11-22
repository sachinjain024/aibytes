/** One step card on aibytes.io/extension-onboarding (AIB-76n, E2): the number in a circle (a tick once `done`, and the card's border turns --success), the title with an "Optional" tag, "Step n of total" at the right, then the body. */
export interface OnboardingStepProps {
  n: number;
  /** with it, "Step {n} of {total}" shows at the right (the one-step-at-a-time flow); without, no counter */
  total?: number;
  title: React.ReactNode;
  /** adds the "Optional" tag after the title */
  optional?: boolean;
  /** the number becomes a tick and the card is marked done */
  done?: boolean;
  /** copy: `stepOf` (onb.stepof, with {n} and {total}), `optional` (onb.optional) */
  labels?: { stepOf?: string; optional?: string };
  children?: React.ReactNode;
}
export declare function OnboardingStep(props: OnboardingStepProps): JSX.Element;
/** A ticked line inside a step: "Pinned. Select … in the toolbar any time.", "Signed in as …", "Subscribed to aiBytes_ weekly." */
export declare function OnboardingStatus(props: { children: React.ReactNode }): JSX.Element;
