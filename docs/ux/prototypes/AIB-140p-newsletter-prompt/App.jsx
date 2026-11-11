// AIB-140p prototype: offering the weekly newsletter around a reader's Google
// sign-in, asked either before the Google popup (pre-signup) or after it
// (post-signup). Built from the real Ledger components; only the dialog, the
// prompt card and the review panel are prototype-local (proto.css).
import React from "react";
import { createRoot } from "react-dom/client";
import { AppHeader } from "@ds/components/navigation/AppHeader.jsx";
import { Sidebar } from "@ds/components/navigation/Sidebar.jsx";
import { Toolbar } from "@ds/components/navigation/Toolbar.jsx";
import { EditionBar } from "@ds/components/navigation/EditionBar.jsx";
import { CardGrid } from "@ds/components/content/Feed.jsx";
import { Card } from "@ds/components/content/Card.jsx";
import { SectionHeading } from "@ds/components/content/SectionHeading.jsx";
import { EndCard } from "@ds/components/content/EndCard.jsx";
import { SaveBanner } from "@ds/components/content/SaveBanner.jsx";
import { Button } from "@ds/components/forms/Button.jsx";

const D = window.LEDGER_DATA;
const rankOf = item => item.rank || 99;
const USER = { name: "Demo Reader", email: "demo.reader@gmail.com" };
const SEED_LOCAL = ["gh-officecli", "hn-claudecode"];
const TODAY = D.order[D.order.length - 1];

const OPTIONS = {
  when: {
    label: "When the newsletter is offered",
    choices: { 1: "Pre-signup", 2: "Post-signup" },
    notes: {
      1: "Asked on every Sign in click, before Google. The app cannot yet tell a new reader from a returning one, or from someone already subscribed.",
      2: "Asked once, after Google returns, and only when the account is new. The Google email is known, so one click subscribes it.",
    },
  },
  pre: {
    label: "Pre-signup form", only: "1",
    choices: { 1: "Tick box in the sign-in dialog", 2: "Ask first, two buttons" },
  },
  post: {
    label: "Post-signup form", only: "2",
    choices: { 1: "Dialog", 2: "Card under the avatar" },
  },
  copy: {
    label: "Copy",
    choices: { 1: "Short", 2: "Full pitch" },
  },
};

const PITCH = {
  1: "One email a week.",
  2: "Get the best of AI in your inbox every Monday. We cover the best developer tools, the most engaging topics from X and Hacker News, and the latest AI news.",
};
const COVERS = ["New AI tools", "AI threads on HN", "Trending AI projects", "Latest AI news", "Official announcements", "Viral posts on X"];
const PROOF = "Read by 2,000+ developers at companies like Amazon, Google, OpenAI, Nvidia and Stripe.";

// The closing line of the picked prompt (D2): a heart, the line, and the YC mark
// drawn like Ledger's Hacker News tile.
const BuiltBy = () => (
  <p className="proto-builtby">
    <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path d="M8 13.6 2.3 8.1a3.3 3.3 0 0 1 4.6-4.7L8 4.5l1.1-1.1a3.3 3.3 0 0 1 4.6 4.7Z" fill="currentColor" /></svg>
    <span>Built by a former YC founder</span>
    <svg className="proto-yc" viewBox="0 0 16 16" width="16" height="16" role="img" aria-label="Y Combinator"><rect width="16" height="16" rx="3" /><path d="M4.6 4 8 9v3.4M11.4 4 8 9" fill="none" strokeWidth="1.5" /></svg>
  </p>
);

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

const mergedLine = n => !n ? "" : n === 1
  ? "1 save from this browser was added to your account."
  : `${n} saves from this browser were added to your account.`;

const Close = ({ onClick }) => (
  <button type="button" className="ldg-iconbtn proto-x" aria-label="Close" onClick={onClick}>
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" /></svg>
  </button>
);

// What Ledger's Dialog would be: modal, Tab stays inside, Escape closes, focus
// goes back to the control that opened it.
function Dialog({ labelledBy, onClose, children, kicker }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const opener = document.activeElement;
    const nodes = () => [...ref.current.querySelectorAll("button,a[href],input")];
    (ref.current.querySelector("[data-autofocus]") || nodes()[0])?.focus();
    const key = e => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab") return;
      const list = nodes(), first = list[0], last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("keydown", key); if (opener?.isConnected) opener.focus(); };
  }, []);
  return (
    <div className="proto-scrim" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className={"proto-dialog" + (kicker ? " proto-dialog--standin" : "")} role="dialog" aria-modal="true" aria-labelledby={labelledBy} ref={ref}>
        {kicker && <p className="proto-kicker">{kicker}</p>}
        {children}
      </div>
    </div>
  );
}

