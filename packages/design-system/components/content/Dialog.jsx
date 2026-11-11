import React from "react";

const FOCUSABLE = 'button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

// A modal dialog over a scrim, for one question the reader answers or closes.
// While open: focus moves in (to [data-autofocus], else the first control), Tab
// stays inside, the page behind does not scroll, and Escape, the × or a press
// on the scrim call onClose. On close, focus goes back to where it was.
export function Dialog({ open = true, onClose, labelledBy, label, dismissible = true, className, children }) {
  const ref = React.useRef(null);
  const close = React.useRef(onClose);
  close.current = onClose;
  React.useEffect(() => {
    if (!open) return undefined;
    const opener = document.activeElement;
    const controls = () => [...ref.current.querySelectorAll(FOCUSABLE)];
    (ref.current.querySelector("[data-autofocus]") || controls()[0] || ref.current).focus();
    const onKey = event => {
      if (event.key === "Escape") { event.stopPropagation(); close.current?.(); }
      if (event.key !== "Tab") return;
      const list = controls(), first = list[0], last = list[list.length - 1];
      if (!first) event.preventDefault();
      else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      if (opener && opener.isConnected && typeof opener.focus === "function") opener.focus();
    };
  }, [open]);
  if (!open) return null;
  return (
    <div className="ldg-dialog__scrim" onMouseDown={event => { if (event.target === event.currentTarget) onClose?.(); }}>
      <div className={"ldg-dialog" + (className ? " " + className : "")} role="dialog" aria-modal="true"
        aria-labelledby={labelledBy} aria-label={labelledBy ? undefined : label} tabIndex={-1} ref={ref}>
        {dismissible && (
          <button type="button" className="ldg-iconbtn ldg-dialog__close" aria-label="Close" onClick={() => onClose?.()}>
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" /></svg>
          </button>
        )}
        {children}
      </div>
    </div>
  );
}
