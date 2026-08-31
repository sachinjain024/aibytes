#!/usr/bin/env python3
"""Hide one item from a published edition.

    python3 packages/feed-schema/hide.py ph-chatcut-2026-08-27 --reason "spam"
    python3 packages/feed-schema/hide.py ph-chatcut-2026-08-27 --unhide

The site reads `hidden` on the item, so that flag is what actually takes
effect; everything else this script touches exists to keep the rest of the tree
honest about it. One run flips the item, re-tallies the edition's counts,
corrects the edition's total in index.json, and appends to the hide log in
hidden.json, which is what lets the weekly newsletter skill exclude the same
items without opening every edition.

The change is validated in memory first, so a rejected hide leaves the tree
exactly as it was. The tree is then re-validated from disk as a backstop; if
that fails, the hide is on disk and the tree had a problem this script did not
cause. The result is a small commit to push.
"""

import argparse
import datetime as dt
import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

import validate as contract


class HideError(Exception):
    """Something about the request or the tree is wrong; nothing was written."""


def _read(path):
    if not path.exists():
        raise HideError(f"{path} is missing")
    try:
        return json.loads(path.read_text())
    except ValueError as exc:
        raise HideError(f"{path} is not valid JSON: {exc}") from exc


def _write(path, document):
    # Same shape as every other JSON this repo commits, so diffs stay readable.
    path.write_text(json.dumps(document, indent=2) + "\n")


def edition_date_of(item_id):
    """The edition an id belongs to. Ids end with their edition's date."""
    if not contract.ID_RE.match(item_id):
        raise HideError(f"{item_id!r} is not an item id (expected <source>-<slug>-YYYY-MM-DD)")
    return item_id[-10:]


def hide(item_id, *, content_root, reason=None, unhide=False, now=None):
    """Flip one item and reconcile the tree. Returns a one-line summary.

    Idempotent: hiding an already-hidden item changes nothing and says so.
    """
    root = pathlib.Path(content_root)
    now = now or dt.datetime.now(dt.timezone.utc)
    date = edition_date_of(item_id)

    edition_path = root / "editions" / f"{date}.json"
    index_path = root / "index.json"
    hidden_path = root / "hidden.json"

    edition = _read(edition_path)
    index = _read(index_path)
    hidden = _read(hidden_path)
    tag_names = contract.tag_names(_read(root / "tags.json"))

    items = edition.get("items")
    if not isinstance(items, list):
        raise HideError(f"{edition_path} has no items array")
    matches = [item for item in items if isinstance(item, dict) and item.get("id") == item_id]
    if not matches:
        raise HideError(f"no item {item_id!r} in {edition_path}")
    item = matches[0]

    want_hidden = not unhide
    if item.get("hidden") is want_hidden:
        state = "hidden" if want_hidden else "visible"
        return f"{item_id} is already {state}; nothing to do"

    item["hidden"] = want_hidden
    edition["counts"] = _tally(items)
    total = sum(edition["counts"].values())

    listed = [
        entry for entry in index.get("editions", [])
        if isinstance(entry, dict) and entry.get("date") == date
    ]
    if not listed:
        raise HideError(f"index.json does not list {date}; run the curate step before hiding")
    listed[0]["total"] = total

    hidden["hidden"] = _log(hidden.get("hidden", []), item_id, date, reason, now, want_hidden)

    # Validate the whole change in memory. Nothing is on disk yet, so a
    # rejection here leaves the tree exactly as it was.
    _check(contract.validate_edition, edition, edition_path, tag_names=tag_names)
    _check(contract.validate_index, index, index_path)
    _check(contract.validate_hidden, hidden, hidden_path)

    _write(edition_path, edition)
    _write(index_path, index)
    _write(hidden_path, hidden)

    # Backstop. The three documents were checked above and counts and totals
    # are recomputed rather than adjusted, so this only fires on a problem the
    # tree already had - and the operator needs to know it is now also written.
    try:
        contract.validate_content_root(root)
    except contract.FeedValidationError as exc:
        raise HideError(
            f"{item_id} was written, but {root} has problems this hide did not "
            f"cause:\n{exc}"
        ) from exc

    verb = "hidden" if want_hidden else "unhidden"
    return f"{item_id} {verb}; {date} now has {total} visible item(s)"


def _tally(items):
    """Counts, recomputed from the items rather than adjusted by one."""
    counts = dict.fromkeys(contract.CATEGORIES, 0)
    for item in items:
        if not isinstance(item, dict) or item.get("hidden") is True:
            continue
        if item.get("category") in counts:
            counts[item["category"]] += 1
    return counts


def _log(entries, item_id, date, reason, now, want_hidden):
    """Append to or retract from the hide log, newest first."""
    entries = [
        entry for entry in entries
        if not (isinstance(entry, dict) and entry.get("id") == item_id)
    ]
    if not want_hidden:
        return entries
    entry = {
        "id": item_id,
        "edition_date": date,
        "hidden_at": now.replace(microsecond=0).isoformat().replace("+00:00", "Z"),
    }
    if reason:
        entry["reason"] = reason
    return [entry] + entries


def _check(validator, document, path, **kwargs):
    try:
        validator(document, **kwargs)
    except contract.FeedValidationError as exc:
        raise HideError(f"{path} would be invalid, so nothing was written:\n{exc}") from exc


def build_parser():
    parser = argparse.ArgumentParser(
        prog="hide.py", description=__doc__.splitlines()[0],
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("item_id", help="the item's id, e.g. ph-chatcut-2026-08-27")
    parser.add_argument("--reason", default=None, help="why, for the hide log")
    parser.add_argument("--unhide", action="store_true", help="reverse a hide")
    parser.add_argument(
        "--content-root", default=contract.DEFAULT_CONTENT_ROOT,
        help=f"the content tree to edit (default {contract.DEFAULT_CONTENT_ROOT})",
    )
    return parser


def main(argv=None):
    args = build_parser().parse_args(argv)
    if args.unhide and args.reason:
        print("--reason applies to a hide, not --unhide", file=sys.stderr)
        return 2
    try:
        print(hide(args.item_id, content_root=args.content_root,
                   reason=args.reason, unhide=args.unhide))
    except (HideError, contract.FeedValidationError) as exc:
        print(exc, file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
