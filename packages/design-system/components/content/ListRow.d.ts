import type { EditionItem } from "./Card";
/** List-view row, two lines: title over one-line summary; 24px image, mono meta (source · signals), save star, ⋮ context menu. 1px borders between rows, --surface-2 on hover. */
export interface ListRowProps {
  item: EditionItem;
  saved?: boolean;
  /** the save star renders only when this is passed */
  onToggleSave?: (id: string) => void;
  /** Where the save star sits: "actions" = after the ⋮ menu (default); "visual" = under the source image, in its column. */
  starPos?: "actions" | "visual";
}
export declare function ListRow(props: ListRowProps): JSX.Element;
