import React from "react";
import { gridColumns } from "./layout.js";
import { readChoice, THEME, writeChoice } from "./prefs.js";
import { planPress, pressed, zeroTotals } from "./reactionKeys.js";

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

/**
 * A saves store (saves.js) as render state: `saves` newest first, `has(id)`,
 * and the store's `toggle`. Re-renders on every change, in this tab or another.
 */
export function useSaves(store) {
  const saves = React.useSyncExternalStore(store.subscribe, store.list, store.list);
  const ids = React.useMemo(() => new Set(saves.map((save) => save.item_id)), [saves]);
  return { saves, has: (id) => ids.has(id), toggle: store.toggle };
}

/**
 * The reactions on one gist as render state (spec AIB-145y-app-reactions): what GistActions
 * takes as `reactions`. `store` is reactions.js's, or null while Firebase has not loaded;
 * `user` is undefined while the session restores, null signed out, an object signed in.
 *
 * Counts load once when the gist opens, never live. A press shows at once and is undone,
 * with a line saying so, if the write fails. Signed out, a press applies nothing and shows
 * "Please sign in to add your reaction" with a Sign in link (`askSignIn`); the link, not the
 * press, opens Google (`onSignIn`). A press is held until the reader's own set has loaded, and while the
 * last press is still being written.
 */
export function useReactions(slug, { store, user, signIn }) {
  const [state, setState] = React.useState(null);
  const [tries, setTries] = React.useState(0);
  const [asking, setAsking] = React.useState(null); // the slug a signed-out press was made on
  const writing = React.useRef(false);
  React.useEffect(() => {
    if (!slug || !store) return undefined;
    let live = true;
    store.load(slug).then(({ totals, mine }) => {
      if (!live) return;
      setState({ slug, store, totals: totals || zeroTotals(), mine: mine || [], mineKnown: mine !== null, message: mine === null ? "Could not load your reactions. Try again." : null });
    });
    return () => { live = false; };
  }, [slug, store, tries]);
  if (!slug) return null;
  // On this gist, before its first load: the bar at zero with nothing pressed. After a
  // sign-in or sign-out (a new store) the public totals stay on screen while the new load
  // runs; only the reader's own marks are cleared, since they belong to whoever was signed in.
  const sameGist = state && state.slug === slug;
  const current = sameGist && state.store === store ? state
    : sameGist ? { ...state, mine: [], mineKnown: !store?.signedIn, message: null }
    : { slug, totals: zeroTotals(), mine: [], mineKnown: !store?.signedIn, message: null };
  const onToggle = (key) => {
    const plan = planPress({ user, mineKnown: Boolean(store) && current.mineKnown, writing: writing.current });
    if (plan === "ask") setAsking(slug);
    if (plan === "hold" && state && state.slug === slug && state.mineKnown === false) setTries((n) => n + 1);
    if (plan !== "write") return;
    const before = current;
    const next = pressed(before, key);
    writing.current = true;
    setState({ ...before, ...next, store, message: null });
    store.toggle(slug, key).catch(() => {
      setState((now) => (now && now.slug === slug && now.store === store ? { ...before, message: "Could not save your reaction. Try again." } : now));
    }).finally(() => { writing.current = false; });
  };
  return { slug, totals: current.totals, mine: current.mine, message: current.message, onToggle, askSignIn: user === null && asking === slug, onSignIn: signIn };
}
