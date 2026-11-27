// The prototype's reader-facing strings, kept in one table so the Copy screen
// can list them, take edits, and show those edits live in the prototype.
//
// A row: { key, where, text, when? }
//   key   - stable id the components ask for: t("onb.h1")
//   where - "Screen › place", shown on the Copy screen; put the choice in
//           brackets when only one choice renders it: "Popup › Sign-in prompt (C2)"
//   text  - the current string; {name} placeholders are filled by t(key, vars)
//   when  - opts => boolean; the Copy screen lists the row only while the
//           selected choices render it. Leave it out for strings every choice shows.

export function makeCopy(rows) {
  const byKey = Object.fromEntries(rows.map(r => [r.key, r]));
  let drafts = {};
  const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
  return {
    rows,
    /** The string for `key`: the reviewer's draft when there is one, else the table's. */
    t(key, vars = {}) {
      const row = byKey[key];
      if (!row) throw new Error("No copy row " + key);
      const draft = drafts[key];
      return fill(draft && draft.trim() ? draft : row.text, vars);
    },
    setDrafts(d) { drafts = d || {}; },
  };
}

/** The changed rows as plain text, for the clipboard or a comment to Claude. */
export function changesText(title, rows, drafts) {
  const changed = rows.filter(r => drafts[r.key] && drafts[r.key].trim() && drafts[r.key].trim() !== r.text);
  if (!changed.length) return "";
  const lines = [`${title}: ${changed.length} copy change${changed.length === 1 ? "" : "s"}`, ""];
  changed.forEach((r, i) => {
    lines.push(`${i + 1}. ${r.where}  [${r.key}]`, `   Was: ${r.text}`, `   Now: ${drafts[r.key].trim()}`, "");
  });
  return lines.join("\n").trimEnd();
}
