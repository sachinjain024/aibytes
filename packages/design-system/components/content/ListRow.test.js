// ListRow's stacked layout (the extension popup, AIB-76n): the ⋮ menu beside
// the title, then the summary, then the source line; the default row keeps
// the menu on the source line.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import Module from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { build } from 'esbuild';

const result = await build({entryPoints:[new URL('./ListRow.jsx',import.meta.url).pathname],
  bundle:true,platform:'node',format:'cjs',external:['react'],write:false});
const mod = new Module(import.meta.filename);
mod.filename=import.meta.filename;mod.paths=Module._nodeModulePaths(new URL('.',import.meta.url).pathname);
mod.require=createRequire(import.meta.url);mod._compile(result.outputFiles[0].text,import.meta.filename);
const { ListRow } = mod.exports;
const item={id:'row-fixture',title:'Fixture title',summary:'Fixture summary',url:'https://example.com',source_url:'https://news.ycombinator.com/item?id=1',
  source:'hackernews',image:{type:'none'},tags:[],signals:{points:976,comments:740}};
const render=props=>renderToStaticMarkup(React.createElement(ListRow,{item,...props}));
const at=(html,needle)=>{const i=html.indexOf(needle);assert.ok(i>=0,`missing ${needle}`);return i;};

test('stacked: title and menu, then summary, then the source and counts',()=>{
  const html=render({stacked:true});
  assert.match(html,/class="story story--stacked"/);
  const top=html.slice(at(html,'class="story-top"'),at(html,'class="summary"'));
  assert.match(top,/Fixture title/);assert.match(top,/class="item-actions"/);
  const meta=html.slice(at(html,'class="metadata"'));
  assert.ok(at(html,'class="summary"')<at(html,'class="metadata"'));
  assert.match(meta,/Hacker News/);assert.match(meta,/976/);assert.doesNotMatch(meta,/item-actions/);
  assert.equal((html.match(/class="item-actions"/g)||[]).length,1);
});

test('the default row keeps the menu on the source line',()=>{
  const html=render({});
  assert.doesNotMatch(html,/story--stacked/);
  const top=html.slice(at(html,'class="story-top"'),at(html,'class="summary"'));
  assert.doesNotMatch(top,/item-actions/);
  assert.match(html.slice(at(html,'class="metadata"')),/class="item-actions"/);
});
