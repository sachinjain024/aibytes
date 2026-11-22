// The install box in aibytes.io's rail (AIB-76n ledger-extension-ui, pick H3).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import Module from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { build } from 'esbuild';

const result = await build({entryPoints:[new URL('./ExtensionPromo.jsx',import.meta.url).pathname],
  bundle:true,platform:'node',format:'cjs',external:['react'],write:false,loader:{'.jsx':'jsx'}});
const mod = new Module(import.meta.filename);
mod.filename=import.meta.filename;mod.paths=Module._nodeModulePaths(new URL('.',import.meta.url).pathname);
mod.require=createRequire(import.meta.url);mod._compile(result.outputFiles[0].text,import.meta.filename);
const { ExtensionPromo } = mod.exports;
const STORE = 'https://chromewebstore.google.com/detail/faamldnehjdjdobapchedpmldfjjfife';
const h = props => renderToStaticMarkup(React.createElement(ExtensionPromo, { href: STORE, onDismiss: () => {}, ...props }));

test('the box: the icon and the name, one line, then the link and Not now', () => {
  const html = h({});
  assert.match(html, /^<section class="ldg-promo" aria-label="aiBytes_ for Chrome"><p class="ldg-promo__name"><svg[^>]*aria-hidden="true"[^]*<\/svg>aiBytes_ for Chrome<\/p><p class="ldg-promo__body">Today&#x27;s edition from your toolbar.<\/p>/);
  assert.ok(html.indexOf('ldg-promo__cta') < html.indexOf('ldg-promo__dismiss'));
});

test('Add to Chrome is a link that opens the store in a new tab', () => {
  assert.match(h({}), new RegExp(`<a class="ldg-btn ldg-btn--primary ldg-promo__cta" href="${STORE}" target="_blank" rel="noreferrer">Add to Chrome</a>`));
});

test('Not now is a button that calls onDismiss, and the copy can be swapped', () => {
  let dismissed = 0;
  const el = ExtensionPromo({ href: STORE, onDismiss: () => { dismissed++; } });
  const find = (node) => {
    if (!node || typeof node !== 'object') return null;
    if (node.props?.className === 'ldg-promo__dismiss') return node;
    for (const child of [].concat(node.props?.children ?? [])) { const hit = find(child); if (hit) return hit; }
    return null;
  };
  const button = find(el);
  assert.equal(button.type, 'button');
  assert.equal(button.props.type, 'button');
  button.props.onClick();
  assert.equal(dismissed, 1);
  const de = h({ labels: { name: 'aiBytes_ für Chrome', body: 'Heute.', cta: 'Hinzufügen', notNow: 'Später' } });
  assert.match(de, /aria-label="aiBytes_ für Chrome"/);
  assert.match(de, />Heute.<\/p>/);
  assert.match(de, />Hinzufügen<\/a>/);
  assert.match(de, />Später<\/button>/);
});

test('without onDismiss there is no Not now', () => {
  assert.doesNotMatch(h({ onDismiss: undefined }), /ldg-promo__dismiss/);
});
