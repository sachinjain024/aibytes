/** App footer: link row (Chrome Extension, GitHub, X, Advertise mailto by default) + the inline subscribe blurb and Subscribe button. In the app shell it sticks to the viewport bottom (screen-level CSS). */
export interface FooterProps {
  /** an entry without `href` renders as plain text, e.g. "Chrome Extension (soon)" */
  links?: { label: string; href?: string }[];
  /** copy before the Subscribe button; default "Join 1K+ developers reading aiBytes_ weekly" */
  blurb?: string;
  onSubscribe?: () => void;
}
/** @deprecated The shipped app moved the footer links and Subscribe into the bottom of the sidebar and mobile drawer (RedesignSidebar in apps/web/src/Redesign.jsx). Kept only so the ui_kits screens still render; do not use it in new UI. It is removed once those screens are redrawn on the new shell (AIB-133k). */
export declare function Footer(props: FooterProps): JSX.Element;
