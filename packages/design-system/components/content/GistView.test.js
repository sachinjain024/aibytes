import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import Module from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { build } from 'esbuild';
import { age, appearanceLink, dayLabel, linkLabel, monthYear, shortCount, statCells } from './gistFormat.js';

// Bundle JSX for Node; exercise the actual exported component, not a copy.
const result = await build({entryPoints:[new URL('./GistView.jsx',import.meta.url).pathname],
  bundle:true,platform:'node',format:'cjs',external:['react'],write:false});
const mod = new Module(import.meta.filename);
mod.filename=import.meta.filename;mod.paths=Module._nodeModulePaths(new URL('.',import.meta.url).pathname);
mod.require=createRequire(import.meta.url);mod._compile(result.outputFiles[0].text,import.meta.filename);
const { GistView } = mod.exports;

// Synthetic gists in the contract's shape (packages/feed-schema/feed.d.ts). No real source text.
const AS_OF = '2026-11-06T10:38:00Z';
const base = {
  schema_version: 1, tags: [], depth: 'full', sections: [], created_at: AS_OF, updated_at: AS_OF,
  appearances: [{ item_id: 'x-2026-11-05', edition_date: '2026-11-05' }, { item_id: 'x-issue-9', issue_slug: 'issue-9' }],
};
const hn = { ...base, slug: 'hn-fixture', kind: 'hn', source: 'hackernews', category: 'hn', title: 'Fixture HN story',
  url: 'https://example.com/post', source_url: 'https://news.ycombinator.com/item?id=1', image: { type: 'none' }, front_page: true,
  lede: 'A fixture lede for the Hacker News kind.',
  sections: [
    { key: 'key_points', points: ['First point', 'Second point', 'Third point'] },
    { key: 'discussion', points: [{ stance: 'agreed', text: 'Everyone agrees.', url: 'https://news.ycombinator.com/item?id=2' }] },
  ],
  stats: { points: 1169, comments: 365, submitted_by: 'someone', posted_at: '2026-11-05T15:38:00Z' }, stats_as_of: AS_OF,
  links: [{ role: 'destination', title: 'A very long page title that should never be a button label', url: 'https://example.com/post' },
    { role: 'discussion', title: 'Fixture HN story', url: 'https://news.ycombinator.com/item?id=1' }] };
const repo = { ...base, slug: 'gh-fixture', kind: 'repo', source: 'github', category: 'repos', title: 'owner/fixture',
  url: 'https://github.com/owner/fixture', source_url: 'https://github.com/owner/fixture',
  image: { type: 'avatar', url: 'https://github.com/owner.png' }, lede: 'A fixture lede for the repo kind.',
  sections: [{ key: 'key_points', points: ['a', 'b', 'c'] }, { key: 'try_it', command: 'pip install fixture' },
    { key: 'whats_open', points: [{ text: 'Open thing', url: 'https://github.com/owner/fixture/issues/1' }, { text: 'Another' }] }],
  stats: { stars: 140273, stars_gained: 612, forks: 9800, language: 'Shell', license: 'MIT', created_on: '2026-06-12',
    contributors: 41, open_issues: 73, last_release: { tag: 'v1.0', published_on: '2026-10-01' } }, stats_as_of: AS_OF,
  links: [{ role: 'destination', title: 'owner/fixture', url: 'https://github.com/owner/fixture' }] };
const launch = { ...base, slug: 'ph-fixture', kind: 'launch', source: 'producthunt', category: 'launches', title: 'Fixture Launch',
  url: 'https://fixture.example/', source_url: 'https://www.producthunt.com/products/fixture/launches/fixture',
  image: { type: 'logo', url: 'https://ph-files.imgix.net/abc.png?auto=format' }, lede: 'A fixture lede for the launch kind.',
  sections: [{ key: 'key_points', points: ['a', 'b', 'c'] }, { key: 'who_its_for', text: 'People who fixture.' }, { key: 'pricing', text: 'Free.' }],
  stats: { upvotes: 2400, comments: 42 }, stats_as_of: AS_OF,
  links: [{ role: 'destination', title: 'fixture.example', url: 'https://fixture.example/' },
    { role: 'discussion', title: 'Fixture Launch', url: 'https://www.producthunt.com/products/fixture/launches/fixture' }] };
const news = { ...base, slug: 'tc-fixture', kind: 'news', source: 'techcrunch', category: 'news', title: 'Fixture news story',
  url: 'https://techcrunch.com/2026/11/05/fixture/', source_url: 'https://techcrunch.com/2026/11/05/fixture/',
  image: { type: 'thumbnail', url: 'https://techcrunch.com/wp-content/uploads/2026/11/fixture.jpg' }, lede: 'A fixture lede for the news kind.',
  sections: [{ key: 'key_points', points: ['a', 'b', 'c'] }, { key: 'why_it_matters', text: 'It matters.' }],
  links: [{ role: 'destination', title: 'Fixture news story', url: 'https://techcrunch.com/2026/11/05/fixture/' }] };
