import React from "react";
import { Card } from "@aibytes/design-system/components/content/Card.jsx";
import { EndCard } from "@aibytes/design-system/components/content/EndCard.jsx";
import { ListRow } from "@aibytes/design-system/components/content/ListRow.jsx";
import { EditionBar } from "@aibytes/design-system/components/navigation/EditionBar.jsx";
import { Chip } from "@aibytes/design-system/components/navigation/Chip.jsx";
import { Header } from "@aibytes/design-system/components/navigation/Header.jsx";
import { loadEdition, loadIndex, loadTags } from "./content.js";
import { CATEGORIES, filtersToSearch, matches, parseFilters, SOURCES, toggle } from "./filters.js";
import { ago, longDate, midDate, shortDate } from "./format.js";
import { useChoice, useDismiss, useMedia, useTheme } from "./hooks.js";
import { VIEW } from "./prefs.js";
import { editionPath, parseRoute, pickEdition } from "./route.js";

const TAGLINE = "today's AI, in one byte";
// Ledger's sticky breakpoint (app.css); below it the header and bar go compact.
const PHONE = "(max-width: 699px)";

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

// Header, edition bar, and calendar over the edition as a Card grid or a
// ListRow list, filtered by category, tags, and sources from the URL. Saves
// and sign-in are later AIB-8h items, so the header shows no controls for them.
export function App() {
  const [location, navigate] = useLocation();
  const route = parseRoute(location.pathname);
  const [theme, toggleTheme] = useTheme();
  const [view, setView] = useChoice(VIEW, "grid");
  const compact = useMedia(PHONE);
  const [index, setIndex] = React.useState({ status: "loading" });
  const [edition, setEdition] = React.useState({ status: "loading" });
  const [tags, setTags] = React.useState({ status: "loading", groups: [] });
  const tagGroups = tags.groups;
  const [panel, setPanel] = React.useState(null);
  const closePanel = React.useCallback(() => setPanel(null), []);
  const sticky = React.useRef(null);
  useDismiss(sticky, panel !== null, closePanel);

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

  return (
    <div className="app-shell">
      <div className="app-sticky" ref={sticky}>
        <Header compact={compact} tagline={compact ? undefined : TAGLINE}
          showCategories={filterable} categories={categories} activeCategory={filters.category}
          onCategory={(key) => setFilters({ ...filters, category: key })}
          tagCount={filters.tags.length} onOpenTags={filterable && tagGroups.length ? () => onPanel("tags") : undefined}
          sourceCount={filters.sources.length} onOpenSources={filterable ? () => onPanel("sources") : undefined}
          view={view} onView={setView} theme={theme} onToggleTheme={toggleTheme} />
        {ref && <Bar refAt={ref} editions={editions} compact={compact} search={location.search} navigate={navigate} />}
        {panel === "tags" && (
          <Panel label="Filter by tag" groups={tagGroups.map((g) => ({ name: g.name, options: g.tags.map((tag) => ({ key: tag.name, label: tag.name })) }))}
            selected={filters.tags} onToggle={(name) => setFilters({ ...filters, tags: toggle(filters.tags, name) })} />)}
        {panel === "sources" && (
          <Panel label="Filter by source" narrow groups={[{ name: "Sources", options: SOURCES }]}
            selected={filters.sources} onToggle={(key) => setFilters({ ...filters, sources: toggle(filters.sources, key) })} />)}
      </div>
      <main className="app-main">{body(route, index, ref, edition, view, visible, filters, () => setFilters({ category: "all", tags: [], sources: [] }))}</main>
    </div>
  );
}

// The Tags or Sources dropdown under the header: grouped multi-select chips,
// as in the UI kit's TagPanel and SourcePanel.
function Panel({ label, groups, selected, onToggle, narrow = false }) {
  return (
    <div className="app-pop" style={narrow ? { width: 300 } : undefined} role="group" aria-label={label}>
      {groups.map((group) => (
        <div key={group.name}>
          <div className="app-pop__label">{group.name}</div>
          <div className="app-pop__chips" style={{ marginTop: 6 }}>
            {group.options.map((o) => <Chip key={o.key} label={o.label} active={selected.includes(o.key)} onClick={() => onToggle(o.key)} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

// The edition bar for `refAt`. index.json is newest first, so the previous
// (older) edition is the next entry and the newer one the entry before.
function Bar({ refAt, editions, compact, search, navigate }) {
  const [open, setOpen] = React.useState(false);
  const close = React.useCallback(() => setOpen(false), []);
  const wrap = React.useRef(null);
  useDismiss(wrap, open, close);

  const at = editions.findIndex((ref) => ref.date === refAt.date);
  const older = editions[at + 1];
  const newer = editions[at - 1];
  const go = (date) => {
    setOpen(false);
    // Filters apply within whichever edition is open, so they travel with it.
    if (date !== refAt.date) navigate(editionPath(date) + search);
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

function body(route, index, ref, edition, view, visible, filters, clearFilters) {
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
  if (!visible) return message("Loading the edition...");

  // `visible` already skips hidden items: they stay in the file so a hide is
  // reversible, and readers never see them.
  const items = visible.filter((item) => matches(item, filters));
  if (!items.length) {
    return message(<>No items in this edition match these filters. <a href="#clear" onClick={(e) => { e.preventDefault(); clearFilters(); }}>Clear filters</a>.</>);
  }
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
