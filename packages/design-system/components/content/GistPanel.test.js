import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import Module from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { build } from 'esbuild';
import { PANEL, clampWidth, closeOnEscape, isNarrow, nextOpener, openerKeys, panelMax, widthForKey } from './gistPanel.js';

const result = await build({entryPoints:[new URL('./GistPanel.jsx',import.meta.url).pathname],
  bundle:true,platform:'node',format:'cjs',external:['react'],write:false});
const mod = new Module(import.meta.filename);
mod.filename=import.meta.filename;mod.paths=Module._nodeModulePaths(new URL('.',import.meta.url).pathname);
mod.require=createRequire(import.meta.url);mod._compile(result.outputFiles[0].text,import.meta.filename);
const { GistPanel } = mod.exports;

const gist = { slug: 'hn-fixture' };
const render = (props) => renderToStaticMarkup(React.createElement(GistPanel,
  { gist, pageHref: '/gists/hn-fixture', onClose: () => {}, ...props }, React.createElement('p', null, 'inside')));

test('the panel is a complementary region labelled by the gist title, holding its children', () => {
  const html = render({});
  assert.match(html, /^<aside class="gist-panel"[^>]*role="complementary"[^>]*aria-labelledby="gist-title"/);
  assert.match(html, /<div class="gist-panel-scroll"><p>inside<\/p><\/div>/);
  assert.doesNotMatch(html, /aria-modal/);
});
test('the bar links to the gist page and has a labelled close button', () => {
  const html = render({});
  assert.match(html, /<a class="gist-url" href="\/gists\/hn-fixture"[^>]*>aibytes\.io\/gists\/hn-fixture<svg/);
  assert.match(html, /<button type="button" class="ldg-iconbtn" aria-label="Close the gist"/);
});
test('the resize edge is a focusable vertical separator with its value and bounds', () => {
  const html = render({});
  const edge = html.match(/<div class="gist-resize"[^>]*>/)[0];
  assert.match(edge, /role="separator"/);assert.match(edge, /aria-orientation="vertical"/);assert.match(edge, /tabindex="0"/);
  assert.match(edge, /aria-valuenow="460"/);assert.match(edge, /aria-valuemin="360"/);assert.match(edge, /aria-valuemax="750"/);
  assert.match(html, /style="width:460px"/);
});
test('the width the app passes is shown, held between the bounds', () => {
  assert.match(render({ width: 600 }), /aria-valuenow="600"/);
  assert.match(render({ width: 100 }), /aria-valuenow="360"/);
  assert.match(render({ width: 5000 }), /aria-valuenow="750"/);
});
test('the widest the panel may be leaves the feed about 440px, and never passes 760', () => {
  assert.equal(panelMax(1440), 750);
  assert.equal(panelMax(1920), 760);
  assert.equal(panelMax(1100), 410);
  assert.equal(panelMax(900), 360, 'the floor wins on a small screen');
  assert.equal(clampWidth(1000, 1440), 750);
  assert.equal(clampWidth(200, 1440), 360);
  assert.equal(clampWidth(500.4, 1440), 500);
});
test('arrow keys change the width within bounds; shift is a bigger step; Home and End are the ends', () => {
  const w = (key, shift, width = 460) => widthForKey(key, shift, width, 1440);
  assert.equal(w('ArrowLeft', false), 480);
  assert.equal(w('ArrowRight', false), 440);
  assert.equal(w('ArrowLeft', true), 540);
  assert.equal(w('ArrowRight', true), 380);
  assert.equal(w('ArrowLeft', false, 750), 750, 'stops at the widest');
  assert.equal(w('ArrowRight', false, 360), 360, 'stops at the narrowest');
  assert.equal(w('Home', false), 750);
  assert.equal(w('End', false), 360);
  assert.equal(w('a', false), null);
  assert.equal(w('Tab', false), null);
});
test('Escape calls onClose and nothing else does', () => {
  let closed = 0;
  assert.equal(closeOnEscape({ key: 'Escape' }, () => closed++), true);
  assert.equal(closed, 1);
  assert.equal(closeOnEscape({ key: 'Enter' }, () => closed++), false);
  assert.equal(closeOnEscape({ key: 'a' }, () => closed++), false);
  assert.equal(closed, 1);
});
test('at 760px and under the panel is a sheet with no resize edge', () => {
  assert.equal(isNarrow(760), true);
  assert.equal(isNarrow(761), false);
  assert.equal(isNarrow(390), true);
  assert.equal(PANEL.def, 460);
});

test('focus returns to the card last clicked: a new opener is taken from a card outside the panel only', () => {
  const card = { id: 'b' }, first = { id: 'a' }, body = { id: 'body' };
  const card2 = { id: 'in' };
  const panelEl = { contains: (el) => el === card2 };
  assert.equal(nextOpener(first, card, panelEl, body), card, 'switching to another card');
  assert.equal(nextOpener(first, card2, panelEl, body), first, 'focus inside the panel is not an opener');
  assert.equal(nextOpener(first, body, panelEl, body), first, 'focus lost to the page keeps the old opener');
  assert.equal(nextOpener(first, null, panelEl, body), first);
  assert.equal(nextOpener(null, card, panelEl, body), card);
});

test('the opener is retaken when another card opens the same gist, not only when the gist changes', () => {
  assert.notDeepEqual(openerKeys('gh-x', 'card-a'), openerKeys('gh-x', 'card-b'), 'same gist, another card');
  assert.notDeepEqual(openerKeys('gh-x', 'card-a'), openerKeys('hn-y', 'card-a'), 'another gist');
  assert.deepEqual(openerKeys('gh-x', 'card-a'), openerKeys('gh-x', 'card-a'));
  assert.deepEqual(openerKeys('gh-x', undefined), ['gh-x', null], 'no card: a reload or shared link');
  assert.match(render({ openerKey: 'card-b' }), /gist-panel/, 'the prop is accepted');
});
