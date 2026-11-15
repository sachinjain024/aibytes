// Gist reactions in Firestore (spec AIB-145y-app-reactions): the eight keys, the
// store the page and the panel press through, and the small pure helpers the screen
// uses. `db` and `uid` are passed in, as for the saves store, so the emulator tests
// drive this exact code under firestore.rules.
//
// Two documents per gist: gist_reaction_counts/{slug} (everyone's numbers, public)
// and gist_reactions/{slug}/by/{uid} (what this reader chose, theirs alone). A press
// writes both in one batch, with no read first: the counts move by increment, so two
// readers pressing at once do not refuse each other.
import { doc, getDoc, increment, serverTimestamp, writeBatch } from "firebase/firestore";
import { KEYS } from "./reactionKeys.js";

export { barProps, KEYS, LEDGER_EMOJI, pressed, zeroTotals } from "./reactionKeys.js";

const whole = (n) => (Number.isInteger(n) && n >= 0 ? n : 0);
const totalsOf = (data) => Object.fromEntries(KEYS.map((k) => [k.key, whole(data?.[k.key])]));
const known = new Set(KEYS.map((k) => k.key));

export function reactions(db, uid) {
  // The reader's set per slug, once it has loaded. A press before that does nothing:
  // a stale empty set would write the wrong `picked` and the wrong increment sign.
  const mineBy = new Map();
  const countsRef = (slug) => doc(db, "gist_reaction_counts", slug);
  const readerRef = (slug) => doc(db, "gist_reactions", slug, "by", uid);

  return {
    signedIn: Boolean(uid),
    /**
     * Never rejects. `totals` is everyone's numbers, the reader included (eight zeros for
     * a gist nobody reacted to), or null when the read failed; `mine` is the reader's own
     * keys (empty when signed out), or null when that read failed.
     */
    async load(slug) {
      const [counts, own] = await Promise.all([
        Promise.resolve().then(() => getDoc(countsRef(slug))).then((snap) => totalsOf(snap.data()), () => null),
        uid ? Promise.resolve().then(() => getDoc(readerRef(slug))).then((snap) => (snap.data()?.picked || []).filter((k) => known.has(k)), () => null) : [],
      ]);
      if (own) mineBy.set(slug, own); else mineBy.delete(slug);
      return { totals: counts, mine: own };
    },
    /** Add or remove one key. One batch; rejects, changing nothing, when the rules refuse it. */
    async toggle(slug, key) {
      const mine = mineBy.get(slug);
      if (!uid || !mine || !known.has(key)) return;
      const on = mine.includes(key);
      const next = on ? mine.filter((k) => k !== key) : [...mine, key];
      const batch = writeBatch(db);
      if (next.length) batch.set(readerRef(slug), { picked: next, updated_at: serverTimestamp() });
      else batch.delete(readerRef(slug));
      batch.set(countsRef(slug), Object.fromEntries(KEYS.map((k) => [k.key, increment(k.key === key ? (on ? -1 : 1) : 0)])), { merge: true });
      await batch.commit();
      mineBy.set(slug, next);
    },
  };
}
