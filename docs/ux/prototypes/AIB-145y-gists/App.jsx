// AIB-145y prototype: the gist, as a panel beside the feed and as its own page,
// plus the newsletter row that links to it. Built from the real Ledger
// components; the gist view, the panel, the reaction bar and the review panel
// are prototype-local (proto.css). Items and gist copy are the UI kit's
// invented examples, not real coverage.
import React from "react";
import { createRoot } from "react-dom/client";
import { AppHeader } from "@ds/components/navigation/AppHeader.jsx";
import { Sidebar } from "@ds/components/navigation/Sidebar.jsx";
import { Toolbar } from "@ds/components/navigation/Toolbar.jsx";
import { EditionBar } from "@ds/components/navigation/EditionBar.jsx";
import { CardGrid, RowList } from "@ds/components/content/Feed.jsx";
import { ListRow } from "@ds/components/content/ListRow.jsx";
import { Card } from "@ds/components/content/Card.jsx";
import { ItemImage } from "@ds/components/content/ItemImage.jsx";
import { SaveStar } from "@ds/components/content/SaveStar.jsx";
import { Icon } from "@ds/components/navigation/icons.jsx";
import { EndCard } from "@ds/components/content/EndCard.jsx";
import { SOURCE_NAMES, fmtNum } from "@ds/components/content/signals.jsx";
import { Button } from "@ds/components/forms/Button.jsx";

const D = window.LEDGER_DATA;
const rankOf = item => item.rank || 99;
const USER = { name: "Demo Reader", email: "demo.reader@gmail.com" };
const TODAY = D.order[D.order.length - 1];

const OPTIONS = {
  panel: {
    label: "The panel on a wide screen",
    choices: { 1: "Beside the feed", 2: "Over the feed" },
    notes: {
      1: "The feed narrows and stays usable, so a reader can click through cards with the panel open.",
      2: "The panel slides over a dimmed feed. More room for the gist; the feed waits until it closes.",
    },
  },
  card: {
    label: "The source name on a card",
    choices: { 1: "Opens the gist too", 2: "Still opens the source" },
    notes: {
      1: "Every click on a card lands on the gist. The source is one click further, inside the gist.",
      2: "The title opens the gist; the small source name (Hacker News, GitHub) keeps going straight to the source.",
    },
  },
  stats: {
    label: "Stats",
    choices: { 1: "One line", 2: "A grid" },
  },
  actions: {
    label: "Star and reactions",
    choices: { 1: "Under the title", 2: "At the end", 3: "Pinned at the bottom" },
    notes: {
      1: "Seen first, before the reader has read anything.",
      2: "Seen after reading, where a reaction is an answer to the gist.",
      3: "Always in view while the gist scrolls.",
    },
  },
  page: {
    label: "The gist page",
    choices: { 1: "In the app shell", 2: "A reading page" },
    notes: {
      1: "Header and sidebar as on every page; the gist sits where the feed would be.",
      2: "Header only and one narrow column, then more from the same edition. Built for a visitor arriving from search or a post.",
    },
  },
  mail: {
    label: "The newsletter row",
    choices: { 1: "Title to the gist only", 2: "Gist, plus a source link" },
  },
};

const REACTIONS = ["👍", "👎", "😄", "🎉", "😕", "❤️", "🚀", "👀"];
// The buttons that close a gist, in place of a References list. First is primary.
const END_CTAS = {
  producthunt: ["Visit the product", "View on Product Hunt"],
  hackernews: ["Open the linked page", "View on Hacker News"],
  "hn-tinyeval": ["View on GitHub", "View on Hacker News"],
  "ph-chatcut": ["Visit chatcut.io", "View on Product Hunt"],
};
const SOURCE_ACTION = { producthunt: "View the launch", hackernews: "Open the thread", github: "View on GitHub", techcrunch: "Read on TechCrunch", x: "Open the post on X" };
const NAMES = { ...SOURCE_NAMES, x: "X" };
// Stats move after the run reads them, so every set carries when it was read
// (the gist file's stats_as_of).
// HN stories a fetch has seen on the front page. A badge on the card and in the
// gist, in the family of the TOP marker; not a stat.
const FRONT = ["hn-tinyeval", "hn-claudecode", "hn-localgood"];
const AS_OF = "As of Aug 27, 2026, 1:34 PM IST";

