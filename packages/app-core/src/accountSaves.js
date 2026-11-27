// Saves in the reader's account, users/{uid}/saves in Firestore (spec AIB-75v
// app-accounts): the same interface as localSaves, so the app swaps stores on
// sign-in and no component learns where saves live. `db` is passed in, so the
// emulator tests drive this exact code under firestore.rules.
//
// One onSnapshot listener, opened by the first subscriber, keeps the list:
// newest first, the same array until a snapshot changes it. A toggle writes and
// returns at once; Firestore applies the write to the local snapshot before the
// server answers, so the star fills without waiting, and a rejected write is
// rolled back by the next snapshot.
import { collection, deleteDoc, doc, getDocs, onSnapshot, orderBy, query, setDoc, writeBatch } from "firebase/firestore";
import { toDoc, toSave } from "./accountData.js";
import { toAdd } from "./merge.js";

const savesOf = (db, uid) => collection(db, "users", uid, "saves");
const savesIn = (snapshot) => snapshot.docs.map((d) => toSave(d.id, d.data())).filter(Boolean);

export function accountSaves(db, uid, { onError = () => {} } = {}) {
  let saves = [];
  let stop = null;
  const listeners = new Set();

  return {
    list: () => saves,
    has: (itemId) => saves.some((save) => save.item_id === itemId),
    /** Save or unsave `item`. Throws, without writing, on what the rules would refuse. */
    toggle(item, from) {
      const data = toDoc(item, from);
      const saved = !saves.some((save) => save.item_id === item.id);
      const ref = doc(savesOf(db, uid), item.id);
      (saved ? setDoc(ref, data) : deleteDoc(ref)).catch(onError);
      return { saved, kept: true };
    },
    /** Call `listener` on every change, from this tab or any other device. Returns the unsubscribe. */
    subscribe(listener) {
      if (!stop) {
        stop = onSnapshot(query(savesOf(db, uid), orderBy("created_at", "desc")), (snapshot) => {
          saves = savesIn(snapshot);
          listeners.forEach((l) => l());
        }, onError);
      }
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        if (!listeners.size && stop) { stop(); stop = null; }
      };
    },
  };
}

// Firestore's limit on writes in one batch.
const BATCH = 500;

/**
 * Adds the `local` saves the account lacks, keeping their created_at; the
 * account's copy wins. Resolves to the number added once every batch has
 * committed, so the caller clears local storage only then; rejects otherwise.
 */
export async function mergeInto(db, uid, local) {
  if (!local.length) return 0;
  const adding = toAdd(local, savesIn(await getDocs(savesOf(db, uid))));
  for (let i = 0; i < adding.length; i += BATCH) {
    const batch = writeBatch(db);
    for (const save of adding.slice(i, i + BATCH)) {
      batch.set(doc(savesOf(db, uid), save.item_id), toDoc({ id: save.item_id }, save, new Date(save.created_at)));
    }
    await batch.commit();
  }
  return adding.length;
}
