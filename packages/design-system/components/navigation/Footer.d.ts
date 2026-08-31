/** App footer: link row (Chrome Extension, GitHub, X, Advertise mailto by default) + the inline subscribe blurb and Subscribe button. In the app shell it sticks to the viewport bottom (screen-level CSS). */
export interface FooterProps {
  links?: { label: string; href: string }[];
  /** copy before the Subscribe button; default "Join 1K+ developers reading aiBytes_ weekly" */
  blurb?: string;
  onSubscribe?: () => void;
}
export declare function Footer(props: FooterProps): JSX.Element;