// Four written gists, one per type, and one X post preview. Every other item
// falls back to a `brief` gist made from its card, which is what the run does
// when it cannot read a source.
const GISTS = {
  "tc-nvidia": {
    slug: "tc-nvidia-data-center-revenue-up-64", depth: "full",
    lede: "Nvidia's data-center revenue rose 64% year on year, and for the first time the company says more of it came from running models than from training them.",
    sections: [
      { key: "key_points", heading: "Key points", points: [
        "Inference made up more than half of hyperscaler orders this quarter.",
        "Training demand still grew, but at about a third of the pace of inference.",
        "The company guided to a further rise next quarter, with supply as the limit.",
      ] },
      { key: "why", heading: "Why it matters", text: "Spending is moving from building models to serving them. For developers that means capacity and pricing are being tuned for inference workloads, which is where most application costs sit." },
    ],
    references: [{ title: "Nvidia earnings: data-center revenue up 64% on inference demand", host: "techcrunch.com" }],
  },
  "hn-tinyeval": {
    slug: "hn-show-hn-tinyeval-an-eval-harness-in-a-single-python-file", depth: "full",
    lede: "TinyEval is a 300-line Python file that runs prompt evaluations against any OpenAI-compatible endpoint, with no dependencies to install.",
    stats: [["Points", "212"], ["Comments", "87"], ["Submitted by", "mkrause"], ["Age", "19h"]],
    sections: [
      { key: "key_points", heading: "Key points", points: [
        "One file you copy into a project; test cases are plain Python dicts.",
        "Scores by exact match, a regular expression, or a second model as judge.",
        "Prints a table and exits non-zero on a regression, so it drops into CI.",
      ] },
      { key: "discussion", heading: "The discussion", points: [
        { label: "Agreed", text: "Most commenters like that it can be read in one sitting, unlike the larger eval frameworks." },
        { label: "Disputed", text: "Whether a model-as-judge score means much without a human-labelled baseline." },
        { label: "Counterpoint", text: "One reply argues the single-file rule will not survive the first request for parallel runs." },
      ] },
    ],
    references: [{ title: "TinyEval on GitHub", host: "github.com" }, { title: "Show HN: TinyEval", host: "news.ycombinator.com" }],
  },
  "gh-officecli": {
    slug: "gh-officecli", depth: "full",
    lede: "OfficeCLI creates and edits Word, Excel and PowerPoint files from the command line, aimed at scripts and agents that need to produce real documents.",
    stats: [["Stars", "18.2k"], ["Gained", "+6.4k"], ["Forks", "640"], ["Language", "Python"], ["Licence", "MIT"], ["Created", "Jun 2026"], ["Contributors", "41"], ["Open issues", "73"]],
    sections: [
      { key: "key_points", heading: "Key points", points: [
        "One command per action: add a slide, fill a table, replace text by style.",
        "Reads and writes the standard file formats directly; Office does not need to be installed.",
        "Ships a JSON mode so an agent can inspect a document before changing it.",
      ] },
      { key: "try", heading: "Try it", code: "pip install officecli && officecli docx new report.docx" },
      { key: "open", heading: "What's open", points: [
        { text: "Chart support in PowerPoint is the most requested feature." },
        { text: "Several reports of formulas being dropped when a sheet is rewritten." },
        { text: "A long thread on whether to add PDF export or leave it to other tools." },
      ] },
    ],
    references: [{ title: "OfficeCLI repository", host: "github.com" }, { title: "README", host: "github.com" }, { title: "Open issues", host: "github.com" }],
  },
  "ph-chatcut": {
    slug: "ph-chatcut", depth: "full",
    lede: "ChatCut is a video editor that runs inside ChatGPT: you describe the cut, it edits on a real timeline, and the project exports as XML for a desktop editor.",
    stats: [["Upvotes", "776"], ["Comments", "42"]],
    sections: [
      { key: "key_points", heading: "Key points", points: [
        "Edits are made on a visible timeline, so each change can be checked and undone.",
        "Exports XML that opens in Premiere and Final Cut.",
        "Works on footage you upload; it does not generate video.",
      ] },
      { key: "who", heading: "Who it's for", text: "People who cut interviews, demos and social clips and want a first assembly without learning an editor." },
      { key: "pricing", heading: "Pricing", text: "Free for exports up to 720p; a paid plan removes the limit." },
    ],
    references: [{ title: "ChatCut on Product Hunt", host: "producthunt.com" }, { title: "chatcut.io", host: "chatcut.io" }],
  },
};

