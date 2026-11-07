/** The app header (masthead): the menu button that opens the Sidebar drawer (phones only), the aiBytes_ wordmark linking home, then GitHub and the light/dark toggle at the right, then Sign in or the signed-in reader's avatar menu. 52px tall, sticky at the top; the Toolbar sticks right under it.
 * @startingPoint section="Components" subtitle="App header: menu, wordmark, GitHub, theme" viewport="1200x52"
 */
export interface AppHeaderProps {
  /** the theme in force; the toggle offers the other one */
  theme?: "light" | "dark";
  /** the theme toggle renders only when this is passed */
  onToggleTheme?: () => void;
  /** whether the Sidebar drawer is open, announced as aria-expanded */
  menuOpen?: boolean;
  /** the menu button (phones only) renders only when this is passed; omit it on a surface without a Sidebar */
  onMenu?: () => void;
  /** the GitHub link renders only when this is passed */
  githubUrl?: string;
  /** signed out: a "Sign in" control renders after the theme toggle when this is passed and `user` is not */
  onSignIn?: () => void;
  /** signed in: the avatar replaces Sign in. `photoUrl` is the Google profile photo (Firebase's photoURL); without one, or if it fails to load, the first letter of `name` shows */
  user?: { name: string; photoUrl?: string };
  /** the menu's Sign out item; the avatar renders only when this and `user` are passed */
  onSignOut?: () => void;
  /** the menu's Saved item renders only when this is passed */
  onSaved?: () => void;
}
export declare function AppHeader(props: AppHeaderProps): JSX.Element;
/** The avatar's menu on its own: the reader's name and "Signed in with Google", then Saved (with `onSaved`) and Sign out. Each item calls `onClose` before its handler. AppHeader renders it; it is exported for previews and tests. */
export declare function AccountMenuPanel(props: { user: { name: string; photoUrl?: string }; onSaved?: () => void; onSignOut: () => void; onClose?: () => void }): JSX.Element;
