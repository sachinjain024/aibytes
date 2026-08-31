import { css, adopt } from './sheet.js';

// Every component ships its own reset. Injected UI cannot assume the host
// page has a sane box-sizing or margin baseline.
const styles = css`
  :host { display: inline-block; }
  :host([full]) { display: block; }
  button {
    all: unset;
    box-sizing: border-box;
    display: inline-flex; align-items: center; justify-content: center;
    gap: var(--aib-space-2);
    width: 100%;
    padding: var(--aib-space-2) var(--aib-space-4);
    font-family: var(--aib-font-body);
    font-size: var(--aib-text-md);
    font-weight: 600;
    line-height: 1.2;
    border-radius: var(--aib-radius-md);
    cursor: pointer;
    transition: background-color .12s ease, color .12s ease;
  }
  button:focus-visible {
    outline: 2px solid var(--aib-accent);
    outline-offset: 2px;
  }
  :host([disabled]) button { opacity: .5; cursor: not-allowed; }

  :host([variant="primary"]) button,
  :host(:not([variant])) button {
    background: var(--aib-accent); color: var(--aib-accent-on);
  }
  :host([variant="primary"]) button:hover,
  :host(:not([variant])) button:hover { background: var(--aib-accent-hover); }

  :host([variant="secondary"]) button {
    background: var(--aib-surface-raised);
    color: var(--aib-text);
    box-shadow: inset 0 0 0 1px var(--aib-border);
  }
  :host([variant="ghost"]) button { background: transparent; color: var(--aib-accent); }
  :host([variant="ghost"]) button:hover { background: color-mix(in srgb, var(--aib-accent) 10%, transparent); }

  :host([size="sm"]) button {
    padding: var(--aib-space-1) var(--aib-space-3);
    font-size: var(--aib-text-sm);
  }
`;

export class AibButton extends HTMLElement {
  static observedAttributes = ['disabled'];

  connectedCallback() {
    if (this.shadowRoot) return;
    const root = this.attachShadow({ mode: 'open' });
    adopt(root, styles);
    root.innerHTML = '<button part="button"><slot></slot></button>';
    this.#sync();
  }

  attributeChangedCallback() { this.#sync(); }

  #sync() {
    const btn = this.shadowRoot?.querySelector('button');
    if (btn) btn.disabled = this.hasAttribute('disabled');
  }
}

customElements.define('aib-button', AibButton);
