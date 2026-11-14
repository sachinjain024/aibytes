// A card title that has a gist is a real link to the gist's page. A plain click
// opens the panel instead; any modified click (new tab, new window, download)
// is the browser's, so the link keeps working as a link (AIB-145y app-gist-panel).

export function isPlainClick(e) {
  return (e.button ?? 0) === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
}

/** The title's onClick, or undefined when the card has no panel to open. */
export function openGistOnClick(item, onOpenGist) {
  if (!onOpenGist) return undefined;
  return (e) => {
    if (!isPlainClick(e)) return;
    e.preventDefault();
    onOpenGist(item);
  };
}

const OWN_CLICK = 'a, button, input, select, textarea, [role="menu"], [role="menuitem"]';

/**
 * The card's onClick: a plain click anywhere on a card with a gist opens it, except
 * on something that has a click of its own (the title, the source name, the star,
 * the menu) and while the reader is selecting text. The title stays the real link
 * for the keyboard, a new tab and search engines; this is the mouse's wider target.
 * `selection` is injectable for the tests.
 */
export function openGistOnCardClick(item, onOpenGist, selection = () => (typeof window !== "undefined" && window.getSelection ? String(window.getSelection()) : "")) {
  if (!onOpenGist) return undefined;
  return (e) => {
    if (!isPlainClick(e)) return;
    if (e.target && e.target.closest && e.target.closest(OWN_CLICK)) return;
    if (selection()) return;
    onOpenGist(item);
  };
}
