/** Ledger button. Primary = accent fill, secondary = 1px border, ghost = text-only, google = Google sign-in per brand rules tuned to tokens. No shadows, 120ms transitions.
 * @startingPoint section="Components" subtitle="Primary / secondary / ghost / Google sign-in" viewport="700x200"
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "google";
  /** "lg": 48px tall, 16px semibold, full width up to 360px (the Google sign-in on the extension's onboarding, AIB-76n). Absent = the regular size, markup unchanged. */
  size?: "lg";
}
export declare function Button(props: ButtonProps): JSX.Element;
