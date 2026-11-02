/** The category rail: All + one row per category with its count (the active one marked), then the footer links and Subscribe at the bottom. No date picker: the date lives in the Toolbar. Below 761px it is a slide-out drawer opened by the AppHeader's menu button; while open it is a modal dialog behind a backdrop, traps Tab and closes on Esc.
 * @startingPoint section="Components" subtitle="Category rail + links; the mobile drawer" viewport="260x620"
 */
export interface SidebarProps {
  categories?: { key: string; label: string; count?: number }[];
  /** count on the All row */
  count?: number;
  /** the selected category key; "all" for everything */
  active?: string;
  onCategory?: (key: string) => void;
  /** the drawer is open (phones) */
  open?: boolean;
  onClose?: () => void;
  /** footer links in order; one without href renders as plain text, e.g. "Chrome Extension (soon)" */
  links?: { label: string; href?: string }[];
  /** the "Read aiBytes_ weekly · Subscribe" block renders only when this is passed */
  subscribeUrl?: string;
}
export declare function Sidebar(props: SidebarProps): JSX.Element;
