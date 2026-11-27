// The extension popup's header (AIB-76n, A2 and C1): the compact wordmark and
// the edition's date, then the theme toggle, the saved toggle (a star and the count) and Sign in,
// or the reader's avatar with the same menu aibytes.io has (AccountMenu). The
// popup owns what each control does; this only draws them.
import React from "react";
import { Wordmark } from "../brand/Wordmark.jsx";
import { AccountMenu } from "../navigation/AppHeader.jsx";
import { Icon } from "../navigation/icons.jsx";

// An outline star: the filled --save star means an item is saved, not a toggle.
const STAR = <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17.6 6.1 20.8l1.3-6.5L2.5 9.8 9.1 9z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>;

export function PopupHeader({ date, theme = "light", onToggleTheme, savedCount = 0, savedActive = false, onToggleSaved, user, onSignIn, onSignOut, href = "https://aibytes.io/", labels = {} }) {
  const { saved = "Saved items", signIn = "Sign in", toDark = "Switch to dark theme", toLight = "Switch to light theme" } = labels;
  return (
    <header className="ldg-popup-head">
      <Wordmark variant="compact" href={href} />
      {date && <span className="ldg-popup-head__date">{date}</span>}
      <span className="ldg-popup-head__end">
        {onToggleTheme && (
          <button type="button" className="ldg-popup-theme" aria-label={theme === "dark" ? toLight : toDark} onClick={onToggleTheme}>
            <Icon name={theme === "dark" ? "sun" : "moon"} />
          </button>
        )}
        {onToggleSaved && (
          <button type="button" className={"ldg-popup-saved" + (savedActive ? " ldg-popup-saved--on" : "")} aria-pressed={savedActive} aria-label={saved} onClick={onToggleSaved}>
            {STAR}<span className="ldg-popup-saved__n">{savedCount}</span>
          </button>
        )}
        {user && onSignOut
          ? <AccountMenu user={user} onSignOut={onSignOut} />
          : !user && onSignIn && <button type="button" className="ldg-popup-signin" onClick={onSignIn}>{signIn}</button>}
      </span>
    </header>
  );
}
