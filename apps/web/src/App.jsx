import React from "react";
import { Card } from "@aibytes/design-system/components/content/Card.jsx";
import { EmptyState } from "@aibytes/design-system/components/content/EmptyState.jsx";
import { EndCard } from "@aibytes/design-system/components/content/EndCard.jsx";
import { CardGrid, RowList, StatusMessage } from "@aibytes/design-system/components/content/Feed.jsx";
import { ListRow } from "@aibytes/design-system/components/content/ListRow.jsx";
import { SaveBanner } from "@aibytes/design-system/components/content/SaveBanner.jsx";
import { SectionHeading } from "@aibytes/design-system/components/content/SectionHeading.jsx";
import { ActiveFilters } from "@aibytes/design-system/components/navigation/ActiveFilters.jsx";
import { AppHeader } from "@aibytes/design-system/components/navigation/AppHeader.jsx";
import { EditionBar } from "@aibytes/design-system/components/navigation/EditionBar.jsx";
import { FilterPanel } from "@aibytes/design-system/components/navigation/FilterPanel.jsx";
import { Sidebar } from "@aibytes/design-system/components/navigation/Sidebar.jsx";
import { Toolbar } from "@aibytes/design-system/components/navigation/Toolbar.jsx";
import { loadEdition, loadIndex, loadTags, loadWeeklyIndex, loadWeeklyIssue } from "./content.js";
import { filesToLoad, leftOutNote, savedFeed, savedGroups } from "./saved.js";
import { CATEGORIES, countMatches, describeFilters, filtersToSearch, matches, NO_FILTERS, parseFilters, SOURCES } from "./filters.js";
import { FOOTER_LINKS, GITHUB_URL, mailto, SUBSCRIBE_URL } from "./footer.js";
import { longDate, midDate, shortDate } from "./format.js";
import { useChoice, useDismiss, useGridColumns, useMedia, useReturnFocus, useSaves, useTheme } from "./hooks.js";
import { shownView } from "./layout.js";
import { groupedItems, rankedItems } from "./order.js";
import { ORDER, VIEW } from "./prefs.js";
import { showBanner } from "./banner.js";
import { headerAccount } from "./header.js";
import { mergedLine } from "./merge.js";
import { clearSaves, localSaves, readSaves } from "./saves.js";
import { NewsletterPrompt } from "./NewsletterPrompt.jsx";
import { failureReport, initialPrompt, promptReducer, shouldOpenPrompt } from "./newsletterPrompt.js";
import { NEWSLETTER_PRIVACY, showSubscribeOptions } from "./subscribeOptions.js";
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

// The reader's account (AIB-75v app-accounts): `user` is undefined while
// Firebase restores the session, null when signed out, and { uid, name,
// photoUrl? } when signed in; `merged` is how many local saves the last
// sign-in added, shown once on /saved; `signInFailed` shows the error line until
// the next try or page.
const AccountContext = React.createContext({
  user: null, merged: 0, signInFailed: false, subscribed: undefined, prompt: null,
  signIn() {}, signOut() {}, dismiss() {}, clearMerged() {}, subscribe() {}, closePrompt() {},
});

// Firebase loads just after the first paint (decision 1, revised 9 Nov): every
// page draws as fast as without it, and Sign in, or a returning reader's
// avatar, appears a moment later. One load per session; a failed one (offline)
// is retried by the next Sign in.
let firebase = null;
function loadFirebase() {
  firebase ||= Promise.all([import("./account.js"), import("./accountSaves.js"), import("./subscriber.js")]).then(
    ([account, store, subscribers]) => ({ ...account, ...store, ...subscribers }),
    (error) => { firebase = null; throw error; },
  );
  return firebase;
}

// After the browser has painted and gone idle, or at most a second later.
function afterPaint(callback) {
  if (typeof requestIdleCallback === "function") {
    const id = requestIdleCallback(callback, { timeout: 1000 });
    return () => cancelIdleCallback(id);
  }
  const id = setTimeout(callback, 1);
  return () => clearTimeout(id);
}

