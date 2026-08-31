import { tokensCss } from '../dist/tokens.js';

/** Tagged template that returns a constructable stylesheet. */
export function css(strings, ...values) {
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(String.raw({ raw: strings }, ...values));
  return sheet;
}

const tokens = css`${tokensCss}`;

/**
 * Adopt the design tokens plus a component's own styles into a shadow root.
 *
 * Custom properties inherit through the shadow boundary, so on the web app the
 * tokens on :root would reach here anyway. In the extension the shadow host
 * sits on a page we do not control and there are no aiBytes tokens above it -
 * adopting them here is what makes a component render identically in both.
 */
export function adopt(root, ...sheets) {
  root.adoptedStyleSheets = [tokens, ...sheets];
}
