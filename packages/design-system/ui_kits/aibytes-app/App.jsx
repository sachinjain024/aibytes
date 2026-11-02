/* aiBytes_ app — loaded as text/babel. The same page apps/web/src/App.jsx
   renders, with the same page classes, built from the Ledger bundle and fed
   the sample editions in data.js instead of content/. */
const NS = window.LedgerAiBytesDesignSystem_b1be4f || {};
if (!NS.AppHeader) document.body.insertAdjacentHTML("afterbegin", '<p style="font-family:monospace;font-size:13px;padding:16px">Ledger bundle not compiled yet — reload in a moment (_ds_bundle.js missing).</p>');
const { AppHeader, Sidebar, Toolbar, FilterPanel, ActiveFilters, EditionBar, CardGrid, RowList, Card, ListRow, SectionHeading, EmptyState, EndCard } = NS;
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
  const goTo = date => { setEdition(date); setCalOpen(false); };

  const render = list => (shown === "list"
    ? <RowList>{list.map(item => <ListRow key={item.id} item={item} />)}</RowList>
    : <CardGrid>{list.map(item => <Card key={item.id} item={item} />)}</CardGrid>);

  let body;
  if (!items.length && filters.query.trim()) {
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

  return (
    <div className={"app-shell redesign" + (shown === "grid" ? " redesign-grid" : "") + (menuOpen ? " mobile-menu-open" : "")} data-theme={theme}>
      <AppHeader theme={theme} onToggleTheme={() => setTheme(t => (t === "light" ? "dark" : "light"))} menuOpen={menuOpen} onMenu={() => setMenuOpen(o => !o)} githubUrl={D.githubUrl} />
      <Sidebar categories={categories} count={ed.items.length} active={filters.category} open={menuOpen} onClose={() => setMenuOpen(false)}
        onCategory={key => { setFilters({ ...filters, category: key }); setMenuOpen(false); }}
        links={D.links} subscribeUrl={D.subscribeUrl} />
      <main id="main" className="redesign-main" tabIndex={-1}>
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
    </div>);
}
window.AiBytesApp = AiBytesApp;
