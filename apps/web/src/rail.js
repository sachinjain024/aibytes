// The rail's date block (spec AIB-77u app-side-nav). "Today" and "Yesterday"
// are calendar-true for the reader: the latest edition is only Today once the
// day's run has published it, and "Yesterday" means the reader's yesterday,
// never the day before the edition being viewed. Pure, so node --test covers
// every row of the spec's table.
import { midDate, shortDate } from "./format.js";
import { olderEdition } from "./route.js";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole calendar days from `a` to `b`, both YYYY-MM-DD. Negative if `b` is earlier. */
export function daysBetween(a, b) {
  // Both as UTC midnights, so a DST change in the reader's zone cannot make a
  // day 23 or 25 hours long.
  return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / DAY_MS);
}

/** The reader's local calendar day as YYYY-MM-DD - what `today` means below. */
export function localDate(now = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * SideNav's date props for the edition `ref`. `editions` is index.json's list,
 * newest first; `today` is the reader's local date (`localDate()`), passed in
 * so tests can pin it. An edition dated after `today`, which a time-zone edge
 * can produce, reads as Today.
 */
export function railDate(ref, editions, today) {
  const latest = editions[0] && editions[0].date === ref.date;
  const older = olderEdition(editions, ref.date);
  const days = daysBetween(ref.date, today);
  const isToday = days <= 0;
  return {
    dateMain: isToday ? "Today" : shortDate(ref.date),
    dateNote: isToday ? `(${midDate(ref.date)})` : undefined,
    dateSub: isToday ? undefined : `${midDate(ref.date)} · ${days} day${days === 1 ? "" : "s"} ago`,
    prevLabel: older ? (daysBetween(older.date, today) === 1 ? "Yesterday" : shortDate(older.date)) : undefined,
    nextLabel: latest ? undefined : "Latest",
  };
}
