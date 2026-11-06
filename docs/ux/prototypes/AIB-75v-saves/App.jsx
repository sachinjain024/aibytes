// AIB-75v prototype: anonymous saves, Google sign-in, merge, and the Saved view,
// built from the real Ledger components. The header and rail are local copies of
// AppHeader / Sidebar markup (same classes) with the slots the options need.
import React from "react";
import { createRoot } from "react-dom/client";
import { CardGrid, RowList } from "@ds/components/content/Feed.jsx";
import { ProtoCard as Card, ProtoRow as ListRow } from "./ProtoFeedItem.jsx";
import { SectionHeading } from "@ds/components/content/SectionHeading.jsx";
import { EndCard } from "@ds/components/content/EndCard.jsx";
import { Toolbar } from "@ds/components/navigation/Toolbar.jsx";
import { EditionBar } from "@ds/components/navigation/EditionBar.jsx";
import { Icon } from "@ds/components/navigation/icons.jsx";

const D = window.LEDGER_DATA;
const rankOf = item => item.rank || 99;

// One item in an older edition was hidden after it was saved (hide.py sets
// `hidden: true` and keeps the item), so the Saved view has to decide what to do.
const HIDDEN_ID = "gh-promptvault";
D.editions["2026-08-25"].items.push({ id: HIDDEN_ID, rank: 30, category: "repos", source: "github", source_url: "#gh", url: "#", title: "prompt-vault", summary: "A shared prompt library with versioning and team review.", tags: ["Dev Tool"], signals: { stars_gained: 700 }, meta: { language: "TypeScript" }, hidden: true });

// What a reader might plausibly have saved this week: three in this browser...
const SEED_LOCAL = [
  { item_id: "gh-officecli", edition_date: "2026-08-27" },
  { item_id: "hn-claudecode", edition_date: "2026-08-27" },
  { item_id: HIDDEN_ID, edition_date: "2026-08-25" },
];
// ...and one already in the account, saved on another device.
const SEED_ACCOUNT = [{ item_id: "hn-sqlite", edition_date: "2026-08-27" }];

const OPTIONS = {
  where: { label: "Where Saved lives", choices: { 1: "Rail entry", 2: "Header chip" } },
  signin: { label: "Sign in in header", choices: { 1: "After first save", 2: "Always" } },
  banner: { label: "Save banner", choices: { 1: "Above the feed", 2: "Full-width strip" } },
  removed: { label: "Hidden items", choices: { 1: "Greyed, unsave only", 2: "Skipped, with a note" } },
  star: { label: "Star on cards and rows", choices: { 1: "After ⋮ (shipped)", 2: "Under source icon", 3: "Before ⋮" } },
};

function useNarrow() {
  const query = "(max-width: 760px)";
  const [narrow, setNarrow] = React.useState(() => window.matchMedia(query).matches);
  React.useEffect(() => {
    const list = window.matchMedia(query);
    const on = () => setNarrow(list.matches);
    list.addEventListener("change", on);
    return () => list.removeEventListener("change", on);
  }, []);
  return narrow;
}

const StarGlyph = ({ filled }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="proto-star-glyph"><path d="M12 3l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17.6 6.1 20.8l1.3-6.5L2.5 9.8 9.1 9z" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>
);

// Ledger's SaveBanner markup plus a leading warning icon, with the message centred.
function SaveBanner({ onSignIn, onDismiss }) {
  return (
    <div className="ldg-banner proto-banner" role="status">
      <div className="ldg-banner__in">
        <span className="proto-banner-msg">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="proto-warn">
            <path d="M10.3 4.2 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0ZM12 9.5v4.5M12 17.2h.01" />
          </svg>
          <span>Saved items are stored in this browser only. <a href="#signin" onClick={e => { e.preventDefault(); onSignIn(); }}>Sign in with Google</a> to keep them across devices.</span>
        </span>
        <button type="button" className="ldg-iconbtn proto-banner-x" aria-label="Dismiss" onClick={onDismiss}>
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" /></svg>
        </button>
      </div>
    </div>
  );
}