// The saves store follows the user: this browser's while signed out, the
// account's while signed in. Signing in with local saves merges them into the
// account and clears them here only once the merge has committed; a failed
// merge leaves them for the next sign-in.
function useAccount() {
  const [fb, setFb] = React.useState(null);
  const [user, setUser] = React.useState(undefined);
  const [merged, setMerged] = React.useState(0);
  const [failed, setFailed] = React.useState(false);
  const [prompt, setPrompt] = React.useState(null);
  const [subscribed, setSubscribed] = React.useState(undefined);
  // Set when this click's sign-in is a new account. The prompt opens once that
  // reader's email is known. A session restored on load never sets it.
  const [pendingNew, setPendingNew] = React.useState(false);
  React.useEffect(() => afterPaint(() => loadFirebase().then(setFb, (e) => {
    console.warn("Could not load sign-in:", e);
    setUser(null);
  })), []);
  React.useEffect(() => (fb ? fb.onUser(setUser) : undefined), [fb]);
  const uid = user?.uid;
  const saves = React.useMemo(
    () => (uid && fb ? fb.accountSaves(fb.db, uid, { onError: (e) => console.warn("Saves:", e.code || e) }) : localSaves()),
    [uid, fb],
  );
  // One merge per sign-in, shared by every run of the effect: StrictMode runs it
  // twice, and a second merge would find nothing left to add and report 0.
  const merging = React.useRef(null);
  React.useEffect(() => {
    if (!uid || !fb) { merging.current = null; return undefined; }
    if (merging.current?.uid !== uid) {
      const local = readSaves();
      const done = !local.length ? Promise.resolve(0) : fb.mergeInto(fb.db, uid, local).then(
        (count) => { clearSaves(); return count; },
        (e) => { console.warn("Merging this browser's saves failed; they stay here for the next sign-in:", e.code || e); return 0; },
      );
      merging.current = { uid, done };
    }
    let live = true;
    merging.current.done.then((count) => { if (live && count) setMerged(count); });
    return () => { live = false; };
  }, [uid, fb]);
  // One read of subscribers/{uid} per signed-in session. Success sets it true
  // without waiting for another read.
  React.useEffect(() => {
    if (!uid || !fb) { setSubscribed(undefined); return undefined; }
    let live = true;
    const apply = (yes) => { if (live) setSubscribed((current) => (current === true ? true : yes)); };
    fb.isSubscribed(fb.db, uid).then(apply, () => apply(false));
    return () => { live = false; };
  }, [uid, fb]);
  React.useEffect(() => {
    if (!pendingNew || !shouldOpenPrompt({ status: "ok", isNew: true }, user?.email)) return;
    setPendingNew(false);
    setPrompt(initialPrompt);
  }, [pendingNew, user]);
  React.useEffect(() => {
    if (prompt?.status !== "thanks") return undefined;
    const id = setInterval(() => setPrompt((state) => promptReducer(state, { type: "tick" })), 1000);
    return () => clearInterval(id);
  }, [prompt?.status]);
  // Stable, so the effects that call them on navigation run on navigation only.
  const dismiss = React.useCallback(() => setFailed(false), []);
  const clearMerged = React.useCallback(() => setMerged(0), []);
  const closePrompt = React.useCallback(() => setPrompt((state) => (state ? promptReducer(state, { type: "close" }) : state)), []);
  const subscribe = React.useCallback(() => {
    if (!fb || !user?.uid) return;
    setPrompt((state) => promptReducer(state, { type: "subscribe" }));
    fb.subscribe(fb.db, user).then((result) => {
      if (result === "ok") setSubscribed(true);
      setPrompt((state) => promptReducer(state, { type: result === "ok" ? "saved" : "failed" }));
      // The failure line is already showing. The report is fire-and-forget,
      // and the Functions client loads only now.
      const report = failureReport(result, window.location.pathname);
      if (report) import("./reportFailure.js").then(({ reportFailure }) => reportFailure(report.code, report.page)).catch(() => {});
    });
  }, [fb, user]);
  const account = React.useMemo(() => ({
    user,
    merged,
    signInFailed: failed,
    subscribed,
    prompt,
    signIn() {
      setFailed(false);
      // Loaded already, the popup opens within the click; a load that failed
      // earlier is retried, and the popup may then be blocked, which shows the error.
      const result = fb ? fb.signIn() : loadFirebase().then((loaded) => { setFb(loaded); return loaded.signIn(); }, () => ({ status: "failed", isNew: false }));
      result.then((r) => {
        setFailed(r.status === "failed");
        if (r.status === "ok" && r.isNew) setPendingNew(true);
      });
    },
    signOut() { setMerged(0); setPendingNew(false); setPrompt(null); fb?.signOut(); },
    dismiss,
    clearMerged,
    subscribe,
    closePrompt,
  }), [fb, user, merged, failed, subscribed, prompt, dismiss, clearMerged, subscribe, closePrompt]);
  return [saves, account];
}