// Pre-signup, form 1: the sign-in dialog carries a tick box, off by default.
function PreTick({ copy, onGoogle, onClose }) {
  const [want, setWant] = React.useState(false);
  return (
    <Dialog labelledBy="pre-h" onClose={onClose}>
      <Close onClick={onClose} />
      <h2 id="pre-h">Sign in to aiBytes_</h2>
      <p>Keep your saved items across devices.</p>
      <label className="proto-check" htmlFor="pre-want">
        <input type="checkbox" id="pre-want" checked={want} onChange={e => setWant(e.target.checked)} />
        <span><b>Also send me aiBytes_ every Monday</b><span>{PITCH[copy]}</span></span>
      </label>
      <div className="proto-actions">
        <Button variant="google" data-autofocus onClick={() => onGoogle(want)}>Continue with Google</Button>
      </div>
    </Dialog>
  );
}

// Pre-signup, form 2: the question comes first, and both answers go on to Google.
function PreAsk({ copy, onGoogle, onClose }) {
  return (
    <Dialog labelledBy="pre-h" onClose={onClose}>
      <Close onClick={onClose} />
      <h2 id="pre-h">Get aiBytes_ every Monday?</h2>
      <p>{PITCH[copy]}</p>
      <div className="proto-actions">
        <Button variant="secondary" onClick={() => onGoogle(false)}>Just sign in</Button>
        <Button variant="primary" data-autofocus onClick={() => onGoogle(true)}>Subscribe and sign in</Button>
      </div>
    </Dialog>
  );
}

function PromptBody({ id, copy, onSubscribe, onNotNow }) {
  // The pick (D2): one action. The × and Escape still close it.
  if (copy === "2") return (
    <>
      <h2 id={id} className="proto-signed">
        <svg className="proto-tick" viewBox="0 0 48 48" width="22" height="22" aria-hidden="true"><circle cx="24" cy="24" r="23" /><path d="M14.5 24.5 21 31l12.5-13.5" fill="none" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        <span>You're successfully signed in.</span>
      </h2>
      <p className="proto-lead">Get the best of AI in your inbox every Monday</p>
      <ul className="proto-covers">{COVERS.map(c => <li key={c}>{c}</li>)}</ul>
      <div className="proto-actions proto-actions--one">
        <Button variant="primary" data-autofocus onClick={onSubscribe}>Subscribe</Button>
      </div>
      <p className="proto-proof">{PROOF}</p>
      <BuiltBy />
    </>
  );
  return (
    <>
      <h2 id={id}>You're signed in. Get aiBytes_ every Monday?</h2>
      <p>{PITCH[copy]}</p>
      <div className="proto-actions">
        <Button variant="secondary" onClick={onNotNow}>Not now</Button>
        <Button variant="primary" data-autofocus onClick={onSubscribe}>Subscribe</Button>
      </div>
    </>
  );
}

// Post-signup, form 2: not modal, hangs under the
// avatar, and the feed behind it stays usable.
function PromptCard(props) {
  return (
    <div className="proto-card" role="region" aria-labelledby="card-h">
      <Close onClick={props.onNotNow} />
      <PromptBody id="card-h" {...props} />
    </div>
  );
}

