"""Assembling the edition, and the two other files that must agree with it.

Reading the snapshots, tallying counts, keeping index.json in step, and
carrying an existing hide forward. Everything is built and validated in memory
before anything is written, so a rejected run leaves the published tree exactly
as it was - the same discipline hide.py uses, for the same reason.
"""

import datetime as dt
import json
import pathlib

from . import REPO_ROOT

import validate as contract
from aibytes_fetchers import layout, registry

DEFAULT_DATA_ROOT = "newsletter/data"
DEFAULT_CONTENT_ROOT = contract.DEFAULT_CONTENT_ROOT
DEFAULT_CADENCE = "daily"

CURATION_FILENAME = "curation.json"
REJECTED_FILENAME = "rejected.json"
LINKS_FILENAME = "links.json"


class CurateError(Exception):
    """Something is wrong with the inputs or the result; nothing was written."""


def parse_date(date):
    """The edition date as a date object, or CurateError.

    Checked against the contract's own pattern rather than left to
    fromisoformat, which on 3.11+ also accepts compact forms like 20260824 -
    those would pass here and only fail at the end of build, when the item ids
    built from them are rejected.
    """
    if not (isinstance(date, str) and contract.DATE_RE.match(date)):
        raise CurateError(f"--date {date!r} is not a YYYY-MM-DD date")
    try:
        return dt.date.fromisoformat(date)
    except ValueError as exc:
        raise CurateError(f"--date {date!r} is not a real date: {exc}") from exc


def now_stamp(now=None):
    """UTC, to the second, the way every other file in content/ writes it."""
    now = now or dt.datetime.now(dt.timezone.utc)
    return now.replace(microsecond=0).isoformat().replace("+00:00", "Z")


# --------------------------------------------------------------------------
# Reading
# --------------------------------------------------------------------------

def snapshot_paths(data_root, date, cadence=DEFAULT_CADENCE):
    """Where each source's snapshot for `date` lives: {source name: path}.

    Derived from the fetchers' own SUBPATH and FILENAME rather than restated,
    so curate always reads exactly where fetch writes.
    """
    as_of = parse_date(date)
    return {
        name: layout.snapshot_path(
            data_root, as_of, cadence, module.SUBPATH, module.FILENAME,
            repo_root=REPO_ROOT,
        )
        for name, module in registry.SOURCES.items()
    }


def day_path(data_root, date, filename, cadence=DEFAULT_CADENCE):
    """A file beside the day's snapshots - the curation request, or rejected.json.

    Only the daily layout gets a folder per date. Under any other cadence the
    period folder covers a range, so the date goes in the filename instead -
    otherwise drafting two dates from one week would silently overwrite the
    first date's curation request and rejection log.
    """
    as_of = parse_date(date)
    if cadence != "daily":
        stem, _, suffix = filename.rpartition(".")
        filename = f"{stem}-{date}.{suffix}"
    return layout.snapshot_path(data_root, as_of, cadence, (), filename, repo_root=REPO_ROOT)


def load_snapshots(data_root, date, cadence=DEFAULT_CADENCE):
    """Every snapshot that exists for the date. Returns ({source: envelope}, missing).

    A missing source is not an error: one failed fetch should still produce an
    edition from the other three, with the gap reported rather than hidden.
    """
    snapshots, missing = {}, []
    for name, path in sorted(snapshot_paths(data_root, date, cadence).items()):
        if not path.exists():
            missing.append(name)
            continue
        try:
            snapshots[name] = json.loads(path.read_text())
        except ValueError as exc:
            raise CurateError(f"{path} is not valid JSON: {exc}") from exc
    return snapshots, missing


def read_links(path):
    """The day's resolved-link map, or an empty one.

    Cached beside the snapshots because it is a fetched fact about the day, the
    same kind of thing a snapshot is - which is what lets `build` publish the
    URLs `draft` resolved rather than asking the network again and maybe
    getting a different answer.
    """
    path = pathlib.Path(path)
    if not path.exists():
        return {}
    try:
        document = json.loads(path.read_text())
    except ValueError:
        return {}  # a corrupt cache is a slow run, not a failed one
    resolved = document.get("resolved") if isinstance(document, dict) else None
    if not isinstance(resolved, dict):
        return {}
    # Every value here becomes a published `url`, so an entry that is not an
    # http(s) URL is dropped rather than carried into the edition. Without this
    # a hand-edited cache crashes dedup on the way to the contract check.
    return {
        hint: url for hint, url in resolved.items()
        if isinstance(hint, str) and isinstance(url, str) and contract.URL_RE.match(url)
    }


