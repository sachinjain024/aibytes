// The extension popup's footer (AIB-76n): a tinted 44px bar pinned under the
// list, the edition's date and count at the left, a link at the right. A div,
// not <footer>: styles.css styles the site's bare footer element.
import React from "react";

export function PopupFooter({ meta, children }) {
  return (
    <div className="ldg-popup-foot">
      <span className="ldg-popup-foot__meta">{meta}</span>
      {children}
    </div>
  );
}
