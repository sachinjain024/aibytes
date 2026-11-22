/** The bottom of a gist in the Chrome extension popup (AIB-76n, D2): the SaveStar, "Save" or "Saved", and a link at the right. */
export interface PopupActionBarProps {
  saved?: boolean;
  onToggleSave: () => void;
  /** copy: pop.gist.save and pop.gist.saved */
  labels?: { save?: string; saved?: string };
  /** the link, usually <a className="ldg-popup-link">View on Web</a> */
  children?: React.ReactNode;
}
export declare function PopupActionBar(props: PopupActionBarProps): JSX.Element;
