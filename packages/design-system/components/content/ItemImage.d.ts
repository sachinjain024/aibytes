import type { EditionItem } from "./Card";
/** The fixed square image slot on a Card or ListRow: the item's image, requested at the slot's size from hosts that support it (sizedImageUrl), lazy-loaded with fixed dimensions. The source mark fills the slot when there is no image or the image fails to load. */
export interface ItemImageProps {
  item: EditionItem;
  /** slot size in CSS px: 40 on a card, 24 in a list row */
  size: number;
  className: string;
  /** added for avatars, and for the GitHub mark */
  circleClassName?: string;
}
export declare function ItemImage(props: ItemImageProps): JSX.Element;
/** `src` resized for a `slot`-px square at `density`x, for TechCrunch, Product Hunt, and GitHub; any other URL unchanged. */
export declare function sizedImageUrl(src: string, slot: number, density?: number): string;
