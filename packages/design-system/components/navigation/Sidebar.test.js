import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import Module from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { build } from 'esbuild';

// Bundle JSX for Node; exercise the actual exported component, not a copy.
const result = await build({entryPoints:[new URL('./Sidebar.jsx',import.meta.url).pathname],
  bundle:true,platform:'node',format:'cjs',external:['react'],write:false});
const mod = new Module(import.meta.filename);
mod.filename=import.meta.filename;mod.paths=Module._nodeModulePaths(new URL('.',import.meta.url).pathname);
mod.require=createRequire(import.meta.url);mod._compile(result.outputFiles[0].text,import.meta.filename);
const { Sidebar } = mod.exports;
const base={categories:[{key:'launches',label:'New Products',count:3},{key:'repos',label:'Repos',count:9}],count:12,active:'repos',
  onCategory:()=>{},links:[{label:'X',href:'https://x.com/aibytes'},{label:'Chrome Extension (soon)'}],subscribeUrl:'https://newsletter.aibytes.io/subscribe'};
const render=props=>renderToStaticMarkup(React.createElement(Sidebar,{...base,...props}));

// The fixture is the rail as rendered on main before the Saved entry existed (AIB-75v).
const before=JSON.parse(readFileSync(new URL('./Sidebar.default.json',import.meta.url),'utf8'));

test('without onSaved the rail renders exactly as before the Saved entry existed',()=>{
  assert.equal(render({}),before.rail);
  assert.equal(render({savedCount:4,savedActive:true}),before.rail);
});

const saved=html=>html.slice(html.indexOf('class="sidebar-saved"'),html.indexOf('class="sidebar-footer"'));
test('with onSaved, a LIBRARY section with the Saved row follows the categories, count included at 0',()=>{
  const html=render({onSaved:()=>{},savedCount:0});
  assert.ok(html.indexOf('class="categories"')<html.indexOf('class="sidebar-saved"'));
  assert.ok(html.indexOf('class="sidebar-saved"')<html.indexOf('class="sidebar-footer"'));
  assert.match(saved(html),/<div class="sidebar-label">LIBRARY<\/div>/);
  assert.match(saved(html),/<button class="category"[^>]*>.*Saved.*<span>0<\/span><\/button>/);
  assert.match(saved(render({onSaved:()=>{},savedCount:3})),/<span>3<\/span>/);
  assert.match(saved(render({onSaved:()=>{}})),/<span>0<\/span>/);
});
test('savedActive marks the Saved row as the current page and no category',()=>{
  const html=render({onSaved:()=>{},savedCount:3,savedActive:true});
  assert.match(saved(html),/class="category active" aria-current="page"/);
  assert.equal((html.match(/aria-current/g)||[]).length,1);
  assert.equal((html.match(/category active/g)||[]).length,1);
  const off=render({onSaved:()=>{},savedCount:3});
  assert.match(off,/class="category active" aria-current="true">Repos/);
  assert.doesNotMatch(saved(off),/active|aria-current/);
});
test('the Saved row carries a filled star, drawn in the save colour by CSS',()=>{
  const svg=saved(render({onSaved:()=>{}})).match(/<svg[^>]*>/)[0];
  assert.match(svg,/class="sidebar-saved__star"/);assert.match(svg,/fill="currentColor"/);
});
