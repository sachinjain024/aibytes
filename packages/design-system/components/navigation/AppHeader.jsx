import React from "react";
import { Icon } from "./icons.jsx";

// Photo URLs that failed to load this session; the avatar shows the initial for them from then on.
const failedPhotos = new Set();

// The signed-in reader's menu: who they are, then Saved and Sign out. Each item closes the menu first.
export function AccountMenuPanel({ user, onSaved, onSignOut, onClose }) {
  const pick = handler => () => { onClose?.(); handler(); };
  return (
    <div className="ldg-menu__panel account__panel" role="menu" aria-label="Account">
      <div className="account__who">
        <span className="account__name">{user.name}</span>
        <span className="account__via">Signed in with Google</span>
      </div>
      {onSaved && <button type="button" role="menuitem" className="account__item" onClick={pick(onSaved)}>Saved</button>}
      <button type="button" role="menuitem" className="account__item" onClick={pick(onSignOut)}>Sign out</button>
    </div>
  );
}

// The avatar: the Google profile photo, or the reader's initial when there is none or it fails to load.
// It opens AccountMenuPanel, which closes like CardMenu: Escape (focus returns here) or a pointer down outside.
function Account({ user, onSaved, onSignOut }) {
  const [open, setOpen] = React.useState(false);
  const [failed, setFailed] = React.useState(() => failedPhotos.has(user.photoUrl));
  const root = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    root.current?.querySelector('[role="menuitem"]')?.focus();
    const dismiss = event => {
      if (event.key === "Escape") { setOpen(false); root.current?.querySelector(".account")?.focus(); }
      if (event.type === "pointerdown" && !root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("keydown", dismiss);
    document.addEventListener("pointerdown", dismiss);
    return () => { document.removeEventListener("keydown", dismiss); document.removeEventListener("pointerdown", dismiss); };
  }, [open]);
  const initial = (Array.from(user.name.trim())[0] || "?").toUpperCase();
  const photo = user.photoUrl && !failed;
  return (
    <span className="ldg-menu account__wrap" ref={root}>
      <button type="button" className="account" aria-label={`Account: ${user.name}`} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        {photo
          ? <img className="account__photo" src={user.photoUrl} alt="" referrerPolicy="no-referrer" onError={() => { failedPhotos.add(user.photoUrl); setFailed(true); }} />
          : <span className="account__initial" aria-hidden="true">{initial}</span>}
      </button>
      {open && <AccountMenuPanel user={user} onSaved={onSaved} onSignOut={onSignOut} onClose={() => setOpen(false)} />}
    </span>
  );
}

// The masthead: menu button (phones only), brand, GitHub and the theme toggle, then Sign in
// (signed out, with onSignIn) or the account avatar (signed in, with user and onSignOut).
export function AppHeader({ theme = "light", onToggleTheme, menuOpen = false, onMenu, githubUrl, onSignIn, user, onSignOut, onSaved }) {
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
        {user && onSignOut
          ? <Account user={user} onSaved={onSaved} onSignOut={onSignOut} />
          : !user && onSignIn && <button type="button" className="control signin" onClick={onSignIn}>Sign in</button>}
      </nav>
    </header>
  );
}
