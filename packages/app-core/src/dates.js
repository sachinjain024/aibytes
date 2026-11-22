// Calendar dates as the content contract writes them (spec AIB-76n app-core).

/** True for a YYYY-MM-DD that is a real calendar day. */
export function isRealDate(text) {
  const date = new Date(text + "T00:00:00Z");
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === text;
}
