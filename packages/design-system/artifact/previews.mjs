// The live preview of each Ledger component in the Design System Artifact.
// `jsx` is the body of a module that ends by rendering into #root; build.mjs
// compiles it to a plain script, so the preview needs no Babel at view time.
// The frame has already loaded tokens.css, bundle.css, React and the bundle,
// and sets the theme on <html>, so a preview renders each component once.

// Sample items and shared setup, prepended to every preview.
export const PRELUDE = `
const L = window.LedgerAiBytesDesignSystem_b1be4f;
const noop = () => {};
const chatcut = { id: "ph-chatcut", title: "ChatCut", summary: "AI video editor inside ChatGPT with a real timeline and XML export.", url: "#", source: "producthunt", source_url: "#", category: "launches", tags: ["Video", "Dev Tool"], signals: { upvotes: 776, comments: 42 } };
const officecli = { id: "gh-officecli", title: "OfficeCLI", summary: "Create and edit Word, Excel, and PowerPoint files from the command line.", url: "#", source: "github", source_url: "#", category: "repos", tags: ["CLI", "Open Source"], signals: { stars_gained: 6400 }, meta: { language: "Python" } };
const hn = { id: "hn-cc", title: "Claude Code sends 33k tokens before you type anything, and other context-window surprises", summary: "A measured look at what a coding agent actually sends per request.", url: "#", source: "hackernews", source_url: "#", category: "hn", tags: ["Claude Code"], signals: { points: 699, comments: 412 } };
const tc = { id: "tc-apple", title: "Apple holds talks with OpenAI over a revamped Siri", summary: "The deal would put a long-context model behind Siri as soon as next spring.", url: "#", source: "techcrunch", source_url: "#", category: "news", tags: ["Apple", "OpenAI"] };
const items = [chatcut, officecli, hn, tc];
const editions = [{ date: "2026-08-27", label: "Wed, Aug 27", count: 16 }, { date: "2026-08-26", label: "Tue, Aug 26", count: 8 }, { date: "2026-08-25", label: "Mon, Aug 25", count: 11 }, { date: "2026-08-22", label: "Fri, Aug 22", count: 9 }];
const categories = [{ key: "launches", label: "New Products", count: 4 }, { key: "repos", label: "Trending Dev Projects", count: 4 }, { key: "news", label: "AI News", count: 3 }, { key: "hn", label: "HN Threads", count: 4 }];
const tagGroups = [{ name: "What it is", tags: ["Open Source", "Dev Tool", "CLI", "SDK"].map(name => ({ name })) }, { name: "Domain", tags: ["LLM", "Agents", "RAG", "Inference"].map(name => ({ name })) }];
const sources = [{ key: "producthunt", label: "Product Hunt" }, { key: "hackernews", label: "Hacker News" }, { key: "github", label: "GitHub" }, { key: "techcrunch", label: "TechCrunch" }];
const Label = ({ children }) => <span className="pv-label">{children}</span>;
const render = (node) => ReactDOM.createRoot(document.getElementById("root")).render(node);
`;

// Page chrome for every preview: the app's ground, and the label style.
export const BASE_CSS = `body{margin:0;padding:16px;background:var(--bg);color:var(--text);font-family:var(--font-body)}
#root{display:flex;flex-direction:column;gap:12px}
.pv-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.pv-label{display:block;font-size:12px;line-height:16px;color:var(--text-2)}
.pv-static .masthead,.pv-static .ldg-banner--sticky{position:static}
.pv-static .sidebar{position:static;transform:none;height:auto;width:auto;min-width:0;max-width:none;border-right:0;padding-top:16px}
.pv-static .redesign-filters,.pv-static .ldg-cal,.pv-static .ldg-menu__panel{position:static;transform:none;max-height:none;margin:0}`;