const X_POST = {
  id: "x-karpathy-evals", source: "x", title: "Post by Andrej Karpathy", category: "x", url: "#", source_url: "#x",
  gist: {
    slug: "x-karpathy-on-evals", depth: "preview",
    post: { name: "Andrej Karpathy", handle: "@karpathy", date: "Aug 26, 2026",
      text: "Most teams I talk to have a model, a prompt and a product, and no eval. You are flying blind. Write twenty test cases today. You will learn more from those than from the next model upgrade.",
      counts: [["Likes", "41.2k"], ["Reposts", "6.8k"], ["Replies", "1.1k"]] },
    references: [{ title: "The post on X", host: "x.com" }],
  },
};

function gistFor(item) {
  if (item.gist) return item.gist;
  return GISTS[item.id] || {
    slug: item.id, depth: "brief", lede: item.summary,
    sections: [], references: [{ title: item.title, host: (NAMES[item.source] || "").toLowerCase().replace(/ /g, "") + ".com" }],
  };
}

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

const Close = ({ onClick, label = "Close" }) => (
  <button type="button" className="ldg-iconbtn proto-x" aria-label={label} onClick={onClick}>
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" /></svg>
  </button>
);

const Out = () => <span aria-hidden="true" className="proto-out">↗</span>;

function Actions({ item, saved, onToggleSave, user, onSignIn, reactions, onReact, pinned }) {
  const [ask, setAsk] = React.useState(false);
  React.useEffect(() => { if (user) setAsk(false); }, [user]);
  const mine = reactions.mine;
  return (
    <div className={"gist-actions" + (pinned ? " gist-actions--pinned" : "")}>
      <div className="gist-actions-row">
        <span className={"gist-save" + (saved ? " gist-save--on" : "")}>
          <SaveStar saved={saved} onToggle={() => onToggleSave(item.id)} />
          <button type="button" className="gist-save-label" onClick={() => onToggleSave(item.id)}>{saved ? "Saved" : "Save"}</button>
        </span>
        <span className="gist-reacts" role="group" aria-label="Reactions">
          {REACTIONS.map(e => {
            const n = (reactions.counts[e] || 0) + (mine.includes(e) ? 1 : 0);
            return (
              <button key={e} type="button" className="gist-react" aria-pressed={mine.includes(e)}
                onClick={() => user ? onReact(e) : setAsk(true)}>
                <span aria-hidden="true">{e}</span>{n > 0 && <b>{n}</b>}
              </button>
            );
          })}
        </span>
      </div>
      {saved && (
        <p className="gist-saved" role="status">
          Added to your Saved items. <a href="/saved" onClick={e => e.preventDefault()} title="Opens /saved in the app">View here</a>
        </p>
      )}
      {ask && !user && (
        <p className="gist-ask" role="status">
          Sign in with Google to react. Saving works without an account.
          <button type="button" className="gist-linkbtn" onClick={onSignIn}>Sign in</button>
        </p>
      )}
    </div>
  );
}

