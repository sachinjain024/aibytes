/** The Chrome extension popup's footer (AIB-76n): a tinted 44px bar under the list, the meta in mono at the left and a link at the right. */
export interface PopupFooterProps {
  /** e.g. "Aug 27 · 28 items" (pop.foot.meta) */
  meta: React.ReactNode;
  /** the link, usually <a className="ldg-popup-link">View on Web</a> */
  children?: React.ReactNode;
}
export declare function PopupFooter(props: PopupFooterProps): JSX.Element;
