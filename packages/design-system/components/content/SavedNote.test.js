import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import Module from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { build } from 'esbuild';

const result = await build({entryPoints:[new URL('./SavedNote.jsx',import.meta.url).pathname],
  bundle:true,platform:'node',format:'cjs',external:['react'],write:false});
const mod = new Module(import.meta.filename);
mod.filename=import.meta.filename;mod.paths=Module._nodeModulePaths(new URL('.',import.meta.url).pathname);
mod.require=createRequire(import.meta.url);mod._compile(result.outputFiles[0].text,import.meta.filename);
const { SavedNote } = mod.exports;

test('the line is a status that links View here to /saved', () => {
  assert.equal(renderToStaticMarkup(React.createElement(SavedNote)),
    '<p class="gist-saved" role="status">Added to your Saved items. <a href="/saved">View here</a></p>');
});
test('href can be changed', () => {
  assert.match(renderToStaticMarkup(React.createElement(SavedNote, { href: '/x/saved' })), /<a href="\/x\/saved">View here<\/a>/);
});
