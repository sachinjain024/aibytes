import React from "react";
import { Icon } from "./icons.jsx";

// The masthead: menu button (phones only), brand, GitHub and the theme toggle.
export function AppHeader({ theme = "light", onToggleTheme, menuOpen = false, onMenu, githubUrl }) {
  return (
    <header className="masthead">
      {onMenu && (
        <button className="mobile-menu-button" aria-label="Toggle navigation" aria-controls="mobileSidebar" aria-expanded={menuOpen} onClick={onMenu}>
          <Icon name="menu" />
        </button>
      )}
      <a className="brand" href="/">
        <svg className="logo-mark" viewBox="0 0 24 30" fill="currentColor">
          <path d="M14 2 3 17h8l-1 11 11-16h-8l1-10Z" />
        </svg>
        aiBytes<span className="brand-dot">_</span>
      </a>
      <nav>
        {githubUrl && (
          <a className="github" href={githubUrl} target="_blank" rel="noreferrer" aria-label="GitHub">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M9 19c-4 1-4-2-6-3m12 6v-4c0-1-.3-2-1-2 4 0 6-2 6-6 0-2-1-3-2-4 0-1 0-2-1-3-2 0-3 1-4 1H9C8 3 6 3 5 3c-1 1-1 2-1 3-1 1-2 2-2 4 0 4 2 6 6 6-1 0-1 1-1 2v4" />
            </svg>
          </a>
        )}
        {onToggleTheme && (
          <button id="themeToggle" className="control" onClick={onToggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}>
            <Icon name={theme === "dark" ? "sun" : "moon"} />
          </button>
        )}
      </nav>
    </header>
  );
}
