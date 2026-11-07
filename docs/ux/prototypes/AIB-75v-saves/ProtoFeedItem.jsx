// A copy of Ledger's FeedItem with one extra option, starPos, so the prototype
// can compare star placements on real cards and rows:
//   "after"  - the shipped order: ⋮ menu, then the star
//   "before" - the star, then the ⋮ menu
//   "left"   - the star under the source icon, in the visual column
import React from "react";
import { ItemImage } from "@ds/components/content/ItemImage.jsx";
import { CardMenu } from "@ds/components/content/CardMenu.jsx";
import { SaveStar } from "@ds/components/content/SaveStar.jsx";
import { SOURCE_NAMES, Signals, LangDot } from "@ds/components/content/signals.jsx";

export function ProtoFeedItem({ item, grid = false, saved, onToggleSave, topToday = false,
  signalsPos = "source", tagStyle = "dots", maxTags = 3, starPos = "after" }) {
  const tags = (item.tags || []).slice(0, maxTags);
  const language = item.meta?.language;
  const atLogo = grid && (signalsPos === "logo" || signalsPos === "bottom");
  const tagsClass = tagStyle === "pills" ? "ldg-tagpills" : "ldg-tags" + (tagStyle === "hash" ? " ldg-tags--hash" : "");
  const star = onToggleSave && <SaveStar saved={saved} onToggle={() => onToggleSave(item.id)} />;
  return (
    <article className={"story" + (grid ? ` story--grid story--signals-${signalsPos}` : "") + (topToday ? " story--top" : "") + ` proto-star-${starPos}`}>
      <div className="story-visual">
        <ItemImage item={item} size={grid ? 28 : 34} className="source-icon" />
        {starPos === "left" && star}
        {atLogo && <Signals signals={item.signals} />}
      </div>
      <div className="story-content">
        <div className="story-top"><h3><a href={item.url} target="_blank" rel="noopener noreferrer">{item.title}</a></h3></div>
        <p className="summary">{item.summary}</p>
        {grid && signalsPos === "row" && <div className="story-signals"><Signals signals={item.signals} /></div>}
        {grid && maxTags > 0 && (language || tags.length > 0) && <div className={"story-tags " + tagsClass}>
          {language && <LangDot language={language} />}
          {tags.map((tag, i) => <React.Fragment key={tag}>
            {tagStyle === "dots" && (i > 0 || language) ? " · " : null}
            <span className={tagStyle === "pills" ? "ldg-tagpill" : tagStyle === "hash" ? "ldg-taghash" : undefined}>{tagStyle === "hash" ? "#" : ""}{tag}</span>
          </React.Fragment>)}
        </div>}
        <div className="metadata">
          {topToday && <span className="ldg-top-label" title="Top today">TOP</span>}
          <a className="discussion" href={item.source_url} target="_blank" rel="noopener noreferrer">{SOURCE_NAMES[item.source] || item.source}</a>
          {(!grid || signalsPos === "source") && <Signals signals={item.signals} />}
          <span className="item-actions">
            {starPos === "before" && star}
            <CardMenu item={item} up={false} />
            {starPos === "after" && star}
          </span>
        </div>
      </div>
    </article>
  );
}

export const ProtoCard = ({ maxTags = 0, ...props }) => <ProtoFeedItem grid maxTags={maxTags} {...props} />;
export const ProtoRow = props => <ProtoFeedItem {...props} />;
