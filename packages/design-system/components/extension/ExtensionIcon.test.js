import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import Module from 'node:module';
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { build } from 'esbuild';

const result = await build({entryPoints:[new URL('./ExtensionIcon.jsx',import.meta.url).pathname],
  bundle:true,platform:'node',format:'cjs',external:['react'],write:false});
const mod = new Module(import.meta.filename);
mod.filename=import.meta.filename;mod.paths=Module._nodeModulePaths(new URL('.',import.meta.url).pathname);
mod.require=createRequire(import.meta.url);mod._compile(result.outputFiles[0].text,import.meta.filename);
const { ExtensionIcon } = mod.exports;
const render = (props) => renderToStaticMarkup(React.createElement(ExtensionIcon, props));

test('without a title the icon is decoration, hidden from screen readers', () => {
  const html = render({});
  assert.match(html, /^<svg [^>]*aria-hidden="true"/);
  assert.doesNotMatch(html, /role="img"|<title>/);
  assert.match(html, /width="20" height="20"/);
});

test('with a title it is a named image', () => {
  const html = render({ title: 'aiBytes_', size: 32 });
  assert.match(html, /role="img"/);
  assert.match(html, /aria-label="aiBytes_"/);
  assert.match(html, /width="32" height="32"/);
  assert.doesNotMatch(html, /aria-hidden/);
});

test('it draws the favicon: the same tile and bolt, in fixed brand colours', () => {
  const favicon = readFileSync(new URL('../../../../apps/web/public/favicon.svg', import.meta.url), 'utf8');
  const html = render({});
  for (const piece of ['viewBox="0 0 32 32"', 'rx="7"', 'fill="#285ed1"', 'fill="#fff"', 'M18.2 3 7 18.4h7.6L12.8 29 25 13.2h-7.9z']) {
    assert.ok(favicon.includes(piece), `favicon has ${piece}`);
    assert.ok(html.includes(piece), `icon has ${piece}`);
  }
  assert.doesNotMatch(html, /var\(--/, 'a logo, not a themed mark');
});

// The PNGs Chrome needs (action icons cannot be SVG; the store needs 128).
function png(size) {
  const buf = readFileSync(new URL(`../../assets/extension/icon-${size}.png`, import.meta.url));
  assert.deepEqual([...buf.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], 'a PNG');
  let at = 8, ihdr, idat = [];
  while (at < buf.length) {
    const len = buf.readUInt32BE(at), type = buf.toString('ascii', at + 4, at + 8), data = buf.subarray(at + 8, at + 8 + len);
    if (type === 'IHDR') ihdr = data;
    if (type === 'IDAT') idat.push(data);
    at += 12 + len;
  }
  return { width: ihdr.readUInt32BE(0), height: ihdr.readUInt32BE(4), depth: ihdr[8], colour: ihdr[9], raw: inflateSync(Buffer.concat(idat)) };
}

for (const size of [16, 32, 48, 128]) {
  test(`icon-${size}.png is ${size}px square RGBA, transparent outside the rounded tile`, () => {
    const { width, height, depth, colour, raw } = png(size);
    assert.equal(width, size);
    assert.equal(height, size);
    assert.equal(depth, 8);
    assert.equal(colour, 6, 'RGBA, so the corners can be transparent');
    // Byte 0 is row 0's filter; the first pixel's bytes are raw under every filter.
    assert.equal(raw[4], 0, 'the top-left corner is outside the tile');
  });
}
