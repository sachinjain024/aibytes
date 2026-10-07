import React from "react";
import { Card } from "@aibytes/design-system/components/content/Card.jsx";
import { EndCard } from "@aibytes/design-system/components/content/EndCard.jsx";
import { ListRow } from "@aibytes/design-system/components/content/ListRow.jsx";
import { EditionBar } from "@aibytes/design-system/components/navigation/EditionBar.jsx";
import { Header } from "@aibytes/design-system/components/navigation/Header.jsx";
import { loadEdition, loadIndex } from "./content.js";
import { ago, longDate, midDate, shortDate } from "./format.js";
import { useChoice, useDismiss, useMedia, useTheme } from "./hooks.js";
import { VIEW } from "./prefs.js";
import { editionPath, parseRoute, pickEdition } from "./route.js";

const TAGLINE = "today's AI, in one byte";
// Ledger's sticky breakpoint (app.css); below it the header and bar go compact.
const PHONE = "(max-width: 699px)";

// The current route, kept in step with back and forward.
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
    window.scrollTo(0, 0);
  }, []);
  return [parseRoute(pathname), navigate];
}

// Header, edition bar, and calendar over the edition as a Card grid or a
// ListRow list. Category chips, filters, saves, and sign-in are later AIB-8h
// phase 4 items, so the header shows none of their controls yet.
export function App() {
  const [route, navigate] = useRoute();
  const [theme, toggleTheme] = useTheme();
  const [view, setView] = useChoice(VIEW, "grid");
  const compact = useMedia(PHONE);
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

  const editions = index.status === "ready" ? index.data.editions : [];
  const ref = pickEdition(route, editions);

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

  React.useEffect(() => {
    document.title = ref ? `aiBytes_ · ${longDate(ref.date)}` : "aiBytes_";
  }, [ref && ref.date]);

  return (
    <div className="app-shell">
      <div className="app-sticky">
        <Header compact={compact} showCategories={false} tagline={compact ? undefined : TAGLINE}
          view={view} onView={setView} theme={theme} onToggleTheme={toggleTheme} />
        {ref && <Bar refAt={ref} editions={editions} compact={compact} navigate={navigate} />}
      </div>
      <main className="app-main">{body(route, index, ref, edition, view)}</main>
    </div>
  );
}

// The edition bar for `refAt`. index.json is newest first, so the previous
// (older) edition is the next entry and the newer one the entry before.
function Bar({ refAt, editions, compact, navigate }) {
  const [open, setOpen] = React.useState(false);
  const close = React.useCallback(() => setOpen(false), []);
  const wrap = React.useRef(null);
  useDismiss(wrap, open, close);

  const at = editions.findIndex((ref) => ref.date === refAt.date);
  const older = editions[at + 1];
  const newer = editions[at - 1];
  const go = (date) => {
    setOpen(false);
    if (date !== refAt.date) navigate(editionPath(date));
  };

  return (
    <div ref={wrap}>
      <EditionBar compact={compact}
        dateLabel={compact ? midDate(refAt.date) : longDate(refAt.date)}
        itemCount={refAt.total}
        updatedAgo={at === 0 ? ago(refAt.generated_at) : undefined}
        prevLabel={older && shortDate(older.date)} onPrev={() => older && go(older.date)}
        nextLabel={newer && shortDate(newer.date)} onNext={() => newer && go(newer.date)}
        onDateClick={() => setOpen((o) => !o)} calendarOpen={open}
        editions={editions.map((ref) => ({ date: ref.date, label: midDate(ref.date), count: ref.total }))}
        currentDate={refAt.date} onSelectEdition={go} />
    </div>
  );
}

function body(route, index, ref, edition, view) {
  const message = (text, role) => <div className="ldg-endcard" role={role}>{text}</div>;
  const toLatest = <a href="/">Go to the latest edition</a>;

  if (route.kind === "notfound") return message(<>Nothing lives at this address. {toLatest}.</>);
  if (index.status === "loading") return message("Loading...");
  if (index.status === "error") return message(`Could not load the editions: ${index.error.message}`, "alert");
  if (!ref) {
    if (route.kind === "latest") return message("No editions published yet.");
    return message(<>There is no edition for {longDate(route.date)}. {toLatest}.</>);
  }
  if (edition.status === "error") return message(`Could not load the edition: ${edition.error.message}`, "alert");
  if (edition.status === "loading" || edition.data.date !== ref.date) return message("Loading the edition...");

  // Hidden items stay in the file so a hide is reversible; readers skip them.
  const items = edition.data.items.filter((item) => !item.hidden);
  return (
    <>
      <section className="app-sec" aria-label={`${items.length} items`}>
        {view === "list"
          ? <div className="app-rows">{items.map((item) => <ListRow key={item.id} item={item} />)}</div>
          : <div className="app-grid">{items.map((item) => <Card key={item.id} item={item} signalsPos="bottom" />)}</div>}
      </section>
      <EndCard dateLabel={shortDate(ref.date)} />
    </>
  );
}
