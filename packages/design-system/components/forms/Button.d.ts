/** Ledger button. Primary = accent fill, secondary = 1px border, ghost = text-only, google = Google sign-in per brand rules tuned to tokens. No shadows, 120ms transitions.
 * @startingPoint section="Components" subtitle="Primary / secondary / ghost / Google sign-in" viewport="700x200"
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "google";
}
export declare function Button(props: ButtonProps): JSX.Element;
