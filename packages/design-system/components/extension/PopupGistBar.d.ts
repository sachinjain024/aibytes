/** The top of a gist in the Chrome extension popup (AIB-76n, D2): one back button. */
export interface PopupGistBarProps {
  /** "← Today" (pop.back.today) or "← Saved" (pop.back.saved): the list the gist was opened from */
  backLabel?: string;
  onBack: () => void;
}
export declare function PopupGistBar(props: PopupGistBarProps): JSX.Element;