def links_document(generated_at, cache):
    return {"generated_at": generated_at, "resolved": dict(sorted(cache.items()))}


def read_json(path, what):
    path = pathlib.Path(path)
    if not path.exists():
        raise CurateError(f"{what} is missing: {path}")
    try:
        return json.loads(path.read_text())
    except ValueError as exc:
        raise CurateError(f"{path} is not valid JSON: {exc}") from exc


def write_json(path, document):
    """The same shape every other JSON in this repo commits, for clean diffs."""
    path = pathlib.Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(document, indent=2, ensure_ascii=False) + "\n")
    return path


# --------------------------------------------------------------------------
# Assembling
# --------------------------------------------------------------------------

def tally(items):
    """Counts: the visible tally, hidden excluded, all four keys always present."""
    counts = dict.fromkeys(contract.CATEGORIES, 0)
    for item in items:
        if item.get("hidden") is True:
            continue
        if item.get("category") in counts:
            counts[item["category"]] += 1
    return counts


def apply_hidden(items, hidden_doc, date):
    """Carry an existing hide forward. Returns (items, orphans).

    Re-curating a day that has had an item hidden must not quietly un-hide it -
    the hide is an editorial decision, the snapshots know nothing about it.
    `orphans` are ids logged as hidden for this date that the new items no
    longer contain, which would leave hidden.json describing an item that is
    not there.
    """
    logged = {
        entry["id"] for entry in (hidden_doc or {}).get("hidden", [])
        if isinstance(entry, dict) and entry.get("edition_date") == date
        and isinstance(entry.get("id"), str)
    }
    present = set()
    for item in items:
        if item.get("id") in logged:
            item["hidden"] = True
            present.add(item["id"])
    return items, sorted(logged - present)


def build(items, date, generated_at):
    """The edition document, in the contract's key order."""
    return {
        "schema_version": contract.SCHEMA_VERSION,
        "date": date,
        "generated_at": generated_at,
        "counts": tally(items),
        "items": items,
    }


def edition_path(content_root, date):
    return pathlib.Path(content_root) / "editions" / f"{date}.json"


def relative_edition_path(date):
    """`path` as index.json records it: relative to the index, forward slashes."""
    return f"editions/{date}.json"


def update_index(index, edition):
    """Insert or replace this edition's entry, newest first.

    The index's own `generated_at` is rewritten here, unlike in hide.py: this
    run did curate something, so the edition bar's "updated 4h ago" should move.
    """
    entry = {
        "date": edition["date"],
        "path": relative_edition_path(edition["date"]),
        "total": sum(edition["counts"].values()),
        "generated_at": edition["generated_at"],
    }
    others = [
        e for e in index.get("editions", [])
        if not (isinstance(e, dict) and e.get("date") == edition["date"])
    ]
    editions = sorted(
        others + [entry],
        # A dict with no date sorts last rather than raising; validate_index
        # is what reports it, and it cannot do that if we crash first.
        key=lambda e: (e.get("date") or "") if isinstance(e, dict) else "",
        reverse=True,
    )
    return {
        "schema_version": contract.SCHEMA_VERSION,
        "generated_at": edition["generated_at"],
        "editions": editions,
    }


def rejected_document(date, generated_at, rejected, kept_count):
    """rejected.json: the filter explaining itself, so it can be tuned.

    Not part of the published contract - it sits beside the raw snapshots it
    was computed from, because it is about the inputs, not the edition.
    """
    return {
        "date": date,
        "generated_at": generated_at,
        "counts": {"kept": kept_count, "rejected": len(rejected)},
        "rejected": rejected,
    }


def check(edition, index, tag_names):
    """Validate both documents in memory. Raises CurateError with everything."""
    for document, validator, what, kwargs in (
        (edition, contract.validate_edition, f"editions/{edition['date']}.json",
         {"tag_names": tag_names}),
        (index, contract.validate_index, "index.json", {}),
    ):
        try:
            validator(document, **kwargs)
        except contract.FeedValidationError as exc:
            raise CurateError(f"{what} would be invalid, so nothing was written:\n{exc}") from exc
