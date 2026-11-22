/** How to pin the extension (AIB-76n, F1): a drawing of Chrome's toolbar looping through five frames (toolbar, puzzle icon, its menu, the pin, pinned), 1.1s each, with the frame's caption under it. Under prefers-reduced-motion it holds the last frame and lists all five captions. */
export interface PinAnimationProps {
  /** five captions, one per frame (onb.pin.1 to onb.pin.5) */
  captions: [string, string, string, string, string] | string[];
  /** forces the reduced-motion form on or off; by default it follows prefers-reduced-motion */
  reducedMotion?: boolean;
  /** the drawing's accessible name */
  label?: string;
}
export declare function PinAnimation(props: PinAnimationProps): JSX.Element;