// After Subscribe: the email is saved, the dialog says so, counts 3, 2, 1 and closes itself.
function Thanks({ email, onClose }) {
  const [left, setLeft] = React.useState(3);
  React.useEffect(() => {
    if (left === 0) { onClose(); return; }
    const t = setTimeout(() => setLeft(n => n - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  return (
    <Dialog labelledBy="thanks-h" onClose={onClose}>
      <Close onClick={onClose} />
      <div className="proto-thanks" role="status">
        <svg className="proto-tick" viewBox="0 0 48 48" width="48" height="48" aria-hidden="true"><circle cx="24" cy="24" r="23" /><path d="M14.5 24.5 21 31l12.5-13.5" fill="none" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        <h2 id="thanks-h">Thank you for subscribing.</h2>
        <p>aiBytes_ arrives every Monday at <b>{email}</b>.</p>
      </div>
      <p className="proto-closing" aria-hidden="true">Closing in <b>{left || 1}</b></p>
    </Dialog>
  );
}

function Proto() {
  const [theme, setTheme] = React.useState(() => document.documentElement.dataset.theme
    || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  const [mode, setMode] = React.useState("ranked");
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState("all");
  const [edition, setEdition] = React.useState(TODAY);
  const [calOpen, setCalOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [page, setPage] = React.useState("feed");
  const [opts, setOpts] = React.useState({ when: "2", pre: "1", post: "1", copy: "2" });
  const [isNew, setIsNew] = React.useState(true);
  const [local, setLocal] = React.useState(SEED_LOCAL);
  const [account, setAccount] = React.useState([]);
  const [user, setUser] = React.useState(null);
  const [merged, setMerged] = React.useState("");
  // step: null | "pre" | "google" | "prompt" | "thanks"
  const [step, setStep] = React.useState(null);
  const [wants, setWants] = React.useState(false);
  const [log, setLog] = React.useState([]);
  const note = text => setLog(l => [...l, text]);

  const narrow = useNarrow();
  const saves = user ? account : local;
  const toggleSave = id => (user ? setAccount : setLocal)(l => l.includes(id) ? l.filter(x => x !== id) : [id, ...l]);

  React.useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);

  const signIn = () => {
    setLog(["Reader selects Sign in"]);
    if (opts.when === "1") { setStep("pre"); note("Newsletter question, before Google"); }
    else setStep("google");
  };
  const toGoogle = want => { setWants(want); note(want ? "Reader asks for the newsletter" : "Reader does not ask for it"); setStep("google"); };
  const finishSignIn = () => {
    const added = local.filter(id => !account.includes(id));
    setAccount([...added, ...account]);
    setMerged(mergedLine(added.length));
    setLocal([]);
    setUser(USER);
    note("Google popup, then back on the same page");
    if (opts.when === "1") {
      if (wants) { setStep("thanks"); note("Email saved to the database; thank-you closes itself after 3 seconds"); }
      else setStep(null);
    } else if (isNew) { setStep("prompt"); note("New account: newsletter question"); }
    else { setStep(null); note("Returning account: no question"); }
  };
  const subscribe = () => { setStep("thanks"); note("Email saved to the database; thank-you closes itself after 3 seconds"); };
  const reset = () => {
    setUser(null); setLocal(SEED_LOCAL); setAccount([]); setMerged(""); setStep(null); setWants(false); setLog([]); setPage("feed");
  };
  const setOpt = (k, v) => { setOpts(o => ({ ...o, [k]: v })); reset(); };

  const ed = D.editions[edition];
  const prevKey = D.order[D.order.indexOf(edition) - 1];
  const items = ed.items
    .filter(i => (category === "all" || i.category === category) && (!query.trim() || `${i.title} ${i.summary}`.toLowerCase().includes(query.trim().toLowerCase())))
    .sort((a, b) => rankOf(a) - rankOf(b));
  const categories = D.categories.map(c => ({ ...c, count: ed.items.filter(i => i.category === c.key).length }));
  const goTo = date => { setEdition(date); setCalOpen(false); setPage("feed"); };
  const openSaved = () => { setPage("saved"); setMenuOpen(false); };
  const card = item => <Card key={item.id} item={item} saved={saves.includes(item.id)} onToggleSave={() => toggleSave(item.id)} topToday={item.top} starPos="visual" />;

  const savedGroups = D.order.slice().reverse()
    .map(k => ({ key: k, ed: D.editions[k], list: D.editions[k].items.filter(i => saves.includes(i.id)).sort((a, b) => rankOf(a) - rankOf(b)) }))
    .filter(g => g.list.length);

  const date = (
    <EditionBar dateLabel={ed.mid} onDateClick={() => setCalOpen(o => !o)} calendarOpen={calOpen}
      editions={D.order.slice().reverse().map(k => ({ date: k, label: D.editions[k].mid, count: D.editions[k].items.length }))}
      currentDate={edition} onSelectEdition={goTo} />
  );

  const promptProps = { copy: opts.copy, onSubscribe: subscribe, onNotNow: () => { setStep(null); note("Reader chooses Not now"); } };
  const asCard = step === "prompt" && opts.post === "2";

  return (
    <div className={"app-shell redesign redesign-grid" + (menuOpen ? " mobile-menu-open" : "")} data-theme={theme}
      onClickCapture={e => { if (e.target.closest("a.brand")) { e.preventDefault(); setPage("feed"); } }}>
      <AppHeader theme={theme} onToggleTheme={() => setTheme(t => t === "light" ? "dark" : "light")} menuOpen={menuOpen} onMenu={() => setMenuOpen(o => !o)} githubUrl={D.githubUrl}
        onSignIn={signIn} user={user || undefined} onSignOut={reset} onSaved={openSaved} />
      {!user && local.length > 0 && <SaveBanner sticky onSignIn={signIn} />}
      <Sidebar categories={categories} count={ed.items.length} active={category} open={menuOpen} onClose={() => setMenuOpen(false)}
        onCategory={key => { setCategory(key); setPage("feed"); setMenuOpen(false); }}
        links={D.links} subscribeUrl={D.subscribeUrl} onSaved={openSaved} savedCount={saves.length} savedActive={page === "saved"} />
      <main id="main" className="redesign-main" tabIndex={-1}>
        <div className="workspace"><section className="feed">
          {page === "saved" ? (
            <div className="app-main proto-saved">
              <div className="proto-saved-head">
                <h1 className="proto-saved-h">Saved <span>{saves.length}</span></h1>
                <p className="proto-saved-sub">{user ? "Synced to your Google account." : "Stored in this browser only. Sign in with Google to keep them across devices."}</p>
                {merged && <p className="proto-merged" role="status">{merged}</p>}
              </div>
              {savedGroups.map(g => (
                <section className="app-sec" key={g.key} aria-labelledby={"saved-" + g.key}>
                  <SectionHeading name={g.ed.mid} count={g.list.length} id={"saved-" + g.key} />
                  <CardGrid>{g.list.map(card)}</CardGrid>
                </section>
              ))}
            </div>
          ) : (
            <>
              <h1 className="app-sr">aiBytes_ edition, {ed.label}</h1>
              <div className="toolbar-slot">
                <Toolbar count={`${items.length} items`} query={query} onQuery={setQuery} mode={mode} onMode={setMode} date={date} />
              </div>
              <div className="app-main">
                {mode === "grouped"
                  ? D.categories.map(c => {
                    const group = items.filter(i => i.category === c.key);
                    return group.length ? <section className="app-sec" key={c.key} aria-labelledby={c.key}><SectionHeading name={c.label} count={group.length} id={c.key} /><CardGrid>{group.map(card)}</CardGrid></section> : null;
                  })
                  : <section className="app-sec" aria-labelledby="items-heading"><h2 className="app-sr" id="items-heading">{items.length} items</h2><CardGrid>{items.map(card)}</CardGrid></section>}
                <EndCard dateLabel={ed.short} prevLabel={prevKey ? D.editions[prevKey].short : undefined} onPrev={() => prevKey && goTo(prevKey)} />
              </div>
            </>
          )}
        </section></div>
      </main>

      {step === "pre" && (opts.pre === "1"
        ? <PreTick copy={opts.copy} onGoogle={toGoogle} onClose={() => setStep(null)} />
        : <PreAsk copy={opts.copy} onGoogle={toGoogle} onClose={() => setStep(null)} />)}

      {step === "google" && (
        <Dialog labelledBy="g-h" kicker="Prototype stand-in" onClose={() => setStep(null)}>
          <h2 id="g-h">Google account picker</h2>
          <p>In the app, Firebase opens Google's own sign-in popup here. The reader picks an account and comes back to the page they were on.</p>
          <div className="proto-actions">
            <Button variant="secondary" onClick={() => setStep(null)}>Cancel</Button>
            <Button variant="primary" data-autofocus onClick={finishSignIn}>Continue as {USER.name}</Button>
          </div>
        </Dialog>
      )}

      {step === "prompt" && !asCard && (
        <Dialog labelledBy="post-h" onClose={promptProps.onNotNow}>
          <Close onClick={promptProps.onNotNow} />
          <PromptBody id="post-h" {...promptProps} />
        </Dialog>
      )}
      {asCard && <PromptCard {...promptProps} />}

      {step === "thanks" && <Thanks email={USER.email} onClose={() => setStep(null)} />}

      <ReviewPanel opts={opts} setOpt={setOpt} isNew={isNew} setIsNew={v => { setIsNew(v); reset(); }} user={user} log={log} onReset={reset} startOpen={!narrow} />
    </div>
  );
}

function ReviewPanel({ opts, setOpt, isNew, setIsNew, user, log, onReset, startOpen }) {
  const [open, setOpen] = React.useState(startOpen);
  const keys = Object.keys(OPTIONS);
  return (
    <aside className={"proto-review" + (open ? "" : " proto-review--closed")} aria-label="Prototype options">
      <button className="proto-review-toggle" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <span>AIB-140p options</span><span aria-hidden="true">{open ? "–" : "+"}</span>
      </button>
      {open && (
        <div className="proto-review-body">
          {keys.map((key, i) => {
            const o = OPTIONS[key], letter = String.fromCharCode(65 + i), off = o.only && o.only !== opts.when;
            return (
              <fieldset key={key} disabled={off}>
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
          <fieldset>
            <legend>Google account in this run</legend>
            <div className="proto-seg">
              <button aria-pressed={isNew} onClick={() => setIsNew(true)}>New to aiBytes_</button>
              <button aria-pressed={!isNew} onClick={() => setIsNew(false)}>Returning</button>
            </div>
          </fieldset>
          <div className="proto-trace">
            <b>{log.length ? "This run" : "Select Sign in in the header to start"}</b>
            {log.length > 0 && <ol>{log.map((l, i) => <li key={i}>{l}</li>)}</ol>}
          </div>
          <div className="proto-review-foot">
            <span>{user ? "Signed in" : "Signed out"}</span>
            <button className="ldg-btn ldg-btn--ghost" onClick={onReset}>Sign out and reset</button>
          </div>
        </div>
      )}
    </aside>
  );
}

createRoot(document.getElementById("root")).render(<Proto />);
