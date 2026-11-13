import React from 'react';
import { ItemImage } from './ItemImage.jsx';
import { CardMenu } from './CardMenu.jsx';
import { SaveStar } from './SaveStar.jsx';
import { withRef } from './withRef.js';
import { SOURCE_NAMES, Signals, LangDot } from './signals.jsx';

/** Shared reading-row/card anatomy; card controls retain their public API.
 * starPos puts the save star after the ⋮ menu ("actions") or under the source image ("visual"). */
export function FeedItem({ item, grid = false, saved, onToggleSave, topToday = false, front = false,
  signalsPos = 'source', tagStyle = 'dots', maxTags = 3, starPos = 'actions' }) {
  const tags = (item.tags || []).slice(0, maxTags);
  const language = item.meta?.language;
  const atLogo = grid && (signalsPos === 'logo' || signalsPos === 'bottom');
  const tagsClass = tagStyle === 'pills' ? 'ldg-tagpills' : 'ldg-tags' + (tagStyle === 'hash' ? ' ldg-tags--hash' : '');
  const star = onToggleSave && <SaveStar saved={saved} onToggle={() => onToggleSave(item.id)} />;
  return (
    <article className={'story' + (grid ? ` story--grid story--signals-${signalsPos}` : '') + (topToday ? ' story--top' : '')}>
      <div className="story-visual">
        <ItemImage item={item} size={grid ? 28 : 34} className="source-icon" />
        {starPos === 'visual' && star}
        {atLogo && <Signals signals={item.signals} />}
      </div>
      <div className="story-content">
        <div className="story-top"><h3><a href={withRef(item.url)} target="_blank" rel="noopener noreferrer">{item.title}</a></h3></div>
        <p className="summary">{item.summary}</p>
        {grid && signalsPos === 'row' && <div className="story-signals"><Signals signals={item.signals} /></div>}
        {grid && maxTags > 0 && (language || tags.length > 0) && <div className={'story-tags ' + tagsClass}>
          {language && <LangDot language={language} />}
          {tags.map((tag, i) => <React.Fragment key={tag}>
            {tagStyle === 'dots' && (i > 0 || language) ? ' · ' : null}
            <span className={tagStyle === 'pills' ? 'ldg-tagpill' : tagStyle === 'hash' ? 'ldg-taghash' : undefined}>{tagStyle === 'hash' ? '#' : ''}{tag}</span>
          </React.Fragment>)}
        </div>}
        <div className="metadata">
          {topToday && <span className="ldg-top-label" title="Top today">TOP</span>}
          {front && <span className="ldg-front-label" title="On the Hacker News front page">Front page</span>}
          <a className="discussion" href={withRef(item.source_url)} target="_blank" rel="noopener noreferrer">{SOURCE_NAMES[item.source] || item.source}</a>
          {(!grid || signalsPos === 'source') && <Signals signals={item.signals} />}
          <span className="item-actions"><CardMenu item={item} up={false} />{starPos === 'actions' && star}</span>
        </div>
      </div>
    </article>
  );
}
