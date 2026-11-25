// chrome.storage.local, made to look like the synchronous Storage localSaves
// expects (spec AIB-76n extension-popup). Signed-out saves live there, not in
// the popup's localStorage, so the background can merge them on sign-in. The
// load fills a copy before the popup draws its stars; writes go through to
// chrome.storage.local; a change made elsewhere (the background's merge clears
// the saves) updates the copy and arrives as a `storage` event, as another
// tab's write does on the site. Only the saves key is copied.
import { SAVES_KEY } from "@aibytes/app-core/saves.js";

export async function extensionStorage(chrome, key = SAVES_KEY) {
  const area = chrome.storage.local;
  const copy = new Map();
  const found = await area.get(key);
  if (found && typeof found[key] === "string") copy.set(key, found[key]);

  // A rejected write is logged, not thrown: localSaves has already updated its
  // list, so the change holds for this popup, as on a site whose storage throws.
  const quietly = (promise) => Promise.resolve(promise).catch((error) => console.warn("chrome.storage.local:", error));

  const storage = {
    getItem: (k) => (copy.has(k) ? copy.get(k) : null),
    setItem(k, value) {
      copy.set(k, String(value));
      quietly(area.set({ [k]: String(value) }));
    },
    removeItem(k) {
      copy.delete(k);
      quietly(area.remove(k));
    },
  };

  const listeners = new Set();
  const onChanged = (changes, areaName) => {
    if (areaName !== "local" || !(key in changes)) return;
    const value = changes[key].newValue;
    const next = typeof value === "string" ? value : null;
    // Our own write, echoed back: the copy already has it.
    if (next === storage.getItem(key)) return;
    if (next === null) copy.delete(key); else copy.set(key, next);
    listeners.forEach((listener) => listener({ key }));
  };

  const events = {
    addEventListener(type, listener) {
      if (type !== "storage") return;
      if (!listeners.size) chrome.storage.onChanged.addListener(onChanged);
      listeners.add(listener);
    },
    removeEventListener(type, listener) {
      if (type !== "storage" || !listeners.delete(listener)) return;
      if (!listeners.size) chrome.storage.onChanged.removeListener(onChanged);
    },
  };

  return { storage, events };
}