function Header({ theme, onToggleTheme, menuOpen, onMenu, savedChip, account }) {
  return (
    <header className="masthead">
      <button className="mobile-menu-button" aria-label="Toggle navigation" aria-controls="mobileSidebar" aria-expanded={menuOpen} onClick={onMenu}>
        <Icon name="menu" />
      </button>
      <a className="brand" href="#" onClick={e => e.preventDefault()}>
        <svg className="logo-mark" viewBox="0 0 24 30" fill="currentColor"><path d="M14 2 3 17h8l-1 11 11-16h-8l1-10Z" /></svg>
        aiBytes<span className="brand-dot">_</span>
      </a>
      <nav>
        {savedChip}
        <a className="github" href={D.githubUrl} target="_blank" rel="noreferrer" aria-label="GitHub">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M9 19c-4 1-4-2-6-3m12 6v-4c0-1-.3-2-1-2 4 0 6-2 6-6 0-2-1-3-2-4 0-1 0-2-1-3-2 0-3 1-4 1H9C8 3 6 3 5 3c-1 1-1 2-1 3-1 1-2 2-2 4 0 4 2 6 6 6-1 0-1 1-1 2v4" /></svg>
        </a>
        <button id="themeToggle" className="control" onClick={onToggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}>
          <Icon name={theme === "dark" ? "sun" : "moon"} />
        </button>
        {account}
      </nav>
    </header>
  );
}

function AccountMenu({ user, onSaved, onSignOut }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const close = e => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const esc = e => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, [open]);
  return (
    <div className="proto-account" ref={ref}>
      <button className="proto-avatar" aria-label={`Account: ${user.name}`} aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen(o => !o)}>{user.name[0]}</button>
      {open && (
        <div className="proto-menu" role="menu">
          <div className="proto-menu-who"><b>{user.name}</b><span>Signed in with Google</span></div>
          <button role="menuitem" onClick={() => { setOpen(false); onSaved(); }}>Saved</button>
          <button role="menuitem" onClick={() => { setOpen(false); onSignOut(); }}>Sign out</button>
        </div>
      )}
    </div>
  );
}

function Rail({ categories, count, active, onCategory, open, onClose, savedEntry }) {
  return (
    <>
      {open && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={onClose} />}
      <aside className="sidebar" id="mobileSidebar" aria-label="Navigation">
        <div className="sidebar-label">CATEGORIES</div>
        <div className="categories">
          {[{ key: "all", label: "All", count }, ...categories].map(c => (
            <button key={c.key} className={"category" + (active === c.key ? " active" : "")} aria-current={active === c.key || undefined} onClick={() => onCategory(c.key)}>
              {c.label}<span>{c.count ?? "–"}</span>
            </button>
          ))}
        </div>
        {savedEntry}
        <div className="sidebar-footer">
          <div className="sidebar-links">
            {D.links.map(l => l.href
              ? <a key={l.label} href={l.href} target="_blank" rel="noreferrer"><Icon name="link" className="link-icon" /><span>{l.label}</span><Icon name="arrow" className="link-arrow" /></a>
              : <span key={l.label}>{l.label}</span>)}
          </div>
          <div className="newsletter">
            <p>Read aiBytes_ weekly</p>
            <a className="subscribe-link" href={D.subscribeUrl} target="_blank" rel="noreferrer">Subscribe <Icon name="arrow" /></a>
          </div>
        </div>
      </aside>
    </>
  );
}

