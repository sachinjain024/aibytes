// Button's size option (AIB-76n): without it, the markup is what it always was.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import Module from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { build } from 'esbuild';

const result = await build({entryPoints:[new URL('./Button.jsx',import.meta.url).pathname],
  bundle:true,platform:'node',format:'cjs',external:['react'],write:false,loader:{'.jsx':'jsx'}});
const mod = new Module(import.meta.filename);
mod.filename=import.meta.filename;mod.paths=Module._nodeModulePaths(new URL('.',import.meta.url).pathname);
mod.require=createRequire(import.meta.url);mod._compile(result.outputFiles[0].text,import.meta.filename);
const { Button } = mod.exports;
const h = (props, text) => renderToStaticMarkup(React.createElement(Button, props, text));

test('without size, every variant renders exactly as before', () => {
  assert.equal(h({}, 'Go'), '<button class="ldg-btn ldg-btn--primary" type="button">Go</button>');
  assert.equal(h({ variant: 'secondary', disabled: true }, 'Go'), '<button class="ldg-btn ldg-btn--secondary" type="button" disabled="">Go</button>');
  assert.equal(h({ variant: 'ghost', 'aria-label': 'x' }, 'Go'), '<button class="ldg-btn ldg-btn--ghost" type="button" aria-label="x">Go</button>');
  assert.match(h({ variant: 'google' }, 'Sign in with Google'), /^<button class="ldg-btn ldg-btn--google" type="button"><svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">/);
});

test('size="lg" adds the large class and never reaches the DOM as an attribute', () => {
  const html = h({ variant: 'google', size: 'lg' }, 'Sign in with Google');
  assert.match(html, /^<button class="ldg-btn ldg-btn--google ldg-btn--lg" type="button">/);
  assert.doesNotMatch(html, /size=/);
  assert.match(h({ size: 'lg' }, 'Go'), /^<button class="ldg-btn ldg-btn--primary ldg-btn--lg"/);
});
