// Validate the authoritative redesigned palette, including resolved aliases.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import postcss from 'postcss';

const root = postcss.parse(readFileSync(new URL('./token.css', import.meta.url), 'utf8'));
function declarations(selector, media = false) {
  const result = {};
  root.walkRules(rule => {
    if (rule.selector !== selector || Boolean(rule.parent.type === 'atrule') !== media) return;
    rule.walkDecls(d => { result[d.prop] = d.value; });
  });
  return result;
}
function theme(name) {
  const vars = { ...declarations(':root'), ...declarations(`:root,[data-theme="light"]`),
    ...(name === 'dark' ? declarations('[data-theme="dark"]') : {}), ...declarations(':root,[data-theme]') };
  const resolve = (value, seen = new Set()) => value.replace(/var\((--[\w-]+)\)/g, (_, key) => {
    assert.ok(vars[key], `Missing ${key}`);
    assert.ok(!seen.has(key), `Cyclic alias: ${key}`);
    return resolve(vars[key], new Set([...seen, key]));
  });
  return Object.fromEntries(Object.entries(vars).map(([key, value]) => [key.slice(2), resolve(value)]));
}
function rgb(hex) {
  assert.match(hex, /^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/i);
  return [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
}
function luminance(color) {
  const [r,g,b] = rgb(color).map(c => c <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4);
  return .2126*r + .7152*g + .0722*b;
}
export function contrast(a, b) {
  const [hi,lo] = [luminance(a),luminance(b)].sort((x,y) => y-x);
  return (hi+.05)/(lo+.05);
}
const surfaces = ['bg','surface','surface-2','accent-tint'];
const pairs = [
  ['text',surfaces,4.5], ['text-2',surfaces,4.5], ['link',surfaces,4.5],
  ['hot-text',['bg','surface','hot-tint'],4.5],
  ['accent-fg',['accent','accent-hover','accent-active'],4.5],
  ['focus-ring',['bg','surface','surface-2'],3],
  ['control-border',['bg','surface'],3],
];
for (const name of ['light','dark']) test(`${name}: redesigned text, buttons, boundaries and focus indicators meet AA`, () => {
  const tokens = theme(name);
  for (const [fg, backgrounds, min] of pairs) for (const bg of backgrounds) {
    const ratio = contrast(tokens[fg],tokens[bg]);
    assert.ok(ratio >= min, `${name}: --${fg} on --${bg} = ${ratio.toFixed(2)}:1; requires ${min}:1`);
  }
});
test('OS dark palette matches the explicit dark palette', () => {
  assert.deepEqual(declarations(':root:not([data-theme="light"])',true), declarations('[data-theme="dark"]'));
});
test('light and dark define the same palette roles', () => {
  assert.deepEqual(Object.keys(declarations(':root,[data-theme="light"]')).sort(),Object.keys(declarations('[data-theme="dark"]')).sort());
});
test('aliases follow the current theme', () => {
  for(const name of ['light','dark']) {
    const tokens=theme(name);
    assert.equal(tokens.text,tokens.ink); assert.equal(tokens.bg,tokens.paper);
    assert.equal(tokens['focus-ring'],tokens.blue);
  }
});
test('contrast matches WCAG examples', () => {
  assert.equal(contrast('#000000','#FFFFFF').toFixed(1),'21.0');
  assert.equal(contrast('#777777','#FFFFFF').toFixed(2),'4.48');
});

// Muted section counts are small text: include the component opacity, not
// just the palette color, so a CSS override cannot silently defeat contrast.
const appStyles = postcss.parse(readFileSync(new URL('../styles.css',import.meta.url),'utf8'));
for(const name of ['light','dark']) test(`${name}: rendered section counts retain small-text contrast`,()=>{
  const tokens=theme(name);let opacity=1;
  appStyles.walkRules(rule=>{if(rule.selector==='.redesign .ldg-count')rule.walkDecls('opacity',d=>{opacity=Number(d.value);});});
  const foreground=rgb(tokens['text-2']),background=rgb(tokens.bg);
  const blended='#'+foreground.map((c,i)=>Math.round((c*opacity+background[i]*(1-opacity))*255).toString(16).padStart(2,'0')).join('');
  assert.ok(contrast(blended,tokens.bg)>=4.5,`${name}: section count is below 4.5:1 after opacity`);
});
