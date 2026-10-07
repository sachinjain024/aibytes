import React from "react";
import { Wordmark } from "@aibytes/design-system/components/brand/Wordmark.jsx";
import { Card } from "@aibytes/design-system/components/content/Card.jsx";
import { EndCard } from "@aibytes/design-system/components/content/EndCard.jsx";
import { loadEdition, loadIndex } from "./content.js";

// Long form for the page heading, e.g. "Wed, Oct 7, 2026". The edition date is
// a calendar day, not an instant, so it is formatted in UTC to stay on that day.
const LONG_DATE = new Intl.DateTimeFormat("en-US", {
  weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
});
const SHORT_DATE = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

// Ledger is wired in: tokens, fonts, and the Card grid. The header, the
// edition bar, routing, filters, and saves are the next AIB-8h phase 4 items;
// until then the date heading stands in for the edition bar.
export function App() {
  const [state, setState] = React.useState({ status: "loading" });

  React.useEffect(() => {
    let live = true;
    loadIndex()
      .then((index) => {
        const latest = index.editions[0];
        if (!latest) return { status: "empty" };
        return loadEdition(latest).then((edition) => ({ status: "ready", edition }));
      })
      .catch((error) => ({ status: "error", error }))
      .then((next) => live && setState(next));
    return () => {
      live = false;
    };
  }, []);

  return (
    <div className="app-shell">
      <div className="app-top">
        <Wordmark />
        {state.status === "ready" && <h1>{LONG_DATE.format(new Date(state.edition.date))}</h1>}
      </div>
      <main className="app-main">
        <Body state={state} />
      </main>
    </div>
  );
}

function Body({ state }) {
  if (state.status === "loading") return <div className="ldg-endcard">Loading the latest edition...</div>;
  if (state.status === "empty") return <div className="ldg-endcard">No editions published yet.</div>;
  if (state.status === "error") {
    return <div className="ldg-endcard" role="alert">Could not load the edition: {state.error.message}</div>;
  }
  const { edition } = state;
  // Hidden items stay in the file so a hide is reversible; readers skip them.
  const items = edition.items.filter((item) => !item.hidden);
  return (
    <>
      <section className="app-sec" aria-label={`${items.length} items`}>
        <div className="app-grid">
          {items.map((item) => <Card key={item.id} item={item} signalsPos="bottom" />)}
        </div>
      </section>
      <EndCard dateLabel={SHORT_DATE.format(new Date(edition.date))} />
    </>
  );
}