const xpost = { ...base, slug: 'x-fixture', kind: 'x_post', depth: 'preview', title: 'Post by Fixture', url: 'https://x.com/fixture/status/1',
  source_url: 'https://x.com/fixture/status/1', image: { type: 'none' },
  preview: { bucket: 'insight', author_name: 'Fixture Author', author_handle: '@fixture', posted_on: '2026-11-02', text: 'A fixture post.', media: 'none' },
  stats: { likes: 41200, reposts: 6800, replies: 1100 }, stats_as_of: AS_OF,
  links: [{ role: 'discussion', title: 'The post on X', url: 'https://x.com/fixture/status/1' }] };
const brief = { ...hn, slug: 'hn-brief', depth: 'brief', front_page: undefined, sections: [], stats: undefined, stats_as_of: undefined };
delete brief.front_page;

const render = (gist, props) => renderToStaticMarkup(React.createElement(GistView, { gist, as: 'panel', ...props }));
const cell = (html, label) => new RegExp(`<dt>${label}</dt><dd>([^<]*)</dd>`).exec(html)?.[1];

test('every kind renders from its gist file alone, under node with no window', () => {
  assert.equal(typeof window, 'undefined');
  for (const gist of [hn, repo, launch, news, xpost, brief]) {
    const html = render(gist);
    assert.match(html, /^<article class="gist gist--panel"/);
    assert.match(html, new RegExp(gist.title));
  }
});
test('the title is an h2 in the panel and the one h1 on the page', () => {
  assert.match(render(hn), /<h2 class="gist-title"[^>]*>Fixture HN story/);
  assert.match(render(hn, { as: 'page' }), /<h1 class="gist-title"[^>]*>Fixture HN story/);
  assert.match(render(hn, { as: 'page' }), /^<article class="gist gist--page"/);
});
test('the image sits just before the title: logo, circle avatar, thumbnail, and the Y mark for Hacker News', () => {
  const head = (gist) => { const html = render(gist); return html.slice(html.indexOf('class="gist-titlerow"'), html.indexOf('class="gist-title"')); };
  assert.match(head(launch), /<img[^>]*src="https:\/\/ph-files\.imgix\.net\/abc\.png[^"]*w=64/);
  assert.match(head(repo), /<img[^>]*class="gist-mark gist-mark--circle"/);
  assert.match(head(news), /<img[^>]*src="https:\/\/techcrunch\.com\/wp-content\/uploads\/2026\/11\/fixture\.jpg\?w=128/);
  assert.match(head(hn), /<svg[^>]*aria-label="Hacker News"/);
  assert.doesNotMatch(render(xpost), /gist-mark/);
});
test('the kicker names the source and when it was first covered, with the front-page and brief labels', () => {
  const html = render(hn);
  assert.match(html, /Hacker News/);
  assert.match(html, /First covered 5 Nov 2026/);
  assert.match(html, /HN front page/);
  assert.doesNotMatch(html, />brief</);
  assert.match(render(brief), /class="gist-depth"[^>]*>brief</);
  assert.doesNotMatch(render(brief), /HN front page/);
  assert.match(render(brief), /This is the short gist\. The source could not be read when the edition was built\./);
  assert.doesNotMatch(render(hn), /short gist/);
  assert.match(render({ ...hn, appearances: [{ item_id: 'a', issue_slug: 'issue-9' }] }), /First covered Issue 9/);
});
test('the stats heading and its date are one line, the day in UTC until the browser swaps in the reader\'s own', () => {
  const html = render(hn);
  assert.match(html, /<h3>Stats<\/h3><span class="gist-asof">\(As of 6 Nov 2026\)<\/span>/);
  assert.doesNotMatch(html, /IST|GMT|10:38|16:08/);
  assert.equal(render(news).includes('Stats'), false, 'a news gist has no stats block');
});
test('counts are short except Hacker News, whose points and comments stay whole', () => {
  assert.equal(cell(render(hn), 'Points'), '1,169');
  assert.equal(cell(render(hn), 'Comments'), '365');
  assert.equal(cell(render(repo), 'Stars'), '140k');
  assert.equal(cell(render(repo), 'Forks'), '9.8k');
  assert.equal(cell(render(launch), 'Upvotes'), '2.4k');
  assert.equal(cell(render(xpost), 'Likes'), '41k');
  assert.deepEqual([999, 1000, 1234, 9999, 10000, 140273, 999999, 1000000, 1250000].map(shortCount),
    ['999', '1k', '1.2k', '9.9k', '10k', '140k', '1M', '1M', '1.2M']);
});
test('a repo reads stars, forks, contributors, open issues, created, language, licence, and hides two fields', () => {
  const html = render(repo);
  const labels = [...html.matchAll(/<dt>([^<]*)<\/dt>/g)].map((m) => m[1]);
  assert.deepEqual(labels, ['Stars', 'Forks', 'Contributors', 'Open issues', 'Created', 'Language', 'Licence']);
  assert.equal(cell(html, 'Created'), 'Jun 2026');
  assert.doesNotMatch(html, /Stars gained|Last release|stars_gained|last_release|v1\.0/);
});
test('Hacker News shows how long ago it was posted, against when the stats were read', () => {
  assert.equal(cell(render(hn), 'Posted'), '19h');
  assert.equal(age('2026-11-05T15:38:00Z', AS_OF), '19h');
  assert.equal(age('2026-11-06T10:00:00Z', AS_OF), '38m');
  assert.equal(age('2026-10-20T10:38:00Z', AS_OF), '17d');
  assert.equal(age('2026-06-06T10:38:00Z', AS_OF), '5mo');
  assert.equal(age('2023-11-06T10:38:00Z', AS_OF), '3y');
});
test('sections render in the contract order, each with its link or code', () => {
  const html = render(hn);
  assert.ok(html.indexOf('First point') < html.indexOf('The discussion'));
  assert.match(html, /<span class="gist-tag">Agreed<\/span>Everyone agrees\. <a href="https:\/\/news\.ycombinator\.com\/item\?id=2"[^>]*>comment<\/a>/);
  const r = render(repo);
  assert.match(r, /<h3>Try it<\/h3><pre class="gist-code"><code>pip install fixture<\/code>/);
  assert.match(r, /<h3>What&#x27;s open<\/h3>/);
  assert.match(r, />issue<\/a>/);
  assert.ok(r.indexOf('Try it') < r.indexOf('What&#x27;s open'));
  const l = render(launch);
  assert.ok(l.indexOf('Who it&#x27;s for') < l.indexOf('Pricing'));
  assert.match(render(news), /<h3>Why it matters<\/h3>/);
});
test('closing buttons are generic: Source filled, then the discussion, each with the external arrow and a new tab', () => {
  const html = render(hn);
  const closing = html.slice(html.indexOf('class="gist-cta"'));
  assert.match(closing, /ldg-btn--primary[^>]*href="https:\/\/example\.com\/post"[^>]*>Source<svg/);
  assert.match(closing, /ldg-btn--secondary[^>]*href="https:\/\/news\.ycombinator\.com\/item\?id=1"[^>]*>HN Discussion<svg/);
  assert.ok(closing.indexOf('>Source<') < closing.indexOf('>HN Discussion<'));
  assert.match(closing, /title="A very long page title that should never be a button label"/);
  assert.doesNotMatch(closing, />A very long page title/);
  assert.equal((closing.match(/target="_blank" rel="noopener noreferrer"/g) || []).length, 2);
  assert.match(render(launch).slice(render(launch).indexOf('class="gist-cta"')), />Product Hunt<svg/);
  assert.equal((render(repo).match(/class="ldg-btn[^"]*gist-btn[^>]*>Source</g) || []).length, 2, 'under the title and at the end');
  assert.equal(linkLabel({ role: 'discussion', url: 'https://lobste.rs/s/x' }), 'Discussion');
  assert.equal(linkLabel({ role: 'source', url: 'https://github.com/o/r#readme' }), 'Source');
  assert.equal(linkLabel({ role: 'discussion', url: 'not a url' }), 'Discussion');
});
test('an item with only a discussion link (an Ask HN post) has one filled button', () => {
  const ask = { ...hn, links: [hn.links[1]] };
  const html = render(ask);
  const closing = html.slice(html.indexOf('class="gist-cta"'), html.indexOf('gist-seen'));
  assert.equal((closing.match(/<a /g) || []).length, 1);
  assert.match(closing, /ldg-btn--primary[^>]*>HN Discussion</);
});
test('an X post draws the post and its counts, with no summary', () => {
  const html = render(xpost);
  assert.match(html, /<figure class="gist-post"/);
  assert.match(html, /Fixture Author/);assert.match(html, /@fixture/);assert.match(html, /A fixture post\./);
  assert.equal(cell(html, 'Replies'), '1.1k');
  assert.doesNotMatch(html, /gist-lede/);
  assert.match(html, />Discussion<svg/);
});
test('Appeared in lists each edition and issue as a link', () => {
  const html = render(hn);
  assert.match(html, /<h3>Appeared in<\/h3>/);
  assert.match(html, /<a href="\/2026-11-05">5 Nov 2026<\/a>/);
  assert.match(html, /<a href="\/weekly\/issue-9">Issue 9<\/a>/);
  assert.deepEqual(appearanceLink({ item_id: 'a', edition_date: '2026-11-05' }), { href: '/2026-11-05', label: '5 Nov 2026' });
  assert.match(render(hn, { appearanceHref: (a) => '/x/' + (a.edition_date || a.issue_slug) }), /<a href="\/x\/2026-11-05">/);
});
test('the actions slot comes last, and is absent when not given', () => {
  const html = render(hn, { actions: React.createElement('div', { className: 'my-actions' }, 'Save') });
  assert.ok(html.indexOf('my-actions') > html.indexOf('Appeared in'));
  assert.doesNotMatch(render(hn), /my-actions/);
});
test('date and number helpers are pure and stable', () => {
  assert.equal(dayLabel('2026-11-06T10:38:00Z', 'UTC'), '6 Nov 2026');
  assert.equal(monthYear('2026-06-12'), 'Jun 2026');
  assert.deepEqual(statCells('news', { points: 3 }, AS_OF), []);
  assert.deepEqual(statCells('launch', { upvotes: 5 }, AS_OF), [['Upvotes', '5']]);
});