function Stats({ stats, style }) {
  if (!stats) return null;
  return (
    <div className="gist-stats">
      {style === "1"
        ? <p className="gist-statline">{stats.map(([k, v], i) => <span key={k}>{i > 0 && <i aria-hidden="true"> · </i>}<b>{v}</b> {k.toLowerCase()}</span>)}</p>
        : <dl className="gist-statgrid">{stats.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>}
      <p className="gist-asof">{AS_OF}</p>
    </div>
  );
}

function Section({ s }) {
  return (
    <section className="gist-sec">
      <h3>{s.heading}</h3>
      {s.text && <p>{s.text}</p>}
      {s.code && <pre className="gist-code"><code>{s.code}</code></pre>}
      {s.points && (
        <ul>{s.points.map((p, i) => typeof p === "string"
          ? <li key={i}>{p}</li>
          : <li key={i}>{p.label && <b className="gist-tag">{p.label}</b>}{p.text}</li>)}</ul>
      )}
    </section>
  );
}

// The one view both the panel and the page render.
function GistView({ item, opts, as, appearances, actions, onEdition }) {
  const g = gistFor(item);
  const H = as === "page" ? "h1" : "h2";
  const bar = <Actions {...actions} item={item} />;
  return (
    <article className={"gist gist--" + as}>
      <header className="gist-head">
        <p className="gist-kicker">
          {item.source !== "x" && <ItemImage item={item} size={20} className="source-icon" />}
          <span>{NAMES[item.source]}</span>
          <i aria-hidden="true">·</i><span>First covered {appearances[0].label}</span>
          {item.top && <span className="gist-badge">Top today</span>}
          {FRONT.includes(item.id) && <span className="gist-badge">HN front page</span>}
          {g.depth !== "full" && <span className="gist-depth" title={g.depth === "brief" ? "The source could not be read, so this gist is the short one" : "A preview of the post, with no written summary"}>{g.depth}</span>}
        </p>
        <H className="gist-title" id="gist-title">{item.title}</H>
        {opts.actions === "1" && bar}
        <a className="ldg-btn ldg-btn--secondary gist-source" href={item.source_url} onClick={e => e.preventDefault()}>{SOURCE_ACTION[item.source]} <Out /></a>
      </header>

      {g.post ? (
        <figure className="gist-post">
          <figcaption><b>{g.post.name}</b><span>{g.post.handle} · {g.post.date}</span></figcaption>
          <blockquote>{g.post.text}</blockquote>
          <div className="gist-stats">
            <p className="gist-statline">{g.post.counts.map(([k, v], i) => <span key={k}>{i > 0 && <i aria-hidden="true"> · </i>}<b>{v}</b> {k.toLowerCase()}</span>)}</p>
            <p className="gist-asof">{AS_OF}</p>
          </div>
        </figure>
      ) : (
        <>
          <p className="gist-lede">{g.lede}</p>
          {g.depth === "brief" && <p className="gist-briefnote">This is the short gist. The source could not be read when the edition was built.</p>}
          <Stats stats={g.stats} style={opts.stats} />
          {g.sections.map(s => <Section key={s.key} s={s} />)}
        </>
      )}

      <div className="gist-cta" aria-label="Sources">
        {(END_CTAS[item.id] || END_CTAS[item.source] || [SOURCE_ACTION[item.source]]).map((label, i) => (
          <a key={i} className={"ldg-btn gist-source " + (i === 0 ? "ldg-btn--primary" : "ldg-btn--secondary")} href={item.source_url} onClick={e => e.preventDefault()}>{label} <Out /></a>
        ))}
      </div>
      <section className="gist-sec gist-seen">
        <h3>Appeared in</h3>
        <p>{appearances.map((a, i) => <span key={a.key}>{i > 0 && <i aria-hidden="true"> · </i>}<a href="#edition" onClick={e => { e.preventDefault(); onEdition(a.key); }}>{a.name}</a></span>)}</p>
      </section>
      {opts.actions === "2" && bar}
      {opts.actions === "3" && <Actions {...actions} item={item} pinned />}
    </article>
  );
}

// The beside panel is resizable. Its width is a per-browser preference, like
// the feed's layout and density: kept in localStorage, never synced.
const PANEL_W = { min: 360, def: 460, key: "aibytes.gistPanelWidth" };
const panelMax = () => Math.max(PANEL_W.min, Math.min(760, window.innerWidth - 300 - 440)); // the feed keeps ~440px

function usePanelWidth() {
  const [w, setW] = React.useState(() => {
    let saved = NaN;
    try { saved = Number(localStorage.getItem(PANEL_W.key)); } catch {}
    return Number.isFinite(saved) && saved > 0 ? saved : PANEL_W.def;
  });
  const clamp = v => Math.round(Math.min(panelMax(), Math.max(PANEL_W.min, v)));
  const set = v => setW(clamp(v));
  React.useEffect(() => {
    const apply = () => document.documentElement.style.setProperty("--gist-w", clamp(w) + "px");
    apply();
    window.addEventListener("resize", apply);
    try { localStorage.setItem(PANEL_W.key, String(w)); } catch {}
    return () => window.removeEventListener("resize", apply);
  }, [w]);
  return { w: clamp(w), set };
}

function ResizeHandle({ w, set }) {
  const start = e => {
    e.preventDefault();
    const x0 = e.clientX, w0 = w;
    document.body.classList.add("gist-resizing");
    const move = ev => set(w0 + (x0 - ev.clientX));
    const up = () => {
      document.body.classList.remove("gist-resizing");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  const key = e => {
    const step = e.shiftKey ? 80 : 20;
    if (e.key === "ArrowLeft") { e.preventDefault(); set(w + step); }
    else if (e.key === "ArrowRight") { e.preventDefault(); set(w - step); }
    else if (e.key === "Home") { e.preventDefault(); set(panelMax()); }
    else if (e.key === "End") { e.preventDefault(); set(PANEL_W.min); }
  };
  return (
    <div className="gist-resize" role="separator" aria-orientation="vertical" aria-label="Resize the gist panel"
      aria-valuenow={w} aria-valuemin={PANEL_W.min} aria-valuemax={panelMax()} tabIndex={0}
      title="Drag to resize. Double-click to reset."
      onPointerDown={start} onKeyDown={key} onDoubleClick={() => set(PANEL_W.def)} />
  );
}

function GistPanel({ item, opts, narrow, onClose, onOpenPage, children }) {
  const ref = React.useRef(null);
  const modal = narrow || opts.panel === "2";
  React.useEffect(() => {
    const opener = document.activeElement;
    ref.current.focus();
    const key = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("keydown", key); if (opener?.isConnected) opener.focus(); };
  }, []);
  React.useEffect(() => { ref.current.querySelector(".gist-scroll").scrollTop = 0; }, [item.id]);
  const g = gistFor(item);
  const width = usePanelWidth();
  return (
    <>
      {modal && <div className="gist-scrim" onMouseDown={onClose} />}
      <aside className={"gist-panel" + (modal ? " gist-panel--over" : "")} role={modal ? "dialog" : "complementary"} aria-modal={modal || undefined}
        aria-labelledby="gist-title" tabIndex={-1} ref={ref}>
        {!modal && <ResizeHandle {...width} />}
        <div className="gist-panel-bar">
          <a href={"#/gists/" + g.slug} className="gist-url" onClick={e => { e.preventDefault(); onOpenPage(); }} title="Open the gist as its own page">
            aibytes.io/gists/{g.slug} <Out />
          </a>
          <Close onClick={onClose} label="Close the gist" />
        </div>
        <div className="gist-scroll">{children}</div>
      </aside>
    </>
  );
}

// A stand-in for the weekly email. Its styling is deliberately not Ledger: the
// newsletter has its own inline palette.
function Mail({ opts, items, onGist }) {
  const row = item => (
    <li key={item.id}>
      <a href="#gist" className="mail-title" onClick={e => { e.preventDefault(); onGist(item); }}>{item.title}</a>
      {opts.mail === "2" && <a href="#source" className="mail-source" onClick={e => e.preventDefault()}>source ↗</a>}
      <p>{item.summary || item.gist.post.text.slice(0, 96) + "…"}</p>
    </li>
  );
  return (
    <div className="mail-wrap">
      <p className="proto-standin">Stand-in for the weekly email, not its real design</p>
      <div className="mail">
        <p className="mail-brand">⚡ aiBytes<span>_</span></p>
        <h2>0x01 · AI News</h2><ul>{items.filter(i => i.category === "news").slice(0, 2).map(row)}</ul>
        <h2>0x02 · Trending GitHub</h2><ul>{items.filter(i => i.category === "repos").slice(0, 2).map(row)}</ul>
        <h2>0x03 · Viral on X</h2><ul>{row(X_POST)}</ul>
        <p className="mail-foot">{opts.mail === "1"
          ? "Every title opens its gist on aibytes.io. The source is one click further, on the gist."
          : "Every title opens its gist on aibytes.io. The small link beside it goes straight to the source."}</p>
      </div>
    </div>
  );
}

// Ledger's sticky SaveBanner with the copy proposed in review (12 Nov 2026).
// The shipped component still carries the old line; the build changes it there.
function SaveBanner({ onSignIn }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const root = document.documentElement;
    const observer = new ResizeObserver(() => root.style.setProperty("--redesign-banner", Math.round(ref.current.getBoundingClientRect().height) + "px"));
    observer.observe(ref.current);
    return () => { observer.disconnect(); root.style.removeProperty("--redesign-banner"); };
  }, []);
  return (
    <div className="ldg-banner ldg-banner--sticky" role="status" ref={ref}>
      <div className="ldg-banner__in">
        <span className="ldg-banner__msg">
          <Icon name="warning" strokeWidth="1.5" className="ldg-banner__icon" />
          <span>Saved items are stored in this browser's local storage. <a href="#signin" onClick={e => { e.preventDefault(); onSignIn(); }}>Sign in with Google</a> to sync them to your account.</span>
        </span>
      </div>
    </div>
  );
}

