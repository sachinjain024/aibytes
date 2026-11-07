import React from "react";
import { Icon } from "./icons.jsx";

const linkIcon = label => (label === "X" ? "x" : label === "Advertise" ? "advertise" : "link");

// The category rail on desktop; on phones the same element is the slide-out
// drawer, and while open it is a modal dialog behind a backdrop that traps Tab
// and closes on Esc. A link without href renders as plain text. With onSaved,
// a LIBRARY section holds the Saved row; savedActive makes it the current page.
export function Sidebar({ categories = [], count, active = "all", onCategory, open = false, onClose, links = [], subscribeUrl,
  onSaved, savedCount = 0, savedActive = false }) {
  const current = savedActive && onSaved ? null : active;
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const handle = e => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "Tab") {
        const nodes = [...ref.current.querySelectorAll("button,a[href]")];
        const first = nodes[0], last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handle);
    ref.current?.querySelector("button")?.focus();
    return () => {
      document.removeEventListener("keydown", handle);
      // Hand focus back to the menu button, but only where it is shown.
      if (ref.current?.contains(document.activeElement)) {
        const toggle = document.querySelector('[aria-controls="mobileSidebar"]');
        if (toggle && getComputedStyle(toggle).display !== "none") toggle.focus();
      }
    };
  }, [open]);

  return (
    <>
      {open && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={onClose} />}
      <aside className="sidebar" id="mobileSidebar" aria-label="Navigation" ref={ref} role={open ? "dialog" : undefined} aria-modal={open || undefined}>
        <div className="sidebar-label">CATEGORIES</div>
        <div className="categories">
          {[{ key: "all", label: "All", count }, ...categories].map(c => (
            <button key={c.key} className={"category" + (current === c.key ? " active" : "")} aria-current={current === c.key || undefined} onClick={() => onCategory?.(c.key)}>
              {c.label}
              <span>{c.count ?? "–"}</span>
            </button>
          ))}
        </div>
        {onSaved && (
          <div className="sidebar-saved">
            <div className="sidebar-label">LIBRARY</div>
            <button className={"category" + (savedActive ? " active" : "")} aria-current={savedActive ? "page" : undefined} onClick={onSaved}>
              <span className="sidebar-saved__name"><Icon name="star" fill="currentColor" className="sidebar-saved__star" />Saved</span>
              <span>{savedCount}</span>
            </button>
          </div>
        )}
        <div className="sidebar-footer">
          <div className="sidebar-links">
            {links.map(l => l.href ? (
              <a key={l.label} href={l.href} target="_blank" rel="noreferrer">
                <Icon name={linkIcon(l.label)} className="link-icon" />
                <span>{l.label}</span>
                <Icon name="arrow" className="link-arrow" />
              </a>
            ) : (
              <span key={l.label}>{l.label}</span>
            ))}
          </div>
          {subscribeUrl && (
            <div className="newsletter">
              <p>Read aiBytes_ weekly</p>
              <a className="subscribe-link" href={subscribeUrl}>Subscribe <Icon name="arrow" /></a>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
