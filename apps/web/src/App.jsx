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
import { filesToLoad, leftOutNote, savedGroups } from "./saved.js";
import { CATEGORIES, countMatches, describeFilters, filtersToSearch, matches, NO_FILTERS, parseFilters, SOURCES } from "./filters.js";
import { FOOTER_LINKS, GITHUB_URL, SUBSCRIBE_URL } from "./footer.js";
import { longDate, midDate, shortDate } from "./format.js";
import { useChoice, useDismiss, useGridColumns, useMedia, useReturnFocus, useSaves, useTheme } from "./hooks.js";
import { shownView } from "./layout.js";
import { groupedItems, rankedItems } from "./order.js";
import { ORDER, VIEW } from "./prefs.js";
import { localSaves } from "./saves.js";
import { editionPath, olderEdition, olderWeeklyIssue, parseRoute, pickEdition, pickWeeklyIssue, savedPath, weeklyPath } from "./route.js";

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
// preference logic. Saves live in this browser (AIB-75v app-local-saves);
// sign-in is still to come.
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
  // One saves store for the session, whichever page is open.
  const [saves] = React.useState(() => localSaves());

  // Weekly archive and issue pages share the Ledger shell with the daily
  // edition (AIB-105j). Intro / Official Announcements / Viral on X are omitted
  // from the issue JSON for now.
  if (route.kind === "weekly_index") {
    return <WeeklyArchive theme={theme} onToggleTheme={toggleTheme} />;
  }
  if (route.kind === "saved") {
    return <SavedApp saves={saves} location={location} navigate={navigate} theme={theme} onToggleTheme={toggleTheme} />;
  }
  if (route.kind === "weekly_issue") {
    return (
      <WeeklyIssueApp
        saves={saves}
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
      saves={saves}
      route={route}
      location={location}
      navigate={navigate}
      theme={theme}
      onToggleTheme={toggleTheme}
    />
  );
}

