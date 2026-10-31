import React from "react";
import { CalendarPopover } from "./CalendarPopover.jsx";
const arrow = direction => <svg className="ldg-edbar__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={direction === "left" ? "M19 12H5m7-7-7 7 7 7" : direction === "right" ? "M5 12h14m-7-7 7 7-7 7" : "m6 9 6 6 6-6"}/></svg>;
export function EditionBar({ dateLabel, itemCount, updatedAgo, prevLabel, nextLabel, onPrev, onNext, onDateClick, calendarOpen = false, editions, currentDate, onSelectEdition, asH1 = true, compact = false, arrows = true }) {
  const H = asH1 ? "h1" : "span";
  return (
    <div className="ldg-edbar">
      <div className="ldg-edbar__in">
        {arrows && <button type="button" className="ldg-edbar__nav" onClick={onPrev} disabled={!prevLabel} aria-label={prevLabel ? "Previous edition, " + prevLabel : "No previous edition"}>{arrow("left")}{!compact && prevLabel ? " " + prevLabel : ""}</button>}
        <H style={{ margin: 0, font: "inherit", letterSpacing: "inherit", display: "inline-flex" }}>
          <button type="button" className="ldg-edbar__date" onClick={onDateClick} aria-haspopup="dialog" aria-expanded={calendarOpen}>
            <strong>{dateLabel}</strong>
            {itemCount != null && <React.Fragment><span className="ldg-edbar__sep">·</span>{itemCount} items</React.Fragment>}
            {!compact && updatedAgo && <React.Fragment><span className="ldg-edbar__sep">·</span>updated {updatedAgo}</React.Fragment>}
            {arrow("down")}
          </button>
        </H>
        {arrows && <button type="button" className="ldg-edbar__nav" onClick={onNext} disabled={!nextLabel} aria-label={nextLabel ? "Next edition, " + nextLabel : "This is the latest edition"}>{!compact && nextLabel ? nextLabel + " " : ""}{arrow("right")}</button>}
        {calendarOpen && editions && <CalendarPopover editions={editions} currentDate={currentDate} onSelect={onSelectEdition} />}
      </div>
    </div>);
}
