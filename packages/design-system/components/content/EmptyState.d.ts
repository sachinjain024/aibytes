/** Filter empty state: "No Repos in this edition. ← Aug 26 had 9." An invitation to act, not mood — same card language as content cards. */
export interface EmptyStateProps {
  /** category label, e.g. "Repos" */
  category?: string;
  /** previous edition short label, e.g. "Aug 26" */
  prevLabel?: string;
  prevCount?: number;
  onPrev?: () => void;
  /** when passed, adds "Clear filters." — for when paging back would not help either */
  onClear?: () => void;
  /** a search that matched nothing: renders "No items match “query”." instead, and the category props are ignored */
  query?: string;
  /** with query: adds a "Clear search" button */
  onClearQuery?: () => void;
}
export declare function EmptyState(props: EmptyStateProps): JSX.Element;
