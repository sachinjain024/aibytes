// AIB-76n prototype: the Chrome extension's popup, its onboarding page at
// aibytes.io/extension-onboarding, and the install banner on aibytes.io.
// Built from the real Ledger components (ListRow, GistView, SaveStar, AppHeader,
// Sidebar, Button). The Chrome toolbar, the popup frame, the pin animation and
// the review panel are prototype-local (proto.css). Items and gists are the UI
// kit's invented examples, not real coverage.
import React from "react";
import { createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
import { AppHeader } from "@ds/components/navigation/AppHeader.jsx";
import { Sidebar } from "@ds/components/navigation/Sidebar.jsx";
import { RowList } from "@ds/components/content/Feed.jsx";
import { ListRow } from "@ds/components/content/ListRow.jsx";
import { GistView } from "@ds/components/content/GistView.jsx";
import { SaveStar } from "@ds/components/content/SaveStar.jsx";
import { ItemImage } from "@ds/components/content/ItemImage.jsx";
import { Wordmark } from "@ds/components/brand/Wordmark.jsx";
import { Button } from "@ds/components/forms/Button.jsx";
import { Icon } from "@ds/components/navigation/icons.jsx";
import { SOURCE_NAMES, Signals } from "@ds/components/content/signals.jsx";

const D = window.LEDGER_DATA;
const GISTS = window.LEDGER_GISTS;
const TODAY = D.order[D.order.length - 1];
const ED = D.editions[TODAY];
const RANKED = [...ED.items].sort((a, b) => (a.rank || 99) - (b.rank || 99));
const BY_ID = Object.fromEntries(ED.items.map(i => [i.id, i]));
const USER = { name: "Demo Reader" };

const OPTIONS = {
  saved: {
    label: "Popup: getting to Saved",
    choices: { 1: "Today · Saved tabs", 2: "Star in the header" },
    notes: {
      1: "Two tabs under the header, each with its count. Saved is always one visible click away.",
      2: "A star with the count sits in the header; pressing it swaps the list for Saved. One less row of chrome above the list.",
    },
  },
  row: {
    label: "Popup: the rows",
    choices: { 1: "As on aibytes.io", 2: "Compact, ranked" },
    notes: {
      1: "Ledger's ListRow unchanged, in its narrow layout: title, one-line summary, then source and signals, with the star under the source icon. About 4–5 rows fit without scrolling.",
      2: "Rank number, title and source only, no summary. About 10 rows fit; the order is what the reader sees first.",
    },
  },
  signin: {
    label: "Popup: signed out",
    choices: { 1: "Sign in always shown", 2: "Prompt after the first star" },
    notes: {
      1: "A Sign in link in the header whenever the reader is signed out, as on aibytes.io (B2 in AIB-75v).",
      2: "Nothing until the reader stars something; then a strip at the bottom says the stars live in this browser and offers sign-in.",
    },
  },
  gist: {
    label: "Popup: the gist view",
    choices: { 1: "Actions in the top bar", 2: "Actions pinned at the bottom" },
    notes: {
      1: "← Back, the star and Open on aibytes.io share one bar above the gist.",
      2: "← Back alone at the top; the star and Open on aibytes.io stay in a bar at the bottom while the gist scrolls.",
    },
  },
  flow: {
    label: "Onboarding: the steps",
    choices: { 1: "Both on one page", 2: "One at a time" },
    notes: {
      1: "Two numbered cards on one page. Each ticks itself when done; nothing blocks the other.",
      2: "Step 1 of 2, then step 2 of 2, then done. Each step has Skip.",
    },
  },
  pin: {
    label: "Onboarding: the pin animation",
    choices: { 1: "In the step card", 2: "Plus an arrow to the toolbar" },
    notes: {
      1: "A looping animation of the puzzle icon → Pin action inside the step.",
      2: "The same animation, plus a pointer at the top right of the page aimed at the reader's real puzzle icon until they pin.",
    },
  },
  subscribe: {
    label: "Onboarding: the newsletter box",
    choices: { 1: "Ticked by default", 2: "Unticked by default" },
    notes: {
      1: "More subscribers; the reader has to untick it. Gmail-signup style.",
      2: "Only readers who want the newsletter tick it. Matches \"this step is optional\".",
    },
  },
  banner: {
    label: "aibytes.io: the install banner",
    choices: { 1: "Strip under the header", 2: "A row in the feed", 3: "A box in the sidebar" },
    notes: {
      1: "Full width under the header, like the save banner. Seen on every page; dismissible.",
      2: "A row after the fifth item, in the list's own style. Seen while reading; scrolls away.",
      3: "A small box in the rail above Subscribe. Always there on desktop, never in the reading column.",
    },
  },
};

// Decided 20 Nov 2026: E2, one step at a time. Kept in OPTIONS so the letters stay fixed.
const DECIDED = { flow: "2" };
const DEFAULTS = { ...Object.fromEntries(Object.keys(OPTIONS).map(k => [k, "1"])), ...DECIDED };

// ---------- the Chrome toolbar ----------

function Puzzle() {
  return <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 2.5a1.5 1.5 0 0 1 3 0V4h2.5a.5.5 0 0 1 .5.5V7h-1.5a1.5 1.5 0 0 0 0 3H12v2.5a.5.5 0 0 1-.5.5H9v-1.5a1.5 1.5 0 0 0-3 0V13H3.5a.5.5 0 0 1-.5-.5V10h1.5a1.5 1.5 0 0 0 0-3H3V4.5a.5.5 0 0 1 .5-.5H6z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>;
}
function Pin({ on }) {
  return <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M10 2l4 4-2 1-2.5 2.5L9 13l-6-6 3.5-.5L9 4z M3 13l3-3" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>;
}
/** The extension's toolbar icon. No drawn logo exists (Ledger readme), so the prototype uses the wordmark's ⚡ on an accent tile; the store icon is designed separately. */
function ExtIcon({ size = 20 }) {
  return <span className="proto-exticon" style={{ width: size, height: size, fontSize: size * 0.62 }} aria-hidden="true">⚡</span>;
}

function ChromeBar({ url, pinned, setPinned, popupOpen, setPopupOpen, installed }) {
  const [menu, setMenu] = React.useState(false);
  return (
    <div className="proto-chrome" role="presentation">
      <span className="proto-chrome-nav" aria-hidden="true">← → ↻</span>
      <div className="proto-omni"><span className="proto-lock" aria-hidden="true">⌂</span>{url}</div>
      <div className="proto-chrome-ext">
        {installed && pinned && (
          <button className={"proto-chrome-btn" + (popupOpen ? " is-on" : "")} aria-label="aiBytes_" aria-expanded={popupOpen} onClick={() => { setMenu(false); setPopupOpen(o => !o); }}>
            <ExtIcon size={18} />
          </button>
        )}
        <button className={"proto-chrome-btn proto-puzzle" + (menu ? " is-on" : "")} aria-label="Extensions" aria-expanded={menu} onClick={() => setMenu(m => !m)}><Puzzle /></button>
        <span className="proto-chrome-avatar" aria-hidden="true">D</span>
        {menu && (
          <div className="proto-extmenu">
            <p className="proto-extmenu-h">Extensions</p>
            {installed ? (
              <div className="proto-extmenu-row">
                <button className="proto-extmenu-name" onClick={() => { setMenu(false); setPopupOpen(true); }}><ExtIcon size={16} /> aiBytes_</button>
                <button className={"proto-chrome-btn" + (pinned ? " is-pinned" : "")} aria-pressed={pinned} aria-label={pinned ? "Unpin aiBytes_" : "Pin aiBytes_"} onClick={() => setPinned(!pinned)}><Pin on={pinned} /></button>
              </div>
            ) : <p className="proto-extmenu-none">No extensions installed</p>}
            <p className="proto-extmenu-foot">Manage extensions</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- the popup ----------

/** A Chrome popup is its own 400px-wide document, so Ledger's narrow-viewport
 *  rules apply inside it. An iframe gives the prototype the same: the page's
 *  styles are copied in and the popup is portalled into its body. */
function Frame({ theme, children }) {
  const ref = React.useRef(null);
  const [body, setBody] = React.useState(null);
  React.useEffect(() => {
    const doc = ref.current.contentDocument;
    doc.open(); doc.write("<!doctype html><html><head><meta charset=\"utf-8\"></head><body></body></html>"); doc.close();
    document.querySelectorAll("style, link[rel=stylesheet]").forEach(n => doc.head.appendChild(n.cloneNode(true)));
    setBody(doc.body);
  }, []);
  React.useEffect(() => { if (body) body.parentElement.setAttribute("data-theme", theme); }, [body, theme]);
  return <iframe ref={ref} className="proto-popup-frame" title="aiBytes_ popup">{body && createPortal(children, body)}</iframe>;
}

function CompactRow({ item, n, saved, onToggleSave, onOpen }) {
  return (
    <article className="proto-crow" onClick={e => { if (!e.target.closest(".ldg-star")) onOpen(item); }}>
      <span className="proto-crow-n">{n}</span>
      <ItemImage item={item} size={20} className="source-icon" />
      <div className="proto-crow-body">
        <h3><a href="#open" onClick={e => e.preventDefault()}>{item.title}</a></h3>
        <div className="proto-crow-meta">{SOURCE_NAMES[item.source]} <Signals signals={item.signals} /></div>
      </div>
      <SaveStar saved={saved} onToggle={() => onToggleSave(item.id)} />
    </article>
  );
}

function Popup({ opts, user, saves, toggleSave, onSignIn, onClose }) {
  const [tab, setTab] = React.useState(HASH.tab || "today");
  const [openId, setOpenId] = React.useState(HASH.gistOpen || null);
  const [note, setNote] = React.useState(null);
  const listRef = React.useRef(null);
  const list = tab === "saved" ? RANKED.filter(i => saves.includes(i.id)) : RANKED;
  const gist = openId && GISTS[openId];

  const open = item => {
    if (GISTS[item.id]) { setOpenId(item.id); setNote(null); if (listRef.current) listRef.current.scrollTop = 0; }
    else setNote(`Opens ${SOURCE_NAMES[item.source]} in a new tab: this item has no gist.`);
  };
  // In the prototype every outward link is "#"; say where it would go instead of following it.
  const capture = e => {
    const a = e.target.closest("a[target=_blank]");
    if (!a) return;
    e.preventDefault();
    const row = a.closest(".story");
    const item = row && RANKED.find(i => row.textContent.includes(i.title));
    if (item && a.closest("h3")) open(item);
    else setNote("Opens in a new tab.");
  };

  const star = item => <SaveStar saved={saves.includes(item.id)} onToggle={() => toggleSave(item.id)} />;
  const toSite = <a className="proto-pop-site" href="#site" onClick={e => { e.preventDefault(); setNote("Opens aibytes.io in a new tab."); }}>Open on aibytes.io <Icon name="arrow" /></a>;

  const header = (
    <header className="proto-pop-head">
      <Wordmark variant="compact" />
      <span className="proto-pop-date">{ED.mid}</span>
      <span className="proto-pop-head-r">
        {opts.saved === "2" && (
          <button className={"proto-pop-savedbtn" + (tab === "saved" ? " is-on" : "")} aria-pressed={tab === "saved"} onClick={() => { setTab(t => t === "saved" ? "today" : "saved"); setOpenId(null); }}>
            <Icon name="star" /> <span>{saves.length}</span>
          </button>
        )}
        {user ? <span className="proto-pop-avatar" title={`Signed in as ${user.name}`}>{user.name[0]}</span>
          : opts.signin === "1" && <button className="proto-pop-link" onClick={onSignIn}>Sign in</button>}
      </span>
    </header>
  );

  if (gist) {
    const item = BY_ID[openId];
    return (
      <div className="proto-popup" onClickCapture={e => { const a = e.target.closest(".gist-view a, .gist a"); if (a && a.getAttribute("href") !== "#back") { e.preventDefault(); setNote("Opens in a new tab."); } }}>
        <div className="proto-pop-gistbar">
          <button className="proto-pop-back" onClick={() => { setOpenId(null); setNote(null); }}>← {tab === "saved" ? "Saved" : "Today"}</button>
          {opts.gist === "1" && <span className="proto-pop-gistbar-r">{star(item)}{toSite}</span>}
        </div>
        <div className="proto-pop-scroll proto-pop-gist ldg-prose"><GistView gist={gist} as="panel" /></div>
        {opts.gist === "2" && <div className="proto-pop-foot">{star(item)}<span>{saves.includes(item.id) ? "Saved" : "Save"}</span>{toSite}</div>}
        {note && <p className="proto-pop-note" role="status">{note}</p>}
      </div>
    );
  }

  const showPrompt = !user && opts.signin === "2" && saves.length > 0;
  return (
    <div className="proto-popup">
      {header}
      {opts.saved === "1" && (
        <div className="proto-pop-tabs" role="tablist">
          <button role="tab" aria-selected={tab === "today"} onClick={() => setTab("today")}>Today <span>{RANKED.length}</span></button>
          <button role="tab" aria-selected={tab === "saved"} onClick={() => setTab("saved")}>Saved <span>{saves.length}</span></button>
        </div>
      )}
      <div className="proto-pop-scroll" ref={listRef} onClickCapture={capture}>
        {tab === "saved" && list.length === 0 ? (
          <div className="proto-pop-empty">
            <p className="proto-pop-empty-h">No saved items yet.</p>
            <p>Select the ☆ on any row to save it. Saved items show here and in Saved on aibytes.io{user ? "." : " once you sign in."}</p>
          </div>
        ) : opts.row === "2" ? (
          <div className="proto-crows">{list.map((item, i) => <CompactRow key={item.id} item={item} n={tab === "saved" ? i + 1 : (item.rank || i + 1)} saved={saves.includes(item.id)} onToggleSave={toggleSave} onOpen={open} />)}</div>
        ) : (
          <RowList>{list.map(item => (
            <ListRow key={item.id} item={item} saved={saves.includes(item.id)} onToggleSave={toggleSave} starPos="visual"
              gistHref={GISTS[item.id] ? "#gist" : undefined} onOpenGist={GISTS[item.id] ? open : undefined} />
          ))}</RowList>
        )}
        {tab === "today" && <p className="proto-pop-end">That's the {ED.short} edition. {toSite}</p>}
      </div>
      {showPrompt && (
        <div className="proto-pop-prompt" role="status">
          <Icon name="warning" strokeWidth="1.5" />
          <span>Stars are kept in this browser. <a href="#signin" onClick={e => { e.preventDefault(); onSignIn(); }}>Sign in on aibytes.io</a> to keep them in your account.</span>
        </div>
      )}
      {opts.saved === "1" || <div className="proto-pop-foot proto-pop-foot--quiet">{toSite}</div>}
      {note && <p className="proto-pop-note" role="status">{note}</p>}
    </div>
  );
}

// ---------- the onboarding page ----------

function PinAnimation() {
  const reduce = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [f, setF] = React.useState(reduce ? 4 : 0);
  React.useEffect(() => { if (reduce) return; const t = setInterval(() => setF(x => (x + 1) % 6), 1100); return () => clearInterval(t); }, [reduce]);
  const caption = ["Look at the top right of Chrome", "Select the puzzle icon", "Find aiBytes_ in the list", "Select the pin", "aiBytes_ is in your toolbar", "aiBytes_ is in your toolbar"][f];
  return (
    <figure className="proto-pinanim" aria-label="Animation: select the puzzle icon, then the pin next to aiBytes_">
      <div className="proto-pinanim-bar">
        <span className="proto-pinanim-omni" />
        {f >= 4 && <span className="proto-pinanim-icon is-new"><ExtIcon size={16} /></span>}
        <span className={"proto-pinanim-icon" + (f === 1 ? " is-hover" : "")}><Puzzle /></span>
        <span className="proto-pinanim-av" />
        {f === 1 && <span className="proto-pinanim-cursor" style={{ right: 34 }} />}
        {(f === 2 || f === 3) && (
          <div className="proto-pinanim-menu">
            <span className="proto-pinanim-row"><ExtIcon size={14} /> aiBytes_<span className={"proto-pinanim-pin" + (f === 3 ? " is-hover" : "")}><Pin on={false} /></span></span>
            <span className="proto-pinanim-row proto-pinanim-row--dim"><span className="proto-pinanim-dot" /> Another extension</span>
            {f === 3 && <span className="proto-pinanim-cursor proto-pinanim-cursor--pin" />}
          </div>
        )}
      </div>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

function Tick() {
  return <span className="proto-tick" aria-hidden="true"><svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5.2l2 2L8 3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg></span>;
}

function Onboarding({ opts, pinned, user, onSignIn, subscribed, setSubscribed, installed }) {
  const [step, setStep] = React.useState(1);
  const [skipped, setSkipped] = React.useState({});
  const [box, setBox] = React.useState(opts.subscribe === "1");
  React.useEffect(() => setBox(opts.subscribe === "1"), [opts.subscribe]);
  React.useEffect(() => { if (opts.flow === "2" && pinned && step === 1) { const t = setTimeout(() => setStep(2), 900); return () => clearTimeout(t); } }, [pinned, step, opts.flow]);
  React.useEffect(() => { if (opts.flow === "2" && user && step === 2) { const t = setTimeout(() => setStep(3), 900); return () => clearTimeout(t); } }, [user, step, opts.flow]);

  if (!installed) {
    return (
      <div className="proto-onb">
        <h1 className="proto-onb-h1">aiBytes_ for Chrome</h1>
        <p className="proto-onb-sub">Today's edition, ranked, one click from your toolbar. Star items to read later on aibytes.io.</p>
        <Button variant="primary">Add to Chrome</Button>
        <p className="proto-onb-fine">Free. Reads only aibytes.io.</p>
      </div>
    );
  }

  const signIn = () => { onSignIn(); if (box) setSubscribed(true); };
  const pinCard = (wizard) => (
    <section className={"proto-step" + (pinned ? " is-done" : "")} aria-labelledby="s1">
      <div className="proto-step-head">
        <span className="proto-step-n">{pinned ? <Tick /> : "1"}</span>
        <h2 id="s1">Pin aiBytes_ to your toolbar</h2>
        {wizard && <span className="proto-step-of">Step 1 of 2</span>}
      </div>
      <p>Chrome puts new extensions behind the puzzle icon. Pin aiBytes_ so today's edition is one click away.</p>
      {pinned ? <p className="proto-step-status"><Tick /> Pinned. Select ⚡ in the toolbar any time.</p> : <PinAnimation />}
      {!pinned && <p className="proto-step-wait">This step ticks itself when you pin.{wizard && <> <button className="proto-skip" onClick={() => { setSkipped(s => ({ ...s, 1: true })); setStep(2); }}>Skip</button></>}</p>}
    </section>
  );
  const signCard = (wizard) => (
    <section className={"proto-step" + (user ? " is-done" : "")} aria-labelledby="s2">
      <div className="proto-step-head">
        <span className="proto-step-n">{user ? <Tick /> : "2"}</span>
        <h2 id="s2">Sign in to save &amp; bookmark items <span className="proto-step-opt">Optional</span></h2>
        {wizard && <span className="proto-step-of">Step 2 of 2</span>}
      </div>
      <p>Items you bookmark will be stored in your account and can help you access them across devices.</p>
      <p>Without signing in, any saved items are only stored in the browser's local storage.</p>
      {user ? (
        <>
          <p className="proto-step-status"><Tick /> Signed in as {user.name}. The extension is signed in too.</p>
          {subscribed && <p className="proto-step-status"><Tick /> Subscribed to aiBytes_ weekly.</p>}
        </>
      ) : (
        <>
          <div className="proto-signin">
            <Button variant="google" onClick={signIn}>Sign in with Google</Button>
            <label className="proto-check"><input type="checkbox" checked={box} onChange={e => setBox(e.target.checked)} /> Also subscribe me to the weekly newsletter</label>
            <button className="proto-skip" onClick={() => { setSkipped(s => ({ ...s, 2: true })); if (wizard) setStep(3); }}>{skipped[2] ? "Skipped" : "Skip for now"}</button>
          </div>
        </>
      )}
    </section>
  );
  const done = (
    <section className="proto-step proto-step--done">
      <h2>You're set.</h2>
      <p>Select <ExtIcon size={16} /> in the toolbar to open today's edition. {user ? "Your stars sync to your account." : "You can sign in later from the popup."}</p>
      <a className="ldg-btn ldg-btn--secondary" href="#feed" onClick={e => e.preventDefault()}>Read today's edition on aibytes.io</a>
    </section>
  );

  return (
    <div className="proto-onb">
      <h1 className="proto-onb-h1">aiBytes_ extension is successfully installed.</h1>
      <p className="proto-onb-sub">Let's get started with a couple of quick steps to help you get the most out of it.</p>
      {opts.flow === "1" ? (
        <>{pinCard(false)}{signCard(false)}{(pinned || skipped[1]) && (user || skipped[2]) && done}</>
      ) : (
        step === 1 ? pinCard(true) : step === 2 ? signCard(true) : done
      )}
    </div>
  );
}

// ---------- the install banner on aibytes.io ----------

function InstallStrip({ onDismiss }) {
  return (
    <div className="ldg-banner proto-install-strip" role="region" aria-label="Chrome extension">
      <div className="ldg-banner__in">
        <span className="ldg-banner__msg"><ExtIcon size={18} /><span>Read the daily edition from your toolbar. <strong>aiBytes_ for Chrome</strong> is free.</span>
          <a className="ldg-btn ldg-btn--primary proto-install-btn" href="#install" onClick={e => e.preventDefault()}>Add to Chrome</a></span>
        <button type="button" className="ldg-iconbtn ldg-banner__dismiss" aria-label="Dismiss" onClick={onDismiss}>
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5"/></svg>
        </button>
      </div>
    </div>
  );
}
function InstallRow({ onDismiss }) {
  return (
    <article className="story proto-install-row">
      <div className="story-visual"><ExtIcon size={28} /></div>
      <div className="story-content">
        <div className="story-top"><h3>aiBytes_ for Chrome</h3></div>
        <p className="summary">Today's edition, ranked, one click from your toolbar. Stars sync with Saved here.</p>
        <div className="metadata proto-install-acts"><a className="ldg-btn ldg-btn--primary" href="#install" onClick={e => e.preventDefault()}>Add to Chrome</a><button className="proto-skip" onClick={onDismiss}>Not now</button></div>
      </div>
    </article>
  );
}
function InstallBox({ onDismiss }) {
  return (
    <div className="proto-install-box">
      <p className="proto-install-box-h"><ExtIcon size={16} /> aiBytes_ for Chrome</p>
      <p>Today's edition from your toolbar.</p>
      <a className="ldg-btn ldg-btn--primary" href="#install" onClick={e => e.preventDefault()}>Add to Chrome</a>
      <button className="proto-skip" onClick={onDismiss}>Not now</button>
    </div>
  );
}

function Site({ opts, theme, setTheme, user, setUser, saves, toggleSave, installed }) {
  const [dismissed, setDismissed] = React.useState(false);
  React.useEffect(() => setDismissed(false), [opts.banner, installed]);
  const show = !installed && !dismissed;
  const cats = D.categories.map(c => ({ ...c, count: ED.items.filter(i => i.category === c.key).length }));
  const links = D.links.map(l => l.label.startsWith("Chrome") ? { label: "Chrome Extension", href: "#store" } : l);
  return (
    <div className="app-shell redesign" data-theme={theme}>
      <AppHeader theme={theme} onToggleTheme={() => setTheme(t => t === "light" ? "dark" : "light")} githubUrl={D.githubUrl}
        onSignIn={() => setUser(USER)} user={user || undefined} onSignOut={() => setUser(null)} />
      {show && opts.banner === "1" && <InstallStrip onDismiss={() => setDismissed(true)} />}
      <Sidebar categories={cats} count={ED.items.length} active="all" links={links} subscribeUrl={D.subscribeUrl} onSaved={() => {}} savedCount={saves.length} />
      {show && opts.banner === "3" && <div className="proto-install-box-slot"><InstallBox onDismiss={() => setDismissed(true)} /></div>}
      <main className="redesign-main"><div className="workspace"><section className="feed"><div className="app-main">
        <h1 className="proto-site-h1">{ED.label}</h1>
        <RowList>{RANKED.flatMap((item, i) => {
          const row = <ListRow key={item.id} item={item} saved={saves.includes(item.id)} onToggleSave={toggleSave} starPos="visual" />;
          return i === 4 && show && opts.banner === "2" ? [row, <InstallRow key="install" onDismiss={() => setDismissed(true)} />] : [row];
        })}</RowList>
      </div></section></div></main>
    </div>
  );
}

// ---------- the prototype ----------

// The hash sets the starting state, so one option can be linked to:
// #view=onboarding&flow=2&theme=light&pinned=0&user=1&gistOpen=ph-chatcut
const HASH = Object.fromEntries(new URLSearchParams(location.hash.slice(1)));

function Proto() {
  const [opts, setOpts] = React.useState(() => ({ ...DEFAULTS, ...Object.fromEntries(Object.keys(OPTIONS).filter(k => HASH[k]).map(k => [k, HASH[k]])), ...DECIDED }));
  const [view, setView] = React.useState(HASH.view || "popup");
  const [theme, setTheme] = React.useState(() => HASH.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  const [user, setUser] = React.useState(HASH.user === "1" ? USER : null);
  const [saves, setSaves] = React.useState(HASH.saves === "0" ? [] : ["gh-officecli"]);
  const [pinned, setPinned] = React.useState(HASH.pinned ? HASH.pinned === "1" : (HASH.view || "popup") !== "onboarding");
  const [installed, setInstalled] = React.useState(HASH.installed ? HASH.installed === "1" : HASH.view !== "site");
  const [subscribed, setSubscribed] = React.useState(false);
  const [popupOpen, setPopupOpen] = React.useState((HASH.view || "popup") === "popup");
  const toggleSave = id => setSaves(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const go = v => {
    setView(v);
    if (v === "popup") { setInstalled(true); setPinned(true); setPopupOpen(true); }
    if (v === "onboarding") { setInstalled(true); setPinned(false); setPopupOpen(false); }
    if (v === "site") { setPopupOpen(false); setInstalled(false); }
  };
  // Sign in from the popup: the real extension opens aibytes.io in a tab; here it goes to the onboarding page's step.
  const signInFromPopup = () => { setPopupOpen(false); setView("onboarding"); };
  const url = view === "onboarding" ? "aibytes.io/extension-onboarding" : view === "site" ? "aibytes.io" : "news.ycombinator.com";

  return (
    <div className="proto-root" data-theme={theme}>
      <ChromeBar url={url} pinned={pinned} setPinned={setPinned} popupOpen={popupOpen} setPopupOpen={setPopupOpen} installed={installed} />
      {view === "onboarding" && opts.pin === "2" && installed && !pinned && (
        <div className="proto-pointer" aria-hidden="true"><span>Pin aiBytes_ here</span><span className="proto-pointer-arrow">↗</span></div>
      )}
      <div className="proto-frame">
        <div className="proto-scroll">
          {view === "popup" && <div className="proto-elsewhere"><p>Any website. The popup opens over whatever tab the reader is on.</p>{Array.from({ length: 9 }, (_, i) => <span key={i} className="proto-ghostline" style={{ width: `${60 + (i * 13) % 35}%` }} />)}</div>}
          {view === "onboarding" && (
            <div className="app-shell redesign proto-onb-shell" data-theme={theme}>
              <AppHeader theme={theme} onToggleTheme={() => setTheme(t => t === "light" ? "dark" : "light")} githubUrl={D.githubUrl}
                onSignIn={() => setUser(USER)} user={user || undefined} onSignOut={() => setUser(null)} />
              <Onboarding key={opts.flow} opts={opts} pinned={pinned} user={user} onSignIn={() => setUser(USER)} subscribed={subscribed} setSubscribed={setSubscribed} installed={installed} />
            </div>
          )}
          {view === "site" && <Site opts={opts} theme={theme} setTheme={setTheme} user={user} setUser={setUser} saves={saves} toggleSave={toggleSave} installed={installed} />}
        </div>
      </div>
      {installed && popupOpen && (
        <div className="proto-popup-anchor">
          <Frame theme={theme}>
            <Popup opts={opts} user={user} saves={saves} toggleSave={toggleSave} onSignIn={signInFromPopup} onClose={() => setPopupOpen(false)} />
          </Frame>
        </div>
      )}
      <ReviewPanel opts={opts} setOpt={(k, v) => setOpts(o => ({ ...o, [k]: v }))} view={view} go={go}
        user={user} setUser={setUser} installed={installed} setInstalled={v => { setInstalled(v); if (!v) setPopupOpen(false); }}
        pinned={pinned} setPinned={setPinned} theme={theme} setTheme={setTheme} />
    </div>
  );
}

const GROUPS = { popup: ["saved", "row", "signin", "gist"], onboarding: ["pin", "subscribe"], site: ["banner"] };

function ReviewPanel({ opts, setOpt, view, go, user, setUser, installed, setInstalled, pinned, setPinned, theme, setTheme }) {
  const [open, setOpen] = React.useState(() => HASH.panel !== "0" && innerWidth > 900);
  const keys = Object.keys(OPTIONS);
  return (
    <aside className={"proto-review" + (open ? "" : " proto-review--closed") + (view === "site" ? " proto-review--right" : "")} aria-label="Prototype options">
      <button className="proto-review-toggle" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <span>AIB-76n options</span><span aria-hidden="true">{open ? "–" : "+"}</span>
      </button>
      {open && (
        <div className="proto-review-body">
          <fieldset>
            <legend>Show</legend>
            <div className="proto-seg">
              {[["popup", "Popup"], ["onboarding", "Onboarding"], ["site", "aibytes.io banner"]].map(([k, l]) =>
                <button key={k} aria-pressed={view === k} onClick={() => go(k)}>{l}</button>)}
            </div>
          </fieldset>
          {GROUPS[view].map(key => {
            const o = OPTIONS[key], letter = String.fromCharCode(65 + keys.indexOf(key));
            return (
              <fieldset key={key}>
                <legend><span className="proto-q">{letter}</span>{o.label}</legend>
                <div className="proto-seg">
                  {Object.entries(o.choices).map(([n, label]) => (
                    <button key={n} aria-pressed={opts[key] === n} onClick={() => setOpt(key, n)}>{letter}{n} · {label}</button>
                  ))}
                </div>
                {o.notes && <p className="proto-note">{o.notes[opts[key]]}</p>}
              </fieldset>
            );
          })}
          <div className="proto-review-foot">
            <span>{user ? "Signed in" : "Signed out"}</span>
            <button className="ldg-btn ldg-btn--ghost" onClick={() => setUser(user ? null : USER)}>{user ? "Sign out" : "Sign in"}</button>
          </div>
          <div className="proto-review-foot">
            <span>Extension {installed ? (pinned ? "pinned" : "installed") : "not installed"}</span>
            {installed && <button className="ldg-btn ldg-btn--ghost" onClick={() => setPinned(!pinned)}>{pinned ? "Unpin" : "Pin"}</button>}
            <button className="ldg-btn ldg-btn--ghost" onClick={() => setInstalled(!installed)}>{installed ? "Uninstall" : "Install"}</button>
          </div>
          <div className="proto-review-foot">
            <span>Theme</span>
            <button className="ldg-btn ldg-btn--ghost" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>{theme === "light" ? "Dark" : "Light"}</button>
          </div>
        </div>
      )}
    </aside>
  );
}

createRoot(document.getElementById("root")).render(<Proto />);
