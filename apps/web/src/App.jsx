import React from "react";
import { Card } from "@aibytes/design-system/components/content/Card.jsx";
import { EmptyState } from "@aibytes/design-system/components/content/EmptyState.jsx";
import { EndCard } from "@aibytes/design-system/components/content/EndCard.jsx";
import { ListRow } from "@aibytes/design-system/components/content/ListRow.jsx";
import { SectionHeading } from "@aibytes/design-system/components/content/SectionHeading.jsx";
import { EditionBar } from "@aibytes/design-system/components/navigation/EditionBar.jsx";
import { Footer } from "@aibytes/design-system/components/navigation/Footer.jsx";
import { Chip } from "@aibytes/design-system/components/navigation/Chip.jsx";
import { Header } from "@aibytes/design-system/components/navigation/Header.jsx";
import { SideNav } from "@aibytes/design-system/components/navigation/SideNav.jsx";
import { loadEdition, loadIndex, loadTags } from "./content.js";
import { CATEGORIES, countMatches, describeFilters, filtersToSearch, matches, NO_FILTERS, parseFilters, SOURCES, toggle } from "./filters.js";
import { FOOTER_LINKS, SUBSCRIBE_URL } from "./footer.js";
import { ago, longDate, midDate, shortDate } from "./format.js";
import { useChoice, useDismiss, useMedia, useReturnFocus, useTheme } from "./hooks.js";
import { groupedItems, rankedItems } from "./order.js";
import { ORDER, VIEW } from "./prefs.js";
import { localDate, railDate, railEditions } from "./rail.js";
import { editionPath, olderEdition, parseRoute, pickEdition } from "./route.js";

const TAGLINE = "today's AI, in one byte";
// Ledger's sticky breakpoint (app.css); below it the header and bar go compact.
const PHONE = "(max-width: 699px)";
// From here up the SideNav rail replaces the header chips and the edition bar
// (spec AIB-77u app-side-nav). One switch, so every width has exactly one
// category control and one date pager.
const WIDE = "(min-width: 900px)";

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

// Header, then either the edition bar (narrow) or the SideNav rail (wide), over
// the edition as a Card grid or a ListRow list, filtered by category, tags, and sources from the URL. Saves
// and sign-in are AIB-75v, so the header and cards show no controls for them.
export function App() {
  const [location, navigate] = useLocation();
  const route = parseRoute(location.pathname);
  const [theme, toggleTheme] = useTheme();
  const [view, setView] = useChoice(VIEW, "grid");
  const [mode, setMode] = useChoice(ORDER, "ranked");
  const compact = useMedia(PHONE);
  const wide = useMedia(WIDE);
  const [index, setIndex] = React.useState({ status: "loading" });
  const [edition, setEdition] = React.useState({ status: "loading" });
  const [tags, setTags] = React.useState({ status: "loading", groups: [] });
  const tagGroups = tags.groups;
  const [panel, setPanel] = React.useState(null);
  const closePanel = React.useCallback(() => setPanel(null), []);
  const sticky = React.useRef(null);
  const shell = React.useRef(null);
  useDismiss(sticky, panel !== null, closePanel);
  useStickyHeights(shell, wide);
  useReturnFocus(panel !== null);

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

  const main = (
    <main className="app-main" id="main" tabIndex={-1}>
      {/* With no edition bar, its h1 moves here, unseen, so the outline stays h1 > h2 > h3. */}
      {wide && ref && <h1 className="app-sr">{longDate(ref.date)}</h1>}
      {body({ route, index, ref, edition, view, mode, items, filters, older, prev, goTo, clearFilters: () => setFilters(NO_FILTERS) })}
    </main>
  );

  return (
    <div className={"app-shell" + (wide ? " app-shell--full" : "")} ref={shell}>
      <a className="app-skip" href="#main">Skip to the edition</a>
      <div className="app-sticky" ref={sticky}>
        <Header compact={compact} tagline={compact ? undefined : TAGLINE}
          showCategories={filterable && !wide} categories={categories} activeCategory={filters.category}
          onCategory={setCategory}
          tagCount={filters.tags.length} tagsOpen={panel === "tags"} sourcesOpen={panel === "sources"} onOpenTags={filterable && tagGroups.length ? () => onPanel("tags") : undefined}
          sourceCount={filters.sources.length} onOpenSources={filterable ? () => onPanel("sources") : undefined}
          view={view} onView={setView} theme={theme} onToggleTheme={toggleTheme}
          mode={mode} onMode={compact ? undefined : setMode} />
        {ref && !wide && <Bar refAt={ref} editions={editions} compact={compact} search={location.search} navigate={navigate} />}
        {panel === "tags" && (
          <Panel label="Filter by tag" groups={tagGroups.map((g) => ({ name: g.name, options: g.tags.map((tag) => ({ key: tag.name, label: tag.name })) }))}
            selected={filters.tags} onToggle={(name) => setFilters({ ...filters, tags: toggle(filters.tags, name) })} />)}
        {panel === "sources" && (
          <Panel label="Filter by source" narrow groups={[{ name: "Sources", options: SOURCES }]}
            selected={filters.sources} onToggle={(key) => setFilters({ ...filters, sources: toggle(filters.sources, key) })} />)}
      </div>
      {wide
        ? (
          <div className="app-cols">
            <Rail refAt={ref} editions={editions} search={location.search} navigate={navigate}
              categories={categories} allCount={visible ? visible.length : undefined}
              activeCategory={filters.category} onCategory={filterable ? setCategory : undefined} />
            {main}
          </div>)
        : main}
      <Footer links={FOOTER_LINKS} onSubscribe={() => window.location.assign(SUBSCRIBE_URL)} />
    </div>
  );
}

