// A subscriber as a Firestore document, subscribers/{uid} (spec AIB-140p).
// toSubscriberDoc is pure. subscribe and isSubscribed do the write and the read.
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const LIMIT_MS = 10_000;

export function toSubscriberDoc(user, now) {
  if (!user?.email) throw new Error("A subscriber needs an email");
  return { email: user.email, source: "signin-prompt", created_at: now };
}

const refOf = (db, uid) => doc(db, "subscribers", uid);

function failureCode(error) {
  const code = String(error?.code || "unknown");
  const slash = code.lastIndexOf("/");
  return slash === -1 ? code : code.slice(slash + 1);
}

/** True when subscribers/{uid} exists. */
export async function isSubscribed(db, uid) {
  return (await getDoc(refOf(db, uid))).exists();
}

/**
 * Creates the reader's subscriber document. Resolves to "ok", or to
 * { failed: code }. Never rejects. A write that does not settle within
 * limitMs resolves { failed: "timeout" }; one that lands later is harmless.
 * A refused create is read back, and an existing document counts as success,
 * so a retry after a late commit does not change it.
 */
export async function subscribe(db, user, {
  limitMs = LIMIT_MS,
  setTimer = setTimeout,
  clearTimer = clearTimeout,
  writeDoc = setDoc,
  readDoc = getDoc,
} = {}) {
  let data;
  try {
    data = toSubscriberDoc(user, serverTimestamp());
  } catch (error) {
    return { failed: "invalid-argument" };
  }
  const ref = refOf(db, user.uid);
  let timer;
  const timed = new Promise((resolve) => {
    timer = setTimer(() => resolve({ failed: "timeout" }), limitMs);
  });
  const attempt = writeDoc(ref, data).then(
    () => "ok",
    async (error) => {
      const code = failureCode(error);
      if (code === "permission-denied" || code === "already-exists") {
        try {
          if ((await readDoc(ref)).exists()) return "ok";
        } catch (readError) {
          return { failed: failureCode(readError) };
        }
      }
      return { failed: code };
    },
  );
  try {
    return await Promise.race([attempt, timed]);
  } finally {
    clearTimer(timer);
  }
}
