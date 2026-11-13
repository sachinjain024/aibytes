/* aiBytes_ app — loaded as text/babel. The same page apps/web/src/App.jsx
   renders, with the same page classes, built from the Ledger bundle and fed
   the sample editions in data.js instead of content/. */
const NS = window.LedgerAiBytesDesignSystem_b1be4f || {};
if (!NS.AppHeader) document.body.insertAdjacentHTML("afterbegin", '<p style="font-family:monospace;font-size:13px;padding:16px">Ledger bundle not compiled yet — reload in a moment (_ds_bundle.js missing).</p>');
const { AppHeader, Sidebar, Toolbar, FilterPanel, ActiveFilters, EditionBar, CardGrid, RowList, Card, ListRow, SectionHeading, EmptyState, EndCard, SaveBanner, StatusMessage, Dialog, Button, GistPanel, GistView, ReactionBar, SavedNote, SaveStar } = NS;
// The gists (AIB-145y): sample files in the shape of content/gists/<slug>.json, by the id of the item they belong to.
const GISTS = window.LEDGER_GISTS || {};
const SAMPLE_REACTIONS = { "👍": 12, "🎉": 3, "🚀": 1200 };
// The offer a new account sees once (AIB-140p, D2). Sample content for the kit;
// the app's NewsletterPrompt owns this copy when it ships.
const PROMPT_COVERS = ["New AI tools", "AI threads on HN", "Trending AI projects", "Latest AI news", "Official announcements", "Viral posts on X"];
function NewsletterPromptSample({ onClose }) {
  return (
    <Dialog labelledBy="prompt-h" onClose={onClose}>
      <h2 id="prompt-h" className="ldg-dialog__title prompt-signed">
        <svg className="prompt-tick" viewBox="0 0 48 48" width="22" height="22" aria-hidden="true"><circle cx="24" cy="24" r="23" /><path d="M14.5 24.5 21 31l12.5-13.5" fill="none" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        <span>You're successfully signed in.</span>
      </h2>
      <p className="prompt-lead">Get the best of AI in your inbox every Monday</p>
      <ul className="prompt-covers">{PROMPT_COVERS.map(item => <li key={item}>{item}</li>)}</ul>
      <div className="ldg-dialog__actions ldg-dialog__actions--one">
        <Button variant="primary" data-autofocus>Subscribe</Button>
      </div>
      <p className="prompt-proof">Read by 2,000+ developers at companies like Amazon, Google, OpenAI, Nvidia and Stripe.</p>
      <p className="prompt-builtby">
        <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path d="M8 13.6 2.3 8.1a3.3 3.3 0 0 1 4.6-4.7L8 4.5l1.1-1.1a3.3 3.3 0 0 1 4.6 4.7Z" fill="currentColor" /></svg>
        <span>Built by a former YC founder</span>
        <svg className="prompt-yc" viewBox="0 0 16 16" width="16" height="16" role="img" aria-label="Y Combinator"><rect width="16" height="16" rx="3" /><path d="M4.6 4 8 9v3.4M11.4 4 8 9" fill="none" strokeWidth="1.5" /></svg>
      </p>
    </Dialog>
  );
}
// The kit's signed-in reader. No photoUrl, so the avatar shows the initial.
const SAMPLE_USER = { name: "Ada Lovelace" };
const D = window.LEDGER_DATA;
const TAG_GROUPS = Object.entries(D.tagGroups).map(([name, tags]) => ({ name, tags: tags.map(tag => ({ name: tag })) }));
const rankOf = item => item.rank || 99;

function useNarrow() {
  const query = "(max-width: 760px)";
  const [narrow, setNarrow] = React.useState(() => window.matchMedia(query).matches);
  React.useEffect(() => {
    const list = window.matchMedia(query);
    const onChange = () => setNarrow(list.matches);
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  }, []);
  return narrow;
}

