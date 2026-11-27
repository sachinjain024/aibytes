/** The Chrome extension popup's header (AIB-76n, A2): the compact wordmark and the edition's date, then the theme toggle (a moon, or a sun in dark), the saved toggle (an outline star and the count) and Sign in, or the reader's avatar with aibytes.io's account menu. 48px tall. */
export interface PopupHeaderProps {
  /** the edition's date as shown, e.g. "Wed, Aug 27" (format.js midDate) */
  date?: string;
  /** the theme showing; the toggle offers the other one. Default "light" */
  theme?: "light" | "dark";
  /** the theme toggle renders, before the saved toggle, only when this is passed */
  onToggleTheme?: () => void;
  /** how many items are saved; shown in mono beside the star */
  savedCount?: number;
  /** true while the Saved list shows: the toggle is pressed */
  savedActive?: boolean;
  /** the saved toggle renders only when this is passed */
  onToggleSaved?: () => void;
  /** signed in: the avatar replaces Sign in. `email` shows in the menu under the name */
  user?: { name: string; email?: string; photoUrl?: string } | null;
  /** signed out: the Sign in link renders when this is passed and `user` is not */
  onSignIn?: () => void;
  /** the menu's Sign out; the avatar renders only when this and `user` are passed */
  onSignOut?: () => void;
  /** where the wordmark links; the popup opens it in a new tab */
  href?: string;
  /** copy: `saved` is the toggle's accessible name (pop.savedbtn), `signIn` the link (pop.signin), `toDark`/`toLight` the theme toggle's name in each theme (pop.theme.dark, pop.theme.light) */
  labels?: { saved?: string; signIn?: string; toDark?: string; toLight?: string };
}
export declare function PopupHeader(props: PopupHeaderProps): JSX.Element;
