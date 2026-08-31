/** THE signature element: a dated, pageable ledger of days, always visible under the header (sticky together). JetBrains Mono. The date is the page H1 by default (open decision #2). Right arrow disabled on the latest edition. Date click opens the calendar popover.
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
  /** render the date as the page <h1> (recommended) */
  asH1?: boolean;
  /** mobile: date centered, bare arrows at the edges, one line */
  compact?: boolean;
}
export declare function EditionBar(props: EditionBarProps): JSX.Element;
