import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import Module from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { build } from 'esbuild';

// Bundle JSX for Node; exercise the actual exported component, not a copy.
const result = await build({entryPoints:[new URL('./SaveBanner.jsx',import.meta.url).pathname],
  bundle:true,platform:'node',format:'cjs',external:['react'],write:false});
const mod = new Module(import.meta.filename);
mod.filename=import.meta.filename;mod.paths=Module._nodeModulePaths(new URL('.',import.meta.url).pathname);
mod.require=createRequire(import.meta.url);mod._compile(result.outputFiles[0].text,import.meta.filename);
const { SaveBanner } = mod.exports;
const render=props=>renderToStaticMarkup(React.createElement(SaveBanner,{onSignIn:()=>{},...props}));

test('the banner leads with a warning icon, then the unchanged copy and the sign-in link',()=>{
  const html=render({});
  assert.match(html,/role="status"/);
  const msg=html.slice(html.indexOf('class="ldg-banner__msg"'));
  assert.match(msg,/^class="ldg-banner__msg"><svg/);
  const icon=msg.match(/<svg[^>]*>/)[0];
  assert.match(icon,/class="ldg-banner__icon"/);assert.match(icon,/stroke-width="1.5"/);assert.match(icon,/aria-hidden="true"/);
  assert.match(html,/Saved items are stored in this browser only\. <a href="#signin">Sign in with Google<\/a> to keep them across devices\./);
});
test('the dismiss button renders only with onDismiss, labelled Dismiss',()=>{
  assert.doesNotMatch(render({}),/Dismiss/);
  assert.match(render({onDismiss:()=>{}}),/<button type="button" class="ldg-iconbtn ldg-banner__dismiss" aria-label="Dismiss">/);
});
test('only a sticky banner carries the sticky class',()=>{
  assert.match(render({sticky:true}),/^<div class="ldg-banner ldg-banner--sticky"/);
  assert.match(render({}),/^<div class="ldg-banner"/);
});
