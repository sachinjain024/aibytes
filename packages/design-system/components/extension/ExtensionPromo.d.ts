/** The Chrome extension's install box in aibytes.io's rail (AIB-76n, H3): the extension's icon and name, one line, a primary "Add to Chrome" link to the store (a new tab) and a "Not now" text button. Goes in Sidebar's `promo`. */
export interface ExtensionPromoProps {
  /** the Chrome Web Store listing */
  href: string;
  /** "Not now"; it renders only when this is passed. The app remembers the dismissal */
  onDismiss?: () => void;
  /** copy: site.name, site.h3.body, site.cta, site.notnow */
  labels?: { name?: string; body?: string; cta?: string; notNow?: string };
}
export declare function ExtensionPromo(props: ExtensionPromoProps): JSX.Element;
