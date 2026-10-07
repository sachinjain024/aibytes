import React from "react";
import { Wordmark } from "@aibytes/design-system/components/brand/Wordmark.jsx";
import { Card } from "@aibytes/design-system/components/content/Card.jsx";
import { EndCard } from "@aibytes/design-system/components/content/EndCard.jsx";
import { loadEdition, loadIndex } from "./content.js";
import { parseRoute, pickEdition } from "./route.js";

// Long form for the page heading, e.g. "Wed, Oct 7, 2026". The edition date is
// a calendar day, not an instant, so it is formatted in UTC to stay on that day.
const LONG_DATE = new Intl.DateTimeFormat("en-US", {
  weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
});
const SHORT_DATE = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const longDate = (date) => LONG_DATE.format(new Date(date));

// The current route, kept in step with back and forward. navigate() is for the
// edition bar; links that leave the app stay ordinary links.
function useRoute() {
  const [pathname, setPathname] = React.useState(window.location.pathname);
  React.useEffect(() => {
    const onPop = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const navigate = React.useCallback((to) => {
    window.history.pushState(null, "", to);
    setPathname(to);
  }, []);
  return [parseRoute(pathname), navigate];
}

// Ledger is wired in and every edition has its own URL. The header, the
// edition bar, filters, and saves are the next AIB-8h phase 4 items; until
// then the date heading stands in for the edition bar.
export function App() {
  const [route] = useRoute();
  const [index, setIndex] = React.useState({ status: "loading" });
  const [edition, setEdition] = React.useState({ status: "loading" });

  React.useEffect(() => {
    let live = true;
    loadIndex()
      .then((data) => live && setIndex({ status: "ready", data }))
      .catch((error) => live && setIndex({ status: "error", error }));
    return () => {
      live = false;
    };
  }, []);

  const ref = index.status === "ready" ? pickEdition(route, index.data.editions) : null;

  React.useEffect(() => {
    if (!ref) return undefined;
    let live = true;
    setEdition({ status: "loading" });
    loadEdition(ref)
      .then((data) => live && setEdition({ status: "ready", data }))
      .catch((error) => live && setEdition({ status: "error", error }));
    return () => {
      live = false;
    };
  }, [ref && ref.date]);

  const view = viewFor(route, index, ref, edition);
  React.useEffect(() => {
    document.title = view.date ? `aiBytes_ · ${longDate(view.date)}` : "aiBytes_";
  }, [view.date]);

  return (
    <div className="app-shell">
      <div className="app-top">
        <Wordmark />
        {view.date && <h1>{longDate(view.date)}</h1>}
      </div>
      <main className="app-main">{view.body}</main>
    </div>
  );
}

// What to show, as { date, body }. `date` is set only once an edition is on screen.
function viewFor(route, index, ref, edition) {
  const message = (text, extra) => ({ body: <div className="ldg-endcard" role={extra}>{text}</div> });
  const toLatest = <a href="/">Go to the latest edition</a>;

  if (route.kind === "notfound") return message(<>Nothing lives at this address. {toLatest}.</>);
  if (index.status === "loading") return message("Loading...");
  if (index.status === "error") return message(`Could not load the editions: ${index.error.message}`, "alert");
  if (!ref) {
    if (route.kind === "latest") return message("No editions published yet.");
    return message(<>There is no edition for {longDate(route.date)}. {toLatest}.</>);
  }
  if (edition.status === "loading" || edition.data?.date !== ref.date) {
    if (edition.status === "error") return message(`Could not load the edition: ${edition.error.message}`, "alert");
    return message("Loading the edition...");
  }

  // Hidden items stay in the file so a hide is reversible; readers skip them.
  const items = edition.data.items.filter((item) => !item.hidden);
  return {
    date: ref.date,
    body: (
      <>
        <section className="app-sec" aria-label={`${items.length} items`}>
          <div className="app-grid">
            {items.map((item) => <Card key={item.id} item={item} signalsPos="bottom" />)}
          </div>
        </section>
        <EndCard dateLabel={SHORT_DATE.format(new Date(ref.date))} />
      </>
    ),
  };
}
