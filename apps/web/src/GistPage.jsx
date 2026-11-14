import React from "react";
import { GistView } from "@aibytes/design-system/components/content/GistView.jsx";
import { ListRow } from "@aibytes/design-system/components/content/ListRow.jsx";
import { RowList } from "@aibytes/design-system/components/content/Feed.jsx";
import { AppHeader } from "@aibytes/design-system/components/navigation/AppHeader.jsx";
import { backLink } from "./gistSite.js";
import { GITHUB_URL, SUBSCRIBE_URL } from "./footer.js";
import { GistActions } from "./GistActions.jsx";

// The page at /gists/<slug> (spec AIB-145y-app-gist-pages). One component for
// the build, which renders it to a string, and the browser, which takes the
// markup over: it reads nothing from the browser while rendering. Everything a
// reader owns (saves, theme, sign-in) arrives as props the client fills in
// after mount, so the first client render matches the server's.
//
// The save row and the theme toggle are drawn on the server too: they are the
// same in every render, and only pressing them needs JavaScript. `saved` is the
// set of saved item ids, empty on the server and on the first client render.
//
// `theme` only picks the header's toggle. The shell's own `data-theme` is left
// off until the browser has mounted (`shellTheme`): Ledger's light tokens also
// apply to any element marked light, so a server-written "light" would paint a
// dark-mode reader's page light until mount. The pre-paint script on <html> owns
// the theme until then.
//
// `headerProps` is what AppHeader gets for the account; an empty object, as on
// the server, shows neither Sign in nor an avatar, the same as while Firebase
// restores the session.
export function GistPage({ gist, more = [], theme = "light", shellTheme, onToggleTheme = () => {}, headerProps = {}, banner = null, saved = new Set(), onToggleSave = () => {}, showSubscribe = true }) {
  const back = backLink(gist);
  const own = saved.has(gist.appearances[0]?.item_id);
  const actions = <GistActions saved={own} onToggle={() => onToggleSave(gist.appearances[0].item_id)} />;
  return (
    <div className="app-shell redesign" data-theme={shellTheme}>
      <a className="app-skip" href="#main">Skip to the gist</a>
      <AppHeader theme={theme} onToggleTheme={onToggleTheme} githubUrl={GITHUB_URL} {...headerProps} />
      {banner}
      <main id="main" className="redesign-main" tabIndex={-1}>
        <div className="gist-page">
          {back && <p className="gist-crumb"><a href={back.href}>{`← Back to ${back.label}`}</a></p>}
          <GistView gist={gist} as="page" actions={actions} />
          {more.length > 0 && (
            <section className="gist-more" aria-labelledby="gist-more-h">
              <h2 id="gist-more-h">{`More from ${back?.label}`}</h2>
              <RowList>{more.map((item) => (
                <ListRow key={item.id} item={item} front={item.front_page === true} saved={saved.has(item.id)} onToggleSave={() => onToggleSave(item.id)} starPos="visual" />))}
              </RowList>
            </section>)}
          {showSubscribe && (
            <aside className="weekly-subscribe" aria-label="Subscribe">
              <p className="weekly-subscribe__text"><b>Get aiBytes_ every Monday.</b> The week in AI for developers, in your inbox.</p>
              <a className="ldg-btn ldg-btn--primary weekly-subscribe__action" href={SUBSCRIBE_URL}>Subscribe</a>
            </aside>)}
        </div>
      </main>
    </div>);
}
