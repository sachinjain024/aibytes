import React from "react";
import { RedesignHeader, RedesignSidebar, RedesignToolbar, RedesignFilters } from "./Redesign.jsx";
import { Card } from "@aibytes/design-system/components/content/Card.jsx";
import { EmptyState } from "@aibytes/design-system/components/content/EmptyState.jsx";
import { EndCard } from "@aibytes/design-system/components/content/EndCard.jsx";
import { ListRow } from "@aibytes/design-system/components/content/ListRow.jsx";
import { SectionHeading } from "@aibytes/design-system/components/content/SectionHeading.jsx";
import { EditionBar } from "@aibytes/design-system/components/navigation/EditionBar.jsx";
import { loadEdition, loadIndex, loadTags } from "./content.js";
import { CATEGORIES, countMatches, describeFilters, filtersToSearch, matches, NO_FILTERS, parseFilters, SOURCES, toggle } from "./filters.js";
import { ago, longDate, midDate, shortDate } from "./format.js";
import { useChoice, useDismiss, useGridColumns, useMedia, useReturnFocus, useTheme } from "./hooks.js";
import { shownView } from "./layout.js";
import { groupedItems, rankedItems } from "./order.js";
import { ORDER, VIEW } from "./prefs.js";
import { editionPath, olderEdition, parseRoute, pickEdition } from "./route.js";

const here = () => ({ pathname: window.location.pathname, search: window.location.search });

