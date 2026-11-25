// The popup (spec AIB-76n extension-popup): Today and Saved, signed out.
// Today: the cached edition paints on the first render, then the fetched one
// replaces it; its states are loading and failed with nothing cached, failed
// with a cache (the cached list under a note), and refused (an unknown
// schema_version: no rows). Saved: /saved's list, loaded the way /saved loads
// it, in sections newest first. Stars appear once chrome.storage.local has
// been read, which happens after the first render so it never delays the
// cache paint. The gist view and the link handler are T11.
import React from "react";
import { PopupHeader } from "@aibytes/design-system/components/extension/PopupHeader.jsx";
import { PopupFooter } from "@aibytes/design-system/components/extension/PopupFooter.jsx";
import { ListRow } from "@aibytes/design-system/components/content/ListRow.jsx";
import { RowList } from "@aibytes/design-system/components/content/Feed.jsx";
import { SectionHeading } from "@aibytes/design-system/components/content/SectionHeading.jsx";
import { Button } from "@aibytes/design-system/components/forms/Button.jsx";
import { midDate, shortDate } from "@aibytes/app-core/format.js";
import { leftOutNote, savedGroups } from "@aibytes/app-core/saved.js";
import { Refused, loadSaved, loadToday, readCache, todayItems, writeCache } from "../content.js";
import { savedUrl, todayUrl } from "../links.js";
import { t } from "../copy.js";

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

// A row with its star, once the store is there. `from` names the item's file.
function Row({ item, store, saves, from }) {
  const saved = saves.some((s) => s.item_id === item.id);
  return <ListRow item={item} front={item.front_page === true} starPos="visual" saved={saved}
    onToggleSave={store ? () => store.toggle(item, from) : undefined} />;
}

const Message = ({ role = "status", title, children }) => (
  <div className="ldg-popup__empty" role={role}>
    {title && <p className="ldg-popup__empty-title">{title}</p>}
    {children}
  </div>
);

/**
 * storage: the popup's localStorage (or null); fetch: window.fetch; site: the
 * aibytes.io origin; openSaves: resolves to the saves store; onSignIn: opens
 * onboarding; onFirstRender(ms, fromCache).
 */
export function Popup({ storage, fetch, site, openSaves, onSignIn, onFirstRender }) {
  const base = React.useMemo(() => new URL("/content/", site), [site]);
  const [today, setToday] = React.useState(() => {
    const cached = readCache(storage);
    return { edition: cached, status: "loading", fromCache: Boolean(cached) };
  });
  const [attempt, setAttempt] = React.useState(0);
  const [view, setView] = React.useState("today");
  const { store, saves } = useSaves(openSaves);

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

  const retry = () => { setToday((s) => ({ ...s, status: "loading" })); setAttempt((n) => n + 1); };
  const shown = today.status === "refused" ? null : today.edition;
  const items = React.useMemo(() => (shown ? todayItems(shown) : []), [shown]);
  const day = shown && shortDate(shown.date);
  const onSaved = view === "saved";

  return (
    <div className="ldg-popup">
      <PopupHeader date={shown ? midDate(shown.date) : undefined} onSignIn={onSignIn}
        savedCount={saves.length} savedActive={onSaved}
        onToggleSaved={store ? () => setView((v) => (v === "saved" ? "today" : "saved")) : undefined}
        labels={{ signIn: t("pop.signin"), saved: t("pop.savedbtn") }} />
      <div className="ldg-popup__scroll">
        {onSaved ? (
          <Saved fetch={fetch} base={base} store={store} saves={saves} />
        ) : today.status === "refused" ? (
          <Message role="alert" title={t("pop.refused")} />
        ) : shown ? (
          <>
            {today.status === "error" && <p className="ldg-popup__end" role="status">{t("pop.stale", { date: day })}</p>}
            <RowList>{items.map((item) => <Row key={item.id} item={item} store={store} saves={saves} from={{ edition_date: shown.date }} />)}</RowList>
            <p className="ldg-popup__end">{t("pop.end", { date: day })}</p>
          </>
        ) : today.status === "error" ? (
          <Message role="alert" title={t("pop.error")}>
            <p><Button variant="secondary" onClick={retry}>{t("pop.retry")}</Button></p>
          </Message>
        ) : (
          <div className="ldg-popup__empty" role="status" aria-busy="true"><p>{t("pop.loading")}</p></div>
        )}
      </div>
      {(shown || onSaved) && (
        <PopupFooter meta={shown ? t("pop.foot.meta", { date: day, count: items.length }) : ""}>
          <a className="ldg-popup-link" href={onSaved ? savedUrl(site) : todayUrl(site, shown.date)} target="_blank" rel="noreferrer">{t("pop.site")}</a>
        </PopupFooter>
      )}
    </div>
  );
}

// The files a set of saves names, as a stable key: a new star from a file
// already loaded asks for nothing.
const fileKeys = (saves) => [...new Set(saves.map((s) => (s.edition_date ? "e:" + s.edition_date : "i:" + s.issue_slug)))].sort().join(" ");

// Saved, as /saved: sections newest first, ranked inside, the left-out note
// above them. The last load stays on screen while a new one runs.
function Saved({ fetch, base, store, saves }) {
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
              <RowList>{group.items.map((item) => <Row key={item.id} item={item} store={store} saves={saves} from={group.from} />)}</RowList>
            </>
          )}
        </section>
      ))}
    </>
  );
}
