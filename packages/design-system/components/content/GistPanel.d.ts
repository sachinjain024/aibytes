import type { Gist } from "./GistView";
/** The gist panel beside the feed: a top bar with a link to the gist's own page and a close button, then a scroll area for its children (usually a GistView). A separator on its left edge resizes it: drag, arrow keys (Shift for bigger steps, Home widest, End narrowest), double-click to reset. 460px by default, never under 360px, never so wide that the feed drops under about 440px. Escape closes it and focus returns to the card that opened it. At 760px and under it is a full-screen dialog with no resize edge. While mounted it writes its width to --gist-panel-w on the root. Ledger stores nothing; the app keeps the width.
 * @startingPoint section="Components" subtitle="Gist panel" viewport="900x640"
 */
export interface GistPanelProps {
  gist: Gist;
  /** where the bar's link goes: the gist's own page */
  pageHref: string;
  onClose: () => void;
  /** width in px; default 460. Held between 360 and the widest the viewport allows. */
  width?: number;
  /** called with the new width after a drag, a key or a double-click, for the app to keep */
  onWidthChange?: (px: number) => void;
  /** changes when another card opens the panel (an id is enough). Closing returns focus to the card last clicked, and a second card showing the same gist is a new opener even though `gist` has not changed. */
  openerKey?: string | number;
  children?: React.ReactNode;
}
export declare function GistPanel(props: GistPanelProps): JSX.Element;
