/** The line under the save control after a save: "Added to your Saved items. View here", with "View here" linking to /saved. A status message, announced by screen readers. */
export interface SavedNoteProps {
  /** where View here goes; default "/saved" */
  href?: string;
}
export declare function SavedNote(props?: SavedNoteProps): JSX.Element;
