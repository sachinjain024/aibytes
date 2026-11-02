/** Filter chip (Inter 13 / 500, radius 6). Category chips are single-select; tag/source chips are multi-select. States: default, hover (--surface-2), active (--accent border/text + --accent-tint), focus ring, disabled, optional count badge. */
export interface ChipProps {
  label: string;
  active?: boolean;
  disabled?: boolean;
  /** count badge, e.g. items in category */
  count?: number;
  onClick?: () => void;
  /** set when the chip opens a panel (Tags ▾, Sources ▾): renders aria-expanded instead of aria-pressed */
  expanded?: boolean;
}
/** @deprecated The shipped app has no chips: categories live in the sidebar rail, and tags and sources are checkboxes in the filter panel (RedesignFilters in apps/web/src/Redesign.jsx). Header still renders it internally. Kept only so the ui_kits screens still render; do not use it in new UI. It is removed once those screens are redrawn on the new shell (AIB-133k). */
export declare function Chip(props: ChipProps): JSX.Element;
