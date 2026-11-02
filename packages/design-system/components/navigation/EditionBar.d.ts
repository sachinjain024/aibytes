/** THE signature element: the edition's date, and the way to every other edition. By default it is the date picker at the end of the Toolbar, as the app shows it: compact, no arrows, not a heading; clicking the date opens the calendar popover. The full bar (asH1, compact={false}, arrows) remains for a page that leads with the date.
 * @startingPoint section="Components" subtitle="The signature dated ledger bar" viewport="700x60"
 */
export interface EditionBarProps {
  /** e.g. "Wed, Aug 27, 2026" */
  dateLabel: string;
  itemCount?: number;
  /** e.g. "4h ago" */
  updatedAgo?: string;
  /** short labels, e.g. "Aug 26"; omit to disable the arrow */
  prevLabel?: string;
  nextLabel?: string;
  onPrev?: () => void;
  onNext?: () => void;
  onDateClick?: () => void;
  calendarOpen?: boolean;
  editions?: { date: string; label: string; count: number }[];
  currentDate?: string;
  onSelectEdition?: (date: string) => void;
  /** render the date as the page <h1> (default false: the app gives the page a visually hidden h1 instead) */
  asH1?: boolean;
  /** one line, no "updated" note, bare arrows (default true, as in the toolbar) */
  compact?: boolean;
  /** previous/next arrows (default false: in the toolbar the calendar is the way between editions) */
  arrows?: boolean;
}
export declare function EditionBar(props: EditionBarProps): JSX.Element;
