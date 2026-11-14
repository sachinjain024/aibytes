import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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
  assert.match(render({tagStyle:'pills',maxTags:3}),/class="ldg-tagpill"/);
  const bare=render({maxTags:0});
  assert.doesNotMatch(bare,/First tag/);assert.doesNotMatch(bare,/story-tags/);assert.doesNotMatch(bare,/Python/);
});
test('the default card is the app card: counts after the source, no tags',()=>{
  const html=render({});
  assert.match(html,/story--signals-source/);assert.doesNotMatch(html,/story-tags/);assert.doesNotMatch(html,/First tag/);
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

// ListRow is FeedItem too, bundled the same way; the fixture is the markup on
// main before starPos existed (AIB-75v), so the default can never drift.
// Its title href gained ?ref=aiBytes_ on purpose in AIB-145y T38 (the GitHub
// source link is skipped by design); nothing else changed.
const rowBuild = await build({entryPoints:[new URL('./ListRow.jsx',import.meta.url).pathname],
  bundle:true,platform:'node',format:'cjs',external:['react'],write:false});
const rowMod = new Module(import.meta.filename+'#row');
rowMod.filename=import.meta.filename;rowMod.paths=mod.paths;rowMod.require=mod.require;rowMod._compile(rowBuild.outputFiles[0].text,import.meta.filename);
const { ListRow } = rowMod.exports;
const before = JSON.parse(readFileSync(new URL('./FeedItem.default.json',import.meta.url),'utf8'));
const saving={item,saved:true,onToggleSave:()=>{}};
const renderRow=props=>renderToStaticMarkup(React.createElement(ListRow,{...saving,...props}));
const between=(html,from,to)=>html.slice(html.indexOf(from),html.indexOf(to,html.indexOf(from)));

test('without starPos, cards and rows render exactly as before it existed',()=>{
  assert.equal(render(saving),before.card);assert.equal(renderRow({}),before.row);
  assert.equal(render({...saving,starPos:'actions'}),before.card);assert.equal(renderRow({starPos:'actions'}),before.row);
});
test('starPos "visual" moves the star under the source icon, on cards and rows',()=>{
  for(const html of [render({...saving,starPos:'visual'}),renderRow({starPos:'visual'})]){
    const visual=between(html,'class="story-visual"','class="story-content"');
    assert.match(visual,/aria-label="Saved"/);
    assert.doesNotMatch(between(html,'class="item-actions"','</article>'),/ldg-star/);
    assert.equal((html.match(/class="ldg-star[ "]/g)||[]).length,1);
    assert.ok(visual.indexOf('source-icon')<visual.indexOf('ldg-star'));
  }
});
test('no star renders in either position without onToggleSave',()=>{
  for(const starPos of ['actions','visual']){
    assert.doesNotMatch(render({starPos}),/ldg-star/);
    assert.doesNotMatch(renderToStaticMarkup(React.createElement(ListRow,{item,starPos})),/ldg-star/);
  }
});

test('front adds a Front page label beside TOP on cards and rows, and nothing changes without it',()=>{
  for(const html of [render({front:true}),renderRow({front:true})]){
    assert.match(html,/<span class="ldg-front-label"[^>]*>Front page<\/span>/);
    assert.ok(html.indexOf('ldg-front-label')<html.indexOf('class="discussion"'),'before the source name');
  }
  const both=render({front:true,topToday:true});
  assert.ok(both.indexOf('>TOP<')<both.indexOf('>Front page<'),'TOP first, then Front page');
  assert.doesNotMatch(render({}),/Front page/);assert.doesNotMatch(renderRow({}),/Front page/);
  assert.doesNotMatch(render({front:false}),/ldg-front-label/);
});

test('the title and the source link carry ref=aiBytes_; the menu prompts and the item stay clean (AIB-145y T38)',()=>{
  const linked={...item,url:'https://example.com/post?id=7#top',source_url:'https://news.ycombinator.com/item?id=9',source:'hackernews'};
  const html=renderToStaticMarkup(React.createElement(Card,{item:linked}));
  assert.match(html,/href="https:\/\/example.com\/post\?id=7&amp;ref=aiBytes_#top"/);
  assert.match(html,/href="https:\/\/news.ycombinator.com\/item\?id=9"/);
  assert.doesNotMatch(html,/chatgpt[^"]*aiBytes_/i);
  assert.equal(linked.url,'https://example.com/post?id=7#top');
  const placeholder=renderToStaticMarkup(React.createElement(Card,{item:{...item,url:'#',source_url:'#ph'}}));
  assert.match(placeholder,/href="#"/);assert.match(placeholder,/href="#ph"/);
});

test('a card with a gist links its title to the gist page in this tab, and marks the open one',()=>{
  const html=render({gistHref:'/gists/tinyeval',open:true});
  assert.match(html,/<h3><a href="\/gists\/tinyeval">Fixture<\/a><\/h3>/);
  assert.doesNotMatch(html.match(/<h3>.*?<\/h3>/)[0],/target=|rel=/);
  assert.match(html,/class="story story--grid[^"]*story--open[^"]*"[^>]*aria-current="true"/);
  assert.match(html,/class="discussion" href="https:\/\/github.com\/example[^"]*" target="_blank"/);
  const row=renderRow({gistHref:'/gists/tinyeval',open:true});
  assert.match(row,/href="\/gists\/tinyeval"/);assert.match(row,/story--open/);
});
test('without a gist the title still opens the item in a new tab and nothing is marked',()=>{
  for(const html of [render({}),renderRow({}),render({open:true})]){
    assert.match(html.match(/<h3>.*?<\/h3>/)[0],/target="_blank"/);
    assert.doesNotMatch(html,/story--open|aria-current/);
  }
});
test('a plain click on the title is the one that opens the panel; a modified click is left to the browser',async()=>{
  const {isPlainClick,openGistOnClick}=await import('./gistLink.js');
  const plain={button:0,metaKey:false,ctrlKey:false,shiftKey:false,altKey:false};
  assert.equal(isPlainClick(plain),true);
  for(const change of [{metaKey:true},{ctrlKey:true},{shiftKey:true},{altKey:true},{button:1},{button:2}])
    assert.equal(isPlainClick({...plain,...change}),false,JSON.stringify(change));
  const calls=[];const make=e=>({...e,prevented:false,preventDefault(){this.prevented=true}});
  const handler=openGistOnClick(item,i=>calls.push(i.id));
  const a=make(plain);handler(a);assert.deepEqual(calls,['card-fixture']);assert.equal(a.prevented,true);
  const b=make({...plain,metaKey:true});handler(b);assert.deepEqual(calls,['card-fixture']);assert.equal(b.prevented,false);
  assert.equal(openGistOnClick(item,undefined),undefined);
});

test('a click anywhere on a card with a gist opens it, except on a link, button or menu inside it, or while text is selected',async()=>{
  const {openGistOnCardClick}=await import('./gistLink.js');
  const calls=[];const handler=openGistOnCardClick(item,i=>calls.push(i.id),()=>'');
  const plain={button:0,metaKey:false,ctrlKey:false,shiftKey:false,altKey:false};
  const on=(inside)=>({...plain,target:{closest:sel=>inside&&sel.split(',').some(s=>s.trim()===inside)?{}:null}});
  handler(on(null));assert.deepEqual(calls,['card-fixture'],'the summary or empty space');
  for(const el of ['a','button','input','[role="menu"]','[role="menuitem"]']){handler(on(el));}
  assert.deepEqual(calls,['card-fixture'],'links, buttons and menus keep their own click');
  handler({...on(null),metaKey:true});assert.deepEqual(calls,['card-fixture'],'a modified click is the browser\'s');
  const selecting=openGistOnCardClick(item,i=>calls.push(i.id),()=>'some words');
  selecting(on(null));assert.deepEqual(calls,['card-fixture'],'dragging to select text is not a click');
  assert.equal(openGistOnCardClick(item,undefined),undefined);
});
test('a card with a gist is marked clickable; one without is not',()=>{
  assert.match(render({gistHref:'/gists/x',onOpenGist:()=>{}}),/class="story story--grid[^"]*story--gist/);
  assert.doesNotMatch(render({gistHref:'/gists/x'}),/story--gist/,'no handler, nothing to click');
  assert.doesNotMatch(render({}),/story--gist/);
  assert.match(renderRow({gistHref:'/gists/x',onOpenGist:()=>{}}),/story--gist/);
});
