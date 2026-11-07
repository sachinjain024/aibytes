/** The signed-out save banner, shown once anything is saved and dismissible per session; never a toast. A 1.5px warning icon, then "Saved items are stored in this browser only. Sign in with Google to keep them across devices.", centred, with the dismiss button pinned right. Below 761px the message wraps and is left-aligned. */
export interface SaveBannerProps {
  /** the "Sign in with Google" link */
  onSignIn?: () => void;
  /** the dismiss button renders only when this is passed */
  onDismiss?: () => void;
  /** stick under the AppHeader at full width, over the Sidebar. Render it straight after AppHeader. While mounted it writes its height to --redesign-banner on the root, so everything offset by --redesign-top (the rail, the phone drawer and its backdrop, the sticky toolbar) clears it, and moves back up when it unmounts */
  sticky?: boolean;
}
export declare function SaveBanner(props: SaveBannerProps): JSX.Element;