// The weekly issue's subscribe bar, as apps/web renders it (SubscribeBar in
// App.jsx, styled by .weekly-subscribe in Ledger). The app hides it for a
// reader who has already subscribed.
const SubscribeBar = () => (
  <aside className="weekly-subscribe" aria-label="Subscribe">
    <p className="weekly-subscribe__text"><b>Get aiBytes_ every Monday.</b> The week in AI for developers, in your inbox.</p>
    <a className="ldg-btn ldg-btn--primary weekly-subscribe__action" href={D.subscribeUrl} onClick={e => e.preventDefault()}>Subscribe</a>
  </aside>
);

function Proto() {
  const [theme, setTheme] = React.useState(() => document.documentElement.dataset.theme
    || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  const [mode, setMode] = React.useState("ranked");
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState("all");
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [calOpen, setCalOpen] = React.useState(false);
  // #gist-page, #gist-page-shell and #newsletter open on that view, for review links.
  const start = (window.location.hash || "").slice(1);
  const [view, setView] = React.useState(start.startsWith("gist-page") ? "page" : start === "newsletter" ? "mail" : "feed"); // feed | page | mail
  const [openId, setOpenId] = React.useState("hn-tinyeval"); // the gist shown, panel or page
  const [panelOpen, setPanelOpen] = React.useState(!start);
  // Defaults are the publisher's picks of 12 Nov 2026: A1, B2, C2, D2, E2, F2.
  const [opts, setOpts] = React.useState({ panel: "1", card: "2", stats: "2", actions: "2", page: start === "gist-page-shell" ? "1" : "2", mail: "2" });
  const [saves, setSaves] = React.useState(["gh-officecli"]);
  const [user, setUser] = React.useState(null);
  const [mine, setMine] = React.useState({});
  const narrow = useNarrow();

  React.useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  React.useEffect(() => { if (narrow) setPanelOpen(false); }, []);

  const ed = D.editions[TODAY];
  const all = [...ed.items, X_POST];
  const item = all.find(i => i.id === openId) || ed.items[0];
  const items = ed.items
    .filter(i => (category === "all" || i.category === category) && (!query.trim() || `${i.title} ${i.summary}`.toLowerCase().includes(query.trim().toLowerCase())))
    .sort((a, b) => rankOf(a) - rankOf(b));
  const categories = D.categories.map(c => ({ ...c, count: ed.items.filter(i => i.category === c.key).length }));

  const toggleSave = id => setSaves(l => l.includes(id) ? l.filter(x => x !== id) : [id, ...l]);
  const react = e => setMine(m => { const l = m[openId] || []; return { ...m, [openId]: l.includes(e) ? l.filter(x => x !== e) : [...l, e] }; });
  const seed = id => { const n = id.length + id.charCodeAt(3); return { "👍": n % 9 + 2, "🚀": n % 4, "👀": n % 3, "❤️": n % 5 > 3 ? 1 : 0 }; };
  const actions = { saved: saves.includes(item.id), onToggleSave: toggleSave, user, onSignIn: () => setUser(USER),
    reactions: { counts: seed(item.id), mine: mine[openId] || [] }, onReact: react };
  const appearances = item.source === "x"
    ? [{ key: "issue", label: "Mon, Aug 31", name: "Issue #9 · Aug 31" }]
    : [{ key: TODAY, label: ed.mid, name: ed.mid + " edition" }, ...(GISTS[item.id] ? [{ key: "issue", label: "Mon, Aug 31", name: "Issue #9 · Aug 31" }] : [])];

  const openGist = id => { setOpenId(id); setPanelOpen(true); };
  const toFeed = () => { setView("feed"); setPanelOpen(false); };
  const openPage = id => { if (id) setOpenId(id); setView("page"); setPanelOpen(false); window.scrollTo(0, 0); };

  // The card is Ledger's own. In the app it would link to /gists/<slug>; here
  // the click is caught so the panel opens instead of the placeholder link.
  const onCardClick = (e, id) => {
    if (e.target.closest(".ldg-star, .item-actions")) return;
    const link = e.target.closest("a");
    if (link?.classList.contains("discussion") && opts.card === "2") { e.preventDefault(); return; }
    e.preventDefault();
    openGist(id);
  };
  const card = i => (
    <div key={i.id} className={"proto-cardwrap" + (FRONT.includes(i.id) ? " proto-cardwrap--front" : "") + (panelOpen && view === "feed" && i.id === openId ? " proto-cardwrap--open" : "")} onClick={e => onCardClick(e, i.id)}>
      <Card item={i} saved={saves.includes(i.id)} onToggleSave={() => toggleSave(i.id)} topToday={i.top} starPos="visual" />
    </div>
  );

  const date = <EditionBar dateLabel={ed.mid} onDateClick={() => setCalOpen(o => !o)} calendarOpen={calOpen}
    editions={D.order.slice().reverse().map(k => ({ date: k, label: D.editions[k].mid, count: D.editions[k].items.length }))}
    currentDate={TODAY} onSelectEdition={() => setCalOpen(false)} />;

  const gist = as => <GistView item={item} opts={opts} as={as} appearances={appearances} actions={actions} onEdition={toFeed} />;
  const beside = view === "feed" && panelOpen && !narrow && opts.panel === "1";
  const reading = view === "page" && opts.page === "2";
  const more = ed.items.filter(i => i.id !== item.id && i.category === item.category).slice(0, 3);

  const header = <AppHeader theme={theme} onToggleTheme={() => setTheme(t => t === "light" ? "dark" : "light")} menuOpen={menuOpen} onMenu={() => setMenuOpen(o => !o)} githubUrl={D.githubUrl}
    onSignIn={() => setUser(USER)} user={user || undefined} onSignOut={() => setUser(null)} />;

  return (
    <div className={"app-shell redesign redesign-grid" + (menuOpen ? " mobile-menu-open" : "") + (beside ? " proto-beside" : "") + (reading ? " proto-reading" : "")} data-theme={theme}
      onClickCapture={e => { if (e.target.closest("a.brand")) { e.preventDefault(); toFeed(); } }}>
      {header}
      {!user && saves.length > 0 && <SaveBanner onSignIn={() => setUser(USER)} />}
      {!reading && <Sidebar categories={categories} count={ed.items.length} active={view === "feed" ? category : undefined} open={menuOpen} onClose={() => setMenuOpen(false)}
        onCategory={key => { setCategory(key); setView("feed"); setMenuOpen(false); }} links={D.links} subscribeUrl={D.subscribeUrl} />}
      <main id="main" className="redesign-main" tabIndex={-1}>
        <div className="workspace"><section className="feed">
          {view === "feed" && (
            <>
              <h1 className="app-sr">aiBytes_ edition, {ed.label}</h1>
              <div className="toolbar-slot"><Toolbar count={`${items.length} items`} query={query} onQuery={setQuery} mode={mode} onMode={setMode} date={date} /></div>
              <div className="app-main">
                <section className="app-sec" aria-labelledby="items-heading">
                  <h2 className="app-sr" id="items-heading">{items.length} items</h2>
                  <CardGrid>{items.map(card)}</CardGrid>
                </section>
                <EndCard dateLabel={ed.short} />
              </div>
            </>
          )}
          {view === "page" && (
            <div className={"proto-page" + (reading ? " proto-page--reading" : "")}>
              <p className="proto-crumb"><a href="#feed" onClick={e => { e.preventDefault(); toFeed(); }}>← {ed.mid} edition</a></p>
              {gist("page")}
              {reading && more.length > 0 && (
                <section className="proto-more" aria-labelledby="more-h">
                  <h2 id="more-h">More from the {ed.short} edition</h2>
                  <RowList>{more.map(i => <div key={i.id} className={"proto-cardwrap" + (FRONT.includes(i.id) ? " proto-cardwrap--front" : "")} onClick={e => { if (!e.target.closest(".ldg-star, .item-actions")) { e.preventDefault(); openPage(i.id); } }}>
                    <ListRow item={i} saved={saves.includes(i.id)} onToggleSave={() => toggleSave(i.id)} starPos="visual" /></div>)}</RowList>
                  <SubscribeBar />
                </section>
              )}
            </div>
          )}
          {view === "mail" && <Mail opts={opts} items={ed.items} onGist={i => openPage(i.id)} />}
        </section></div>
      </main>

      {view === "feed" && panelOpen && (
        <GistPanel item={item} opts={opts} narrow={narrow} onClose={() => setPanelOpen(false)} onOpenPage={() => openPage()}>{gist("panel")}</GistPanel>
      )}

      <ReviewPanel opts={opts} setOpt={(k, v) => setOpts(o => ({ ...o, [k]: v }))} view={view}
        show={v => { if (v === "feed") { setView("feed"); if (!narrow) setPanelOpen(true); } else if (v === "x") openPage(X_POST.id); else if (v === "page") openPage(openId === X_POST.id ? "hn-tinyeval" : openId); else { setView("mail"); setPanelOpen(false); } }}
        isX={view === "page" && item.source === "x"} pick={id => view === "page" ? openPage(id) : (setView("feed"), openGist(id))} openId={openId}
        user={user} setUser={setUser} startOpen={!narrow} />
    </div>
  );
}

const SAMPLES = [["tc-nvidia", "News"], ["hn-tinyeval", "HN thread"], ["gh-officecli", "Repo"], ["ph-chatcut", "Launch"], ["hn-localgood", "Brief"]];

function ReviewPanel({ opts, setOpt, view, show, isX, pick, openId, user, setUser, startOpen }) {
  const [open, setOpen] = React.useState(startOpen);
  const at = isX ? "x" : view;
  return (
    <aside className={"proto-review" + (open ? "" : " proto-review--closed")} aria-label="Prototype options">
      <button className="proto-review-toggle" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <span>AIB-145y options</span><span aria-hidden="true">{open ? "–" : "+"}</span>
      </button>
      {open && (
        <div className="proto-review-body">
          <fieldset>
            <legend>Show</legend>
            <div className="proto-seg">
              {[["feed", "Feed and panel"], ["page", "Gist page"], ["x", "X post gist"], ["mail", "Newsletter"]].map(([k, l]) =>
                <button key={k} aria-pressed={at === k} onClick={() => show(k)}>{l}</button>)}
            </div>
          </fieldset>
          {(at === "feed" || at === "page") && (
            <fieldset>
              <legend>Gist type</legend>
              <div className="proto-seg">{SAMPLES.map(([id, l]) => <button key={id} aria-pressed={openId === id} onClick={() => pick(id)}>{l}</button>)}</div>
            </fieldset>
          )}
          {Object.keys(OPTIONS).map((key, i) => {
            const o = OPTIONS[key], letter = String.fromCharCode(65 + i);
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
        </div>
      )}
    </aside>
  );
}

createRoot(document.getElementById("root")).render(<Proto />);