// The Ledger shell a daily edition and a weekly issue share: masthead, category
// sidebar, and the toolbar with search, view, order and filters, all kept in
// the URL and preferences. `all` is the open feed's items, hidden ones
// included, or null while it loads; `children` renders the feed from what the
// filters leave. Every page's Sidebar carries Saved and the stored count.
//
// `savedPage` is the /saved page: no toolbar, filters or tags; Saved is the
// current entry; a category opens the latest edition filtered to it; and the
// page draws its own visible h1, so `heading` is left out.
function FeedShell({ saves: store, savedPage = false, theme, onToggleTheme, location, navigate, skipLabel, heading, date, all, children }) {
  const { saves } = useSaves(store);
  // Defaults: list + grouped (AIB-105j). A stored preference still wins.
  const [view, setView] = useChoice(VIEW, "list");
  const [mode, setMode] = useChoice(ORDER, "grouped");
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
    if (savedPage) return;
    loadTags()
      .then((data) => setTags({ status: "ready", groups: data.groups }))
      .catch(() => setTags({ status: "failed", groups: [] }));
  }, []);
  const filters = parseFilters(location.search, tagGroups);
  const setFilters = (next) => navigate(location.pathname + filtersToSearch(next, tagGroups), { replace: true });

  const visible = all && all.filter((item) => !item.hidden);
  const categories = CATEGORIES.map((c) => ({ ...c, count: visible ? visible.filter((i) => i.category === c.key).length : undefined }));
  const onPanel = (name) => setPanel((open) => (open === name ? null : name));
  // No filter controls until tags.json has settled: rewriting the URL before
  // then would silently drop any t= tags it already carries.
  const filterable = Boolean(visible) && tags.status !== "loading";
  // Order the whole feed, hidden items included, then filter: rank (and the
  // fallback's standing) is over the whole feed, so a filter never reshuffles
  // what it leaves. Both modes use it - Grouped only splits the ranked list by
  // category - so the two never disagree about what is best.
  const items = all && rankedItems(all).filter((item) => !item.hidden && matches(item, filters));
  const setCategory = (key) => setFilters({ ...filters, category: key });
  const setQuery = (query) => setFilters({ ...filters, query });

  return (
    <div className={"app-shell redesign" + (shown === "grid" ? " redesign-grid" : "") + (menuOpen ? " mobile-menu-open" : "")} ref={shell} data-theme={theme}>
      <a className="app-skip" href="#main">{skipLabel}</a>
      <AppHeader theme={theme} onToggleTheme={onToggleTheme} menuOpen={menuOpen} onMenu={() => setMenuOpen(o => !o)} githubUrl={GITHUB_URL} />
      <Sidebar categories={categories} count={visible?.length} active={filters.category} open={menuOpen} onClose={() => setMenuOpen(false)}
        links={SIDEBAR_LINKS} subscribeUrl={SUBSCRIBE_URL}
        onCategory={key => {
          if (savedPage) navigate("/" + filtersToSearch({ ...NO_FILTERS, category: key }, []));
          else if (filterable) setCategory(key);
          setMenuOpen(false);
        }}
        onSaved={() => { if (!savedPage) navigate(savedPath()); setMenuOpen(false); }} savedCount={saves.length} savedActive={savedPage} />
      <main id="main" className="redesign-main" tabIndex={-1}>
        {/* No visible heading: the toolbar is the first row of the content, and its
            date control already shows the edition or issue. Screen readers still get an h1. */}
        {heading && <h1 className="app-sr">{heading}</h1>}
        <div className="workspace"><section className="feed">
          {!savedPage && <>
          <div ref={sticky} className="toolbar-slot">
            <Toolbar count={items ? `${items.length} items` : null} query={filters.query} onQuery={setQuery} view={view} onView={columns > 1 ? setView : undefined} mode={mode} onMode={setMode}
              disabled={!filterable} filterCount={filters.tags.length + filters.sources.length} open={panel !== null} onFilters={() => onPanel("filters")}
              date={date} />
            {panel && <FilterPanel groups={tagGroups} filters={filters} onChange={setFilters} sources={SOURCES} /> }
          </div>
          <ActiveFilters filters={filters} onChange={setFilters} />
          </>}
          <div className="app-main" ref={setMainEl}>
            {children({ items, filters, view: shown, mode, clearQuery: () => setQuery(""), clearFilters: () => setFilters(NO_FILTERS) })}
          </div>
        </section></div>
      </main>
    </div>
  );
}

// A feed's items as sections. The date (edition bar or hidden h1) is the h1 and
// card titles are h3, so each mode supplies the h2s: one hidden count in Ranked,
// a visible heading per category in Grouped. A category the filters empty has
// no section. Every item carries the save star under its source icon; `from`
// names the file it lives in ({ edition_date } or { issue_slug }), taken from
// the page, never from the item.
function ItemSections({ items, view, mode, saves, from }) {
  const render = (list) => <ItemList items={list} view={view} saves={saves} from={from} />;
  return mode === "grouped"
    ? groupedItems(items).map(({ category, items: group }) => (
      <section className="app-sec" key={category.key} aria-labelledby={category.key}>
        <SectionHeading name={category.label} count={group.length} id={category.key} />
        {render(group)}
      </section>))
    : (
      <section className="app-sec" aria-labelledby="items-heading">
        <h2 className="app-sr" id="items-heading">{items.length} items</h2>
        {render(items)}
      </section>);
}

// Cards or rows, each with its save star.
function ItemList({ items, view, saves: store, from }) {
  const { has, toggle } = useSaves(store);
  const star = (item) => ({ saved: has(item.id), onToggleSave: () => toggle(item, from), starPos: "visual" });
  return view === "list"
    ? <RowList>{items.map((item) => <ListRow key={item.id} item={item} {...star(item)} />)}</RowList>
    : <CardGrid>{items.map((item) => <Card key={item.id} item={item} {...star(item)} />)}</CardGrid>;
}

