// A save as a Firestore document, users/{uid}/saves/{itemId}, and back (spec
// AIB-75v app-accounts). Pure, so node --test covers it without Firebase:
// accountSaves.js does the reads and writes. A document holds exactly the
// fields firestore.rules accepts - item_id (the document id), one of
// edition_date or issue_slug, and created_at as a timestamp - and reads back as
// the same save shape localSaves keeps, created_at as an ISO string.
import { asSave, sourceOf } from "./saves.js";

/** The document for saving `item` from `from` at `now`. Throws on what the rules would refuse. */
export function toDoc(item, from, now = new Date()) {
  const source = sourceOf(from);
  if (!source) throw new Error("A save needs exactly one of edition_date or issue_slug");
  if (!item || typeof item.id !== "string" || !item.id) throw new Error("A save needs an id");
  return { item_id: item.id, ...source, created_at: now };
}

// A Firestore Timestamp, or the Date a pending local write still holds, as ISO.
function isoOf(value) {
  const date = value && typeof value.toDate === "function" ? value.toDate() : value;
  return date instanceof Date && !Number.isNaN(date.getTime()) ? date.toISOString() : null;
}

/** The save stored as document `id`, or null if the document is not a save. */
export function toSave(id, data) {
  if (!data || data.item_id !== id) return null;
  return asSave({ ...data, created_at: isoOf(data.created_at) });
}
