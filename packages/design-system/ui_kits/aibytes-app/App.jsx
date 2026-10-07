/* aiBytes_ app — loaded as text/babel; composes Ledger bundle components. */
const NS = window.LedgerAiBytesDesignSystem_b1be4f || {};
if (!NS.Header) document.body.insertAdjacentHTML("afterbegin", '<p style="font-family:monospace;font-size:13px;padding:16px">Ledger bundle not compiled yet — reload in a moment (_ds_bundle.js missing).</p>');
const { Header, EditionBar, SaveBanner, Card, ListRow, SectionHeading, EmptyState, EndCard, Footer, Chip, SourceMark, SideNav } = NS;
const D = window.LEDGER_DATA;

function TagPanel({ selected, onToggle }) {
  return (
    <div className="app-pop" role="group" aria-label="Filter by tag">
      {Object.entries(D.tagGroups).map(([group, tags]) => (
        <div key={group}>
          <div className="app-pop__label">{group}</div>
          <div className="app-pop__chips" style={{ marginTop: 6 }}>
            {tags.map(t => <Chip key={t} label={t} active={selected.has(t)} onClick={() => onToggle(t)} />)}
          </div>
        </div>))}
    </div>);
}
function SourcePanel({ selected, onToggle }) {
  return (
    <div className="app-pop" style={{ width: 300 }} role="group" aria-label="Filter by source">
      <div className="app-pop__label">Sources</div>
      <div className="app-pop__chips">
        {D.sources.map(s => <Chip key={s.key} label={s.label} active={selected.has(s.key)} onClick={() => onToggle(s.key)} />)}
      </div>
    </div>);
}

