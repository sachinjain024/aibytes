// The Copy screen: every string the selected choices show, where it appears,
// and a box for the reviewer's version. Edits show live in the prototype.
// "Copy changes" puts them on the clipboard; "Send to Claude" posts them as a
// comment thread sent to Claude, through the page's `comments` capability
// (published with capabilities: { comments: {} }). Opened as a local file, or
// where the platform does not offer sending, only Copy changes is shown.
import React from "react";
import { changesText } from "./copy.js";

const LIMIT = 4000; // a comment is at most 4 KiB of UTF-8

function useComments() {
  const [state, setState] = React.useState({ api: null, can: "off" });
  React.useEffect(() => {
    let live = true;
    const c = window.claude;
    if (!c || typeof c.use !== "function") return;
    c.use("comments").then(async api => {
      if (!live || !api) return;
      let can = "off";
      try { can = await api.canSendToClaude(); } catch { can = "off"; }
      if (live) setState({ api, can });
    }, () => {});
    return () => { live = false; };
  }, []);
  return state;
}

async function copyToClipboard(text, fallbackEl) {
  try { await navigator.clipboard.writeText(text); return true; } catch {}
  try { fallbackEl.select(); return document.execCommand("copy"); } catch { return false; }
}

export function CopyScreen({ title, rows, drafts, setDrafts, opts, letterOf }) {
  const [all, setAll] = React.useState(false);
  const [status, setStatus] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const out = React.useRef(null);
  const section = React.useRef(null);
  const { api, can } = useComments();

  const shown = rows.filter(r => all || !r.when || r.when(opts));
  const groups = [];
  shown.forEach(r => {
    const screen = r.where.split(" › ")[0];
    let g = groups.find(x => x.screen === screen);
    if (!g) groups.push(g = { screen, rows: [] });
    g.rows.push(r);
  });
  const text = changesText(title, rows, drafts);
  const count = text ? rows.filter(r => drafts[r.key] && drafts[r.key].trim() && drafts[r.key].trim() !== r.text).length : 0;
  const selected = Object.entries(opts).map(([k, n]) => letterOf(k) + n).filter(Boolean).join(" ");

  const copy = async () => {
    const ok = await copyToClipboard(text, out.current);
    setStatus(ok ? `Copied ${count} change${count === 1 ? "" : "s"}.` : "Copy failed. Select the text below and copy it.");
  };
  const send = async () => {
    if (!api || busy) return;
    if (new TextEncoder().encode(text).length > LIMIT) { setStatus("Too long for one comment. Use Copy changes instead."); return; }
    setBusy(true);
    try {
      const anchor = await api.anchorFor(section.current);
      await api.sendToClaude({ anchor, text });
      setStatus("Sent to Claude as a comment on this page.");
    } catch (e) {
      setStatus(e && e.code === "not_granted" ? "Sending needs your permission. Use Copy changes instead." : "Could not send. Use Copy changes instead.");
    } finally { setBusy(false); }
  };

  return (
    <div className="kit-copy" ref={section}>
      <header className="kit-copy-head">
        <h1>Copy</h1>
        <p>Every string shown by the selected choices ({selected}). Type a new version in the right-hand box: it shows in the prototype straight away. Then copy the changes or send them to Claude.</p>
        <label className="kit-copy-all"><input type="checkbox" checked={all} onChange={e => setAll(e.target.checked)} /> Include strings from choices that aren't selected</label>
      </header>
      {groups.map(g => (
        <section key={g.screen} className="kit-copy-group" aria-labelledby={"kc-" + g.screen}>
          <h2 id={"kc-" + g.screen}>{g.screen}</h2>
          <div className="kit-copy-table" role="table">
            <div className="kit-copy-row kit-copy-row--head" role="row">
              <span role="columnheader">Where</span><span role="columnheader">Current</span><span role="columnheader">New</span>
            </div>
            {g.rows.map(r => {
              const draft = drafts[r.key] || "";
              const changed = draft.trim() && draft.trim() !== r.text;
              return (
                <div key={r.key} className={"kit-copy-row" + (changed ? " is-changed" : "")} role="row">
                  <span role="cell" className="kit-copy-where">{r.where.split(" › ").slice(1).join(" › ")}<code>{r.key}</code></span>
                  <span role="cell" className="kit-copy-current">{r.text}</span>
                  <span role="cell">
                    <textarea aria-label={"New text for " + r.where} rows={Math.min(4, Math.max(1, Math.ceil(r.text.length / 48)))}
                      placeholder={r.text} value={draft} onChange={e => setDrafts({ ...drafts, [r.key]: e.target.value })} />
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      ))}
      <div className="kit-copy-bar">
        <span className="kit-copy-count">{count ? `${count} change${count === 1 ? "" : "s"}` : "No changes yet"}</span>
        {status && <span className="kit-copy-status" role="status">{status}</span>}
        <button className="ldg-btn ldg-btn--ghost" disabled={!count} onClick={() => { setDrafts({}); setStatus(null); }}>Clear</button>
        <button className="ldg-btn ldg-btn--secondary" disabled={!count} onClick={copy}>Copy changes</button>
        {api && can !== "off" && (
          <button className="ldg-btn ldg-btn--primary" disabled={!count || busy || can !== "available"} onClick={send}
            title={can === "available" ? "" : can === "writers_only" ? "Only people who can edit this page can send to Claude" : "No Claude session is listening right now"}>
            {busy ? "Sending…" : "Send to Claude"}
          </button>
        )}
      </div>
      <textarea ref={out} className="kit-copy-out" readOnly value={text} aria-label="The changes as text" tabIndex={-1} />
    </div>
  );
}
