// The options panel every review prototype carries: which screen to show,
// then the open choices for that screen as lettered, numbered buttons
// (A1, A2 ...). A choice the publisher has confirmed is listed in `decided`
// and shows only its pick, marked with a check: "A1 ✓", fixed, with a
// "Decided" tag. Letters come from the order of `options`, so they never shift.
import React from "react";

export function Check() {
  return <svg className="kit-check" width="12" height="12" viewBox="0 0 10 10" aria-hidden="true"><path d="M2 5.2l2 2L8 3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

export const letterFor = options => key => {
  const i = Object.keys(options).indexOf(key);
  return i < 0 ? "" : String.fromCharCode(65 + i);
};

export function ReviewPanel({ title, options, groups, decided = {}, opts, setOpt, views, view, go, right = false, startOpen = true, children }) {
  const [open, setOpen] = React.useState(startOpen);
  const letter = letterFor(options);
  const keys = groups[view] || Object.keys(options);
  const open_ = keys.filter(k => !decided[k]).length;
  return (
    <aside className={"kit-review" + (open ? "" : " kit-review--closed") + (right ? " kit-review--right" : "")} aria-label="Prototype options">
      <button className="kit-review-toggle" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <span>{title} options</span><span aria-hidden="true">{open ? "–" : "+"}</span>
      </button>
      {open && (
        <div className="kit-review-body">
          <fieldset>
            <legend>Show</legend>
            <div className="kit-seg">
              {views.map(([k, l]) => <button key={k} aria-pressed={view === k} onClick={() => go(k)}>{l}</button>)}
            </div>
          </fieldset>
          {keys.length > 0 && <p className="kit-tally">{open_ ? `${open_} open` : "All decided"}{keys.length - open_ ? ` · ${keys.length - open_} decided` : ""}</p>}
          {keys.map(key => {
            const o = options[key], L = letter(key), pick = decided[key];
            return (
              <fieldset key={key} className={pick ? "is-decided" : undefined}>
                <legend><span className="kit-q">{L}</span>{o.label}{pick && <span className="kit-decided">Decided</span>}</legend>
                <div className="kit-seg">
                  {pick ? (
                    <button aria-pressed="true" disabled><Check /> {L}{pick} · {o.choices[pick]}</button>
                  ) : Object.entries(o.choices).map(([n, label]) => (
                    <button key={n} aria-pressed={opts[key] === n} onClick={() => setOpt(key, n)}>{L}{n} · {label}</button>
                  ))}
                </div>
                {o.notes && <p className="kit-note">{o.notes[pick || opts[key]]}</p>}
              </fieldset>
            );
          })}
          {children}
        </div>
      )}
    </aside>
  );
}
