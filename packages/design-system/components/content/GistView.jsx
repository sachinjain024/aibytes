import React from "react";
import { ItemImage } from "./ItemImage.jsx";
import { SOURCE_NAMES } from "./signals.jsx";
import { Out } from "./gistIcons.jsx";
import { appearanceLink, dayLabel, linkLabel, stanceLabel, statCells } from "./gistFormat.js";

// The one view the gist panel and the gist page both render. It takes the gist
// file and nothing else, so the page can show it without loading an edition.
// Server-renderable: nothing here reads window or the clock while rendering.

function SourceButton({ link, primary, className = "" }) {
  return (
    <a className={"ldg-btn gist-btn " + (primary ? "ldg-btn--primary" : "ldg-btn--secondary") + (className ? " " + className : "")}
      href={link.url} target="_blank" rel="noopener noreferrer" title={link.title}>{linkLabel(link)}<Out /></a>);
}

// The stats heading and its date share one line. A server cannot know the
// reader's time zone, so it writes the UTC day and the browser swaps in the
// local one after it mounts: the first client render matches the server's.
function StatsAsOf({ iso }) {
  const [day, setDay] = React.useState(() => dayLabel(iso, "UTC"));
  React.useEffect(() => { setDay(dayLabel(iso)); }, [iso]);
  return <span className="gist-asof">(As of {day})</span>;
}

function Stats({ gist }) {
  const cells = gist.stats && gist.stats_as_of ? statCells(gist.kind, gist.stats, gist.stats_as_of) : [];
  if (!cells.length) return null;
  return (
    <section className="gist-sec gist-stats">
      <div className="gist-statshead"><h3>Stats</h3><StatsAsOf iso={gist.stats_as_of} /></div>
      <dl className="gist-statgrid">{cells.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    </section>);
}

function Section({ section }) {
  switch (section.key) {
    case "key_points":
      return <section className="gist-sec"><ul>{section.points.map((p, i) => <li key={i}>{p}</li>)}</ul></section>;
    case "why_it_matters":
      return <section className="gist-sec"><h3>Why it matters</h3><p>{section.text}</p></section>;
    case "who_its_for":
      return <section className="gist-sec"><h3>Who it's for</h3><p>{section.text}</p></section>;
    case "pricing":
      return <section className="gist-sec"><h3>Pricing</h3><p>{section.text}</p></section>;
    case "try_it":
      return <section className="gist-sec"><h3>Try it</h3><pre className="gist-code"><code>{section.command}</code></pre></section>;
    case "discussion":
      return (
        <section className="gist-sec"><h3>The discussion</h3>
          <ul>{section.points.map((p, i) => (
            <li key={i}><span className="gist-tag">{stanceLabel(p.stance)}</span>{p.text}{" "}
              <a href={p.url} target="_blank" rel="noopener noreferrer">comment</a></li>))}</ul>
        </section>);
    case "whats_open":
      return (
        <section className="gist-sec"><h3>What's open</h3>
          <ul>{section.points.map((p, i) => (
            <li key={i}>{p.text}{p.url && <>{" "}<a href={p.url} target="_blank" rel="noopener noreferrer">issue</a></>}</li>))}</ul>
        </section>);
    default:
      return null;
  }
}

function XPost({ gist }) {
  const post = gist.preview;
  return (
    <figure className="gist-post">
      <figcaption><b>{post.author_name}</b><span>{post.author_handle} · {dayLabel(post.posted_on + "T00:00:00Z", "UTC")}</span></figcaption>
      <blockquote>{post.text}</blockquote>
    </figure>);
}

export function GistView({ gist, as = "panel", appearanceHref, actions }) {
  const Heading = as === "page" ? "h1" : "h2";
  const first = gist.appearances[0];
  const firstLabel = appearanceLink(first).label;
  const destination = gist.links.find((l) => l.role === "destination");
  const discussion = gist.links.find((l) => l.role === "discussion");
  const buttons = [destination, discussion].filter(Boolean);
  const hasImage = gist.kind !== "x_post";
  const sourceName = gist.source ? SOURCE_NAMES[gist.source] : "X";
  return (
    <article className={"gist gist--" + as}>
      <header className="gist-head">
        <p className="gist-kicker">
          <span>{sourceName}</span>
          <i aria-hidden="true">·</i><span>First covered {firstLabel}</span>
          {gist.front_page && <span className="gist-badge">HN front page</span>}
          {gist.depth === "brief" && <span className="gist-depth" title="The source could not be read, so this gist is the short one">brief</span>}
        </p>
        <div className="gist-titlerow">
          {hasImage && <ItemImage item={{ image: gist.image, source: gist.source }} size={32} className="gist-mark" circleClassName="gist-mark--circle" />}
          <Heading className="gist-title" id="gist-title">{gist.title}</Heading>
        </div>
        {buttons[0] && <SourceButton link={buttons[0]} primary={false} />}
      </header>

      {gist.kind === "x_post" ? <XPost gist={gist} /> : <p className="gist-lede">{gist.lede}</p>}
      {gist.depth === "brief" && <p className="gist-briefnote">This is the short gist. The source could not be read when the edition was built.</p>}
      <Stats gist={gist} />
      {gist.sections.map((section) => <Section key={section.key} section={section} />)}

      <div className="gist-cta" aria-label="Sources">
        {buttons.map((link, i) => <SourceButton key={link.url} link={link} primary={i === 0} />)}
      </div>
      <section className="gist-sec gist-seen">
        <h3>Appeared in</h3>
        <p>{gist.appearances.map((a, i) => {
          const { href, label } = appearanceLink(a);
          return <span key={a.item_id}>{i > 0 && <i aria-hidden="true"> · </i>}<a href={appearanceHref ? appearanceHref(a) : href}>{label}</a></span>;
        })}</p>
      </section>
      {actions}
    </article>);
}
