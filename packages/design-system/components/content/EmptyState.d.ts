/** Filter empty state: "No Repos in this edition. ← Aug 26 had 9." An invitation to act, not mood — same card language as content cards. */
export interface EmptyStateProps {
  /** category label, e.g. "Repos" */
  category: string;
  /** previous edition short label, e.g. "Aug 26" */
  prevLabel?: string;
  prevCount?: number;
  onPrev?: () => void;
  /** when passed, adds "Clear filters." — for when paging back would not help either */
  onClear?: () => void;
}
export declare function EmptyState(props: EmptyStateProps): JSX.Element;