// A JSON document's load state: loading, ready with data, or error. `ref` null
// means nothing to load yet; `key` is what makes a new ref a new load.
function useLoaded(load, ref, key) {
  const [state, setState] = React.useState({ status: "loading" });
  React.useEffect(() => {
    if (!ref) return undefined;
    let live = true;
    setState({ status: "loading" });
    load(ref)
      .then((data) => live && setState({ status: "ready", key, data }))
      .catch((error) => live && setState({ status: "error", key, error }));
    return () => {
      live = false;
    };
  }, [key]);
  // A result for an older ref is still loading as far as this one is concerned.
  return state.status !== "loading" && state.key !== key ? { status: "loading" } : state;
}

// The ref for a document that has no ref: the index, which loads once.
const ONCE = {};

function EditionApp({ saves, route, location, navigate, theme, onToggleTheme }) {
  const index = useLoaded(loadIndex, ONCE, "index");
  const editions = index.status === "ready" ? index.data.editions : [];
  const ref = pickEdition(route, editions);
  const edition = useLoaded(loadEdition, ref, ref && ref.date);

  React.useEffect(() => {
    document.title = ref ? `aiBytes_ · ${longDate(ref.date)}` : "aiBytes_";
  }, [ref && ref.date]);

  const older = ref && olderEdition(editions, ref.date);
  // Paging back or forward keeps the filters, as the edition bar does.
  const goTo = (date) => navigate(editionPath(date) + location.search);

  return (
    <FeedShell saves={saves} theme={theme} onToggleTheme={onToggleTheme} location={location} navigate={navigate}
      skipLabel="Skip to the edition"
      heading={ref ? `aiBytes_ edition, ${new Date(ref.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}` : "aiBytes_"}
      date={ref ? <Bar refAt={ref} editions={editions} search={location.search} navigate={navigate} /> : null}
      all={edition.status === "ready" ? edition.data.items : null}>
      {(feed) => <EditionFeed saves={saves} route={route} index={index} editionRef={ref} edition={edition} older={older} goTo={goTo} {...feed} />}
    </FeedShell>
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

function EditionFeed({ saves, route, index, editionRef: ref, edition, older, goTo, items, filters, view, mode, clearQuery, clearFilters }) {
  const prev = usePrevious(items && !items.length ? older : null);
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
  if (!items.length && filters.query.trim()) return <EmptyState query={filters.query} onClearQuery={clearQuery} />;
  if (!items.length) {
    const what = describeFilters(filters);
    if (older && !prev) return <EmptyState category={what} />;
    const prevCount = prev && prev.items ? countMatches(prev.items, filters) : 0;
    return prevCount
      ? <EmptyState category={what} prevLabel={shortDate(older.date)} prevCount={prevCount} onPrev={() => goTo(older.date)} />
      : <EmptyState category={what} onClear={clearFilters} />;
  }
  return (
    <>
      <ItemSections items={items} view={view} mode={mode} saves={saves} from={{ edition_date: ref.date }} />
      <EndCard dateLabel={shortDate(ref.date)} prevLabel={older ? shortDate(older.date) : undefined} onPrev={() => older && goTo(older.date)} />
    </>
  );
}

// /saved - every saved item, one section per edition or weekly issue, newest
// first (spec AIB-75v app-saved-view). It loads the two indexes, then only the
// files the saves name; saved.js decides the sections, order and what is left out.
function SavedApp({ saves: store, location, navigate, theme, onToggleTheme }) {
  const index = useLoaded(loadIndex, ONCE, "index");
  const weekly = useLoaded(loadWeeklyIndex, ONCE, "weekly");
  const { saves } = useSaves(store);
  React.useEffect(() => { document.title = "aiBytes_ · Saved"; }, []);

  const settled = index.status !== "loading" && weekly.status !== "loading";
  const failed = [index, weekly].find((state) => state.status === "error");
  const editions = index.status === "ready" ? index.data.editions : [];
  const issues = weekly.status === "ready" ? weekly.data.issues : [];
  const files = useSavedFiles(settled && !failed ? filesToLoad(saves, editions, issues) : []);
  const { groups, leftOut } = savedGroups(saves, { editions, issues, files });

  return (
    <FeedShell saves={store} savedPage theme={theme} onToggleTheme={onToggleTheme} location={location} navigate={navigate}
      skipLabel="Skip to your saved items" date={null} all={null}>
      {({ view }) => {
        const message = (text, role) => <StatusMessage role={role}>{text}</StatusMessage>;
        if (!settled) return message("Loading your saves...");
        if (failed) return message(`Could not load your saves: ${failed.error.message}`, "alert");
        if (!saves.length) {
          return message(<>
            <b>No saved items yet.</b> Select the ☆ on any card or row to save it. Saved items from every edition
            collect here, newest edition first. <a href="/">← Back to the latest edition</a>
          </>, "status");
        }
        // The count waits for every file, so it never counts up while they land.
        const loading = groups.some((group) => group.status === "loading");
        const shown = groups.reduce((n, group) => n + group.items.length, 0);
        const note = leftOutNote(leftOut);
        return (
          <>
            <h1 className="ldg-section-h">Saved {!loading && <span className="ldg-count">{shown}</span>}</h1>
            {shown > 0 && <p>Stored in this browser only.</p>}
            {groups.map((group) => {
              const id = "saved-" + group.key.replace(":", "-");
              return (
                <section className="app-sec" key={group.key} aria-labelledby={id}>
                  <SectionHeading name={group.label} count={group.status === "ready" ? group.items.length : ""} id={id} />
                  {group.status === "ready" ? <ItemList items={group.items} view={view} saves={store} from={group.from} />
                    : group.status === "error" ? message(group.kind === "edition" ? `Could not load the ${group.label} edition.` : `Could not load ${group.label}.`, "alert")
                    : message(`Loading ${group.label}...`)}
                </section>
              );
            })}
            {note && <p>{note}</p>}
          </>
        );
      }}
    </FeedShell>
  );
}

// Each edition or issue in `toLoad`, fetched once and kept: { [key]: { status, data | error } }.
function useSavedFiles(toLoad) {
  const [files, setFiles] = React.useState({});
  const asked = React.useRef(new Set());
  const keys = toLoad.map((file) => file.key).join(" ");
  React.useEffect(() => {
    for (const file of toLoad) {
      if (asked.current.has(file.key)) continue;
      asked.current.add(file.key);
      const load = file.kind === "edition" ? loadEdition : loadWeeklyIssue;
      load(file.ref)
        .then((data) => setFiles((now) => ({ ...now, [file.key]: { status: "ready", data } })))
        .catch((error) => setFiles((now) => ({ ...now, [file.key]: { status: "error", error } })));
    }
  }, [keys]);
  return files;
}

// A compact Substack subscribe bar at the top of a weekly issue, so a reader
// arriving cold from social can subscribe without finding the sidebar.
function SubscribeBar() {
  return (
    <aside className="weekly-subscribe" aria-label="Subscribe">
      <p className="weekly-subscribe__text"><b>Get aiBytes_ every Monday.</b> The week in AI for developers, in your inbox.</p>
      <a className="ldg-btn ldg-btn--primary weekly-subscribe__action" href={SUBSCRIBE_URL}>Subscribe</a>
    </aside>
  );
}

// /weekly - every published issue, newest first. Issue links are plain hrefs:
// each issue is its own built page, with its own title and canonical URL.
function WeeklyArchive({ theme, onToggleTheme }) {
  const weekly = useLoaded(loadWeeklyIndex, ONCE, "weekly");
  React.useEffect(() => { document.title = "aiBytes_ · Weekly"; }, []);
  const issues = weekly.status === "ready" ? weekly.data.issues : [];

  let list;
  if (weekly.status === "loading") list = <StatusMessage>Loading...</StatusMessage>;
  else if (weekly.status === "error") list = <StatusMessage role="alert">Could not load the weekly archive: {weekly.error.message}</StatusMessage>;
  else if (!issues.length) list = <StatusMessage>No weekly issues published yet.</StatusMessage>;
  else {
    list = (
      <ol className="weekly-list">
        {issues.map((issue) => (
          <li key={issue.slug}>
            <a className="weekly-issue" href={weeklyPath(issue.slug)}>
              <span className="weekly-issue__meta">
                <span>Issue #{issue.number}</span>
                <time dateTime={issue.published_on}>{midDate(issue.published_on)}</time>
              </span>
              <span className="weekly-issue__title">{issue.title}</span>
              {issue.description && <span className="weekly-issue__desc">{issue.description}</span>}
            </a>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <div className="app-shell redesign" data-theme={theme}>
      <a className="app-skip" href="#main">Skip to the archive</a>
      <AppHeader theme={theme} onToggleTheme={onToggleTheme} githubUrl={GITHUB_URL} />
      <main id="main" className="redesign-main" tabIndex={-1}>
        <div className="workspace">
          <section className="weekly-archive">
            <header className="weekly-archive__head">
              <p className="weekly-archive__kicker">Weekly</p>
              <h1 className="weekly-archive__title">aiBytes_ archive</h1>
              <p className="weekly-archive__lede">
                Every Monday issue on aibytes.io. <a href={SUBSCRIBE_URL}>Subscribe</a> · <a href="/">Daily edition</a>
              </p>
            </header>
            {list}
          </section>
        </div>
      </main>
    </div>
  );
}

// /weekly/issue-N - the issue's AI News, Products, Repos and HN in the same
// shell as the daily edition. No intro block, Official Announcements or Viral on X.
function WeeklyIssueApp({ saves, route, location, navigate, theme, onToggleTheme }) {
  const weekly = useLoaded(loadWeeklyIndex, ONCE, "weekly");
  const issues = weekly.status === "ready" ? weekly.data.issues : [];
  const ref = pickWeeklyIssue(route, issues);
  const issue = useLoaded(loadWeeklyIssue, ref, ref && ref.slug);

  React.useEffect(() => {
    document.title = ref ? `aiBytes_ · Issue #${ref.number}: ${ref.title}` : "aiBytes_ · Weekly";
  }, [ref && ref.slug]);

  const older = ref && olderWeeklyIssue(issues, ref.slug);
  const goTo = (slug) => navigate(weeklyPath(slug) + location.search);

  return (
    <FeedShell saves={saves} theme={theme} onToggleTheme={onToggleTheme} location={location} navigate={navigate}
      skipLabel="Skip to the issue"
      heading={ref ? `aiBytes_ weekly issue #${ref.number}: ${ref.title}` : "aiBytes_ weekly"}
      date={ref ? <WeeklyBar refAt={ref} navigate={navigate} /> : null}
      all={issue.status === "ready" ? issue.data.items : null}>
      {({ items, filters, view, mode, clearQuery, clearFilters }) => {
        const message = (text, role) => <StatusMessage role={role}>{text}</StatusMessage>;
        let feed;
        if (weekly.status === "loading") feed = message("Loading...");
        else if (weekly.status === "error") feed = message(`Could not load the weekly archive: ${weekly.error.message}`, "alert");
        else if (!ref) feed = message(<>No weekly issue at this address. <a href={weeklyPath()}>Back to the archive</a>.</>);
        else if (issue.status === "error") feed = message(`Could not load the issue: ${issue.error.message}`, "alert");
        else if (!items) feed = message("Loading the issue...");
        else if (!items.length && filters.query.trim()) feed = <EmptyState query={filters.query} onClearQuery={clearQuery} />;
        else if (!items.length) feed = <EmptyState category={describeFilters(filters)} onClear={clearFilters} />;
        else {
          feed = (
            <>
              <ItemSections items={items} view={view} mode={mode} saves={saves} from={{ issue_slug: ref.slug }} />
              <EndCard dateLabel={`Issue #${ref.number}`} prevLabel={older ? `Issue #${older.number}` : undefined}
                onPrev={() => older && goTo(older.slug)} note="That's the week. Next issue Monday." prevText="Previous issue" />
            </>
          );
        }
        return <><SubscribeBar />{feed}</>;
      }}
    </FeedShell>
  );
}

// The toolbar's date control on an issue. The calendar is a date grid and
// issues are numbered, so the control opens the archive instead.
function WeeklyBar({ refAt, navigate }) {
  return (
    <EditionBar dateLabel={`Issue #${refAt.number}`} onDateClick={() => navigate(weeklyPath())} calendarOpen={false} />
  );
}
