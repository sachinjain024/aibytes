// Pure rules for the gist panel's width and keys, so a test can check them
// with no browser. The panel component calls these and nothing else decides.

export const PANEL = {
  min: 360,       // never narrower
  def: 460,       // where double-click resets to
  ceiling: 760,   // never wider, however big the screen
  rail: 250,      // the sidebar rail
  feed: 440,      // the feed always keeps about this much
  narrow: 760,    // at this viewport width and under the panel is a full-screen sheet
};

/** The widest the panel may be in a viewport this wide. */
export function panelMax(viewport) {
  return Math.max(PANEL.min, Math.min(PANEL.ceiling, viewport - PANEL.rail - PANEL.feed));
}

/** `width` held between the minimum and the widest the viewport allows, in whole pixels. */
export function clampWidth(width, viewport) {
  return Math.round(Math.min(panelMax(viewport), Math.max(PANEL.min, width)));
}

/**
 * The width after a key on the resize edge, or null if the key is not one of
 * its keys. The panel sits on the right, so the left arrow widens it. Shift
 * takes bigger steps; Home is the widest and End the narrowest.
 */
export function widthForKey(key, shiftKey, width, viewport) {
  const step = shiftKey ? 80 : 20;
  if (key === "ArrowLeft") return clampWidth(width + step, viewport);
  if (key === "ArrowRight") return clampWidth(width - step, viewport);
  if (key === "Home") return panelMax(viewport);
  if (key === "End") return PANEL.min;
  return null;
}

/** Escape closes the panel. Returns true when it did. */
export function closeOnEscape(event, onClose) {
  if (event.key !== "Escape") return false;
  onClose();
  return true;
}

/** True when the panel is a full-screen sheet with no resize edge. */
export const isNarrow = (viewport) => viewport <= PANEL.narrow;
