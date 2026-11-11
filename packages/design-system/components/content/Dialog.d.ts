/** A modal dialog over a scrim: one question the reader answers or closes. Focus moves in on open (to the element marked `data-autofocus`, else the first control), Tab stays inside, the page behind does not scroll, and focus returns to the opener on close. Lay the content out with `.ldg-dialog__title` (the one heading), plain `<p>`s, and `.ldg-dialog__actions` for the buttons, which stack full-width below 481px. */
export interface DialogProps {
  /** renders nothing when false. Default true, so it can also be mounted conditionally */
  open?: boolean;
  /** called by Escape, the × and a press on the scrim. The dialog does not close itself */
  onClose?: () => void;
  /** id of the heading inside that names the dialog */
  labelledBy?: string;
  /** the name, when there is no visible heading to point at */
  label?: string;
  /** show the × in the top-right corner. Default true */
  dismissible?: boolean;
  /** extra class on the panel */
  className?: string;
  children?: React.ReactNode;
}
export declare function Dialog(props: DialogProps): JSX.Element | null;
