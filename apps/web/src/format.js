// Date labels for the edition bar and the calendar, in the UI kit's shapes.
// An edition date is a calendar day, not an instant, so these format in UTC
// to stay on that day wherever the reader is.

const LONG = new Intl.DateTimeFormat("en-US", {
  weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
});
const MID = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
const SHORT = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

const day = (date) => new Date(date + "T00:00:00Z");

/** "Wed, Oct 7, 2026" - the edition bar's heading. */
export const longDate = (date) => LONG.format(day(date));
/** "Wed, Oct 7" - a calendar row. */
export const midDate = (date) => MID.format(day(date));
/** "Oct 7" - an arrow label. */
export const shortDate = (date) => SHORT.format(day(date));

/** "4h ago" from an ISO timestamp, for the edition bar's "updated" note. */
export function ago(iso, now = Date.now()) {
  const minutes = Math.max(0, Math.floor((now - Date.parse(iso)) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
