/** Edition calendar popover, opened from the edition-bar date. Lists AVAILABLE editions from index.json only — missing days are simply absent, never greyed (no fake editions). 1px border, no shadow. */
export interface CalendarPopoverProps {
  editions: { date: string; label: string; count: number }[];
  currentDate?: string;
  onSelect?: (date: string) => void;
}
export declare function CalendarPopover(props: CalendarPopoverProps): JSX.Element;
