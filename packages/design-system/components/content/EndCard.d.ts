/** End-of-edition footer card: "That's Aug 27. ← Read Aug 26". Replaces infinite scroll / Load more — the path back is always explicit. */
export interface EndCardProps {
  /** current edition short label, e.g. "Aug 27" */
  dateLabel: string;
  prevLabel?: string;
  onPrev?: () => void;
  /** The line under "You're all caught up." Defaults to "A little more informed. See you tomorrow." */
  note?: string;
  /** The back button's text. Defaults to "Previous edition". */
  prevText?: string;
}
export declare function EndCard(props: EndCardProps): JSX.Element;
