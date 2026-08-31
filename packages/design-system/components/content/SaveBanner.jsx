import React from "react";
export function SaveBanner({ onSignIn, onDismiss }) {
  return (
    <div className="ldg-banner" role="status">
      <div className="ldg-banner__in">
        <span style={{ flex: 1 }}>Saved items are stored in this browser only. <a href="#signin" onClick={e => { e.preventDefault(); onSignIn && onSignIn(); }}>Sign in with Google</a> to keep them across devices.</span>
        {onDismiss && <button type="button" className="ldg-iconbtn" aria-label="Dismiss" onClick={onDismiss} style={{ width: 24, height: 24 }}>
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5"/></svg>
        </button>}
      </div>
    </div>);
}
