import React from "react";
import { Button } from "../forms/Button.jsx";
const DEFAULT_LINKS = [
  { label: "Chrome Extension", href: "#extension" },
  { label: "GitHub", href: "#github" },
  { label: "X", href: "#x" },
  { label: "Advertise", href: "mailto:sachinjain.hq@gmail.com" }];
export function Footer({ links = DEFAULT_LINKS, blurb = "Join 1K+ developers reading aiBytes_ weekly", onSubscribe }) {
  return (
    <footer className="ldg-footer">
      <div className="ldg-footer__in">
        <nav className="ldg-footer__links" aria-label="Footer">
          {links.map(l => l.href ? <a key={l.label} href={l.href}>{l.label}</a> : <span key={l.label}>{l.label}</span>)}
        </nav>
        <form className="ldg-footer__sub" onSubmit={e => { e.preventDefault(); onSubscribe && onSubscribe(); }}>
          <span style={{ alignSelf: "center", marginRight: 4 }}>{blurb}</span>
          <Button variant="primary" type="submit">Subscribe</Button>
        </form>
      </div>
    </footer>);
}