// AppHeader's account props for this page: Sign in, the avatar, or neither while restoring.
function useHeaderAccount(navigate) {
  const account = React.useContext(AccountContext);
  return headerAccount(account.user, { signIn: account.signIn, signOut: account.signOut, openSaved: () => navigate(savedPath()) });
}

// true, false, or null while the session restores.
const signedInOf = (user) => (user === undefined ? null : Boolean(user));

// The sticky save banner (C2), straight after the AppHeader on every page: signed out with a save.
function StickyBanner({ saveCount }) {
  const account = React.useContext(AccountContext);
  return showBanner({ signedIn: signedInOf(account.user), saveCount }) ? <SaveBanner sticky onSignIn={account.signIn} /> : null;
}

// "Could not sign in. Try again." under the header, after a sign-in that failed for a reason other than the reader closing the popup.
function SignInFailed() {
  const { signInFailed } = React.useContext(AccountContext);
  return signInFailed ? <StatusMessage role="alert">Could not sign in. Try again.</StatusMessage> : null;
}

// The approved presentation wraps the existing edition, URL filter and
// preference logic, with saves and Google sign-in (AIB-75v).
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
  // One saves store for the session, whichever page is open, swapped on sign-in and sign-out.
  const [saves, account] = useAccount();
  const { dismiss, clearMerged } = account;
  React.useEffect(() => { dismiss(); }, [location.pathname, dismiss]);
  // The merge line shows on /saved until the reader leaves it, then not again.
  const onSaved = route.kind === "saved";
  const wasOnSaved = React.useRef(onSaved);
  React.useEffect(() => {
    if (wasOnSaved.current && !onSaved) clearMerged();
    wasOnSaved.current = onSaved;
  }, [onSaved, clearMerged]);
  return (
    <AccountContext.Provider value={account}>
      {page()}
      {account.prompt && account.prompt.status !== "closed" && (
        <NewsletterPrompt state={account.prompt} email={account.user?.email} onSubscribe={account.subscribe} onClose={account.closePrompt} />
      )}
    </AccountContext.Provider>
  );

  function page() {
  // Weekly archive and issue pages share the Ledger shell with the daily
  // edition (AIB-105j). Intro / Official Announcements / Viral on X are omitted
  // from the issue JSON for now.
  if (route.kind === "weekly_index") {
    return <WeeklyArchive saves={saves} theme={theme} onToggleTheme={toggleTheme} navigate={navigate} />;
  }
  if (route.kind === "privacy") {
    return <PrivacyApp saves={saves} location={location} navigate={navigate} theme={theme} onToggleTheme={toggleTheme} />;
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
}

// The Ledger shell a daily edition and a weekly issue share: masthead, category
// sidebar, and the toolbar with search, view, order and filters, all kept in
// the URL and preferences. `all` is the open feed's items, hidden ones
// included, or null while it loads; `children` renders the feed from what the
// filters leave. Every page's Sidebar carries Saved and the stored count.
//
// `page` is "feed" for an edition or weekly issue. "saved" (/saved) and
// "privacy" (/privacy) have no toolbar, filters or tags; a category opens the
// latest edition filtered to it; and the page draws its own visible h1, so
// `heading` is left out. On "saved", Saved is the current entry.
function FeedShell({ saves: store, page = "feed", theme, onToggleTheme, location, navigate, skipLabel, heading, date, all, children }) {
  const { saves } = useSaves(store);
  const { subscribed } = React.useContext(AccountContext);
  const headerProps = useHeaderAccount(navigate);
  const feedPage = page === "feed";
  const savedPage = page === "saved";
  // The feed and /saved filter their items with the Toolbar; /privacy has none.
  // The Sidebar's categories belong to the feed: elsewhere they open today's
  // edition filtered to one, show no counts, and none is current.
  const filtering = feedPage || savedPage;
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
    if (!filtering) return;
    loadTags()
      .then((data) => setTags({ status: "ready", groups: data.groups }))
      .catch(() => setTags({ status: "failed", groups: [] }));
  }, [filtering]);
  const parsed = parseFilters(location.search, tagGroups);
  // /saved has no category filter, whatever its URL says.
  const filters = feedPage ? parsed : { ...parsed, category: NO_FILTERS.category };
  const setFilters = (next) => navigate(location.pathname + filtersToSearch(next, tagGroups), { replace: true });

  const visible = all && all.filter((item) => !item.hidden);
  const categories = CATEGORIES.map((c) => ({ ...c, count: visible && feedPage ? visible.filter((i) => i.category === c.key).length : undefined }));
  const onPanel = (name) => setPanel((open) => (open === name ? null : name));
  // No filter controls until tags.json has settled: rewriting the URL before
  // then would silently drop any t= tags it already carries.
  const filterable = Boolean(visible) && tags.status !== "loading";
  // Order the whole feed, hidden items included, then filter: rank (and the
  // fallback's standing) is over the whole feed, so a filter never reshuffles
  // what it leaves. Both modes use it - Grouped only splits the ranked list by
  // category - so the two never disagree about what is best.
  // /saved passes its items already in order: newest file first, each file ranked on its own.
  const items = all && (savedPage ? all : rankedItems(all)).filter((item) => !item.hidden && matches(item, filters));
  const setCategory = (key) => setFilters({ ...filters, category: key });
  const setQuery = (query) => setFilters({ ...filters, query });

  return (
    <div className={"app-shell redesign" + (shown === "grid" ? " redesign-grid" : "") + (menuOpen ? " mobile-menu-open" : "")} ref={shell} data-theme={theme}>
      <a className="app-skip" href="#main">{skipLabel}</a>
      <AppHeader theme={theme} onToggleTheme={onToggleTheme} menuOpen={menuOpen} onMenu={() => setMenuOpen(o => !o)} githubUrl={GITHUB_URL} {...headerProps} />
      <StickyBanner saveCount={saves.length} />
      <Sidebar categories={categories} count={feedPage ? visible?.length : undefined} active={feedPage ? filters.category : null} open={menuOpen} onClose={() => setMenuOpen(false)}
        links={SIDEBAR_LINKS} subscribeUrl={showSubscribeOptions(subscribed) ? SUBSCRIBE_URL : undefined}
        onCategory={key => {
          if (!feedPage) navigate("/" + filtersToSearch({ ...NO_FILTERS, category: key }, []));
          else if (filterable) setCategory(key);
          setMenuOpen(false);
        }}
        onSaved={() => { if (!savedPage) navigate(savedPath()); setMenuOpen(false); }} savedCount={saves.length} savedActive={savedPage} />
      <main id="main" className="redesign-main" tabIndex={-1}>
        {/* No visible heading: the toolbar is the first row of the content, and its
            date control already shows the edition or issue. Screen readers still get an h1. */}
        {heading && <h1 className="app-sr">{heading}</h1>}
        <div className="workspace"><section className="feed">
          {filtering && <>
          <div ref={sticky} className="toolbar-slot">
            <Toolbar count={items ? `${items.length} items` : null} query={filters.query} onQuery={setQuery} view={view} onView={columns > 1 ? setView : undefined} mode={mode} onMode={setMode}
              disabled={!filterable} filterCount={filters.tags.length + filters.sources.length} open={panel !== null} onFilters={() => onPanel("filters")}
              date={date} />
            {panel && <FilterPanel groups={tagGroups} filters={filters} onChange={setFilters} sources={SOURCES} /> }
          </div>
          <ActiveFilters filters={filters} onChange={setFilters} />
          </>}
          <div className="app-main" ref={setMainEl}>
            <SignInFailed />
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

// Cards or rows, each with its save star. `from` names the file the items live
// in, or is a function of the item when they come from several (/saved).
function ItemList({ items, view, saves: store, from }) {
  const { has, toggle } = useSaves(store);
  const fromOf = typeof from === "function" ? from : () => from;
  const star = (item) => ({ saved: has(item.id), onToggleSave: () => toggle(item, fromOf(item)), starPos: "visual" });
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

// /saved - every saved item, as a category view (spec AIB-75v app-saved-view,
// amended by T16): the Toolbar without a date, the Sidebar's categories and both
// modes over the saves, ordered newest file first and ranked inside each. It
// loads the two indexes, then only the files the saves name; saved.js decides
// the order and what is left out.
function SavedApp({ saves: store, location, navigate, theme, onToggleTheme }) {
  const index = useLoaded(loadIndex, ONCE, "index");
  const weekly = useLoaded(loadWeeklyIndex, ONCE, "weekly");
  const { saves } = useSaves(store);
  const account = React.useContext(AccountContext);
  const merged = mergedLine(account.merged);
  React.useEffect(() => { document.title = "aiBytes_ · Saved"; }, []);

  const settled = index.status !== "loading" && weekly.status !== "loading";
  const failed = [index, weekly].find((state) => state.status === "error");
  const editions = index.status === "ready" ? index.data.editions : [];
  const issues = weekly.status === "ready" ? weekly.data.issues : [];
  const files = useSavedFiles(settled && !failed ? filesToLoad(saves, editions, issues) : []);
  const { groups, leftOut } = savedGroups(saves, { editions, issues, files });
  const feed = savedFeed(groups);
  // Nothing to filter until every file has landed, so the count never counts up.
  const all = settled && !failed && !feed.loading ? feed.items : null;

  return (
    <FeedShell saves={store} page="saved" theme={theme} onToggleTheme={onToggleTheme} location={location} navigate={navigate}
      skipLabel="Skip to your saved items" heading="Saved" date={null} all={all}>
      {({ items, filters, view, mode, clearQuery, clearFilters }) => {
        const message = (text, role) => <StatusMessage role={role}>{text}</StatusMessage>;
        if (failed) return message(`Could not load your saves: ${failed.error.message}`, "alert");
        if (!settled) return message("Loading your saves...");
        if (!saves.length) {
          return message(<span className="ldg-prose">
            <b>No saved items yet.</b> Select the ☆ on any card or row to save it. Saved items from every edition
            collect here, newest edition first.
            {account.user !== undefined && (account.user ? " Your saves sync to your Google account." : " Saves stay in this browser until you sign in with Google.")}
            {" "}<a href="/">← Back to the latest edition</a>
          </span>, "status");
        }
        if (!items) return message("Loading your saves...");
        const note = leftOutNote(leftOut);
        let body = null;
        if (items.length) body = <ItemSections items={items} view={view} mode={mode} saves={store} from={(item) => feed.from.get(item.id)} />;
        else if (feed.items.length && filters.query.trim()) body = <EmptyState query={filters.query} onClearQuery={clearQuery} />;
        else if (feed.items.length) {
          body = message(<span className="ldg-prose">No saved {describeFilters(filters)}. <a href="#clear" onClick={(e) => { e.preventDefault(); clearFilters(); }}>Clear filters.</a></span>);
        }
        return (
          <>
            {merged && <p role="status">{merged}</p>}
            {feed.failed.map((group) => <React.Fragment key={group.key}>
              {message(group.kind === "edition" ? `Could not load the ${group.label} edition.` : `Could not load ${group.label}.`, "alert")}
            </React.Fragment>)}
            {body}
            {note && <p>{note}</p>}
          </>
        );
      }}
    </FeedShell>
  );
}

// /privacy: what saving and signing in keep, and where (AIB-75v T11). Its facts
// were checked against the built site: no cookies of the site's own, fonts from
// Google Fonts, item images from the sites they belong to. Analytics is Umami
// Cloud (AIB-145y T3); its fields were checked against Umami's "Metric
// definitions" and privacy pages on 12 Nov 2026. Change them only with the
// site; Google's sign-in consent screen links here.
const PRIVACY_EMAIL = "contact@aibytes.io";

function PrivacyApp({ saves, location, navigate, theme, onToggleTheme }) {
  React.useEffect(() => { document.title = "aiBytes_ · Privacy"; }, []);
  const contact = <a href={mailto(PRIVACY_EMAIL, "Privacy: aiBytes_")}>{PRIVACY_EMAIL}</a>;
  return (
    <FeedShell saves={saves} page="privacy" theme={theme} onToggleTheme={onToggleTheme} location={location} navigate={navigate}
      skipLabel="Skip to the privacy page" date={null} all={null}>
      {() => <article className="app-privacy">
        <h1 className="ldg-section-h">Privacy</h1>
        <p>Last changed 12 November 2026.</p>

        <h2 className="ldg-section-h">Reading</h2>
        <p>aiBytes_ sets no cookies. The site is hosted on GitHub Pages; its fonts come from Google Fonts, and item
          images from the sites they belong to, such as GitHub, TechCrunch and Product Hunt. Like any web request,
          those services see your IP address and browser.</p>

        <h2 className="ldg-section-h">Analytics</h2>
        <p>To see which pages are read and where readers come from, aiBytes_ uses <a href="https://umami.is">Umami</a>,
          an analytics service that sets no cookies and stores nothing in your browser. For each page view it records
          the page address and title, the site that linked to it, your browser, operating system, device type, screen
          size and language, and your approximate location (country, region and city). It uses your IP address and
          browser to make an anonymous visitor code, which changes every month, and does not store your IP address
          with the record. It is not told who you are, even when you are signed in, and it is not used for
          advertising.</p>

        <h2 className="ldg-section-h">Saving</h2>
        <p>Items you save without signing in stay in this browser&apos;s local storage. Nothing about them leaves your
          device.</p>

        <h2 className="ldg-section-h">Signing in with Google</h2>
        <p>Signing in uses Firebase Authentication, a Google service, which gives aiBytes_ your name, email address
          and profile photo. The name and photo appear in the header; the email is not used for anything else. None
          of it is sold or shared.</p>
        <p>Your saves are then stored in Google Cloud Firestore under your account, where only you can read them.
          Each save is the item&apos;s id, the edition or weekly issue it came from, and when you saved it. Firebase
          keeps you signed in using this browser&apos;s storage.</p>

        <h2 className="ldg-section-h">Deleting</h2>
        <p>Unstar an item to delete its save. To delete your account and all its saves, email {contact}.</p>

        <h2 className="ldg-section-h">The newsletter</h2>
        <p>{NEWSLETTER_PRIVACY}</p>

        <h2 className="ldg-section-h">Questions</h2>
        <p>Email {contact}.</p>
      </article>}
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
  const { subscribed } = React.useContext(AccountContext);
  if (!showSubscribeOptions(subscribed)) return null;
  return (
    <aside className="weekly-subscribe" aria-label="Subscribe">
      <p className="weekly-subscribe__text"><b>Get aiBytes_ every Monday.</b> The week in AI for developers, in your inbox.</p>
      <a className="ldg-btn ldg-btn--primary weekly-subscribe__action" href={SUBSCRIBE_URL}>Subscribe</a>
    </aside>
  );
}

// /weekly - every published issue, newest first. Issue links are plain hrefs:
// each issue is its own built page, with its own title and canonical URL.
function WeeklyArchive({ saves: store, theme, onToggleTheme, navigate }) {
  const headerProps = useHeaderAccount(navigate);
  const { subscribed } = React.useContext(AccountContext);
  const { saves } = useSaves(store);
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
      <AppHeader theme={theme} onToggleTheme={onToggleTheme} githubUrl={GITHUB_URL} {...headerProps} />
      <StickyBanner saveCount={saves.length} />
      <SignInFailed />
      <main id="main" className="redesign-main" tabIndex={-1}>
        <div className="workspace">
          <section className="weekly-archive">
            <header className="weekly-archive__head">
              <p className="weekly-archive__kicker">Weekly</p>
              <h1 className="weekly-archive__title">aiBytes_ archive</h1>
              <p className="weekly-archive__lede ldg-prose">
                Every Monday issue on aibytes.io. {showSubscribeOptions(subscribed) && <><a href={SUBSCRIBE_URL}>Subscribe</a> · </>}<a href="/">Daily edition</a>
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