// --ldg-header-h and --ldg-footer-h on the shell, from the sticky header cluster
// and the sticky footer as they actually measure, so the rail sits exactly
// between them. Only the rail reads them, so only while it is shown.
function useStickyHeights(shell, on) {
  React.useEffect(() => {
    const root = shell.current;
    if (!on || !root) return undefined;
    const header = root.querySelector(".app-sticky");
    const footer = root.querySelector(".ldg-footer");
    const set = () => {
      if (header) root.style.setProperty("--ldg-header-h", header.offsetHeight + "px");
      if (footer) root.style.setProperty("--ldg-footer-h", footer.offsetHeight + "px");
    };
    set();
    const observer = new ResizeObserver(set);
    [header, footer].forEach((el) => el && observer.observe(el));
    return () => {
      observer.disconnect();
      root.style.removeProperty("--ldg-header-h");
      root.style.removeProperty("--ldg-footer-h");
    };
  }, [shell, on]);
}

// The SideNav rail for `refAt`: the date block (rail.js), the edition list, and
// the categories. With no edition yet - loading, failed, not found - it still
// renders its categories, so the layout does not jump when data arrives.
// `onCategory` is undefined until the edition and tags have settled, which
// makes early clicks no-ops, as the chips are hidden until then.
function Rail({ refAt, editions, search, navigate, categories, allCount, activeCategory, onCategory }) {
  const [open, setOpen] = React.useState(false);
  const close = React.useCallback(() => setOpen(false), []);
  useReturnFocus(open);
  useRailEscape(open, close);

  const older = refAt && olderEdition(editions, refAt.date);
  // Paging keeps the filters, as the edition bar does; Latest is the root.
  const go = (path) => {
    setOpen(false);
    navigate(path + search);
  };
  const dates = refAt ? railDate(refAt, editions, localDate()) : {};
  return (
    <SideNav {...dates}
      onPrev={() => older && go(editionPath(older.date))}
      onNext={() => go("/")}
      editions={refAt ? railEditions(editions) : []} currentDate={refAt && refAt.date}
      onSelectEdition={(date) => (date === refAt.date ? setOpen(false) : go(editionPath(date)))}
      calendarOpen={open} onToggleCalendar={() => setOpen((o) => !o)}
      categories={categories} allCount={allCount}
      activeCategory={activeCategory} onCategory={onCategory} />
  );
}

// Escape closes the rail's edition list while focus is inside the rail.
function useRailEscape(open, close) {
  React.useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape" && document.activeElement && document.activeElement.closest(".ldg-sidenav")) close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);
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

// The Tags or Sources dropdown under the header: grouped multi-select chips,
// as in the UI kit's TagPanel and SourcePanel.
// Opening one moves focus to its first chip; App's useReturnFocus sends it back
// to the Tags or Sources button when the panel closes.
function Panel({ label, groups, selected, onToggle, narrow = false }) {
  const self = React.useRef(null);
  React.useEffect(() => {
    const first = self.current && self.current.querySelector("button");
    if (first) first.focus();
  }, []);
  return (
    <section className="app-pop" ref={self} style={narrow ? { width: 300 } : undefined} aria-label={label}>
      {groups.map((group) => (
        <div key={group.name}>
          <div className="app-pop__label">{group.name}</div>
          <div className="app-pop__chips" style={{ marginTop: 6 }}>
            {group.options.map((o) => <Chip key={o.key} label={o.label} active={selected.includes(o.key)} onClick={() => onToggle(o.key)} />)}
          </div>
        </div>
      ))}
    </section>
  );
}

// The edition bar for `refAt`. index.json is newest first, so the previous
// (older) edition is the next entry and the newer one the entry before.
function Bar({ refAt, editions, compact, search, navigate }) {
  const [open, setOpen] = React.useState(false);
  const close = React.useCallback(() => setOpen(false), []);
  const wrap = React.useRef(null);
  useDismiss(wrap, open, close);
  useReturnFocus(open);

  const at = editions.findIndex((ref) => ref.date === refAt.date);
  const older = olderEdition(editions, refAt.date);
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

function body({ route, index, ref, edition, view, mode, items, filters, older, prev, goTo, clearFilters }) {
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
    : <div className="app-grid">{list.map((item) => <Card key={item.id} item={item} signalsPos="bottom" />)}</div>);
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
