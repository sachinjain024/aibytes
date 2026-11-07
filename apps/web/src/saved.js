// The Saved page's rules (spec AIB-75v app-saved-view), as pure functions so
// node --test covers them; App.jsx only loads the files and renders.
//
// A save names its file: an edition by date or a weekly issue by slug. The page
// loads only those files, then shows one section per file, newest first, with
// editions and issues interleaved by date (an issue by its published_on). Inside
// a section the items keep the feed's order: the whole file is ranked, hidden
// items included, then filtered to the saved ones. A save whose item is hidden,
// gone from its file, or whose file is gone from its index is left out and
// counted for the note; the save itself is kept (D2).
import { midDate, shortDate } from "./format.js";
import { rankedItems } from "./order.js";

const keyOf = (save) => (save.edition_date ? "edition:" + save.edition_date : "issue:" + save.issue_slug);

// The file a save points at, if its index still lists it.
function fileOf(save, editions, issues) {
  if (save.edition_date) {
    const ref = editions.find((r) => r.date === save.edition_date);
    return ref && { key: keyOf(save), kind: "edition", ref };
  }
  const ref = issues.find((r) => r.slug === save.issue_slug);
  return ref && { key: keyOf(save), kind: "issue", ref };
}

/** [{ key, kind, ref }]: each edition and issue the saves point at, once, if its index lists it. */
export function filesToLoad(saves, editions, issues) {
  const files = new Map();
  for (const save of saves) {
    const file = fileOf(save, editions, issues);
    if (file && !files.has(file.key)) files.set(file.key, file);
  }
  return [...files.values()];
}

/**
 * `files` maps a file's key to { status: "loading" | "ready" | "error", data }
 * (a key not there yet is loading). Returns { groups, leftOut }: groups as
 * { key, kind, label, date, from, status, items }, newest first (`from` is
 * what a save of its items carries, for unstarring), and leftOut as
 * { count, kinds }, kinds being which of "edition" and "issue" it came from.
 */
export function savedGroups(saves, { editions, issues, files }) {
  const left = { count: 0, kinds: new Set() };
  const leave = (kind) => { left.count += 1; left.kinds.add(kind); };
  const groups = [];
  for (const file of filesToLoad(saves, editions, issues)) {
    const state = files[file.key] || { status: "loading" };
    const date = file.kind === "edition" ? file.ref.date : file.ref.published_on;
    const label = file.kind === "edition" ? midDate(date) : `Issue #${file.ref.number} · ${shortDate(date)}`;
    const from = file.kind === "edition" ? { edition_date: file.ref.date } : { issue_slug: file.ref.slug };
    const group = { key: file.key, kind: file.kind, label, date, from, status: state.status, items: [] };
    if (state.status === "ready") {
      const ids = new Set(saves.filter((s) => keyOf(s) === file.key).map((s) => s.item_id));
      const all = state.data.items;
      group.items = rankedItems(all).filter((item) => ids.has(item.id) && !item.hidden);
      const present = new Set(all.filter((item) => !item.hidden).map((item) => item.id));
      ids.forEach((id) => { if (!present.has(id)) leave(file.kind); });
      if (!group.items.length) continue;
    }
    groups.push(group);
  }
  for (const save of saves) {
    if (!fileOf(save, editions, issues)) leave(save.edition_date ? "edition" : "issue");
  }
  // Newest first; on the same date an edition comes before an issue.
  groups.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.kind === b.kind ? 0 : a.kind === "edition" ? -1 : 1));
  return { groups, leftOut: { count: left.count, kinds: ["edition", "issue"].filter((k) => left.kinds.has(k)) } };
}

/** The note under the sections, or null when nothing was left out. */
export function leftOutNote({ count, kinds }) {
  if (!count) return null;
  const one = count === 1;
  const noun = kinds.length > 1 ? (one ? "edition or issue" : "editions or issues") : (one ? kinds[0] : kinds[0] + "s");
  return one
    ? `1 saved item was removed from its ${noun} and is not shown.`
    : `${count} saved items were removed from their ${noun} and are not shown.`;
}
