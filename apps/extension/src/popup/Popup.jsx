// The popup (spec AIB-76n extension-popup): Today, Saved and a gist; signed in
// (extension-auth), the header shows the avatar and the stars are the account's.
// Today: the cached edition paints on the first render, then the fetched one
// replaces it; its states are loading and failed with nothing cached, failed
// with a cache (the cached list under a note), and refused (an unknown
// schema_version: no rows). Saved: /saved's list, loaded the way /saved loads
// it, in sections newest first. Stars appear once chrome.storage.local has
// been read, which happens after the first render so it never delays the
// cache paint. A row with a gist opens it in the popup; Back returns to the
// list where it was. The popup never navigates itself: every web link opens
// in a new tab.
import React from "react";
import { PopupHeader } from "@aibytes/design-system/components/extension/PopupHeader.jsx";
import { PopupFooter } from "@aibytes/design-system/components/extension/PopupFooter.jsx";
import { ListRow } from "@aibytes/design-system/components/content/ListRow.jsx";
import { RowList } from "@aibytes/design-system/components/content/Feed.jsx";
import { SectionHeading } from "@aibytes/design-system/components/content/SectionHeading.jsx";
import { Button } from "@aibytes/design-system/components/forms/Button.jsx";
import { withRef } from "@aibytes/design-system/components/content/withRef.js";
import { midDate, shortDate } from "@aibytes/app-core/format.js";
import { leftOutNote, savedGroups } from "@aibytes/app-core/saved.js";
import { Refused, loadGist, loadSaved, loadToday, readCache, todayItems, writeCache } from "../content.js";
import { gistUrl, savedUrl, tabHref, todayUrl } from "../links.js";
import { t } from "../copy.js";
import { GistPanel } from "./GistPanel.jsx";

const NONE = [];
const noSubscribe = () => () => {};

// The saves store once openSaves() resolves, and its list, kept in step.
function useSaves(openSaves) {
  const [store, setStore] = React.useState(null);
  React.useEffect(() => {
    let live = true;
    openSaves?.().then((s) => { if (live) setStore(s); }, (error) => console.warn("Saves unavailable:", error));
    return () => { live = false; };
  }, [openSaves]);
  const saves = React.useSyncExternalStore(store ? store.subscribe : noSubscribe, store ? store.list : () => NONE);
  return { store, saves };
}

// What a row needs from the popup: the site, the store, and opening a gist.
const RowContext = React.createContext(null);

// A row with its star once the store is there, and its gist if it has one.
// `from` names the item's file.
function Row({ item, from }) {
  const { site, store, saves, openGist } = React.useContext(RowContext);
  const saved = saves.some((s) => s.item_id === item.id);
  const gist = item.gist ? { gistHref: gistUrl(site, item.gist), onOpenGist: () => openGist(item, from) } : {};
  return <ListRow item={item} front={item.front_page === true} starPos="visual" saved={saved}
    onToggleSave={store ? () => store.toggle(item, from) : undefined} {...gist} />;
}

const Message = ({ role = "status", title, children }) => (
  <div className="ldg-popup__empty" role={role}>
    {title && <p className="ldg-popup__empty-title">{title}</p>}
    {children}
  </div>
);

/**
 * storage: the popup's localStorage (or null); fetch: window.fetch; site: the
 * aibytes.io origin; openSaves: resolves to the saves store; openTab(url):
 * chrome.tabs.create; onSignIn: opens onboarding; user: the signed-in reader
 * or null (useAccount); onSignOut: the avatar menu's Sign out;
 * onFirstRender(ms, fromCache).
 */
