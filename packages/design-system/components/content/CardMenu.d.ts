import type { EditionItem } from "./Card";
/** Card context menu: a ⋮ kebab at the bottom-right of a card / right edge of a list row. Currently one item — "Open in" with ChatGPT, Claude, and Gemini icon buttons (new tab; prefilled prompt where the assistant supports it). More items land here later. 1px-border panel, no shadow. */
export interface CardMenuProps {
  item: EditionItem;
  /** open the panel upward (default; avoids clipping at card bottom) */
  up?: boolean;
}
export declare function CardMenu(props: CardMenuProps): JSX.Element;
