/** Filter chip (Inter 13 / 500, radius 6). Category chips are single-select; tag/source chips are multi-select. States: default, hover (--surface-2), active (--accent border/text + --accent-tint), focus ring, disabled, optional count badge. */
export interface ChipProps {
  label: string;
  active?: boolean;
  disabled?: boolean;
  /** count badge, e.g. items in category */
  count?: number;
  onClick?: () => void;
}
export declare function Chip(props: ChipProps): JSX.Element;
