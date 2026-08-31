import { css, adopt } from './sheet.js';

const styles = css`
  :host {
    display: block;
    box-sizing: border-box;
    background: var(--aib-surface-raised);
    color: var(--aib-text);
    font-family: var(--aib-font-body);
    font-size: var(--aib-text-md);
    border: 1px solid var(--aib-border);
    border-radius: var(--aib-radius-lg);
    padding: var(--aib-space-5);
    box-shadow: var(--aib-shadow-sm);
  }
  /* The issue's signature notched corner, carried over from the thumbnail. */
  :host([notched]) {
    border-radius: 0;
    clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%);
  }
  ::slotted(h2), ::slotted(h3) {
    margin: 0 0 var(--aib-space-2);
    font-family: var(--aib-font-display);
    letter-spacing: -.02em;
  }
  .eyebrow {
    display: block;
    font-family: var(--aib-font-mono);
    font-size: var(--aib-text-xs);
    letter-spacing: .1em;
    text-transform: uppercase;
    color: var(--aib-text-muted);
    margin-bottom: var(--aib-space-2);
  }
  .eyebrow:empty { display: none; }
`;

export class AibCard extends HTMLElement {
  static observedAttributes = ['eyebrow'];

  connectedCallback() {
    if (this.shadowRoot) return;
    const root = this.attachShadow({ mode: 'open' });
    adopt(root, styles);
    root.innerHTML = '<span class="eyebrow" part="eyebrow"></span><slot></slot>';
    this.attributeChangedCallback();
  }

  attributeChangedCallback() {
    const el = this.shadowRoot?.querySelector('.eyebrow');
    if (el) el.textContent = this.getAttribute('eyebrow') ?? '';
  }
}

customElements.define('aib-card', AibCard);
