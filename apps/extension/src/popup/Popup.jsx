// The popup's Today list (spec AIB-76n extension-popup). The cached edition
// paints on the first render, then the fetched one replaces it. States:
// loading and failed with nothing cached, failed with a cache (the cached
// list under a note), and refused (an unknown schema_version: no rows).
// Stars and Saved are T10, the gist view and the link handler T11.
import React from "react";
import { PopupHeader } from "@aibytes/design-system/components/extension/PopupHeader.jsx";
import { PopupFooter } from "@aibytes/design-system/components/extension/PopupFooter.jsx";
import { ListRow } from "@aibytes/design-system/components/content/ListRow.jsx";
import { RowList } from "@aibytes/design-system/components/content/Feed.jsx";
import { Button } from "@aibytes/design-system/components/forms/Button.jsx";
import { midDate, shortDate } from "@aibytes/app-core/format.js";
import { Refused, loadToday, readCache, todayItems, writeCache } from "../content.js";
import { todayUrl } from "../links.js";
import { t } from "../copy.js";

/**
 * storage: the popup's localStorage (or null); fetch: window.fetch; site: the
 * aibytes.io origin; onSignIn: opens onboarding; onFirstRender(ms, fromCache).
 */
export function Popup({ storage, fetch, site, onSignIn, onFirstRender }) {
  const [state, setState] = React.useState(() => {
    const cached = readCache(storage);
    return { edition: cached, status: "loading", fromCache: Boolean(cached) };
  });
  const [attempt, setAttempt] = React.useState(0);

  React.useLayoutEffect(() => { onFirstRender?.(performance.now(), state.fromCache); }, []);

  React.useEffect(() => {
    let live = true;
    loadToday({ fetch, base: new URL("/content/", site) }).then(
      (edition) => {
        if (!live) return;
        writeCache(storage, edition);
        setState({ edition, status: "ok", fromCache: false });
      },
      (error) => {
        if (live) setState((s) => ({ ...s, status: error instanceof Refused ? "refused" : "error" }));
      },
    );
    return () => { live = false; };
  }, [attempt, fetch, site, storage]);

  const retry = () => { setState((s) => ({ ...s, status: "loading" })); setAttempt((n) => n + 1); };
  const { edition, status } = state;
  const shown = status === "refused" ? null : edition;
  const items = React.useMemo(() => (shown ? todayItems(shown) : []), [shown]);
  const day = shown && shortDate(shown.date);

  return (
    <div className="ldg-popup">
      <PopupHeader date={shown ? midDate(shown.date) : undefined} onSignIn={onSignIn} labels={{ signIn: t("pop.signin"), saved: t("pop.savedbtn") }} />
      <div className="ldg-popup__scroll">
        {status === "refused" ? (
          <div className="ldg-popup__empty" role="alert"><p className="ldg-popup__empty-title">{t("pop.refused")}</p></div>
        ) : shown ? (
          <>
            {status === "error" && <p className="ldg-popup__end" role="status">{t("pop.stale", { date: day })}</p>}
            <RowList>{items.map((item) => <ListRow key={item.id} item={item} front={item.front_page === true} starPos="visual" />)}</RowList>
            <p className="ldg-popup__end">{t("pop.end", { date: day })}</p>
          </>
        ) : status === "error" ? (
          <div className="ldg-popup__empty" role="alert">
            <p className="ldg-popup__empty-title">{t("pop.error")}</p>
            <p><Button variant="secondary" onClick={retry}>{t("pop.retry")}</Button></p>
          </div>
        ) : (
          <div className="ldg-popup__empty" role="status" aria-busy="true"><p>{t("pop.loading")}</p></div>
        )}
      </div>
      {shown && (
        <PopupFooter meta={t("pop.foot.meta", { date: day, count: items.length })}>
          <a className="ldg-popup-link" href={todayUrl(site, shown.date)} target="_blank" rel="noreferrer">{t("pop.site")}</a>
        </PopupFooter>
      )}
    </div>
  );
}
