import React from "react";
import { Card } from "@aibytes/design-system/components/content/Card.jsx";
import { EmptyState } from "@aibytes/design-system/components/content/EmptyState.jsx";
import { EndCard } from "@aibytes/design-system/components/content/EndCard.jsx";
import { CardGrid, RowList, StatusMessage } from "@aibytes/design-system/components/content/Feed.jsx";
import { ListRow } from "@aibytes/design-system/components/content/ListRow.jsx";
import { SectionHeading } from "@aibytes/design-system/components/content/SectionHeading.jsx";
import { ActiveFilters } from "@aibytes/design-system/components/navigation/ActiveFilters.jsx";
import { AppHeader } from "@aibytes/design-system/components/navigation/AppHeader.jsx";
import { EditionBar } from "@aibytes/design-system/components/navigation/EditionBar.jsx";
import { FilterPanel } from "@aibytes/design-system/components/navigation/FilterPanel.jsx";
import { Sidebar } from "@aibytes/design-system/components/navigation/Sidebar.jsx";
import { Toolbar } from "@aibytes/design-system/components/navigation/Toolbar.jsx";
import { loadEdition, loadIndex, loadTags, loadWeeklyIndex, loadWeeklyIssue } from "./content.js";
import { CATEGORIES, countMatches, describeFilters, filtersToSearch, matches, NO_FILTERS, parseFilters, SOURCES } from "./filters.js";
import { FOOTER_LINKS, GITHUB_URL, SUBSCRIBE_URL } from "./footer.js";
import { longDate, midDate, shortDate } from "./format.js";
import { useChoice, useDismiss, useGridColumns, useMedia, useReturnFocus, useTheme } from "./hooks.js";
import { shownView } from "./layout.js";
import { groupedItems, rankedItems } from "./order.js";
import { ORDER, VIEW } from "./prefs.js";
import { editionPath, olderEdition, olderWeeklyIssue, parseRoute, pickEdition, pickWeeklyIssue, weeklyPath } from "./route.js";

