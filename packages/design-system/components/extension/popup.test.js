// The popup's pieces (AIB-76n ledger-extension-ui; picks A2 and D2).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import Module from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { build } from 'esbuild';

async function load(file) {
  const result = await build({entryPoints:[new URL(file,import.meta.url).pathname],
    bundle:true,platform:'node',format:'cjs',external:['react'],write:false,loader:{'.jsx':'jsx'}});
  const mod = new Module(import.meta.filename);
  mod.filename=import.meta.filename;mod.paths=Module._nodeModulePaths(new URL('.',import.meta.url).pathname);
  mod.require=createRequire(import.meta.url);mod._compile(result.outputFiles[0].text,import.meta.filename);
  return mod.exports;
}
const { PopupHeader } = await load('./PopupHeader.jsx');
const { PopupFooter } = await load('./PopupFooter.jsx');
const { PopupGistBar } = await load('./PopupGistBar.jsx');
const { PopupActionBar } = await load('./PopupActionBar.jsx');
const h = (C, props, ...kids) => renderToStaticMarkup(React.createElement(C, props, ...kids));
const noop = () => {};

test('the header has the compact wordmark and the edition date', () => {
  const html = h(PopupHeader, { date: 'Wed, Aug 27', savedCount: 3, onToggleSaved: noop, onSignIn: noop });
  assert.match(html, /^<header class="ldg-popup-head">/);
  assert.match(html, /ldg-wordmark--compact/);
  assert.match(html, /<span class="ldg-popup-head__date">Wed, Aug 27<\/span>/);
});

test('the saved toggle (A2) is a star and the count, pressed when Saved shows', () => {
  const off = h(PopupHeader, { savedCount: 3, onToggleSaved: noop });
  assert.match(off, /<button type="button" class="ldg-popup-saved" aria-pressed="false" aria-label="Saved items">/);
  assert.match(off, /<span class="ldg-popup-saved__n">3<\/span>/);
  const on = h(PopupHeader, { savedCount: 0, savedActive: true, onToggleSaved: noop, labels: { saved: 'Gespeichert' } });
  assert.match(on, /class="ldg-popup-saved ldg-popup-saved--on" aria-pressed="true" aria-label="Gespeichert"/);
  assert.match(on, />0<\/span>/);
  assert.doesNotMatch(h(PopupHeader, { savedCount: 3 }), /ldg-popup-saved/, 'no toggle without onToggleSaved');
});

test('signed out it offers Sign in; signed in the avatar replaces it', () => {
  const out = h(PopupHeader, { onSignIn: noop });
  assert.match(out, /<button type="button" class="ldg-popup-signin">Sign in<\/button>/);
  assert.match(h(PopupHeader, { onSignIn: noop, labels: { signIn: 'Anmelden' } }), />Anmelden<\/button>/);
  const signedIn = h(PopupHeader, { onSignIn: noop, onSignOut: noop, user: { name: 'Demo Reader', email: 'demo@example.com' } });
  assert.doesNotMatch(signedIn, /ldg-popup-signin/);
  assert.match(signedIn, /<button type="button" class="account" aria-label="Account: Demo Reader" aria-haspopup="menu" aria-expanded="false">/);
  assert.match(signedIn, /<span class="account__initial" aria-hidden="true">D<\/span>/);
});

test('the footer is the meta at the left and the link at the right', () => {
  const html = h(PopupFooter, { meta: 'Aug 27 · 28 items' }, React.createElement('a', { href: '#' }, 'View on Web'));
  assert.equal(html, '<div class="ldg-popup-foot"><span class="ldg-popup-foot__meta">Aug 27 · 28 items</span><a href="#">View on Web</a></div>');
});

test('the gist bar (D2) has one back button', () => {
  assert.equal(h(PopupGistBar, { onBack: noop }), '<div class="ldg-popup-gistbar"><button type="button" class="ldg-popup-back">← Today</button></div>');
  assert.match(h(PopupGistBar, { backLabel: '← Saved', onBack: noop }), />← Saved<\/button>/);
});

test('the action bar (D2) is the star, Save or Saved, and the link', () => {
  const off = h(PopupActionBar, { onToggleSave: noop }, React.createElement('a', { href: '#' }, 'View on Web'));
  assert.match(off, /^<div class="ldg-popup-actions"><button type="button" class="ldg-star" aria-label="Save" aria-pressed="false">/);
  assert.match(off, /<span class="ldg-popup-actions__label">Save<\/span><a href="#">View on Web<\/a><\/div>$/);
  const on = h(PopupActionBar, { saved: true, onToggleSave: noop, labels: { saved: 'Gespeichert' } });
  assert.match(on, /ldg-star--saved/);
  assert.match(on, />Gespeichert<\/span>/);
});
