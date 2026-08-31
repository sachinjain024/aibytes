/** Save star: outline at rest, --save fill when saved. 32px tap target. aria-label flips Save/Saved. Saving is instant (local storage first), never a modal. */
export interface SaveStarProps {
  saved?: boolean;
  onToggle?: () => void;
  className?: string;
}
export declare function SaveStar(props: SaveStarProps): JSX.Element;
