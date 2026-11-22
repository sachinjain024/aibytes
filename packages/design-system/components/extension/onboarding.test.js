// The onboarding page's pieces (AIB-76n ledger-extension-ui; picks E2 and F1).
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
const { OnboardingStep, OnboardingStatus } = await load('./OnboardingStep.jsx');
const { PinAnimation } = await load('./PinAnimation.jsx');
const h = (C, props, ...kids) => renderToStaticMarkup(React.createElement(C, props, ...kids));
const CAPTIONS = ['Look at the top right of Chrome', 'Select the puzzle icon', 'Find aiBytes_ in the list', 'Select the pin', 'aiBytes_ is in your toolbar'];

test('a step is a labelled section: the number, the title, then its body', () => {
  const html = h(OnboardingStep, { n: 1, title: 'Pin aiBytes_ to your toolbar' }, React.createElement('p', null, 'Body'));
  assert.match(html, /^<section class="ldg-onb-step" aria-labelledby="([^"]+)"><div class="ldg-onb-step__head"><span class="ldg-onb-step__n">1<\/span><h2 id="\1">Pin aiBytes_ to your toolbar<\/h2><\/div><p>Body<\/p><\/section>$/);
});

test('with total it says "Step 2 of 2"; optional adds the tag', () => {
  const html = h(OnboardingStep, { n: 2, total: 2, optional: true, title: 'Sign in to save & bookmark items' });
  assert.match(html, /<h2 id="[^"]+">Sign in to save &amp; bookmark items <span class="ldg-onb-step__opt">Optional<\/span><\/h2>/);
  assert.match(html, /<span class="ldg-onb-step__of">Step 2 of 2<\/span>/);
  assert.match(h(OnboardingStep, { n: 1, total: 2, title: 'T', labels: { stepOf: 'Schritt {n} von {total}' } }), />Schritt 1 von 2</);
  assert.doesNotMatch(h(OnboardingStep, { n: 1, title: 'T' }), /ldg-onb-step__of/, 'no counter without total');
});

test('done turns the number into the tick and marks the card', () => {
  const html = h(OnboardingStep, { n: 1, title: 'T', done: true });
  assert.match(html, /^<section class="ldg-onb-step ldg-onb-step--done"/);
  assert.match(html, /<span class="ldg-onb-step__n"><span class="ldg-onb-tick" aria-hidden="true"><svg/);
  assert.doesNotMatch(html, /__n">1</);
});

test('a status line is the tick then the text', () => {
  assert.match(h(OnboardingStatus, null, 'Signed in as Ada.'), /^<p class="ldg-onb-status"><span class="ldg-onb-tick" aria-hidden="true"><svg[^]*<\/span><span>Signed in as Ada.<\/span><\/p>$/);
});

test('the animation starts on frame one, with its caption', () => {
  const html = h(PinAnimation, { captions: CAPTIONS, reducedMotion: false });
  assert.match(html, /^<figure class="ldg-pinanim"><div class="ldg-pinanim__bar" role="img" aria-label="[^"]+">/);
  assert.match(html, /<figcaption>Look at the top right of Chrome<\/figcaption>/, 'not aria-live: it changes every 1.1s');
  assert.doesNotMatch(html, /<ol/);
});

test('under reduced motion it shows the last frame still and every caption as a numbered list', () => {
  const html = h(PinAnimation, { captions: CAPTIONS, reducedMotion: true });
  assert.match(html, /ldg-pinanim__icon--new/, 'the pinned icon of the last frame');
  assert.doesNotMatch(html, /ldg-pinanim__menu/, 'no menu in the last frame');
  assert.match(html, /<ol class="ldg-pinanim__steps"><li>Look at the top right of Chrome<\/li><li>Select the puzzle icon<\/li><li>Find aiBytes_ in the list<\/li><li>Select the pin<\/li><li>aiBytes_ is in your toolbar<\/li><\/ol>/);
  assert.doesNotMatch(html, /<figcaption/);
});
