/** The aiBytes_ extension's icon: the favicon tile (white bolt on cobalt), fixed brand colours in both themes. PNGs for Chrome live in assets/extension/. */
export interface ExtensionIconProps {
  /** px; 20 inline with text (the onboarding's "Select [icon] in the toolbar"), 16 to 24 elsewhere */
  size?: number;
  /** An accessible name. Omit it when text beside the icon already names it: the icon is then aria-hidden */
  title?: string;
  className?: string;
}
export declare function ExtensionIcon(props: ExtensionIconProps): JSX.Element;
