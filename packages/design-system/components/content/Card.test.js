import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import Module from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { build } from 'esbuild';

// Bundle JSX for Node; exercise the actual exported component, not a copy.
const result = await build({entryPoints:[new URL('./Card.jsx',import.meta.url).pathname],
  bundle:true,platform:'node',format:'cjs',external:['react'],write:false});
const mod = new Module(import.meta.filename);
mod.filename=import.meta.filename;mod.paths=Module._nodeModulePaths(new URL('.',import.meta.url).pathname);
mod.require=createRequire(import.meta.url);mod._compile(result.outputFiles[0].text,import.meta.filename);
const { Card } = mod.exports;
const item={id:'card-fixture',title:'Fixture',summary:'Summary',url:'https://example.com',source_url:'https://github.com/example',
  source:'github',image:{type:'none'},tags:['First tag','Second tag','Third tag'],meta:{language:'Python'},signals:{stars_gained:25}};
const render=props=>renderToStaticMarkup(React.createElement(Card,{item,...props}));

test('cards preserve language, top label, tag treatment and tag limit',()=>{
  const html=render({topToday:true,tagStyle:'hash',maxTags:1});
  assert.match(html,/>TOP</);assert.match(html,/Python/);assert.match(html,/#First tag/);assert.doesNotMatch(html,/Second tag/);
  assert.match(render({tagStyle:'pills'}),/class="ldg-tagpill"/);
  const bare=render({maxTags:0});
  assert.doesNotMatch(bare,/First tag/);assert.doesNotMatch(bare,/story-tags/);assert.doesNotMatch(bare,/Python/);
});
test('each public signals placement renders the signal once in its intended area',()=>{
  for(const pos of ['logo','bottom','source','row']){
    const html=render({signalsPos:pos});assert.match(html,new RegExp(`story--signals-${pos}`));
    assert.equal((html.match(/Stars gained today/g)||[]).length,1);
    if(pos==='row')assert.match(html,/class="story-signals"/);
    if(pos==='logo'||pos==='bottom')assert.ok(html.indexOf('Stars gained today')<html.indexOf('class="story-content"'));
    if(pos==='source')assert.ok(html.indexOf('Stars gained today')>html.indexOf('class="metadata"'));
  }
});
test('save control stays optional and destination links remain safe new-tab links',()=>{
  assert.doesNotMatch(render({}),/aria-label="Save"/);
  const html=render({onToggleSave:()=>{}});
  assert.match(html,/aria-label="Save"/);assert.match(html,/aria-pressed="false"/);assert.match(html,/rel="noopener noreferrer"/);
  assert.match(render({saved:true,onToggleSave:()=>{}}),/aria-label="Saved"/);
});