function AiBytesApp(props) {
  const [edition, setEdition] = React.useState(props.edition0 || D.order[D.order.length - 1]);
  const [theme, setTheme] = React.useState(props.theme0 || "light");
  const [view, setView] = React.useState(props.view0 || "grid");
  const [cat, setCat] = React.useState(props.cat0 || "all");
  const [tags, setTags] = React.useState(new Set(props.tags0 || []));
  const [sources, setSources] = React.useState(new Set(props.sources0 || []));
  const [saved, setSaved] = React.useState(() => { try { const s = JSON.parse(localStorage.getItem("aibytes-saved") || "[]"); return new Set(s.length ? s : props.saved0 || []); } catch (e) { return new Set(props.saved0 || []); } });
  React.useEffect(() => { try { localStorage.setItem("aibytes-saved", JSON.stringify([...saved])); } catch (e) {} }, [saved]);
  const [savedView, setSavedView] = React.useState(!!props.savedView0);
  const [calOpen, setCalOpen] = React.useState(!!props.calOpen0);
  const [signedIn, setSignedIn] = React.useState(!!props.signedIn0);
  const [bannerGone, setBannerGone] = React.useState(false);
  const [tagsOpen, setTagsOpen] = React.useState(!!props.tagsOpen0);
  const [mode, setMode] = React.useState(props.mode0 || "ranked");
  const [sourcesOpen, setSourcesOpen] = React.useState(false);
  const compact = !!props.compact;
  const shellRef = React.useRef(null);
  React.useEffect(() => {
    const shell = shellRef.current; if (!shell) return;
    const cluster = shell.querySelector(".app-sticky"); if (!cluster) return;
    const set = () => shell.style.setProperty("--ldg-header-h", cluster.offsetHeight + "px");
    set();
    const ro = new ResizeObserver(set); ro.observe(cluster);
    return () => ro.disconnect();
  });
  const sideNav = props.nav === "side" && !compact;
  const ed = D.editions[edition];
  const idx = D.order.indexOf(edition);
  const prevKey = D.order[idx - 1], nextKey = D.order[idx + 1];
  const editionsList = D.order.slice().reverse().map(k => ({ date: k, label: D.editions[k].mid, count: D.editions[k].items.length }));
  const inSet = (set, setter) => v => setter(s => { const n = new Set(s); n.has(v) ? n.delete(v) : n.add(v); return n; });
  const match = it => (cat === "all" || it.category === cat) && (!tags.size || (it.tags || []).some(t => tags.has(t))) && (!sources.size || sources.has(it.source));
  const catCount = k => ed.items.filter(i => i.category === k).length;
  const prevWith = key => { for (let i = idx - 1; i >= 0; i--) { const c = D.editions[D.order[i]].items.filter(x => x.category === key).length; if (c > 0) return { short: D.editions[D.order[i]].short, count: c, date: D.order[i] }; } return null; };
  const renderItems = its => view === "grid"
    ? <div className={"app-grid" + (compact ? " app-grid--one" : "")}>{its.map(i => <Card key={i.id} item={i} topToday={!!i.top} saved={saved.has(i.id)} onToggleSave={inSet(saved, setSaved)} signalsPos={props.cardSignals} tagStyle={props.cardTags} />)}</div>
    : <div className="app-rows">{its.map(i => <ListRow key={i.id} item={i} saved={saved.has(i.id)} onToggleSave={inSet(saved, setSaved)} />)}</div>;
  let body;
  if (savedView) {
    const groups = D.order.slice().reverse().map(k => ({ k, its: D.editions[k].items.filter(i => saved.has(i.id)) })).filter(g => g.its.length);
    body = groups.length
      ? groups.map(g => <section className="app-sec" key={g.k}><SectionHeading name={D.editions[g.k].mid} count={g.its.length} /> {renderItems(g.its)}</section>)
      : <div className="ldg-endcard">Nothing saved yet. Tap ☆ on any card to keep it here.</div>;
  } else if (mode === "ranked") {
    const sig = i => Math.max(i.signals?.upvotes || 0, i.signals?.points || 0, (i.signals?.stars_gained || 0) / 8);
    const its = ed.items.filter(match).slice().sort((a, b) => (a.rank || 99) - (b.rank || 99) || sig(b) - sig(a));
    body = its.length
      ? <section className="app-sec">{renderItems(its)}</section>
      : <section className="app-sec"><EmptyState category="items matching this filter" prevLabel={prevKey ? D.editions[prevKey].short : undefined} prevCount={prevKey ? D.editions[prevKey].items.length : undefined} onPrev={() => setEdition(prevKey)} /></section>;
  } else {
    const cats = D.categories.filter(c => cat === "all" || c.key === cat);
    body = cats.map(c => {
      const its = ed.items.filter(i => i.category === c.key).filter(match);
      if (!its.length && cat !== "all") {
        const p = prevWith(c.key);
        return <section className="app-sec" key={c.key}><EmptyState category={c.label} prevLabel={p && p.short} prevCount={p && p.count} onPrev={() => { p && setEdition(p.date); }} /></section>;
      }
      if (!its.length) return null;
      return <section className="app-sec" key={c.key}><SectionHeading name={c.label} count={its.length} id={c.key} />{renderItems(its)}</section>;
    });
  }
  const cluster = (
    <div className="app-sticky">
      <Header compact={compact} showCategories={!sideNav}
        tagline={props.tagline}
        categories={D.categories.map(c => ({ ...c, count: catCount(c.key) }))}
        activeCategory={cat} onCategory={k => { setCat(k); setSavedView(false); }}
        savedCount={saved.size} savedActive={savedView} onSaved={() => setSavedView(v => !v)}
        mode={mode} onMode={setMode}
        tagCount={tags.size} onOpenTags={() => { setTagsOpen(o => !o); setSourcesOpen(false); }}
        sourceCount={sources.size} onOpenSources={() => { setSourcesOpen(o => !o); setTagsOpen(false); }}
        view={view} onView={setView}
        theme={theme} onToggleTheme={() => setTheme(t => t === "light" ? "dark" : "light")}
        signedIn={signedIn} userInitial="S" onSignIn={() => setSignedIn(true)} />
      {!savedView && !sideNav && <EditionBar compact={compact}
        dateLabel={compact ? ed.mid : ed.label} itemCount={ed.items.length} updatedAgo={ed.updated || undefined}
        prevLabel={prevKey ? D.editions[prevKey].short : undefined}
        nextLabel={nextKey ? D.editions[nextKey].short : undefined}
        onPrev={() => setEdition(prevKey)} onNext={() => setEdition(nextKey)}
        onDateClick={() => setCalOpen(o => !o)} calendarOpen={calOpen}
        editions={editionsList} currentDate={edition}
        onSelectEdition={d => { setEdition(d); setCalOpen(false); }} />}
      {tagsOpen && <TagPanel selected={tags} onToggle={inSet(tags, setTags)} />}
      {sourcesOpen && <SourcePanel selected={sources} onToggle={inSet(sources, setSources)} />}
    </div>);
  const isLatest = idx === D.order.length - 1;
  const daysAgo = D.order.length - 1 - idx;
  const sidenav = sideNav && (
    <SideNav
      dateMain={savedView ? undefined : (isLatest ? "Today" : ed.short)}
      dateNote={isLatest ? `(${ed.mid})` : undefined}
      dateSub={isLatest ? undefined : `${ed.mid} · ${daysAgo}${daysAgo === 1 ? " day ago" : " days ago"}`}
      prevLabel={prevKey ? (isLatest ? "Yesterday" : D.editions[prevKey].short) : undefined} onPrev={() => setEdition(prevKey)}
      nextLabel={nextKey ? "Latest" : undefined} onNext={() => setEdition(D.order[D.order.length - 1])}
      editions={editionsList} currentDate={edition}
      onSelectEdition={d => { setEdition(d); setCalOpen(false); }}
      calendarOpen={calOpen} onToggleCalendar={() => setCalOpen(o => !o)}
      categories={D.categories.map(c => ({ ...c, count: catCount(c.key) }))}
      activeCategory={savedView ? "" : cat} onCategory={k => { setCat(k); setSavedView(false); }}
      allCount={ed.items.length}
      savedLabel="My Starred" savedCount={saved.size} savedActive={savedView} onSaved={() => setSavedView(v => !v)} />);
  const banner = saved.size > 0 && !signedIn && <SaveBanner onSignIn={() => setSignedIn(true)} />;
  if (props.headerOnly) return (
    <div className="app-shell" data-theme={theme} style={{ minHeight: 0 }}>{cluster}{banner}</div>);
  return (
    <div ref={shellRef} className={"app-shell" + (compact ? " app-phone" : "") + (sideNav ? " app-shell--full" : "")} data-theme={theme}>
      {cluster}{banner}
      <div className={sideNav ? "app-cols" : undefined}>
        {sidenav}
        <main className="app-main" style={compact ? { padding: "16px 20px" } : undefined}>
          {body}
          {!savedView && <EndCard dateLabel={ed.short} prevLabel={prevKey ? D.editions[prevKey].short : undefined} onPrev={() => setEdition(prevKey)} />}
        </main>
      </div>
      <Footer />
    </div>);
}
window.AiBytesApp = AiBytesApp;