function AiBytesApp(props) {
  const [edition, setEdition] = React.useState(props.edition0 || D.order[D.order.length - 1]);
  const [theme, setTheme] = React.useState(props.theme0 || "light");
  const [view, setView] = React.useState(props.view0 || "grid");
  const [mode, setMode] = React.useState(props.mode0 || "ranked");
  const [filters, setFilters] = React.useState({ category: props.cat0 || "all", tags: props.tags0 || [], sources: props.sources0 || [], query: props.query0 || "" });
  const [panel, setPanel] = React.useState(!!props.tagsOpen0);
  const [calOpen, setCalOpen] = React.useState(!!props.calOpen0);
  const [menuOpen, setMenuOpen] = React.useState(!!props.menuOpen0);
  // Saves and sign-in (AIB-75v): ids saved in this browser, the Saved page, and
  // the banner, which shows signed out once anything is saved until dismissed.
  const [saved, setSaved] = React.useState(() => new Set(props.saved0 || []));
  const [signedIn, setSignedIn] = React.useState(!!props.signedIn0);
  const [savedPage, setSavedPage] = React.useState(!!props.savedPage0);
  const [bannerDismissed, setBannerDismissed] = React.useState(false);
  const [promptOpen, setPromptOpen] = React.useState(!!props.prompt0);
  // The gist panel beside the feed (gist0 = the item it opens on), the gist page
  // (gistPage0), the panel's width, and this reader's reactions.
  const [gistId, setGistId] = React.useState(props.gist0 || null);
  const [panelWidth, setPanelWidth] = React.useState(460);
  const [mine, setMine] = React.useState(props.mine0 || []);
  const [askSignIn, setAskSignIn] = React.useState(false);
  React.useEffect(() => setSignedIn(!!props.signedIn0), [props.signedIn0]);
  React.useEffect(() => { if (props.theme0) setTheme(props.theme0); }, [props.theme0]);
  React.useEffect(() => { if (props.view0) setView(props.view0); }, [props.view0]);
  React.useEffect(() => { if (props.mode0) setMode(props.mode0); }, [props.mode0]);

  // At phone width there is one column, so Cards show and the toggle hides, as in the app.
  const narrow = useNarrow();
  const shown = narrow ? "grid" : view;
  const ed = D.editions[edition];
  const idx = D.order.indexOf(edition);
  const prevKey = D.order[idx - 1];
  const matches = it => (filters.category === "all" || it.category === filters.category)
    && (!filters.tags.length || (it.tags || []).some(t => filters.tags.includes(t)))
    && (!filters.sources.length || filters.sources.includes(it.source))
    && (!filters.query.trim() || `${it.title} ${it.summary}`.toLowerCase().includes(filters.query.trim().toLowerCase()));
  const items = ed.items.filter(matches).slice().sort((a, b) => rankOf(a) - rankOf(b));
  const categories = D.categories.map(c => ({ ...c, count: ed.items.filter(i => i.category === c.key).length }));
  const goTo = date => { setEdition(date); setCalOpen(false); setSavedPage(false); };
  const toggleSave = id => setSaved(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const openSaved = () => { setSavedPage(true); setMenuOpen(false); };
  const showBanner = !signedIn && saved.size > 0 && !bannerDismissed;
  const allItems = D.order.flatMap(k => D.editions[k].items);
  const hasFront = item => !!(GISTS[item.id] && GISTS[item.id].front_page);
  // A card's title opens its gist in the panel on a plain click (the app's B2 pick).
  const onFeedClick = e => {
    const link = e.target.closest && e.target.closest(".story h3 a");
    if (!link) return;
    const item = allItems.find(i => i.title === link.textContent);
    if (item && GISTS[item.id]) { e.preventDefault(); setGistId(item.id); }
  };
  const react = emoji => { if (!signedIn) return setAskSignIn(true); setMine(m => m.includes(emoji) ? m.filter(x => x !== emoji) : [...m, emoji]); };
  const actionsFor = id => (
    <div className="gist-actions">
      <div className="gist-actions-row">
        <span className={"gist-save" + (saved.has(id) ? " gist-save--on" : "")}>
          <SaveStar saved={saved.has(id)} onToggle={() => toggleSave(id)} />
          <button type="button" className="gist-save-label" onClick={() => toggleSave(id)}>{saved.has(id) ? "Saved" : "Save"}</button>
        </span>
        <ReactionBar counts={SAMPLE_REACTIONS} mine={mine} onToggle={react} />
      </div>
      {saved.has(id) && <SavedNote />}
      {askSignIn && !signedIn && <p className="gist-saved" role="status">Sign in with Google to react. Saving works without an account.</p>}
    </div>);

  const render = list => (shown === "list"
    ? <RowList>{list.map(item => <ListRow key={item.id} item={item} front={hasFront(item)} saved={saved.has(item.id)} onToggleSave={() => toggleSave(item.id)} starPos="visual" />)}</RowList>
    : <CardGrid>{list.map(item => <Card key={item.id} item={item} front={hasFront(item)} saved={saved.has(item.id)} onToggleSave={() => toggleSave(item.id)} starPos="visual" />)}</CardGrid>);

  let body;
  if (savedPage) {
    // A preview of the Saved view (module app-saved-view): newest edition first,
    // each edition's saves in rank order.
    const groups = D.order.slice().reverse()
      .map(k => ({ key: k, ed: D.editions[k], list: D.editions[k].items.filter(i => saved.has(i.id)).sort((a, b) => rankOf(a) - rankOf(b)) }))
      .filter(g => g.list.length);
    body = groups.length
      ? groups.map(g => (
        <section className="app-sec" key={g.key} aria-labelledby={"saved-" + g.key}>
          <SectionHeading name={g.ed.mid} count={g.list.length} id={"saved-" + g.key} />
          {render(g.list)}
        </section>))
      : <StatusMessage role="status">Nothing saved yet. Select the ☆ on any card or row to save it; saves from every edition collect here.</StatusMessage>;
  } else if (!items.length && filters.query.trim()) {
    body = <EmptyState query={filters.query} onClearQuery={() => setFilters({ ...filters, query: "" })} />;
  } else if (!items.length) {
    const what = filters.category !== "all" ? D.categories.find(c => c.key === filters.category).label : "items matching these filters";
    const prevCount = prevKey ? D.editions[prevKey].items.filter(matches).length : 0;
    body = prevCount
      ? <EmptyState category={what} prevLabel={D.editions[prevKey].short} prevCount={prevCount} onPrev={() => goTo(prevKey)} />
      : <EmptyState category={what} onClear={() => setFilters({ ...filters, tags: [], sources: [] })} />;
  } else {
    const feed = mode === "grouped"
      ? D.categories.map(c => {
        const group = items.filter(i => i.category === c.key);
        if (!group.length) return null;
        return (
          <section className="app-sec" key={c.key} aria-labelledby={c.key}>
            <SectionHeading name={c.label} count={group.length} id={c.key} />
            {render(group)}
          </section>);
      })
      : (
        <section className="app-sec" aria-labelledby="items-heading">
          <h2 className="app-sr" id="items-heading">{items.length} items</h2>
          {render(items)}
        </section>);
    // The end card closes a feed; an empty state stands alone, as in the app.
    body = <>{feed}<EndCard dateLabel={ed.short} prevLabel={prevKey ? D.editions[prevKey].short : undefined} onPrev={() => prevKey && goTo(prevKey)} /></>;
  }

  const date = (
    <div>
      <EditionBar dateLabel={ed.mid} onDateClick={() => setCalOpen(o => !o)} calendarOpen={calOpen}
        editions={D.order.slice().reverse().map(k => ({ date: k, label: D.editions[k].mid, count: D.editions[k].items.length }))}
        currentDate={edition} onSelectEdition={goTo} />
    </div>);

  // The gist page: the header only and one reading column, then more from the same edition.
  const pageGist = props.gistPage0 && GISTS[props.gistPage0];
  if (pageGist) {
    const pageEd = D.editions[pageGist.appearances[0].edition_date];
    const more = pageEd.items.filter(i => i.id !== props.gistPage0).sort((a, b) => rankOf(a) - rankOf(b)).slice(0, 4);
    return (
      <div className="app-shell redesign" data-theme={theme}>
        <AppHeader theme={theme} onToggleTheme={() => setTheme(t => (t === "light" ? "dark" : "light"))} githubUrl={D.githubUrl}
          onSignIn={() => setSignedIn(true)} user={signedIn ? SAMPLE_USER : undefined} onSignOut={() => setSignedIn(false)} onSaved={openSaved} />
        {showBanner && <SaveBanner sticky onSignIn={() => setSignedIn(true)} onDismiss={() => setBannerDismissed(true)} />}
        <main id="main" className="redesign-main" tabIndex={-1}>
          <div className="gist-page">
            <p className="gist-crumb"><a href="#edition">← Back to {pageEd.mid}</a></p>
            <GistView gist={pageGist} as="page" actions={actionsFor(props.gistPage0)} />
            <section className="gist-more" aria-labelledby="more-h">
              <h2 id="more-h">More from {pageEd.short}</h2>
              <RowList>{more.map(item => <ListRow key={item.id} item={item} front={hasFront(item)} saved={saved.has(item.id)} onToggleSave={() => toggleSave(item.id)} starPos="visual" />)}</RowList>
            </section>
          </div>
        </main>
      </div>);
  }

  return (
    <div className={"app-shell redesign" + (shown === "grid" ? " redesign-grid" : "") + (menuOpen ? " mobile-menu-open" : "")} data-theme={theme}>
      <AppHeader theme={theme} onToggleTheme={() => setTheme(t => (t === "light" ? "dark" : "light"))} menuOpen={menuOpen} onMenu={() => setMenuOpen(o => !o)} githubUrl={D.githubUrl}
        onSignIn={() => setSignedIn(true)} user={signedIn ? SAMPLE_USER : undefined} onSignOut={() => setSignedIn(false)} onSaved={openSaved} />
      {showBanner && <SaveBanner sticky onSignIn={() => setSignedIn(true)} onDismiss={() => setBannerDismissed(true)} />}
      <Sidebar categories={categories} count={ed.items.length} active={filters.category} open={menuOpen} onClose={() => setMenuOpen(false)}
        onCategory={key => { setFilters({ ...filters, category: key }); setSavedPage(false); setMenuOpen(false); }}
        links={D.links} subscribeUrl={D.subscribeUrl}
        onSaved={openSaved} savedCount={saved.size} savedActive={savedPage} />
      <main id="main" className="redesign-main" tabIndex={-1} onClick={onFeedClick}>
        <h1 className="app-sr">aiBytes_ edition, {ed.label}</h1>
        <div className="workspace"><section className="feed">
          <div className="toolbar-slot">
            <Toolbar count={`${items.length} items`} query={filters.query} onQuery={query => setFilters({ ...filters, query })}
              view={view} onView={narrow ? undefined : setView} mode={mode} onMode={setMode}
              filterCount={filters.tags.length + filters.sources.length} open={panel} onFilters={() => setPanel(o => !o)} date={date} />
            {panel && <FilterPanel groups={TAG_GROUPS} filters={filters} onChange={setFilters} sources={D.sources} />}
          </div>
          <ActiveFilters filters={filters} onChange={setFilters} />
          <div className="app-main">
            {body}
          </div>
        </section></div>
      </main>
      {gistId && GISTS[gistId] && (
        <GistPanel gist={GISTS[gistId]} pageHref="#gist-page" width={panelWidth} onWidthChange={setPanelWidth} onClose={() => setGistId(null)}>
          <GistView gist={GISTS[gistId]} as="panel" actions={actionsFor(gistId)} />
        </GistPanel>)}
      {promptOpen && <NewsletterPromptSample onClose={() => setPromptOpen(false)} />}
    </div>);
}
window.AiBytesApp = AiBytesApp;
