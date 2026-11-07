import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import Module from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { build } from 'esbuild';

// Bundle JSX for Node; exercise the actual exported component, not a copy.
const result = await build({entryPoints:[new URL('./AppHeader.jsx',import.meta.url).pathname],
  bundle:true,platform:'node',format:'cjs',external:['react'],write:false});
const mod = new Module(import.meta.filename);
mod.filename=import.meta.filename;mod.paths=Module._nodeModulePaths(new URL('.',import.meta.url).pathname);
mod.require=createRequire(import.meta.url);mod._compile(result.outputFiles[0].text,import.meta.filename);
const { AppHeader } = mod.exports;
const base={theme:'light',onToggleTheme:()=>{},menuOpen:false,onMenu:()=>{},githubUrl:'https://github.com/sachinjain024/aibytes'};
const render=props=>renderToStaticMarkup(React.createElement(AppHeader,{...base,...props}));

// The fixture is the header as rendered on main before Sign in existed (AIB-75v).
const before=JSON.parse(readFileSync(new URL('./AppHeader.default.json',import.meta.url),'utf8'));

test('without onSignIn or user the header renders exactly as before Sign in existed',()=>{
  assert.equal(render({}),before.header);
  assert.equal(render({onSaved:()=>{},onSignOut:()=>{}}),before.header);
});

const ada={name:'Ada Lovelace',photoUrl:'https://lh3.googleusercontent.com/a/ada=s96-c'};
const nav=html=>html.slice(html.indexOf('<nav>'),html.indexOf('</nav>'));
test('signed out, onSignIn adds a Sign in control after the theme toggle',()=>{
  const html=nav(render({onSignIn:()=>{}}));
  assert.match(html,/<button[^>]*class="control signin"[^>]*>Sign in<\/button>/);
  assert.ok(html.indexOf('id="themeToggle"')<html.indexOf('Sign in'));
});
test('signed in, the avatar replaces Sign in and shows the Google photo',()=>{
  const html=nav(render({onSignIn:()=>{},user:ada,onSignOut:()=>{}}));
  assert.doesNotMatch(html,/Sign in/);
  assert.match(html,/aria-label="Account: Ada Lovelace"/);assert.match(html,/aria-haspopup="menu"/);assert.match(html,/aria-expanded="false"/);
  const img=html.match(/<img[^>]*>/)[0];
  assert.match(img,/src="https:\/\/lh3\.googleusercontent\.com\/a\/ada=s96-c"/);
  assert.match(img,/alt=""/);assert.match(img,/referrerpolicy="no-referrer"/i);
  assert.ok(html.indexOf('id="themeToggle"')<html.indexOf('Account: Ada'));
});
test('without a photo the avatar shows the initial, and needs onSignOut to render at all',()=>{
  const html=nav(render({user:{name:' ada lovelace'},onSignOut:()=>{}}));
  assert.doesNotMatch(html,/<img/);assert.match(html,/<span class="account__initial" aria-hidden="true">A<\/span>/);
  assert.doesNotMatch(nav(render({user:ada})),/account/);
});
test('the menu names the reader, then Saved (only with onSaved) and Sign out',()=>{
  const { AccountMenuPanel } = mod.exports;
  const html=renderToStaticMarkup(React.createElement(AccountMenuPanel,{user:ada,onSaved:()=>{},onSignOut:()=>{},onClose:()=>{}}));
  assert.match(html,/role="menu"/);
  assert.ok(html.indexOf('Ada Lovelace')<html.indexOf('Signed in with Google'));
  assert.ok(html.indexOf('Signed in with Google')<html.indexOf('>Saved<'));
  assert.ok(html.indexOf('>Saved<')<html.indexOf('>Sign out<'));
  assert.equal((html.match(/role="menuitem"/g)||[]).length,2);
  const bare=renderToStaticMarkup(React.createElement(AccountMenuPanel,{user:ada,onSignOut:()=>{},onClose:()=>{}}));
  assert.doesNotMatch(bare,/>Saved</);assert.equal((bare.match(/role="menuitem"/g)||[]).length,1);
});
