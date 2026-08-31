import React from "react";
export function Chip({ label, active = false, disabled = false, count, onClick }) {
  return (
    <button type="button" className="ldg-chip" aria-pressed={active} disabled={disabled} onClick={onClick}>
      {label}{count != null && <span className="ldg-chip__count">{count}</span>}
    </button>);
}
