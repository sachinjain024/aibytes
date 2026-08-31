import React from "react";
export function SaveStar({ saved = false, onToggle, className = "" }) {
  return (
    <button type="button" className={"ldg-star" + (saved ? " ldg-star--saved" : "") + (className ? " " + className : "")} aria-label={saved ? "Saved" : "Save"} aria-pressed={saved} onClick={onToggle}>
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17.6 6.1 20.8l1.3-6.5L2.5 9.8 9.1 9z" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>
    </button>);
}
