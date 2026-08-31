import React from "react";
export function CalendarPopover({ editions = [], currentDate, onSelect }) {
  return (
    <div className="ldg-cal" role="listbox" aria-label="Available editions">
      {editions.map(e => (
        <button key={e.date} type="button" role="option" aria-selected={e.date === currentDate} className={"ldg-cal__row" + (e.date === currentDate ? " ldg-cal__row--current" : "")} onClick={() => onSelect && onSelect(e.date)}>
          <span>{e.label}</span><span className="ldg-count">{e.count} items</span>
        </button>))}
    </div>);
}
