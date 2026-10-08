import React from "react";
import { Wordmark } from "../brand/Wordmark.jsx";
import { Chip } from "./Chip.jsx";
import { Button } from "../forms/Button.jsx";
const iGrid = <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M1 1h5v5H1zM8 1h5v5H8zM1 8h5v5H1zM8 8h5v5H8z" fill="currentColor"/></svg>;
const iList = <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M1 2.5h12M1 7h12M1 11.5h12" stroke="currentColor" strokeWidth="1.8"/></svg>;
const iSun = <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.7"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8" stroke="currentColor" strokeWidth="1.7"/></svg>;
const iMoon = <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>;
export function Header({ categories = [], activeCategory = "all", onCategory, savedCount = 0, savedActive = false, onSaved, tagCount = 0, onOpenTags, tagsOpen = false, sourceCount = 0, onOpenSources, sourcesOpen = false, view = "grid", onView, theme = "light", onToggleTheme, signedIn = false, userInitial = "S", onSignIn, compact = false, mode = "ranked", onMode, showCategories = true, tagline }) {
  const brand = tagline
    ? <span className="ldg-header__brand"><Wordmark variant="compact" /><span className="ldg-header__tagline">{tagline}</span></span>
    : <Wordmark variant="compact" />;
  const chips = !showCategories ? null : (
    <nav className="ldg-header__chips" aria-label="Categories">
      <Chip label="All" active={activeCategory === "all" && !savedActive} onClick={() => onCategory && onCategory("all")} />
      {categories.map(c => <Chip key={c.key} label={c.label} count={c.count} active={activeCategory === c.key && !savedActive} onClick={() => onCategory && onCategory(c.key)} />)}
      {savedCount > 0 && <Chip label="Saved" count={savedCount} active={savedActive} onClick={onSaved} />}
    </nav>);
  const tools = (
    <div className="ldg-header__tools">
      {onMode && <span className="ldg-seg" role="group" aria-label="Feed order">
        <button type="button" className="ldg-seg__btn" aria-pressed={mode === "ranked"} onClick={() => onMode("ranked")}>Ranked</button>
        <button type="button" className="ldg-seg__btn" aria-pressed={mode === "grouped"} onClick={() => onMode("grouped")}>Grouped</button>
      </span>}
      {!compact && onOpenTags && <Chip label="Tags ▾" count={tagCount || undefined} active={tagCount > 0} expanded={tagsOpen} onClick={onOpenTags} />}
      {!compact && onOpenSources && <Chip label="Sources ▾" count={sourceCount || undefined} active={sourceCount > 0} expanded={sourcesOpen} onClick={onOpenSources} />}
      {onView && <span className="ldg-seg" role="group" aria-label="View">
        <button type="button" className="ldg-iconbtn" aria-pressed={view === "grid"} aria-label="Grid view" onClick={() => onView("grid")}>{iGrid}</button>
        <button type="button" className="ldg-iconbtn" aria-pressed={view === "list"} aria-label="List view" onClick={() => onView("list")}>{iList}</button>
      </span>}
      {onToggleTheme && <button type="button" className="ldg-iconbtn" aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"} onClick={onToggleTheme}>{theme === "light" ? iMoon : iSun}</button>}
      {signedIn ? <span className="ldg-avatar" title="Signed in">{userInitial}</span> : onSignIn && <Button variant="primary" onClick={onSignIn}>Sign in</Button>}
    </div>);
  if (compact) return (
    <header className="ldg-header">
      <div className="ldg-header__in" style={{ paddingBottom: chips ? 6 : undefined }}>{brand}{tools}</div>
      {chips && <div className="ldg-header__in" style={{ paddingTop: 0 }}>{chips}</div>}
    </header>);
  return (
    <header className="ldg-header">
      <div className="ldg-header__in">{brand}{chips}{tools}</div>
    </header>);
}
