import React from "react";
import { CalendarPopover } from "./CalendarPopover.jsx";
export function EditionBar({ dateLabel, itemCount, updatedAgo, prevLabel, nextLabel, onPrev, onNext, onDateClick, calendarOpen = false, editions, currentDate, onSelectEdition, asH1 = true, compact = false }) {
  const H = asH1 ? "h1" : "span";
  return (
    <div className="ldg-edbar">
      <div className="ldg-edbar__in">
        <button type="button" className="ldg-edbar__nav" onClick={onPrev} disabled={!prevLabel} aria-label={prevLabel ? "Previous edition, " + prevLabel : "No previous edition"}>←{!compact && prevLabel ? " " + prevLabel : ""}</button>
        <H style={{ margin: 0, font: "inherit", letterSpacing: "inherit", display: "inline-flex" }}>
          <button type="button" className="ldg-edbar__date" onClick={onDateClick} aria-haspopup="listbox" aria-expanded={calendarOpen}>
            <strong>{dateLabel}</strong>
            {itemCount != null && <React.Fragment><span className="ldg-edbar__sep">·</span>{itemCount} items</React.Fragment>}
            {!compact && updatedAgo && <React.Fragment><span className="ldg-edbar__sep">·</span>updated {updatedAgo}</React.Fragment>}
          </button>
        </H>
        <button type="button" className="ldg-edbar__nav" onClick={onNext} disabled={!nextLabel} aria-label={nextLabel ? "Next edition, " + nextLabel : "This is the latest edition"}>{!compact && nextLabel ? nextLabel + " " : ""}→</button>
        {calendarOpen && editions && <CalendarPopover editions={editions} currentDate={currentDate} onSelect={onSelectEdition} />}
      </div>
    </div>);
}
