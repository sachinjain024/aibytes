/** Sticky app header: wordmark · category chips · tag/source filter triggers · grid/list toggle · theme toggle · Sign in / avatar. Saved chip appears once anything is saved. On mobile (compact) the chips drop to a horizontal-scroll row.
 * Each control in the tools cluster renders only when its handler is passed (onOpenTags, onOpenSources, onView, onToggleTheme, onSignIn, onMode), so a surface that lacks a feature shows no dead control.
 * @startingPoint section="Components" subtitle="Sticky header with chips and toggles" viewport="1200x64"
 */
export interface HeaderProps {
  categories?: { key: string; label: string; count?: number }[];
  activeCategory?: string;
  onCategory?: (key: string) => void;
  savedCount?: number;
  savedActive?: boolean;
  onSaved?: () => void;
  tagCount?: number;
  onOpenTags?: () => void;
  /** whether the Tags panel is open, announced as aria-expanded */
  tagsOpen?: boolean;
  sourceCount?: number;
  onOpenSources?: () => void;
  /** whether the Sources panel is open, announced as aria-expanded */
  sourcesOpen?: boolean;
  view?: "grid" | "list";
  onView?: (view: "grid" | "list") => void;
  theme?: "light" | "dark";
  onToggleTheme?: () => void;
  signedIn?: boolean;
  userInitial?: string;
  onSignIn?: () => void;
  /** feed order: ranked = one curation-ordered list (default); grouped = category sections */
  mode?: "ranked" | "grouped";
  /** when provided, the Ranked | Grouped segmented control renders in the tools cluster */
  onMode?: (mode: "ranked" | "grouped") => void;
  /** mobile layout: chips become a horizontal scroll row */
  compact?: boolean;
  /** false hides the category chips (and Saved chip) — for layouts that move categories into a side nav */
  showCategories?: boolean;
  /** subtle mono tagline rendered in small type below the wordmark; omit to hide */
  tagline?: string;
}
export declare function Header(props: HeaderProps): JSX.Element;
