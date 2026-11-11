import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import Module from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { build } from 'esbuild';

// Bundle JSX for Node; exercise the actual exported component, not a copy.
const result = await build({entryPoints:[new URL('./Dialog.jsx',import.meta.url).pathname],
  bundle:true,platform:'node',format:'cjs',external:['react'],write:false});
const mod = new Module(import.meta.filename);
mod.filename=import.meta.filename;mod.paths=Module._nodeModulePaths(new URL('.',import.meta.url).pathname);
mod.require=createRequire(import.meta.url);mod._compile(result.outputFiles[0].text,import.meta.filename);
const { Dialog } = mod.exports;
const h=React.createElement;
const render=(props,children=h('h2',{id:'q'},'A question'))=>renderToStaticMarkup(h(Dialog,{onClose:()=>{},...props},children));

test('a closed dialog renders nothing',()=>{
  assert.equal(render({open:false}),'');
});
test('an open dialog is a modal dialog named by its heading, inside a scrim',()=>{
  const html=render({labelledBy:'q'});
  assert.match(html,/^<div class="ldg-dialog__scrim"><div class="ldg-dialog" role="dialog" aria-modal="true" aria-labelledby="q" tabindex="-1">/);
  assert.match(html,/<h2 id="q">A question<\/h2>/);
  assert.doesNotMatch(html,/aria-label="A/);
});
test('without a heading to point at, label names it',()=>{
  assert.match(render({label:'Newsletter'},null),/role="dialog" aria-modal="true" aria-label="Newsletter"/);
});
test('the close button is there by default, labelled Close, and goes with dismissible={false}',()=>{
  assert.match(render({}),/<button type="button" class="ldg-iconbtn ldg-dialog__close" aria-label="Close">/);
  assert.doesNotMatch(render({dismissible:false}),/ldg-dialog__close/);
});
test('className is added to the panel, not the scrim',()=>{
  assert.match(render({className:'prompt'}),/<div class="ldg-dialog prompt" role="dialog"/);
});
