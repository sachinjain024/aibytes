// The eight gist reactions as data, and the pure helpers the screen uses (spec
// AIB-145y-app-reactions). No Firebase in here: hooks.js and GistActions import it
// on the first paint, and the store (reactions.js) loads with Firebase after it.

/** The eight, in the Ledger bar's order. Firestore holds the key, never the emoji. */
export const KEYS = [
  { key: "plus1", emoji: "👍" },
  { key: "minus1", emoji: "👎" },
  { key: "laugh", emoji: "😄" },
  { key: "hooray", emoji: "🎉" },
  { key: "confused", emoji: "😕" },
  { key: "heart", emoji: "❤️" },
  { key: "rocket", emoji: "🚀" },
  { key: "eyes", emoji: "👀" },
];
/** The same emoji, as Ledger's REACTIONS lists them (the test pins the two together). */
export const LEDGER_EMOJI = KEYS.map((k) => k.emoji);

export const zeroTotals = () => Object.fromEntries(KEYS.map((k) => [k.key, 0]));

/** The screen's change for one press: the key on or off, and its total one up or down. */
export function pressed({ totals, mine }, key) {
  const on = mine.includes(key);
  return {
    totals: { ...totals, [key]: Math.max(0, (totals[key] || 0) + (on ? -1 : 1)) },
    mine: on ? mine.filter((k) => k !== key) : [...mine, key],
  };
}

/**
 * What ReactionBar takes. The store's totals include the reader; the bar wants
 * everyone else's, keyed by emoji, and adds `mine` itself, so each held key's total
 * loses one here. Passing totals straight in would count a signed-in press twice.
 */
export function barProps({ totals, mine }) {
  const counts = {};
  for (const { key, emoji } of KEYS) counts[emoji] = Math.max(0, (totals[key] || 0) - (mine.includes(key) ? 1 : 0));
  return { counts, mine: KEYS.filter((k) => mine.includes(k.key)).map((k) => k.emoji) };
}

/**
 * What a press does, decided from what is known; the hook acts on the answer.
 * "ignore": the session is still restoring, or the last press is still being written.
 * "ask": signed out, so show the sign-in line and write nothing.
 * "hold": signed in but the reader's own set is not known, so write nothing
 * (a stale empty set would write the wrong `picked` and the wrong increment sign).
 * "write": apply it and write.
 */
export function planPress({ user, mineKnown, writing }) {
  if (user === undefined) return "ignore";
  if (!user) return "ask";
  if (!mineKnown) return "hold";
  return writing ? "ignore" : "write";
}
