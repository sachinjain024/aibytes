import React from "react";

const THEME_KEY = "aibytes-theme";
const DARK = "(prefers-color-scheme: dark)";

function stored() {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

// The theme on screen, and a toggle. With no stored choice the OS decides,
// live, through Ledger's prefers-color-scheme tokens and no data-theme at all.
// The toggle pins a choice on <html> and remembers it; index.html applies a
// stored choice before first paint so it never flashes the other theme.
export function useTheme() {
  const [choice, setChoice] = React.useState(stored);
  const [systemDark, setSystemDark] = React.useState(() => window.matchMedia(DARK).matches);

  React.useEffect(() => {
    const query = window.matchMedia(DARK);
    const onChange = () => setSystemDark(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const theme = choice || (systemDark ? "dark" : "light");
  const toggle = React.useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Private mode: the choice holds for this page view only.
    }
    setChoice(next);
  }, [theme]);
  return [theme, toggle];
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