// Stands in for Google's own account picker, which Firebase opens as a popup.
function SignInSheet({ localCount, onContinue, onCancel }) {
  const btn = React.useRef(null);
  React.useEffect(() => {
    btn.current?.focus();
    const esc = e => e.key === "Escape" && onCancel();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, []);
  return (
    <div className="proto-scrim" onMouseDown={e => e.target === e.currentTarget && onCancel()}>
      <div className="proto-sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-h">
        <p className="proto-sheet-kicker">Prototype step</p>
        <h2 id="sheet-h">Google account picker</h2>
        <p>In the app, Firebase opens Google’s own sign-in popup here. Pick an account and you come straight back to the page you were on.</p>
        {localCount > 0 && <p className="proto-sheet-note">{localCount} {localCount === 1 ? "save" : "saves"} from this browser will be added to the account.</p>}
        <div className="proto-sheet-actions">
          <button className="ldg-btn ldg-btn--secondary" onClick={onCancel}>Cancel</button>
          <button className="ldg-btn ldg-btn--primary" ref={btn} onClick={onContinue}>Continue as Demo Reader</button>
        </div>
      </div>
    </div>
  );
}

function ReviewPanel({ opts, setOpt, onReset, signedIn }) {
  const [open, setOpen] = React.useState(true);
  return (
    <aside className={"proto-review" + (open ? "" : " proto-review--closed")} aria-label="Prototype options">
      <button className="proto-review-toggle" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <span>AIB-75v options</span><span aria-hidden="true">{open ? "–" : "+"}</span>
      </button>
      {open && (
        <div className="proto-review-body">
          {Object.entries(OPTIONS).map(([key, o], i) => (
            <fieldset key={key}>
              <legend><span className="proto-q">{String.fromCharCode(65 + i)}</span>{o.label}</legend>
              <div className="proto-seg">
                {Object.entries(o.choices).map(([n, label]) => (
                  <button key={n} aria-pressed={opts[key] === n} onClick={() => setOpt(key, n)}>{String.fromCharCode(65 + i)}{n} · {label}</button>
                ))}
              </div>
            </fieldset>
          ))}
          <div className="proto-review-foot">
            <span>{signedIn ? "Signed in" : "Signed out"}</span>
            <button className="ldg-btn ldg-btn--ghost" onClick={() => onReset(false)}>Start with no saves</button>
            <button className="ldg-btn ldg-btn--ghost" onClick={() => onReset(true)}>Reset to sample</button>
          </div>
        </div>
      )}
    </aside>
  );
}

function SavedView({ saves, view, starPos, onToggleSave, removedOpt, mergedNote, signedIn, onSignIn, onBack }) {
  const resolved = saves.map(s => {
    const ed = D.editions[s.edition_date];
    const item = ed && ed.items.find(i => i.id === s.item_id);
    return item ? { ...s, item } : null;
  }).filter(Boolean);
  const hiddenCount = resolved.filter(r => r.item.hidden).length;
  const shown = removedOpt === "2" ? resolved.filter(r => !r.item.hidden) : resolved;
  const dates = [...new Set(shown.map(s => s.edition_date))].sort().reverse();
  const render = list => view === "list"
    ? <RowList>{list.map(({ item }) => item.hidden ? <Removed key={item.id} item={item} list onToggleSave={onToggleSave} /> : <ListRow key={item.id} item={item} saved onToggleSave={onToggleSave} starPos={starPos} />)}</RowList>
    : <CardGrid>{list.map(({ item }) => item.hidden ? <Removed key={item.id} item={item} onToggleSave={onToggleSave} /> : <Card key={item.id} item={item} saved onToggleSave={onToggleSave} signalsPos="row" starPos={starPos} />)}</CardGrid>;

  return (
    <div className="proto-saved">
      <div className="proto-saved-head">
        <a href="#feed" className="proto-back" onClick={e => { e.preventDefault(); onBack(); }}>← Latest edition</a>
        <h1 className="proto-saved-h">Saved <span className="ldg-count">{shown.length}</span></h1>
        {shown.length > 0 && <p className="proto-saved-sub">{signedIn
          ? "Synced to your Google account."
          : <>Stored in this browser only. <a href="#signin" onClick={e => { e.preventDefault(); onSignIn(); }}>Sign in with Google</a> to keep them across devices.</>}</p>}
        {mergedNote && <p className="proto-merged" role="status">{mergedNote}</p>}
      </div>
      {!shown.length && (
        <div className="ldg-endcard proto-saved-empty" role="status">
          <StarGlyph />
          <b>No saved items yet.</b>
          <span>Select the ☆ on any card or row to save it. Saved items from every edition collect here, newest edition first.</span>
          <span>{signedIn ? "Your saves sync to your Google account." : "Saves stay in this browser until you sign in with Google."}</span>
          <a href="#feed" onClick={e => { e.preventDefault(); onBack(); }}>← Back to the latest edition</a>
        </div>
      )}
      {dates.map(date => {
        const group = shown.filter(s => s.edition_date === date);
        return (
          <section className="app-sec" key={date} aria-labelledby={"saved-" + date}>
            <SectionHeading name={D.editions[date].label} count={group.length} id={"saved-" + date} />
            {render(group)}
          </section>
        );
      })}
      {removedOpt === "2" && hiddenCount > 0 && (
        <p className="proto-footnote">{hiddenCount} saved {hiddenCount === 1 ? "item was" : "items were"} removed from {hiddenCount === 1 ? "its edition" : "their editions"} and {hiddenCount === 1 ? "is" : "are"} not shown.</p>
      )}
    </div>
  );
}

// A saved item that hide.py has since hidden: no outbound links, only unsave.
function Removed({ item, list, onToggleSave }) {
  return (
    <article className={"story proto-removed" + (list ? "" : " story--grid")}>
      <div className="story-content">
        <div className="story-top"><h3>{item.title}</h3></div>
        <p className="summary">Removed from this edition. It stays here until you unsave it.</p>
        <div className="metadata">
          <span className="proto-removed-label">Removed</span>
          <span className="item-actions">
            <button type="button" className="ldg-star ldg-star--saved" aria-label="Unsave" aria-pressed="true" onClick={() => onToggleSave(item.id)}>
              <StarGlyph filled />
            </button>
          </span>
        </div>
      </div>
    </article>
  );
}

function Proto() {
  const [theme, setTheme] = React.useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  const [view, setView] = React.useState("grid");
  const [mode, setMode] = React.useState("ranked");
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState("all");
  const [edition, setEdition] = React.useState(D.order[D.order.length - 1]);
  const [calOpen, setCalOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [page, setPage] = React.useState("feed");
  const [opts, setOpts] = React.useState({ where: "1", signin: "2", banner: "2", removed: "2", star: "2" });
  const [local, setLocal] = React.useState(SEED_LOCAL);
  const [account, setAccount] = React.useState(SEED_ACCOUNT);
  const [user, setUser] = React.useState(null);
  const [bannerOff, setBannerOff] = React.useState(false);
  const [sheet, setSheet] = React.useState(false);
  const [mergedNote, setMergedNote] = React.useState("");

  const narrow = useNarrow();
  const starPos = { 1: "after", 2: "left", 3: "before" }[opts.star];
  const shown = narrow ? "grid" : view;
  const saves = user ? account : local;
  const savedIds = new Set(saves.map(s => s.item_id));
  const setSaves = user ? setAccount : setLocal;

  // Newest first, as the Saved view and Firestore's created_at ordering would give.
  const toggleSave = (id, date = edition) => setSaves(list => list.some(s => s.item_id === id)
    ? list.filter(s => s.item_id !== id)
    : [{ item_id: id, edition_date: date }, ...list]);

  const signIn = () => setSheet(true);
  const finishSignIn = () => {
    // Union by item id, then the local copy is cleared and the banner goes.
    const have = new Set(account.map(s => s.item_id));
    const added = local.filter(s => !have.has(s.item_id));
    setAccount([...added, ...account]);
    setMergedNote(local.length ? `${added.length} ${added.length === 1 ? "save" : "saves"} from this browser ${added.length === 1 ? "was" : "were"} added to your account.` : "");
    setLocal([]);
    setUser({ name: "Demo Reader" });
    setSheet(false);
  };
  const signOut = () => { setUser(null); setMergedNote(""); setPage("feed"); };
  const reset = sample => {
    setUser(null); setLocal(sample ? SEED_LOCAL : []); setAccount(SEED_ACCOUNT);
    setBannerOff(false); setMergedNote(""); setPage("feed");
  };

  const ed = D.editions[edition];
  const idx = D.order.indexOf(edition);
  const prevKey = D.order[idx - 1];
  const visible = ed.items.filter(i => !i.hidden);
  const items = visible
    .filter(i => (category === "all" || i.category === category) && (!query.trim() || `${i.title} ${i.summary}`.toLowerCase().includes(query.trim().toLowerCase())))
    .sort((a, b) => rankOf(a) - rankOf(b));
  const categories = D.categories.map(c => ({ ...c, count: visible.filter(i => i.category === c.key).length }));
  const goTo = date => { setEdition(date); setCalOpen(false); setPage("feed"); };

  const showSavedNav = saves.length > 0 || !!user;
  const savedCount = saves.filter(s => opts.removed === "1" || !isHidden(s)).length;
  const openSaved = () => { setPage("saved"); setMenuOpen(false); };

  const chip = opts.where === "2" && showSavedNav && (
    <button className={"proto-chip" + (page === "saved" ? " proto-chip--on" : "")} aria-current={page === "saved" ? "page" : undefined} onClick={openSaved}>
      <StarGlyph filled /> Saved <span>{savedCount}</span>
    </button>
  );
  const railEntry = opts.where === "1" && (
    <div className="proto-rail-you">
      <div className="sidebar-label">YOURS</div>
      <button className={"category" + (page === "saved" ? " active" : "")} aria-current={page === "saved" || undefined} onClick={openSaved}>
        <span className="proto-rail-saved"><StarGlyph filled />Saved</span><span>{savedCount}</span>
      </button>
    </div>
  );
  const accountSlot = user
    ? <AccountMenu user={user} onSaved={openSaved} onSignOut={signOut} />
    : (opts.signin === "2" || local.length > 0) && <button className="control proto-signin" onClick={signIn}>Sign in</button>;

  const banner = !user && local.length > 0 && !bannerOff && page === "feed" && <SaveBanner onSignIn={signIn} onDismiss={() => setBannerOff(true)} />;

  const render = list => shown === "list"
    ? <RowList>{list.map(item => <ListRow key={item.id} item={item} saved={savedIds.has(item.id)} onToggleSave={toggleSave} topToday={item.top} starPos={starPos} />)}</RowList>
    : <CardGrid>{list.map(item => <Card key={item.id} item={item} saved={savedIds.has(item.id)} onToggleSave={toggleSave} topToday={item.top} signalsPos="row" starPos={starPos} />)}</CardGrid>;

  const feed = mode === "grouped"
    ? D.categories.map(c => {
      const group = items.filter(i => i.category === c.key);
      return group.length ? <section className="app-sec" key={c.key} aria-labelledby={c.key}><SectionHeading name={c.label} count={group.length} id={c.key} />{render(group)}</section> : null;
    })
    : <section className="app-sec" aria-labelledby="items-heading"><h2 className="app-sr" id="items-heading">{items.length} items</h2>{render(items)}</section>;

  const date = (
    <EditionBar dateLabel={ed.mid} onDateClick={() => setCalOpen(o => !o)} calendarOpen={calOpen}
      editions={D.order.slice().reverse().map(k => ({ date: k, label: D.editions[k].mid, count: D.editions[k].items.filter(i => !i.hidden).length }))}
      currentDate={edition} onSelectEdition={goTo} />
  );

  React.useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);

  // The strip banner sticks under the header and sits above the rail, so the
  // rail, drawer and sticky toolbar all start below the header plus the banner.
  const topRef = React.useRef(null);
  const [topH, setTopH] = React.useState(52);
  React.useLayoutEffect(() => {
    const ro = new ResizeObserver(([e]) => setTopH(Math.round(e.target.getBoundingClientRect().height)));
    ro.observe(topRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div className={"app-shell redesign" + (shown === "grid" ? " redesign-grid" : "") + (menuOpen ? " mobile-menu-open" : "")} data-theme={theme} style={{ "--redesign-header": topH + "px" }}>
      <div className="proto-top" ref={topRef}>
      <Header theme={theme} onToggleTheme={() => setTheme(t => t === "light" ? "dark" : "light")} menuOpen={menuOpen} onMenu={() => setMenuOpen(o => !o)} savedChip={chip} account={accountSlot} />
      {opts.banner === "2" && banner}
      </div>
      <Rail categories={categories} count={visible.length} active={page === "saved" ? null : category} open={menuOpen} onClose={() => setMenuOpen(false)}
        onCategory={key => { setCategory(key); setPage("feed"); setMenuOpen(false); }} savedEntry={railEntry} />
      <main id="main" className="redesign-main" tabIndex={-1}>
        <div className="workspace"><section className="feed">
          {page === "saved" ? (
            <div className="app-main">
              <SavedView saves={saves} view={shown} starPos={starPos} onToggleSave={id => toggleSave(id)} removedOpt={opts.removed} mergedNote={mergedNote}
                signedIn={!!user} onSignIn={signIn} onBack={() => setPage("feed")} />
            </div>
          ) : (
            <>
              <h1 className="app-sr">aiBytes_ edition, {ed.label}</h1>
              <div className="toolbar-slot">
                <Toolbar count={`${items.length} items`} query={query} onQuery={setQuery} view={view} onView={narrow ? undefined : setView} mode={mode} onMode={setMode} date={date} />
              </div>
              {opts.banner === "1" && banner && <div className="proto-inline-banner">{banner}</div>}
              <div className="app-main">
                {items.length ? <>{feed}<EndCard dateLabel={ed.short} prevLabel={prevKey ? D.editions[prevKey].short : undefined} onPrev={() => prevKey && goTo(prevKey)} /></>
                  : <div className="ldg-endcard" role="status">No items match “{query}”. <button onClick={() => setQuery("")}>Clear search</button></div>}
              </div>
            </>
          )}
        </section></div>
      </main>
      {sheet && <SignInSheet localCount={local.length} onContinue={finishSignIn} onCancel={() => setSheet(false)} />}
      <ReviewPanel opts={opts} setOpt={(k, v) => setOpts(o => ({ ...o, [k]: v }))} onReset={reset} signedIn={!!user} />
    </div>
  );
}

function isHidden(s) {
  const ed = D.editions[s.edition_date];
  return !!ed?.items.find(i => i.id === s.item_id)?.hidden;
}

createRoot(document.getElementById("root")).render(<Proto />);
