/** Quiet inline banner shown once anything is saved (signed-out only), dismissible per session. Sits below the edition bar without pushing it; never a toast. */
export interface SaveBannerProps {
  onSignIn?: () => void;
  onDismiss?: () => void;
}
export declare function SaveBanner(props: SaveBannerProps): JSX.Element;
