import React from "react";
import { Out } from "./gistIcons.jsx";
import { PANEL, clampWidth, closeOnEscape, isNarrow, panelMax, widthForKey } from "./gistPanel.js";

// The panel beside the feed (and, on a phone, a full-screen sheet). It holds
// the width, the focus and the keys; what goes in it is the caller's, usually a
// GistView. Ledger stores nothing: the app keeps the width, like layout and
// density. While mounted it publishes its width as --gist-panel-w on the root,
// so the feed can leave room for it.

const SERVER_VIEWPORT = 1440; // what a server assumes; the browser replaces it on mount

function useViewportWidth() {
  const [viewport, setViewport] = React.useState(SERVER_VIEWPORT);
  React.useEffect(() => {
    const read = () => setViewport(window.innerWidth);
    read();
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
  }, []);
  return viewport;
}

function ResizeEdge({ width, viewport, onResize }) {
  const start = (event) => {
    event.preventDefault();
    const x0 = event.clientX, w0 = width;
    document.body.classList.add("gist-resizing");
    const move = (e) => onResize(w0 + (x0 - e.clientX));
    const up = () => {
      document.body.classList.remove("gist-resizing");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  const key = (event) => {
    const next = widthForKey(event.key, event.shiftKey, width, viewport);
    if (next == null) return;
    event.preventDefault();
    onResize(next);
  };
  return (
    <div className="gist-resize" role="separator" aria-orientation="vertical" aria-label="Resize the gist panel"
      aria-valuenow={width} aria-valuemin={PANEL.min} aria-valuemax={panelMax(viewport)} tabIndex={0}
      title="Drag to resize. Double-click to reset." onPointerDown={start} onKeyDown={key}
      onDoubleClick={() => onResize(PANEL.def)} />);
}

export function GistPanel({ gist, pageHref, onClose, width = PANEL.def, onWidthChange, children }) {
  const viewport = useViewportWidth();
  const narrow = isNarrow(viewport);
  const [held, setHeld] = React.useState(width);
  React.useEffect(() => { setHeld(width); }, [width]);
  const shown = clampWidth(held, viewport);
  const resize = (next) => {
    const clamped = clampWidth(next, viewport);
    setHeld(clamped);
    if (onWidthChange) onWidthChange(clamped);
  };

  const panel = React.useRef(null);
  const scroll = React.useRef(null);

  // Focus moves in on open and back to the card that opened it on close; Escape closes.
  React.useEffect(() => {
    const opener = document.activeElement;
    panel.current.focus();
    const onKey = (event) => closeOnEscape(event, onClose);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (opener && opener.isConnected) opener.focus();
    };
  }, []);

  // Another gist opens at the top.
  React.useEffect(() => { if (scroll.current) scroll.current.scrollTop = 0; }, [gist.slug]);

  // Tell the feed how much room the panel takes.
  React.useEffect(() => {
    const root = document.documentElement;
    if (narrow) root.style.removeProperty("--gist-panel-w");
    else root.style.setProperty("--gist-panel-w", shown + "px");
    return () => root.style.removeProperty("--gist-panel-w");
  }, [narrow, shown]);

  return (
    <aside className={"gist-panel" + (narrow ? " gist-panel--sheet" : "")} ref={panel} tabIndex={-1}
      role={narrow ? "dialog" : "complementary"} aria-modal={narrow || undefined} aria-labelledby="gist-title"
      style={narrow ? undefined : { width: shown }}>
      {!narrow && <ResizeEdge width={shown} viewport={viewport} onResize={resize} />}
      <div className="gist-panel-bar">
        <a className="gist-url" href={pageHref} title="Open the gist as its own page">aibytes.io/gists/{gist.slug}<Out /></a>
        <button type="button" className="ldg-iconbtn" aria-label="Close the gist" onClick={onClose}>
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5"/></svg>
        </button>
      </div>
      <div className="gist-panel-scroll" ref={scroll}>{children}</div>
    </aside>);
}