export const PREVIEWS = {
  Wordmark: { group: "Brand", height: 96, jsx: `
render(<div className="pv-row"><L.Wordmark variant="full" /><L.Wordmark variant="compact" /><L.Wordmark variant="icon" /></div>);` },

  SourceMark: { group: "Brand", height: 110, jsx: `
render(<>
  <div className="pv-row">{sources.map(s => <L.SourceMark key={s.key} source={s.key} />)}{sources.map(s => <L.SourceMark key={s.key + "24"} source={s.key} size={24} />)}</div>
  <Label>40px in the card image slot, 24px in list rows. The HN tile uses --hot; the Octocat uses --text.</Label>
</>);` },

  Card: { group: "Content", height: 420, width: 1000, jsx: `
function Demo() {
  const [saved, setSaved] = React.useState(["ph-chatcut"]);
  const toggle = (id) => setSaved(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  return <>
    <L.CardGrid>
      <L.Card item={chatcut} topToday saved={saved.includes(chatcut.id)} onToggleSave={toggle} starPos="visual" />
      <L.Card item={officecli} saved={saved.includes(officecli.id)} onToggleSave={toggle} starPos="visual" />
      <L.Card item={hn} saved={saved.includes(hn.id)} onToggleSave={toggle} starPos="visual" />
      <L.Card item={tc} />
    </L.CardGrid>
    <Label>Top today (ChatCut), saved and unsaved stars under the source icon, and a card without onToggleSave (no star). Hover lifts the card; the ⋮ menu opens "Open in".</Label>
  </>;
}
render(<Demo />);` },

  ListRow: { group: "Content", height: 330, width: 900, jsx: `
function Demo() {
  const [saved, setSaved] = React.useState(["gh-officecli"]);
  const toggle = (id) => setSaved(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  return <L.RowList>{items.map(i => <L.ListRow key={i.id} item={i} saved={saved.includes(i.id)} onToggleSave={toggle} starPos="visual" />)}</L.RowList>;
}
render(<Demo />);` },

  CardGrid: { group: "Content", height: 260, width: 1100, jsx: `
render(<L.CardGrid>{[chatcut, officecli, hn].map(i => <L.Card key={i.id} item={i} />)}</L.CardGrid>);` },

  RowList: { group: "Content", height: 250, width: 900, jsx: `
render(<L.RowList>{[chatcut, officecli, tc].map(i => <L.ListRow key={i.id} item={i} />)}</L.RowList>);` },

  StatusMessage: { group: "Content", height: 150, jsx: `
render(<>
  <L.StatusMessage role="status">Loading the edition...</L.StatusMessage>
  <L.StatusMessage role="alert">Could not load the edition.</L.StatusMessage>
</>);` },

  SectionHeading: { group: "Content", height: 90, jsx: `
render(<><L.SectionHeading name="Trending Dev Projects" count={4} /><Label>Grouped order only; the ranked feed has no headings.</Label></>);` },

  EmptyState: { group: "Content", height: 300, width: 800, jsx: `
render(<>
  <L.EmptyState category="Trending Dev Projects" prevLabel="Aug 25" prevCount={3} onPrev={noop} />
  <L.EmptyState category="items tagged Agents" onClear={noop} />
  <L.EmptyState query="quantum toaster" onClearQuery={noop} />
</>);` },

  EndCard: { group: "Content", height: 180, width: 800, jsx: `
render(<L.EndCard dateLabel="Aug 27" prevLabel="Aug 26" onPrev={noop} />);` },

  SaveStar: { group: "Content", height: 90, jsx: `
function Demo() {
  const [a, setA] = React.useState(false);
  const [b, setB] = React.useState(true);
  return <div className="pv-row"><L.SaveStar saved={a} onToggle={() => setA(v => !v)} /><L.SaveStar saved={b} onToggle={() => setB(v => !v)} /><Label>Outline at rest, --save fill when saved. Click to toggle.</Label></div>;
}
render(<Demo />);` },

  SaveBanner: { group: "Content", height: 170, width: 1000, jsx: `
render(<div className="pv-static">
  <L.SaveBanner onSignIn={noop} />
  <Label>As the app shows it: signed out with a save, not dismissible. With sticky it sits under the AppHeader, over the Sidebar.</Label>
</div>);` },

  GistView: { group: "Content", height: 760, width: 520, jsx: `
const asOf = "2026-08-27T08:04:10Z";
const gist = { schema_version: 1, slug: "gh-officecli", kind: "repo", source: "github", category: "repos", title: "OfficeCLI", url: "#", source_url: "#",
  tags: [], image: { type: "none" }, depth: "full",
  lede: "OfficeCLI creates and edits Word, Excel and PowerPoint files from the command line, aimed at scripts and agents that need to produce real documents.",
  sections: [
    { key: "key_points", points: ["One command per action: add a slide, fill a table, replace text by style.", "Reads and writes the standard file formats directly; Office does not need to be installed.", "Ships a JSON mode so an agent can inspect a document before changing it."] },
    { key: "try_it", command: "pip install officecli && officecli docx new report.docx" },
    { key: "whats_open", points: [{ text: "Chart support in PowerPoint is the most requested feature.", url: "#" }, { text: "Several reports of formulas being dropped when a sheet is rewritten." }] },
  ],
  stats: { stars: 18200, stars_gained: 6400, forks: 640, language: "Python", license: "MIT", created_on: "2026-06-12", contributors: 41, open_issues: 73 }, stats_as_of: asOf,
  links: [{ role: "destination", title: "OfficeCLI repository", url: "https://github.com/example/officecli" }],
  appearances: [{ item_id: "gh-officecli-2026-08-27", edition_date: "2026-08-27" }, { item_id: "gh-officecli-issue-9", issue_slug: "issue-9" }],
  created_at: asOf, updated_at: asOf };
render(<>
  <L.GistView gist={gist} as="panel" actions={<div className="gist-sec"><L.SaveStar saved={false} onToggle={noop} /></div>} />
  <Label>The one view the panel and the page both render. A repo gist: image or source mark before the title, the stats grid with its date, sections, then the source button. Hacker News, Product Hunt and news gists differ only in their sections and stats.</Label>
</>);` },

  GistPanel: { group: "Content", height: 640, width: 900, jsx: `
const asOf = "2026-08-27T08:04:10Z";
const gist = { schema_version: 1, slug: "ph-chatcut", kind: "launch", source: "producthunt", category: "launches", title: "ChatCut", url: "#", source_url: "#",
  tags: [], image: { type: "none" }, depth: "full",
  lede: "ChatCut is a video editor that runs inside ChatGPT: you describe the cut, it edits on a real timeline, and the project exports as XML for a desktop editor.",
  sections: [
    { key: "key_points", points: ["Edits are made on a visible timeline, so each change can be checked and undone.", "Exports XML that opens in Premiere and Final Cut.", "Works on footage you upload; it does not generate video."] },
    { key: "who_its_for", text: "People who cut interviews, demos and social clips and want a first assembly without learning an editor." },
    { key: "pricing", text: "Free for exports up to 720p; a paid plan removes the limit." },
  ],
  stats: { upvotes: 776, comments: 42 }, stats_as_of: asOf,
  links: [{ role: "destination", title: "chatcut.io", url: "https://chatcut.io" }, { role: "discussion", title: "ChatCut", url: "https://www.producthunt.com/products/chatcut" }],
  appearances: [{ item_id: "ph-chatcut-2026-08-27", edition_date: "2026-08-27" }],
  created_at: asOf, updated_at: asOf };
function Demo() {
  const [width, setWidth] = React.useState(460);
  return <>
    <L.GistPanel gist={gist} pageHref="#" width={width} onWidthChange={setWidth} onClose={noop}>
      <L.GistView gist={gist} as="panel" />
    </L.GistPanel>
    <Label>Fixed to the right edge: drag its left edge, or focus it and use the arrow keys. Escape closes it. Width: {width}px.</Label>
  </>;
}
render(<Demo />);` },

  Dialog: { group: "Content", height: 420, width: 1000, jsx: `
render(<L.Dialog labelledBy="pv-dialog-h" onClose={noop}>
  <h2 id="pv-dialog-h" className="ldg-dialog__title">You're successfully signed in.</h2>
  <p>Get the best of AI in your inbox every Monday</p>
  <div className="ldg-dialog__actions ldg-dialog__actions--one">
    <L.Button variant="primary" data-autofocus>Subscribe</L.Button>
  </div>
</L.Dialog>);` },

  CardMenu: { group: "Content", height: 210, jsx: `
render(<>
  <div className="pv-row" style={{ justifyContent: "flex-start" }}><span style={{ position: "relative" }}><L.CardMenu item={chatcut} up={false} /></span><Label>The ⋮ on every card and row. Click it: "Open in" ChatGPT, Claude or Gemini.</Label></div>
</>);` },

  ItemImage: { group: "Content", height: 110, jsx: `
render(<>
  <div className="pv-row">{items.map(i => <L.ItemImage key={i.id} item={i} size={40} className="source-icon" />)}{items.map(i => <L.ItemImage key={i.id + "s"} item={i} size={24} className="source-icon" />)}</div>
  <Label>No image on these items, so each slot falls back to its source mark.</Label>
</>);` },

  Tag: { group: "Content", height: 80, jsx: `
render(<div className="pv-row"><L.Tag>Agents</L.Tag><L.Tag>Open Source</L.Tag><L.Tag>Dev Tool</L.Tag></div>);` },

  Signals: { group: "Content", height: 90, jsx: `
render(<div className="pv-row"><L.Signals signals={{ upvotes: 776, comments: 42 }} /><L.Signals signals={{ stars_gained: 6400 }} /><L.Signals signals={{ points: 699, comments: 412 }} /></div>);` },

  LangDot: { group: "Content", height: 80, jsx: `
render(<div className="pv-row">{["Python", "TypeScript", "Rust", "Go", "C++", "Shell", "Jupyter Notebook", "Haskell"].map(l => <span key={l} className="pv-row" style={{ gap: 6 }}><L.LangDot language={l} /><Label>{l}</Label></span>)}</div>);` },

  Button: { group: "Forms", height: 130, jsx: `
render(<>
  <div className="pv-row"><L.Button variant="primary">Subscribe</L.Button><L.Button variant="secondary">Sign in</L.Button><L.Button variant="ghost">Notify me</L.Button><L.Button variant="google">Sign in with Google</L.Button></div>
  <div className="pv-row"><L.Button variant="primary" disabled>Subscribe</L.Button><L.Button variant="secondary" disabled>Sign in</L.Button></div>
</>);` },

  Input: { group: "Forms", height: 90, jsx: `
render(<div className="pv-row"><L.Input type="email" placeholder="you@example.dev" aria-label="Email" /><L.Button variant="secondary">Subscribe</L.Button></div>);` },

  AppHeader: { group: "Navigation", height: 200, width: 1100, jsx: `
const theme = document.documentElement.dataset.theme || "light";
render(<div className="pv-static">
  <L.AppHeader theme={theme} onToggleTheme={noop} onMenu={noop} githubUrl="#" onSignIn={noop} />
  <Label>Signed out: Sign in after the theme toggle. The menu button shows on phones only.</Label>
  <L.AppHeader theme={theme} onToggleTheme={noop} onMenu={noop} githubUrl="#" user={{ name: "Ada Lovelace" }} onSignOut={noop} onSaved={noop} />
  <Label>Signed in: the avatar, with the initial when there is no photo. Click it for the account menu.</Label>
</div>);` },

  AccountMenuPanel: { group: "Navigation", height: 180, jsx: `
render(<div className="pv-static" style={{ width: 220 }}><L.AccountMenuPanel user={{ name: "Ada Lovelace" }} onSaved={noop} onSignOut={noop} /></div>);` },

  Toolbar: { group: "Navigation", height: 150, width: 1100, jsx: `
render(<div className="pv-static">
  <L.Toolbar count="32 items" query="" onQuery={noop} filterCount={0} onFilters={noop} mode="ranked" onMode={noop} view="grid" onView={noop} date={<L.EditionBar dateLabel="Wed, Aug 27" onDateClick={noop} />} />
  <L.Toolbar count="4 items" query="agents" onQuery={noop} filterCount={3} onFilters={noop} mode="grouped" onMode={noop} view="list" onView={noop} date={<L.EditionBar dateLabel="Wed, Aug 27" onDateClick={noop} />} />
</div>);` },

  EditionBar: { group: "Navigation", height: 150, width: 900, jsx: `
render(<div className="pv-static">
  <L.EditionBar dateLabel="Wed, Aug 27" onDateClick={noop} />
  <Label>Compact, as the Toolbar's date picker (default).</Label>
  <L.EditionBar dateLabel="Wed, Aug 27, 2026" itemCount={39} updatedAgo="4h ago" prevLabel="Aug 26" onPrev={noop} compact={false} arrows />
  <Label>The full bar, for a page that leads with the date.</Label>
</div>);` },

  CalendarPopover: { group: "Navigation", height: 380, jsx: `
render(<div className="pv-static" style={{ width: 320 }}><L.CalendarPopover editions={editions} currentDate="2026-08-27" onSelect={noop} /></div>);` },

  FilterPanel: { group: "Navigation", height: 540, jsx: `
function Demo() {
  const [filters, setFilters] = React.useState({ category: "all", tags: ["Agents"], sources: ["github"], query: "" });
  return <div className="pv-static" style={{ width: 340 }}><L.FilterPanel groups={tagGroups} filters={filters} onChange={setFilters} sources={sources} /></div>;
}
render(<Demo />);` },

  ActiveFilters: { group: "Navigation", height: 90, width: 900, jsx: `
function Demo() {
  const [filters, setFilters] = React.useState({ category: "all", tags: ["Agents", "Open Source"], sources: ["github"], query: "" });
  return <><L.ActiveFilters filters={filters} onChange={setFilters} />{!filters.tags.length && !filters.sources.length && <Label>Nothing selected: ActiveFilters renders nothing.</Label>}</>;
}
render(<Demo />);` },

  Sidebar: { group: "Navigation", height: 640, width: 320, jsx: `
const links = [{ label: "X", href: "#" }, { label: "Suggest a link", href: "#" }, { label: "Advertise", href: "#" }, { label: "Chrome Extension (soon)" }];
render(<div className="pv-static"><L.Sidebar categories={categories} count={15} active="repos" links={links} subscribeUrl="#" onSaved={noop} savedCount={3} /></div>);` },
};
