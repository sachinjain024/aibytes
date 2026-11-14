import React from "react";
import { GistPanel } from "@aibytes/design-system/components/content/GistPanel.jsx";
import { GistView } from "@aibytes/design-system/components/content/GistView.jsx";
import { StatusMessage } from "@aibytes/design-system/components/content/Feed.jsx";
import { GistActions } from "./GistActions.jsx";
import { loadGistPage } from "./content.js";
import { useSaves } from "./hooks.js";
import { gistPath } from "./route.js";

// The gist panel on a daily, weekly or saved page (spec AIB-145y-app-gist-panel).
// It stays mounted while the slug changes, so focus returns to the card that
// opened it only when it closes. A gist with no file, or a hidden one, calls
// `onMissing` and shows nothing: the feed is still there and the reader loses nothing.
//
// `target` is the item whose star the panel's save row presses: the card that was
// clicked. A reload or a shared link has no card, so the gist's first appearance is used.
export function FeedGistPanel({ slug, target, store, onClose, onMissing, width, onWidthChange }) {
  const [state, setState] = React.useState({ status: "loading", slug });
  const missing = React.useRef(onMissing);
  missing.current = onMissing;
  React.useEffect(() => {
    let live = true;
    setState({ status: "loading", slug });
    loadGistPage(slug).then(
      (data) => { if (!live) return; if (data) setState({ status: "ready", slug, gist: data.gist }); else missing.current(); },
      () => { if (live) setState({ status: "failed", slug }); },
    );
    return () => { live = false; };
  }, [slug]);
  const { has, toggle } = useSaves(store);
  const ready = state.status === "ready" && state.slug === slug;
  let body;
  if (ready) {
    const first = state.gist.appearances[0];
    const own = target && target.slug === slug ? target
      : { id: first.item_id, from: first.edition_date ? { edition_date: first.edition_date } : { issue_slug: first.issue_slug } };
    body = <GistView gist={state.gist} as="panel" actions={<GistActions saved={has(own.id)} onToggle={() => toggle({ id: own.id }, own.from)} />} />;
  } else {
    body = (
      <div className="gist-panel-status"><StatusMessage role={state.status === "failed" ? "alert" : "status"}>
        {state.status === "failed" ? "Could not load this gist. Try again." : "Loading the gist…"}</StatusMessage></div>);
  }
  return (
    <GistPanel gist={ready ? state.gist : { slug }} pageHref={gistPath(slug)} onClose={onClose} width={width} onWidthChange={onWidthChange}>
      {body}
    </GistPanel>);
}