// The current path and query, kept in step with back and forward. A new
// edition is a history entry; a filter change replaces the current one, so
// Back leaves the edition rather than unpicking chips one by one.
function useLocation() {
  const [location, setLocation] = React.useState(here);
  React.useEffect(() => {
    const onPop = () => setLocation(here());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const navigate = React.useCallback((to, { replace = false } = {}) => {
    window.history[replace ? "replaceState" : "pushState"](null, "", to);
    setLocation(here());
    if (!replace) window.scrollTo(0, 0);
  }, []);
  return [location, navigate];
}

// The approved presentation wraps the existing edition, URL filter and
// preference logic. Saves and sign-in remain outside the shipped app scope.
export function App() {
  // Text fields match :focus-visible even after pointer focus in browsers.
  // Track input modality so rings are reserved for keyboard navigation.
  React.useEffect(() => {
    const root = document.documentElement;
    const pointer = () => { root.dataset.inputModality = "pointer"; };
    const keyboard = event => {
      // Typing into a mouse-focused field must not turn its ring back on.
      const editing = event.target instanceof Element && event.target.matches("input, textarea, select, [contenteditable]");
      const navigation = event.key === "Tab" || (!editing && ["Enter", " ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End", "/"].includes(event.key));
      if (navigation && !event.metaKey && !event.ctrlKey && !event.altKey) root.dataset.inputModality = "keyboard";
    };
    document.addEventListener("pointerdown", pointer, true);
    document.addEventListener("mousedown", pointer, true);
    document.addEventListener("keydown", keyboard, true);
    return () => {
      document.removeEventListener("pointerdown", pointer, true);
      document.removeEventListener("mousedown", pointer, true);
      document.removeEventListener("keydown", keyboard, true);
      delete root.dataset.inputModality;
    };
  }, []);
  const [location, navigate] = useLocation();
  const route = parseRoute(location.pathname);
  const [theme, toggleTheme] = useTheme();
  React.useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  const [view, setView] = useChoice(VIEW, "grid");
  const [mode, setMode] = useChoice(ORDER, "ranked");
  const [index, setIndex] = React.useState({ status: "loading" });
  const [edition, setEdition] = React.useState({ status: "loading" });
  const [tags, setTags] = React.useState({ status: "loading", groups: [] });
  const tagGroups = tags.groups;
  const [panel, setPanel] = React.useState(null);
  const [menuRequested, setMenuOpen] = React.useState(false);
  const mobile = useMedia("(max-width: 760px)");
  const menuOpen = mobile && menuRequested;
  React.useEffect(() => { if (!mobile) setMenuOpen(false); }, [mobile]);
  const closePanel = React.useCallback(() => setPanel(null), []);
  const sticky = React.useRef(null);
  const shell = React.useRef(null);
  // At one column grid and list look alike, so Cards show and the toggle hides;
  // the stored view is kept for when there is room again (spec AIB-83x).
  const [mainEl, setMainEl] = React.useState(null);
  const columns = useGridColumns(mainEl);
  const shown = shownView(view, columns);
  useDismiss(sticky, panel !== null, closePanel);

  useReturnFocus(panel !== null);
  useReturnFocus(menuOpen);
  // The open drawer is modal: the page behind it neither scrolls nor takes
  // focus or clicks. React 18 has no `inert` prop, so it is set directly.
  React.useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const behind = [document.getElementById("main"), shell.current && shell.current.querySelector(".app-skip")].filter(Boolean);
    behind.forEach((el) => { el.inert = true; });
    return () => {
      document.body.style.overflow = previous;
      behind.forEach((el) => { el.inert = false; });
    };
  }, [menuOpen]);

  React.useEffect(() => {
    // Only the Tags panel and tag URLs need it; if it fails, tags just do not filter.
    loadTags()
      .then((data) => setTags({ status: "ready", groups: data.groups }))
      .catch(() => setTags({ status: "failed", groups: [] }));
  }, []);
  const filters = parseFilters(location.search, tagGroups);
  const setFilters = (next) => navigate(location.pathname + filtersToSearch(next, tagGroups), { replace: true });

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

  const visible = edition.status === "ready" && ref && edition.data.date === ref.date
    ? edition.data.items.filter((item) => !item.hidden) : null;
  const categories = CATEGORIES.map((c) => ({ ...c, count: visible ? visible.filter((i) => i.category === c.key).length : undefined }));
  const onPanel = (name) => setPanel((open) => (open === name ? null : name));
  // No filter controls until tags.json has settled: rewriting the URL before
  // then would silently drop any t= tags it already carries.
  const filterable = Boolean(visible) && tags.status !== "loading";
  // Order the whole edition, hidden items included, then filter: rank (and the
  // fallback's standing) is over the whole edition, so a filter never
  // reshuffles what it leaves. Both modes use it - Grouped only splits the
  // ranked list by category - so the two never disagree about what is best.
  const items = visible && rankedItems(edition.data.items)
    .filter((item) => !item.hidden && matches(item, filters));
  const older = ref && olderEdition(editions, ref.date);
  const prev = usePrevious(items && !items.length ? older : null);
  // Paging back or forward keeps the filters, as the edition bar does.
  const goTo = (date) => navigate(editionPath(date) + location.search);
  const setCategory = (key) => setFilters({ ...filters, category: key });
  const setQuery = (query) => setFilters({ ...filters, query });

  return (
    <div className={"app-shell redesign" + (shown === "grid" ? " redesign-grid" : "") + (menuOpen ? " mobile-menu-open" : "")} ref={shell} data-theme={theme}>
      <a className="app-skip" href="#main">Skip to the edition</a>
      <RedesignHeader theme={theme} onToggleTheme={toggleTheme} menuOpen={menuOpen} onMenu={() => setMenuOpen(o => !o)} />
      {menuOpen && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
      <RedesignSidebar categories={categories} count={visible?.length} active={filters.category} open={menuOpen} onClose={() => setMenuOpen(false)}
        onCategory={key => { if (filterable) setCategory(key); setMenuOpen(false); }} />
      <main id="main" className="redesign-main" tabIndex={-1}>
        {/* No visible heading: the toolbar is the first row of the content, and its
            edition bar already shows the date. Screen readers still get an h1. */}
        <h1 className="app-sr">{ref ? `aiBytes_ edition, ${new Date(ref.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}` : "aiBytes_"}</h1>
        <div className="workspace"><section className="feed">
          <div ref={sticky} className="toolbar-slot">
            <RedesignToolbar count={items ? `${items.length} items` : null} query={filters.query} onQuery={setQuery} view={view} onView={columns > 1 ? setView : undefined} mode={mode} onMode={setMode}
              disabled={!filterable} filterCount={filters.tags.length + filters.sources.length} open={panel !== null} onFilters={() => onPanel("filters")}
              date={ref ? <Bar refAt={ref} editions={editions} compact search={location.search} navigate={navigate} /> : null} />
            {panel && <RedesignFilters groups={tagGroups} filters={filters} onChange={setFilters} sources={SOURCES} /> }
          </div>
          {(filters.tags.length > 0 || filters.sources.length > 0) && <div className="active-filters">{[...filters.tags.map(value => ({key:'tags',value})),...filters.sources.map(value=>({key:'sources',value}))].map(({key,value})=><button key={key+value} aria-label={`Remove ${value} filter`} onClick={()=>setFilters({...filters,[key]:toggle(filters[key],value)})}>{value} ×</button>)}<button onClick={()=>setFilters({...filters,tags:[],sources:[]})}>Clear filters</button></div>}
          <div className="app-main" ref={setMainEl}>
            {body({ route, index, ref, edition, view: shown, mode, items, filters, older, prev, goTo, query: filters.query, clearQuery: () => setQuery(""), clearFilters: () => setFilters(NO_FILTERS) })}
          </div>
        </section></div>
      </main>
    </div>
  );
}

// The edition before an empty filtered view, loaded only once a filter comes up
// empty, so the empty state can say how many the day before had. `ref` null
// means not needed; a failed load just leaves the count off.
function usePrevious(ref) {
  const [prev, setPrev] = React.useState(null);
  const date = ref && ref.date;
  React.useEffect(() => {
    if (!ref || (prev && prev.date === date)) return undefined;
    let live = true;
    loadEdition(ref)
      .then((data) => live && setPrev({ date, items: data.items }))
      .catch(() => live && setPrev({ date, items: null }));
    return () => {
      live = false;
    };
  }, [date]);
  return prev && prev.date === date ? prev : null;
}

// The edition bar for `refAt`, without arrows: it sits at the end of the
// toolbar and the calendar is the way between editions.
function Bar({ refAt, editions, compact, search, navigate }) {
  const [open, setOpen] = React.useState(false);
  const close = React.useCallback(() => setOpen(false), []);
  const wrap = React.useRef(null);
  useDismiss(wrap, open, close);
  useReturnFocus(open);

  const at = editions.findIndex((ref) => ref.date === refAt.date);
  const go = (date) => {
    setOpen(false);
    // Filters apply within whichever edition is open, so they travel with it.
    if (date !== refAt.date) navigate(editionPath(date) + search);
  };

  return (
    <div ref={wrap}>
      <EditionBar asH1={false} compact={compact}
        dateLabel={compact ? midDate(refAt.date) : longDate(refAt.date)}
        itemCount={refAt.total}
        updatedAgo={at === 0 ? ago(refAt.generated_at) : undefined}
        arrows={false}
        onDateClick={() => setOpen((o) => !o)} calendarOpen={open}
        editions={editions.map((ref) => ({ date: ref.date, label: midDate(ref.date), count: ref.total }))}
        currentDate={refAt.date} onSelectEdition={go} />
    </div>
  );
}

function body({ route, index, ref, edition, view, mode, items, filters, older, prev, goTo, query, clearQuery, clearFilters }) {
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
  if (!items) return message("Loading the edition...");

  // `items` already skips hidden items: they stay in the file so a hide is
  // reversible, and readers never see them. Empty means a filter emptied it,
  // since editions are never published empty. Paging back is offered only once
  // the older edition is known to have some; otherwise clearing is the way out.
  if (!items.length && query.trim()) return <div className="ldg-endcard" role="status">No items match “{query}”. <button onClick={clearQuery}>Clear search</button></div>;
  if (!items.length) {
    const what = describeFilters(filters);
    if (older && !prev) return <EmptyState category={what} />;
    const prevCount = prev && prev.items ? countMatches(prev.items, filters) : 0;
    return prevCount
      ? <EmptyState category={what} prevLabel={shortDate(older.date)} prevCount={prevCount} onPrev={() => goTo(older.date)} />
      : <EmptyState category={what} onClear={clearFilters} />;
  }
  const render = (list) => (view === "list"
    ? <div className="app-rows">{list.map((item) => <ListRow key={item.id} item={item} />)}</div>
    : <div className="app-grid">{list.map((item) => <Card key={item.id} item={item} signalsPos="source" maxTags={0} />)}</div>);
  // The date (edition bar or hidden h1) is the h1 and card titles are h3, so
  // each mode supplies the h2s: one hidden count in Ranked, a visible heading
  // per category in Grouped. A category the filters empty has no section.
  return (
    <>
      {mode === "grouped"
        ? groupedItems(items).map(({ category, items: group }) => (
          <section className="app-sec" key={category.key} aria-labelledby={category.key}>
            <SectionHeading name={category.label} count={group.length} id={category.key} />
            {render(group)}
          </section>))
        : (
          <section className="app-sec" aria-labelledby="items-heading">
            <h2 className="app-sr" id="items-heading">{items.length} items</h2>
            {render(items)}
          </section>)}
      <EndCard dateLabel={shortDate(ref.date)} prevLabel={older ? shortDate(older.date) : undefined} onPrev={() => older && goTo(older.date)} />
    </>
  );
}
