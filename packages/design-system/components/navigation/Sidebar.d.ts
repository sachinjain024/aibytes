/** The category rail: All + one row per category with its count (the active one marked), then (with `onSaved`) a LIBRARY section with the Saved row, then the footer links and Subscribe at the bottom. No date picker: the date lives in the Toolbar. Below 761px it is a slide-out drawer opened by the AppHeader's menu button; while open it is a modal dialog behind a backdrop, traps Tab and closes on Esc.
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
  /** the LIBRARY section and its Saved row render only when this is passed, at any count */
  onSaved?: () => void;
  /** the count on the Saved row; 0 shows "0" (default 0) */
  savedCount?: number;
  /** the Saved page is showing: the Saved row is marked current (aria-current="page") and no category is, whatever `active` says */
  savedActive?: boolean;
}
export declare function Sidebar(props: SidebarProps): JSX.Element;
