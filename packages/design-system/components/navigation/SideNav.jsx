import React from "react";
export function SideNavItem({ label, count, active, onClick, star }) {
  return (
    <button type="button" className="ldg-nav__item" aria-current={active || undefined} onClick={onClick}>
      <span className="ldg-nav__text">{star ? (active ? "\u2605 " : "\u2606 ") : ""}{label}</span>
      {count != null && count > 0 && <span className="ldg-nav__count">{count}</span>}
    </button>);
}
export function SideNav({ categories = [], activeCategory = "all", onCategory, allCount, savedLabel = "My Starred", savedCount = 0, savedActive = false, onSaved, dateMain, dateNote, dateSub, prevLabel, onPrev, nextLabel, onNext, editions = [], currentDate, onSelectEdition, calendarOpen, onToggleCalendar, children }) {
  const [openU, setOpenU] = React.useState(false);
  const open = calendarOpen != null ? calendarOpen : openU;
  const toggleCal = onToggleCalendar || (() => setOpenU(o => !o));
  return (
    <aside className="ldg-sidenav" aria-label="Categories">
      {dateMain && <div className="ldg-nav__date">
        <div className="ldg-nav__date-main">{dateMain}{dateNote && <span className="ldg-nav__date-sub" style={{ fontWeight: 400, marginLeft: 6 }}>{dateNote}</span>}</div>
        {dateSub && <div className="ldg-nav__date-sub">{dateSub}</div>}
        <div className="ldg-nav__date-links">
          {prevLabel && <button type="button" className="ldg-nav__link" onClick={onPrev}>← {prevLabel}</button>}
          {nextLabel && <button type="button" className="ldg-nav__link" onClick={onNext}>{nextLabel} →</button>}
          {editions.length > 0 && <button type="button" className="ldg-nav__link" style={{ marginLeft: "auto" }} aria-expanded={open} onClick={toggleCal}>Pick a date <span aria-hidden="true" style={{ fontSize: 9, verticalAlign: 1 }}>{open ? "▲" : "▼"}</span></button>}
        </div>
        {open && editions.length > 0 && <div className="ldg-nav__dates" role="listbox" aria-label="Editions">
          {editions.map(e => <button type="button" key={e.date} className="ldg-nav__item" aria-current={e.date === currentDate || undefined} onClick={() => onSelectEdition && onSelectEdition(e.date)}><span className="ldg-nav__text">{e.label}</span><span className="ldg-nav__count">{e.count}</span></button>)}
        </div>}
      </div>}
      <div className="ldg-nav__label">Categories</div>
      <SideNavItem label="All" count={allCount} active={activeCategory === "all"} onClick={() => onCategory && onCategory("all")} />
      {categories.map(c => <SideNavItem key={c.key} label={c.label} count={c.count} active={activeCategory === c.key} onClick={() => onCategory && onCategory(c.key)} />)}
      {(onSaved || savedCount > 0) && <React.Fragment>
        <div className="ldg-nav__label">Library</div>
        <SideNavItem label={savedLabel} count={savedCount} active={savedActive} onClick={onSaved} star />
      </React.Fragment>}
      {children}
    </aside>);
}
