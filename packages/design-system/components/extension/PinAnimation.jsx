// How to pin the extension (AIB-76n, F1): a drawing of Chrome's toolbar that
// loops through five frames, the caption under it changing with each. Frame 1
// the toolbar, 2 the puzzle icon, 3 its menu, 4 the pin, 5 the icon pinned.
// Under prefers-reduced-motion it holds frame 5 and lists all five captions.
import React from "react";
import { ExtensionIcon } from "./ExtensionIcon.jsx";

const PUZZLE = <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 2.5a1.5 1.5 0 0 1 3 0V4h2.5a.5.5 0 0 1 .5.5V7h-1.5a1.5 1.5 0 0 0 0 3H12v2.5a.5.5 0 0 1-.5.5H9v-1.5a1.5 1.5 0 0 0-3 0V13H3.5a.5.5 0 0 1-.5-.5V10h1.5a1.5 1.5 0 0 0 0-3H3V4.5a.5.5 0 0 1 .5-.5H6z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>;
const PIN = <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M10 2l4 4-2 1-2.5 2.5L9 13l-6-6 3.5-.5L9 4z M3 13l3-3" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>;
const FRAME_MS = 1100;
const LAST = 4;

function prefersReduced() {
  return typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function PinAnimation({ captions, reducedMotion, label = "Animation: select the puzzle icon, then the pin next to aiBytes_" }) {
  // Read the media query on the first render, so a reader who asked for reduced
  // motion never sees one animated paint; the effect keeps it in step after.
  const [reduce, setReduce] = React.useState(() => reducedMotion ?? prefersReduced());
  React.useEffect(() => { if (reducedMotion === undefined) setReduce(prefersReduced()); }, [reducedMotion]);
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    if (reduce) return undefined;
    const t = setInterval(() => setTick(x => (x + 1) % 6), FRAME_MS);
    return () => clearInterval(t);
  }, [reduce]);
  // Six ticks per loop: the last frame holds for two.
  const f = reduce ? LAST : Math.min(tick, LAST);
  return (
    <figure className="ldg-pinanim">
      <div className="ldg-pinanim__bar" role="img" aria-label={label}>
        <span className="ldg-pinanim__omni" />
        {f === LAST && <span className="ldg-pinanim__icon ldg-pinanim__icon--new"><ExtensionIcon size={16} /></span>}
        <span className={"ldg-pinanim__icon" + (f === 1 ? " ldg-pinanim__icon--hover" : "")}>{PUZZLE}</span>
        <span className="ldg-pinanim__avatar" />
        {f === 1 && <span className="ldg-pinanim__cursor" />}
        {(f === 2 || f === 3) && (
          <span className="ldg-pinanim__menu">
            <span className="ldg-pinanim__row"><ExtensionIcon size={14} /> aiBytes_<span className={"ldg-pinanim__pin" + (f === 3 ? " ldg-pinanim__pin--hover" : "")}>{PIN}</span></span>
            <span className="ldg-pinanim__row ldg-pinanim__row--dim"><span className="ldg-pinanim__dot" /> Another extension</span>
            {f === 3 && <span className="ldg-pinanim__cursor ldg-pinanim__cursor--pin" />}
          </span>
        )}
      </div>
      {reduce
        ? <ol className="ldg-pinanim__steps">{captions.map((c, i) => <li key={i}>{c}</li>)}</ol>
        : <figcaption>{captions[f]}</figcaption>}
    </figure>
  );
}
