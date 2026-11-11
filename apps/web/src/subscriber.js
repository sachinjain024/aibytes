// A subscriber as a Firestore document, subscribers/{uid} (spec AIB-140p).
// Pure, so node --test covers it; subscriber.js does the write.
export function toSubscriberDoc(user, now) {
  if (!user?.email) throw new Error("A subscriber needs an email");
  return { email: user.email, source: "signin-prompt", created_at: now };
}
