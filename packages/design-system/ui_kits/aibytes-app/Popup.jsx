/* The Chrome extension popup (AIB-76n) — loaded as text/babel. The frames the
   extension renders, built from the Ledger bundle and fed the sample edition
   in data.js and the sample gists in gists.js. Each frame is live: stars,
   the Saved toggle, a gist and Back work in page state. Copy is the agreed
   copy from docs/ux/prototypes/AIB-76n-extension/copy.js. */
const P = window.LedgerAiBytesDesignSystem_b1be4f || {};
const { PopupHeader, PopupFooter, PopupGistBar, PopupActionBar, RowList, ListRow, GistView } = P;
const KIT_DATA = window.LEDGER_DATA;
const KIT_GISTS = window.LEDGER_GISTS || {};
const KIT_DAY = KIT_DATA.order[KIT_DATA.order.length - 1];
const KIT_ED = KIT_DATA.editions[KIT_DAY];
const KIT_RANKED = [...KIT_ED.items].filter(i => !i.hidden && i.category !== "x").sort((a, b) => (a.rank || 99) - (b.rank || 99));
const KIT_BY_ID = Object.fromEntries(KIT_RANKED.map(i => [i.id, i]));
const KIT_USER = { name: "Ada Lovelace", email: "ada@example.com" };
const SITE = "https://aibytes.io/";

function PopupFrame({ theme = "light", signedIn = false, view: view0 = "today", saves: saves0 = [], gist: gist0 = null }) {
  const [view, setView] = React.useState(view0);
  const [saves, setSaves] = React.useState(saves0);
  const [gistId, setGistId] = React.useState(gist0);
  const [user, setUser] = React.useState(signedIn ? KIT_USER : null);
  const toggle = id => setSaves(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const list = view === "saved" ? KIT_RANKED.filter(i => saves.includes(i.id)) : KIT_RANKED;
  const link = href => <a className="ldg-popup-link" href={href} target="_blank" rel="noreferrer">View on Web →</a>;
  const gistItem = gistId && KIT_BY_ID[gistId];

  return (
    <div className="ldg-popup" data-theme={theme}>
        {gistItem ? (
          <>
            <PopupGistBar backLabel={view === "saved" ? "← Saved" : "← Today"} onBack={() => setGistId(null)} />
            <div className="ldg-popup__scroll ldg-popup__gist ldg-prose"><GistView gist={KIT_GISTS[gistId]} as="panel" /></div>
            <PopupActionBar saved={saves.includes(gistId)} onToggleSave={() => toggle(gistId)}>{link(SITE + "gists/" + gistId)}</PopupActionBar>
          </>
        ) : (
          <>
            <PopupHeader date={KIT_ED.mid} savedCount={saves.length} savedActive={view === "saved"}
              onToggleSaved={() => setView(v => v === "saved" ? "today" : "saved")}
              user={user} onSignIn={() => setUser(KIT_USER)} onSignOut={() => setUser(null)} />
            <div className="ldg-popup__scroll">
              {view === "saved" && list.length === 0 ? (
                <div className="ldg-popup__empty">
                  <p className="ldg-popup__empty-title">No saved items yet.</p>
                  <p>Use the ☆ to save an item. Saved items appear here.</p>
                </div>
              ) : (
                <RowList>{list.map(item => (
                  <ListRow key={item.id} item={item} saved={saves.includes(item.id)} onToggleSave={() => toggle(item.id)} starPos="visual"
                    gistHref={KIT_GISTS[item.id] ? SITE + "gists/" + item.id : undefined}
                    onOpenGist={KIT_GISTS[item.id] ? () => setGistId(item.id) : undefined} />
                ))}</RowList>
              )}
              {view === "today" && <p className="ldg-popup__end">That's the {KIT_ED.short} edition.</p>}
            </div>
            <PopupFooter meta={`${KIT_ED.short} · ${KIT_RANKED.length} items`}>{link(view === "saved" ? SITE + "saved" : SITE + KIT_DAY)}</PopupFooter>
          </>
        )}
    </div>
  );
}

// The six frames. Each renders in its own 400px iframe (?frame=<key>), so the
// page inside is 400px wide like Chrome's popup and ListRow takes its narrow
// layout, exactly as in the extension.
const KIT_FIRST_GIST = KIT_RANKED.find(i => KIT_GISTS[i.id])?.id;
const KIT_THREE = KIT_RANKED.slice(0, 3).map(i => i.id);
const KIT_FRAMES = {
  "today-out": { caption: "Today, signed out" },
  "saved-in": { caption: "Saved, signed in", signedIn: true, view: "saved", saves: KIT_THREE },
  "gist-today": { caption: "A gist, from Today", gist: KIT_FIRST_GIST, saves: [KIT_FIRST_GIST] },
  "today-in-dark": { caption: "Today, signed in (dark)", theme: "dark", signedIn: true, saves: KIT_THREE },
  "saved-empty-dark": { caption: "Saved, empty (dark)", theme: "dark", view: "saved" },
  "gist-saved-dark": { caption: "A gist, from Saved (dark)", theme: "dark", view: "saved", gist: KIT_FIRST_GIST },
};

function AiBytesPopup() {
  const key = new URLSearchParams(location.search).get("frame");
  if (key && KIT_FRAMES[key]) {
    const { caption, ...frame } = KIT_FRAMES[key];
    document.documentElement.dataset.theme = frame.theme || "light";
    return <PopupFrame {...frame} />;
  }
  return (
    <div className="kit-popups">
      {Object.entries(KIT_FRAMES).map(([k, f]) => (
        <figure key={k} className="kit-popup">
          <iframe title={f.caption} src={"?frame=" + k} width="400" height="580" />
          <figcaption>{f.caption}</figcaption>
        </figure>
      ))}
    </div>
  );
}
window.AiBytesPopup = AiBytesPopup;
