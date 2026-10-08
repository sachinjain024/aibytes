import React from "react";
export function Chip({ label, active = false, disabled = false, count, onClick, expanded }) {
  // A chip that opens a panel is a disclosure, not a toggle: it announces
  // aria-expanded, and shows `active` (a selection inside) by class instead.
  const disclosure = expanded !== undefined;
  return (
    <button type="button" className={"ldg-chip" + (disclosure && active ? " ldg-chip--active" : "")}
      aria-pressed={disclosure ? undefined : active} aria-expanded={disclosure ? expanded : undefined}
      disabled={disabled} onClick={onClick}>
      {label}{count != null && <span className="ldg-chip__count">{count}</span>}
    </button>);
}
