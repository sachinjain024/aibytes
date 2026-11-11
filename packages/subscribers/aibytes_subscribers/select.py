"""Who is pending up to an Asia/Kolkata day, and the CSV and status text.

The day is inclusive: 23:59 IST on the date is in, and 00:00 IST the next
day is out. Imported documents are dropped here, because Firestore cannot
query for a missing field.
"""

import csv
from datetime import datetime, timedelta, timezone
from pathlib import Path

# India has no daylight-saving time, so a fixed offset is the whole zone.
IST = timezone(timedelta(hours=5, minutes=30))


def cutoff(until):
    """The first instant that is not part of `until` (YYYY-MM-DD), in UTC."""
    year, month, day = (int(part) for part in until.split("-"))
    start = datetime(year, month, day, tzinfo=IST) + timedelta(days=1)
    return start.astimezone(timezone.utc)


def _when(value):
    text = value.replace("Z", "+00:00")
    if text[-3] == ":":
        text = text[:-3] + text[-2:]
    if "." in text:
        return datetime.strptime(text, "%Y-%m-%dT%H:%M:%S.%f%z")
    return datetime.strptime(text, "%Y-%m-%dT%H:%M:%S%z")


def select_pending(docs, until):
    """Documents created before the next IST midnight, with no imported_at."""
    end = cutoff(until)
    chosen = []
    for doc in docs:
        if doc.get("imported_at") or not doc.get("created_at"):
            continue
        if _when(doc["created_at"]) < end:
            chosen.append(doc)
    chosen.sort(key=lambda doc: doc["created_at"])
    return chosen


def outside_repo(output, repo):
    """True when `output` is not inside the repository."""
    path = Path(output).expanduser().resolve()
    root = Path(repo).resolve()
    return path != root and root not in path.parents


def write_csv(path, docs):
    """Header plus email and subscribed_at. The caller has checked the path."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(["email", "subscribed_at"])
        for doc in docs:
            writer.writerow([doc["email"], doc["created_at"]])


def status_lines(docs):
    """Counts only. No email address."""
    imported = [doc for doc in docs if doc.get("imported_at")]
    pending = [doc for doc in docs if not doc.get("imported_at") and doc.get("created_at")]
    dates = [doc["imported_until"] for doc in imported if doc.get("imported_until")]
    oldest = min((doc["created_at"] for doc in pending), default=None)
    return [
        "imported: %d" % len(imported),
        "pending: %d" % len(pending),
        "latest imported_until: %s" % (max(dates) if dates else "none"),
        "oldest pending: %s" % (oldest or "none"),
    ]
