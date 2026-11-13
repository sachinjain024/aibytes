import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import Module from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { build } from 'esbuild';

const result = await build({entryPoints:[new URL('./ReactionBar.jsx',import.meta.url).pathname],
  bundle:true,platform:'node',format:'cjs',external:['react'],write:false});
const mod = new Module(import.meta.filename);
mod.filename=import.meta.filename;mod.paths=Module._nodeModulePaths(new URL('.',import.meta.url).pathname);
mod.require=createRequire(import.meta.url);mod._compile(result.outputFiles[0].text,import.meta.filename);
const { ReactionBar, REACTIONS } = mod.exports;
const render = (props) => renderToStaticMarkup(React.createElement(ReactionBar, { counts: {}, mine: [], onToggle: () => {}, ...props }));
const button = (html, emoji) => new RegExp(`<button[^>]*>(?:(?!</button>).)*${emoji}(?:(?!</button>).)*</button>`).exec(html)?.[0];

test('eight emoji in one fixed order, in a labelled group', () => {
  assert.deepEqual(REACTIONS, ['👍', '👎', '😄', '🎉', '😕', '❤️', '🚀', '👀']);
  const html = render({});
  assert.match(html, /^<span class="gist-reacts" role="group" aria-label="Reactions">/);
  assert.equal((html.match(/<button /g) || []).length, 8);
  const order = REACTIONS.map((e) => html.indexOf(e));
  assert.deepEqual([...order].sort((a, b) => a - b), order);
});
test('each is a toggle with aria-pressed, true only for the reader\'s own', () => {
  const html = render({ mine: ['🎉'] });
  assert.match(button(html, '🎉'), /aria-pressed="true"/);
  assert.match(button(html, '👍'), /aria-pressed="false"/);
  assert.equal((html.match(/aria-pressed="true"/g) || []).length, 1);
});
test('a count shows only above zero, and includes the reader\'s own press', () => {
  const html = render({ counts: { '👍': 12, '🚀': 1200 }, mine: ['👍', '👀'] });
  assert.match(button(html, '👍'), /<b>13<\/b>/);
  assert.match(button(html, '👀'), /<b>1<\/b>/);
  assert.match(button(html, '🚀'), /<b>1\.2k<\/b>/);
  assert.doesNotMatch(button(html, '👎'), /<b>/);
});
test('buttons are named for screen readers, with the count when there is one', () => {
  const html = render({ counts: { '👍': 3 } });
  assert.match(button(html, '👍'), /aria-label="Thumbs up, 3"/);
  assert.match(button(html, '👎'), /aria-label="Thumbs down"/);
  assert.match(button(html, '❤️'), /aria-label="Heart"/);
});
