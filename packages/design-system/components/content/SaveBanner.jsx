import React from "react";
import { Icon } from "../navigation/icons.jsx";

// The signed-out save banner: a warning icon, then the message, centred, with the
// dismiss button pinned right. A sticky banner sticks under the AppHeader and,
// while mounted, writes its height to --redesign-banner on the root, so the rail,
// drawer and toolbar (all offset by --redesign-top) clear it and move back up
// when it goes.
export function SaveBanner({ onSignIn, onDismiss, sticky = false }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!sticky || typeof ResizeObserver === "undefined") return;
    const root = document.documentElement;
    let last = -1;
    const observer = new ResizeObserver(() => {
      const height = Math.round(ref.current.getBoundingClientRect().height);
      if (height !== last) root.style.setProperty("--redesign-banner", (last = height) + "px");
    });
    observer.observe(ref.current);
    return () => { observer.disconnect(); root.style.removeProperty("--redesign-banner"); };
  }, [sticky]);

  return (
    <div className={"ldg-banner" + (sticky ? " ldg-banner--sticky" : "")} role="status" ref={ref}>
      <div className="ldg-banner__in">
        <span className="ldg-banner__msg">
          <Icon name="warning" strokeWidth="1.5" className="ldg-banner__icon" />
          <span>Saved items are stored in this browser's local storage. <a href="#signin" onClick={e => { e.preventDefault(); onSignIn && onSignIn(); }}>Sign in with Google</a> to sync them to your account.</span>
        </span>
        {onDismiss && <button type="button" className="ldg-iconbtn ldg-banner__dismiss" aria-label="Dismiss" onClick={onDismiss}>
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5"/></svg>
        </button>}
      </div>
    </div>);
}
