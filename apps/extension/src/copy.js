// The popup's copy (spec AIB-76n extension-popup): the pop.* strings agreed in
// docs/ux/prototypes/AIB-76n-extension/copy.js, word for word. The popup owns
// its wording; Ledger only draws.
const POP = {
  "pop.savedbtn": "Saved items",
  "pop.signin": "Sign in",
  "pop.empty.title": "No saved items yet.",
  "pop.empty.body": "Use the ☆ to save an item. Saved items appear here.",
  "pop.end": "That's the {date} edition.",
  "pop.foot.meta": "{date} · {count} items",
  "pop.site": "View on Web",
  "pop.back.today": "← Today",
  "pop.back.saved": "← Saved",
  "pop.gist.save": "Save",
  "pop.gist.saved": "Saved",
  "pop.menu.signout": "Sign out",
  "pop.loading": "Loading today's edition…",
  "pop.error": "Couldn't load today's edition.",
  "pop.retry": "Try again",
  "pop.stale": "Showing {date}. Couldn't check for a newer edition.",
  "pop.refused": "Update aiBytes_ to read this edition.",
};

/** The string for `key`, with each {name} filled from `vars`. An unknown key throws. */
export function t(key, vars = {}) {
  if (!(key in POP)) throw new Error(`no copy for ${key}`);
  return POP[key].replace(/\{(\w+)\}/g, (whole, name) => (name in vars ? String(vars[name]) : whole));
}
