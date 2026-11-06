import React from "react";
import { gridColumns } from "./layout.js";
import { readChoice, THEME, writeChoice } from "./prefs.js";

// The theme on screen, and a toggle. Light unless the reader picked dark: the
// OS setting is not followed. The theme is always pinned on <html>, so Ledger's
// prefers-color-scheme tokens never apply; index.html sets it before first
// paint so a stored dark never flashes light, and the default never flashes dark.
export function useTheme() {
  const [choice, setChoice] = React.useState(() => readChoice(THEME));
  const theme = choice || "light";
  const toggle = React.useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    writeChoice(THEME, next);
    setChoice(next);
  }, [theme]);
  return [theme, toggle];
}

/** A stored choice such as VIEW, with a fallback and a setter that remembers it. */
export function useChoice(pref, fallback) {
  const [value, setValue] = React.useState(() => readChoice(pref) || fallback);
  const choose = React.useCallback((next) => {
    writeChoice(pref, next);
    setValue(next);
  }, [pref]);
  return [value, choose];
}

/** True while a media query matches, e.g. the phone layout. */
export function useMedia(query) {
  const [matches, setMatches] = React.useState(() => window.matchMedia(query).matches);
  React.useEffect(() => {
    const list = window.matchMedia(query);
    const onChange = () => setMatches(list.matches);
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

/** The Card grid's column count at `main`'s width, live, from its content box and
 * the --app-card-min and --grid-gap it carries (styles.css in the design system). `main` is the element,
 * not a ref: it remounts when the rail comes and goes, and the observer has to
 * follow it. One column until it is measured, then measured before paint, so a
 * stored list view never flashes as rows on a phone. */
export function useGridColumns(main) {
  const [columns, setColumns] = React.useState(1);
  React.useLayoutEffect(() => {
    if (!main) return undefined;
    const measure = () => {
      const style = getComputedStyle(main);
      const width = main.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      const min = parseFloat(style.getPropertyValue("--app-card-min"));
      const gap = parseFloat(style.getPropertyValue("--grid-gap")) || 0;
      if (min > 0) setColumns(gridColumns(width, min, gap));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(main);
    return () => observer.disconnect();
  }, [main]);
  return columns;
}

/** Calls onClose on Escape or on a pointer press outside `ref`, while `open`. */
export function useDismiss(ref, open, onClose) {
  React.useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => event.key === "Escape" && onClose();
    const onPointer = (event) => ref.current && !ref.current.contains(event.target) && onClose();
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [ref, open, onClose]);
}

/** While `open`, remembers what had focus (the trigger); when it closes with
 * focus lost to <body> - the focused popup was just removed, as on Escape or
 * picking a date - focus goes back to that trigger. A click elsewhere keeps
 * focus where the click put it. A layout effect, so it records the trigger
 * before a popup's own (passive) effect moves focus into it. */
export function useReturnFocus(open) {
  const trigger = React.useRef(null);
  React.useLayoutEffect(() => {
    if (open) {
      trigger.current = document.activeElement;
      return;
    }
    const el = trigger.current;
    trigger.current = null;
    const lost = !document.activeElement || document.activeElement === document.body;
    if (el && el.isConnected && lost) el.focus();
  }, [open]);
}
