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