export function Popup({ storage, fetch, site, openSaves, openTab, onSignIn, user, onSignOut, onFirstRender }) {
  const base = React.useMemo(() => new URL("/content/", site), [site]);
  const [today, setToday] = React.useState(() => {
    const cached = readCache(storage);
    return { edition: cached, status: "loading", fromCache: Boolean(cached) };
  });
  const [attempt, setAttempt] = React.useState(0);
  const [view, setView] = React.useState("today");
  const [open, setOpen] = React.useState(null); // { gist, item, from }
  const { store, saves } = useSaves(openSaves);
  const scroller = React.useRef(null);
  const scrollTop = React.useRef({ today: 0, saved: 0 });

  React.useLayoutEffect(() => { onFirstRender?.(performance.now(), today.fromCache); }, []);

  React.useEffect(() => {
    let live = true;
    loadToday({ fetch, base }).then(
      (edition) => {
        if (!live) return;
        writeCache(storage, edition);
        setToday({ edition, status: "ok", fromCache: false });
      },
      (error) => {
        if (live) setToday((s) => ({ ...s, status: error instanceof Refused ? "refused" : "error" }));
      },
    );
    return () => { live = false; };
  }, [attempt, fetch, base, storage]);

  // A gist opens in the popup once its file has loaded; a missing, broken or
  // unknown one opens the item's source in a tab instead.
  const openGist = React.useCallback((item, from) => {
    loadGist({ fetch, base, slug: item.gist }).then(
      (gist) => {
        scrollTop.current[view] = scroller.current?.scrollTop ?? 0;
        setOpen({ gist, item, from });
      },
      (error) => {
        console.warn(`Gist ${item.gist} unavailable, opening the source:`, error);
        openTab(withRef(item.url)); // as the row's own title link would
      },
    );
  }, [fetch, base, openTab, view]);

  // Back: the list as it was, scrolled where it was.
  React.useLayoutEffect(() => {
    if (!open && scroller.current) scroller.current.scrollTop = scrollTop.current[view];
  }, [open, view]);

  // Every web link opens in a tab; the popup itself never navigates.
  const onLink = (event) => {
    const href = tabHref(event);
    if (!href) return;
    event.preventDefault();
    openTab(href);
  };

  const retry = () => { setToday((s) => ({ ...s, status: "loading" })); setAttempt((n) => n + 1); };
  const shown = today.status === "refused" ? null : today.edition;
  const items = React.useMemo(() => (shown ? todayItems(shown) : []), [shown]);
  const day = shown && shortDate(shown.date);
  const onSaved = view === "saved";
  const rows = React.useMemo(() => ({ site, store, saves, openGist }), [site, store, saves, openGist]);
  const toggleView = () => {
    scrollTop.current[view] = scroller.current?.scrollTop ?? 0;
    setView((v) => (v === "saved" ? "today" : "saved"));
  };

  return (
    <div className="ldg-popup" onClick={onLink} onAuxClick={onLink}>
      {open && (
        <GistPanel gist={open.gist} site={site} back={view}
          saved={saves.some((s) => s.item_id === open.item.id)}
          onToggleSave={() => store?.toggle(open.item, open.from)}
          onBack={() => setOpen(null)} />
      )}
      {/* The list stays mounted under a gist, so Back finds it as it was. */}
      <div style={{ display: open ? "none" : "contents" }}>
        {/* Neither Sign in nor the avatar while the session restores (user undefined). */}
        <PopupHeader date={shown ? midDate(shown.date) : undefined}
          onSignIn={user === undefined ? undefined : onSignIn}
          user={user ?? null} onSignOut={onSignOut}
          savedCount={saves.length} savedActive={onSaved}
          onToggleSaved={store ? toggleView : undefined}
          labels={{ signIn: t("pop.signin"), saved: t("pop.savedbtn") }} />
        <div className="ldg-popup__scroll" ref={scroller}>
          <RowContext.Provider value={rows}>
            {onSaved ? (
              <Saved fetch={fetch} base={base} saves={saves} />
            ) : today.status === "refused" ? (
              <Message role="alert" title={t("pop.refused")} />
            ) : shown ? (
              <>
                {today.status === "error" && <p className="ldg-popup__end" role="status">{t("pop.stale", { date: day })}</p>}
                <RowList>{items.map((item) => <Row key={item.id} item={item} from={{ edition_date: shown.date }} />)}</RowList>
                <p className="ldg-popup__end">{t("pop.end", { date: day })}</p>
              </>
            ) : today.status === "error" ? (
              <Message role="alert" title={t("pop.error")}>
                <p><Button variant="secondary" onClick={retry}>{t("pop.retry")}</Button></p>
              </Message>
            ) : (
              <div className="ldg-popup__empty" role="status" aria-busy="true"><p>{t("pop.loading")}</p></div>
            )}
          </RowContext.Provider>
        </div>
        {(shown || onSaved) && (
          <PopupFooter meta={shown ? t("pop.foot.meta", { date: day, count: items.length }) : ""}>
            <a className="ldg-popup-link" href={onSaved ? savedUrl(site) : todayUrl(site, shown.date)} target="_blank" rel="noreferrer">{t("pop.site")}</a>
          </PopupFooter>
        )}
      </div>
    </div>
  );
}

// The files a set of saves names, as a stable key: a new star from a file
// already loaded asks for nothing.
const fileKeys = (saves) => [...new Set(saves.map((s) => (s.edition_date ? "e:" + s.edition_date : "i:" + s.issue_slug)))].sort().join(" ");

// Saved, as /saved: sections newest first, ranked inside, the left-out note
// above them. The last load stays on screen while a new one runs.
function Saved({ fetch, base, saves }) {
  const [loaded, setLoaded] = React.useState({ status: "loading" });
  const keys = fileKeys(saves);
  React.useEffect(() => {
    if (!keys) return undefined;
    let live = true;
    loadSaved({ fetch, base, saves }).then(
      (data) => { if (live) setLoaded({ status: "ready", ...data }); },
      (error) => { if (live) setLoaded({ status: error instanceof Refused ? "refused" : "error" }); },
    );
    return () => { live = false; };
    // Reload when the files change, not on every star: `saves` is read fresh above.
  }, [keys, fetch, base]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!saves.length) return <Message title={t("pop.empty.title")}><p>{t("pop.empty.body")}</p></Message>;
  if (loaded.status === "refused") return <Message role="alert" title={t("pop.refused")} />;
  if (loaded.status === "error") return <Message role="alert" title={t("pop.saved.error")} />;
  if (loaded.status === "loading") return <div className="ldg-popup__empty" role="status" aria-busy="true"><p>{t("pop.saved.loading")}</p></div>;

  const { groups, leftOut } = savedGroups(saves, loaded);
  const note = leftOutNote(leftOut);
  return (
    <>
      {note && <p className="ldg-popup__end">{note}</p>}
      {groups.map((group) => (
        <section key={group.key} aria-label={group.label}>
          {group.status === "error" ? (
            <p className="ldg-popup__end" role="alert">{t(group.kind === "edition" ? "pop.saved.edition.error" : "pop.saved.issue.error", { label: group.label })}</p>
          ) : group.status === "ready" && (
            <>
              <SectionHeading name={group.label} count={group.items.length} />
              <RowList>{group.items.map((item) => <Row key={item.id} item={item} from={group.from} />)}</RowList>
            </>
          )}
        </section>
      ))}
    </>
  );
}