// The sidebar's links: live ones first, then those not live yet. GitHub is
// left out because the masthead already carries it.
const SIDEBAR_LINKS = [...FOOTER_LINKS.filter((l) => l.href && l.label !== "GitHub"), ...FOOTER_LINKS.filter((l) => !l.href)];

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

  // Weekly archive and issue pages share the Ledger shell with the daily
  // edition (AIB-105j). Intro / Official Announcements / Viral on X are omitted
  // from the issue JSON for now.
  if (route.kind === "weekly_index") {
    return <WeeklyArchive theme={theme} onToggleTheme={toggleTheme} />;
  }
  if (route.kind === "weekly_issue") {
    return (
      <WeeklyIssueApp
        route={route}
        location={location}
        navigate={navigate}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  return (
    <EditionApp
      route={route}
      location={location}
      navigate={navigate}
      theme={theme}
      onToggleTheme={toggleTheme}
    />
  );
}

function EditionApp({ route, location, navigate, theme, onToggleTheme }) {
  // Defaults: list + grouped (AIB-105j). A stored preference still wins.
  const [view, setView] = useChoice(VIEW, "list");
  const [mode, setMode] = useChoice(ORDER, "grouped");
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
      <AppHeader theme={theme} onToggleTheme={onToggleTheme} menuOpen={menuOpen} onMenu={() => setMenuOpen(o => !o)} githubUrl={GITHUB_URL} />
      <Sidebar categories={categories} count={visible?.length} active={filters.category} open={menuOpen} onClose={() => setMenuOpen(false)}
        links={SIDEBAR_LINKS} subscribeUrl={SUBSCRIBE_URL}
        onCategory={key => { if (filterable) setCategory(key); setMenuOpen(false); }} />
      <main id="main" className="redesign-main" tabIndex={-1}>
        {/* No visible heading: the toolbar is the first row of the content, and its
            edition bar already shows the date. Screen readers still get an h1. */}
        <h1 className="app-sr">{ref ? `aiBytes_ edition, ${new Date(ref.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}` : "aiBytes_"}</h1>
        <div className="workspace"><section className="feed">
          <div ref={sticky} className="toolbar-slot">
            <Toolbar count={items ? `${items.length} items` : null} query={filters.query} onQuery={setQuery} view={view} onView={columns > 1 ? setView : undefined} mode={mode} onMode={setMode}
              disabled={!filterable} filterCount={filters.tags.length + filters.sources.length} open={panel !== null} onFilters={() => onPanel("filters")}
              date={ref ? <Bar refAt={ref} editions={editions} search={location.search} navigate={navigate} /> : null} />
            {panel && <FilterPanel groups={tagGroups} filters={filters} onChange={setFilters} sources={SOURCES} /> }
          </div>
          <ActiveFilters filters={filters} onChange={setFilters} />
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

// The edition bar for `refAt`, in Ledger's default toolbar form: no arrows,
// since the calendar is the way between editions.
function Bar({ refAt, editions, search, navigate }) {
  const [open, setOpen] = React.useState(false);
  const close = React.useCallback(() => setOpen(false), []);
  const wrap = React.useRef(null);
  useDismiss(wrap, open, close);
  useReturnFocus(open);

  const go = (date) => {
    setOpen(false);
    // Filters apply within whichever edition is open, so they travel with it.
    if (date !== refAt.date) navigate(editionPath(date) + search);
  };

  return (
    <div ref={wrap}>
      <EditionBar dateLabel={midDate(refAt.date)}
        onDateClick={() => setOpen((o) => !o)} calendarOpen={open}
        editions={editions.map((ref) => ({ date: ref.date, label: midDate(ref.date), count: ref.total }))}
        currentDate={refAt.date} onSelectEdition={go} />
    </div>
  );
}

function body({ route, index, ref, edition, view, mode, items, filters, older, prev, goTo, query, clearQuery, clearFilters }) {
  const message = (text, role) => <StatusMessage role={role}>{text}</StatusMessage>;
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
  if (!items.length && query.trim()) return <EmptyState query={query} onClearQuery={clearQuery} />;
  if (!items.length) {
    const what = describeFilters(filters);
    if (older && !prev) return <EmptyState category={what} />;
    const prevCount = prev && prev.items ? countMatches(prev.items, filters) : 0;
    return prevCount
      ? <EmptyState category={what} prevLabel={shortDate(older.date)} prevCount={prevCount} onPrev={() => goTo(older.date)} />
      : <EmptyState category={what} onClear={clearFilters} />;
  }
  const render = (list) => (view === "list"
    ? <RowList>{list.map((item) => <ListRow key={item.id} item={item} />)}</RowList>
    : <CardGrid>{list.map((item) => <Card key={item.id} item={item} />)}</CardGrid>);
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

// /weekly — Ledger list of published issues.
function WeeklyArchive({ theme, onToggleTheme }) {
  const [weekly, setWeekly] = React.useState({ status: "loading" });
  React.useEffect(() => {
    document.title = "aiBytes_ · Weekly";
    let live = true;
    loadWeeklyIndex()
      .then((data) => live && setWeekly({ status: "ready", data }))
      .catch((error) => live && setWeekly({ status: "error", error }));
    return () => { live = false; };
  }, []);

  const issues = weekly.status === "ready" ? weekly.data.issues || [] : [];

  return (
    <div className="app-shell redesign" data-theme={theme}>
      <a className="app-skip" href="#main">Skip to the archive</a>
      <AppHeader theme={theme} onToggleTheme={onToggleTheme} githubUrl={GITHUB_URL} />
      <main id="main" className="redesign-main" tabIndex={-1}>
        <div className="workspace">
          <section className="feed" style={{ maxWidth: 720, margin: "0 auto", padding: "28px 20px 56px" }}>
            <header style={{ marginBottom: 28 }}>
              <p style={{ fontFamily: "var(--font-mono, ui-monospace, monospace)", fontSize: 12, letterSpacing: "0.08em", color: "var(--text-muted, var(--slate, #6B7080))", marginBottom: 8 }}>WEEKLY</p>
              <h1 style={{ fontFamily: "var(--font-display, inherit)", fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 10px" }}>aiBytes_ archive</h1>
              <p style={{ color: "var(--text-muted, var(--slate, #6B7080))", margin: "0 0 16px", lineHeight: 1.5 }}>
                Every Monday issue on aibytes.io.{" "}
                <a href={SUBSCRIBE_URL}>Subscribe</a>
                {" · "}
                <a href="/">Daily edition</a>
              </p>
            </header>
            {weekly.status === "loading" && <StatusMessage>Loading...</StatusMessage>}
            {weekly.status === "error" && (
              <StatusMessage role="alert">Could not load the weekly archive: {weekly.error.message}</StatusMessage>
            )}
            {weekly.status === "ready" && !issues.length && (
              <StatusMessage>No weekly issues published yet.</StatusMessage>
            )}
            {weekly.status === "ready" && issues.length > 0 && (
              <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                {issues.map((issue) => (
                  <li key={issue.slug} style={{ border: "1px solid var(--border, var(--line, #E4E4DC))", borderRadius: 12, background: "var(--surface, var(--card, #fff))" }}>
                    <a
                      href={weeklyPath(issue.slug)}
                      style={{ display: "block", padding: "16px 18px", color: "inherit", textDecoration: "none" }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 6, fontFamily: "var(--font-mono, ui-monospace, monospace)", fontSize: 12, color: "var(--text-muted, var(--slate, #6B7080))" }}>
                        <span>Issue #{issue.number}</span>
                        <time dateTime={issue.published_on}>{midDate(issue.published_on)}</time>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 17, lineHeight: 1.35, marginBottom: issue.description ? 6 : 0 }}>
                        {issue.title}
                      </div>
                      {issue.description ? (
                        <div style={{ fontSize: 14, lineHeight: 1.5, color: "var(--text-muted, var(--slate, #6B7080))" }}>
                          {issue.description}
                        </div>
                      ) : null}
                    </a>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

// /weekly/issue-N — same Ledger shell as the daily edition: side nav filters,
// list/grid, ranked/grouped. Defaults to list + grouped. No intro block.
function WeeklyIssueApp({ route, location, navigate, theme, onToggleTheme }) {
  const [view, setView] = useChoice(VIEW, "list");
  const [mode, setMode] = useChoice(ORDER, "grouped");
  const [weekly, setWeekly] = React.useState({ status: "loading" });
  const [issue, setIssue] = React.useState({ status: "loading" });
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
  const [mainEl, setMainEl] = React.useState(null);
  const columns = useGridColumns(mainEl);
  const shown = shownView(view, columns);
  useDismiss(sticky, panel !== null, closePanel);
  useReturnFocus(panel !== null);
  useReturnFocus(menuOpen);

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
    loadTags()
      .then((data) => setTags({ status: "ready", groups: data.groups }))
      .catch(() => setTags({ status: "failed", groups: [] }));
  }, []);

  const filters = parseFilters(location.search, tagGroups);
  const setFilters = (next) => navigate(location.pathname + filtersToSearch(next, tagGroups), { replace: true });

  React.useEffect(() => {
    let live = true;
    loadWeeklyIndex()
      .then((data) => live && setWeekly({ status: "ready", data }))
      .catch((error) => live && setWeekly({ status: "error", error }));
    return () => { live = false; };
  }, []);

  const issues = weekly.status === "ready" ? weekly.data.issues || [] : [];
  const ref = pickWeeklyIssue(route, issues);

  React.useEffect(() => {
    if (!ref || !ref.path) {
      setIssue({ status: ref ? "error" : "loading", error: ref ? new Error("weekly issue has no path") : undefined });
      return undefined;
    }
    let live = true;
    setIssue({ status: "loading" });
    loadWeeklyIssue(ref)
      .then((data) => live && setIssue({ status: "ready", data }))
      .catch((error) => live && setIssue({ status: "error", error }));
    return () => { live = false; };
  }, [ref && ref.slug, ref && ref.path]);

  React.useEffect(() => {
    document.title = ref ? `aiBytes_ · Issue #${ref.number}` : "aiBytes_ · Weekly";
  }, [ref && ref.number]);

  const visible = issue.status === "ready" && ref && issue.data.slug === ref.slug
    ? issue.data.items.filter((item) => !item.hidden) : null;
  const categories = CATEGORIES.map((c) => ({ ...c, count: visible ? visible.filter((i) => i.category === c.key).length : undefined }));
  const onPanel = (name) => setPanel((open) => (open === name ? null : name));
  const filterable = Boolean(visible) && tags.status !== "loading";
  const items = visible && rankedItems(issue.data.items)
    .filter((item) => !item.hidden && matches(item, filters));
  const older = ref && olderWeeklyIssue(issues, ref.slug);
  const setCategory = (key) => setFilters({ ...filters, category: key });
  const setQuery = (query) => setFilters({ ...filters, query });
  const goTo = (slug) => navigate(weeklyPath(slug) + location.search);

  const message = (text, role) => <StatusMessage role={role}>{text}</StatusMessage>;
  let feed;
  if (weekly.status === "loading" || (ref && issue.status === "loading" && !visible)) {
    feed = message("Loading...");
  } else if (weekly.status === "error") {
    feed = message(`Could not load the weekly archive: ${weekly.error.message}`, "alert");
  } else if (!ref) {
    feed = message(<>No weekly issue at this address. <a href={weeklyPath()}>Back to the archive</a>.</>);
  } else if (issue.status === "error") {
    feed = message(`Could not load the issue: ${issue.error.message}`, "alert");
  } else if (!items) {
    feed = message("Loading the issue...");
  } else if (!items.length && filters.query.trim()) {
    feed = <EmptyState query={filters.query} onClearQuery={() => setQuery("")} />;
  } else if (!items.length) {
    feed = <EmptyState category={describeFilters(filters)} onClear={() => setFilters(NO_FILTERS)} />;
  } else {
    const render = (list) => (shown === "list"
      ? <RowList>{list.map((item) => <ListRow key={item.id} item={item} />)}</RowList>
      : <CardGrid>{list.map((item) => <Card key={item.id} item={item} />)}</CardGrid>);
    feed = (
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
        <EndCard
          dateLabel={`Issue #${ref.number}`}
          prevLabel={older ? `Issue #${older.number}` : undefined}
          onPrev={() => older && goTo(older.slug)}
        />
      </>
    );
  }

  return (
    <div className={"app-shell redesign" + (shown === "grid" ? " redesign-grid" : "") + (menuOpen ? " mobile-menu-open" : "")} ref={shell} data-theme={theme}>
      <a className="app-skip" href="#main">Skip to the issue</a>
      <AppHeader theme={theme} onToggleTheme={onToggleTheme} menuOpen={menuOpen} onMenu={() => setMenuOpen((o) => !o)} githubUrl={GITHUB_URL} />
      <Sidebar categories={categories} count={visible?.length} active={filters.category} open={menuOpen} onClose={() => setMenuOpen(false)}
        links={SIDEBAR_LINKS} subscribeUrl={SUBSCRIBE_URL}
        onCategory={(key) => { if (filterable) setCategory(key); setMenuOpen(false); }} />
      <main id="main" className="redesign-main" tabIndex={-1}>
        <h1 className="app-sr">{ref ? `aiBytes_ weekly issue #${ref.number}` : "aiBytes_ weekly"}</h1>
        <div className="workspace"><section className="feed">
          <div ref={sticky} className="toolbar-slot">
            <Toolbar
              count={items ? `${items.length} items` : null}
              query={filters.query}
              onQuery={setQuery}
              view={view}
              onView={columns > 1 ? setView : undefined}
              mode={mode}
              onMode={setMode}
              disabled={!filterable}
              filterCount={filters.tags.length + filters.sources.length}
              open={panel !== null}
              onFilters={() => onPanel("filters")}
              date={ref ? <WeeklyBar refAt={ref} navigate={navigate} /> : null}
            />
            {panel && <FilterPanel groups={tagGroups} filters={filters} onChange={setFilters} sources={SOURCES} />}
          </div>
          <ActiveFilters filters={filters} onChange={setFilters} />
          <div className="app-main" ref={setMainEl}>{feed}</div>
        </section></div>
      </main>
    </div>
  );
}

function WeeklyBar({ refAt, navigate }) {
  // CalendarPopover is date-grid based; weekly issues use Issue #N, so the
  // control opens the archive instead of a month grid.
  return (
    <EditionBar
      dateLabel={`Issue #${refAt.number}`}
      onDateClick={() => navigate(weeklyPath())}
      calendarOpen={false}
    />
  );
}
