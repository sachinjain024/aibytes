import type { EditionItem } from "./Card";
/** List-view row, two lines: title over one-line summary; 24px image, mono meta (source · signals), save star, ⋮ context menu. 1px borders between rows, --surface-2 on hover. */
export interface ListRowProps {
  item: EditionItem;
  saved?: boolean;
  /** the item was on the Hacker News front page: a "Front page" label before the source name. Default off. */
  front?: boolean;
  /** the gist's page, for an item that has a gist. The title becomes this link, in the same tab; the source name still opens the source. Without it the title opens the item's own URL in a new tab, as before. */
  gistHref?: string;
  /** called on a plain click on the title (never a modified click, which follows `gistHref`). The app opens its panel here. */
  onOpenGist?: (item: EditionItem) => void;
  /** this card's gist is the one open in the panel: an accent edge and `aria-current`. Needs `gistHref`. */
  open?: boolean;
  /** the save star renders only when this is passed */
  onToggleSave?: (id: string) => void;
  /** Where the save star sits: "actions" = after the ⋮ menu (default); "visual" = under the source image, in its column. */
  starPos?: "actions" | "visual";
}
export declare function ListRow(props: ListRowProps): JSX.Element;
