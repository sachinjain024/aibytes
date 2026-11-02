/** Side navigation rail for the full-page layout — the alternative to header category chips. Top: date widget (current edition, prev / Latest links, "Pick a date" edition list). Middle: Categories with counts (All + one per category, active = inset accent bar). Bottom: Library / My Starred. Sticky under the header (set --ldg-header-h on an ancestor to the sticky-cluster height, and --ldg-footer-h to a sticky footer's height, default 0px, so the rail ends where the footer starts); hidden below 900px, so keep header chips on mobile.
 */
export interface SideNavEditionRef { date: string; label: string; count?: number }
export interface SideNavProps {
  categories?: { key: string; label: string; count?: number }[];
  activeCategory?: string;
  onCategory?: (key: string) => void;
  /** count shown on the All item */
  allCount?: number;
  /** Library item label (default "My Starred") */
  savedLabel?: string;
  savedCount?: number;
  savedActive?: boolean;
  onSaved?: () => void;
  /** date widget renders only when set — e.g. "Today" or "Aug 25"; omit in saved view */
  dateMain?: string;
  /** light inline note after dateMain, e.g. "(Aug 27, 2026)" when dateMain is "Today" */
  dateNote?: string;
  /** mono second line, e.g. "Aug 25, 2026 · 2 days ago" — for non-latest editions */
  dateSub?: string;
  /** rendered as "← {prevLabel}" */
  prevLabel?: string;
  onPrev?: () => void;
  /** rendered as "{nextLabel} →" — usually "Latest"; omit on the latest edition */
  nextLabel?: string;
  onNext?: () => void;
  /** available editions for the "Pick a date" list (newest first); a labelled group, the current one aria-current="date" */
  editions?: SideNavEditionRef[];
  currentDate?: string;
  onSelectEdition?: (date: string) => void;
  /** controlled open state of the edition list; omit to let the rail manage it */
  calendarOpen?: boolean;
  onToggleCalendar?: () => void;
  children?: React.ReactNode;
}
/** @deprecated The shipped app replaced it with a category rail that becomes the mobile drawer (RedesignSidebar in apps/web/src/Redesign.jsx); the date picker moved to the toolbar as EditionBar + CalendarPopover. Kept only so the ui_kits screens still render; do not use it in new UI. It is removed once those screens are redrawn on the new shell (AIB-133k). */
export declare function SideNav(props: SideNavProps): JSX.Element;
/** One rail row: label left, mono count right; star=true prefixes ☆/★.
 * @deprecated Part of SideNav, which is deprecated. */
export declare function SideNavItem(props: { label: string; count?: number; active?: boolean; onClick?: () => void; star?: boolean }): JSX.Element;
