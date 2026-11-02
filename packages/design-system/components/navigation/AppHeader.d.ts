/** The app header (masthead): the menu button that opens the Sidebar drawer (phones only), the aiBytes_ wordmark linking home, then GitHub and the light/dark toggle at the right. 52px tall, sticky at the top; the Toolbar sticks right under it.
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
}
export declare function AppHeader(props: AppHeaderProps): JSX.Element;
