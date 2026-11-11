// What a subscribe-failure alert may say, and whether this reader is still
// under the daily cap (spec AIB-140p). Pure: index.js does the auth, the
// Firestore count, and the webhook post.

const CODE_MAX = 64;
const PAGE_MAX = 200;
const DAILY_CAP = 3;

/** Plain text, one line, cut to `max`. Control characters become spaces. */
function clean(value, max) {
  return String(value ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

/** Today's count. A stored count from another day does not carry over. */
function countToday(stored, day) {
  if (!stored || stored.day !== day) return 0;
  return stored.count || 0;
}

/**
 * Decides one alert. The email and uid come from the auth token. `data.email`
 * and `data.uid` are ignored. No auth is refused. A fourth report on `day`
 * is dropped.
 */
function prepareReport({ auth, data = {}, stored, day, now = new Date() }) {
  if (!auth?.uid) return { ok: false, error: "unauthenticated" };
  const count = countToday(stored, day);
  const email = String(auth.token?.email || "");
  const code = clean(data.code, CODE_MAX);
  const page = clean(data.page, PAGE_MAX);
  if (count >= DAILY_CAP) return { ok: false, error: "dropped", email, uid: auth.uid, code, page };
  const time = now.toISOString();
  const text = [
    "aibytes.io: a newsletter subscribe failed",
    `email: ${email}`,
    `uid: ${auth.uid}`,
    `code: ${code}`,
    `page: ${page}`,
    `time: ${time}`,
  ].join("\n");
  return { ok: true, email, uid: auth.uid, code, page, count, text };
}

module.exports = { clean, countToday, prepareReport, CODE_MAX, PAGE_MAX, DAILY_CAP };
