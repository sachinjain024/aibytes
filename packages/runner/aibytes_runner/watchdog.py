"""The check that catches the failure a failure notification cannot report.

If launchd never fires the daily job - the agent got unloaded by an OS update,
the plist has a typo, the machine came back from a reboot in a strange state -
then nothing fails, so nothing is sent, and silence looks exactly like a clean
run. This runs an hour after the job and asks the only question that matters:
is today's edition actually on disk and in the index?

It stays deliberately dumb. It reads two files and compares them. Anything
cleverer would be a second implementation of the contract, and the contract
already has one in `packages/feed-schema`.
"""

import argparse
import datetime
import json
import pathlib
import sys

REPO_ROOT = pathlib.Path(__file__).resolve().parents[3]

sys.path.insert(0, str(REPO_ROOT / "packages" / "curate"))
from aibytes_curate import edition as edition_mod  # noqa: E402

from . import notify  # noqa: E402


def problems(content_root, date):
    """Every reason today's edition is not properly published. Empty is good."""
    root = pathlib.Path(content_root)
    edition = root / "editions" / f"{date}.json"
    found = []

    if not edition.exists():
        return [f"{edition} does not exist"]
    try:
        document = json.loads(edition.read_text())
    except ValueError as exc:
        return [f"{edition} is not valid JSON: {exc}"]
    if document.get("date") != date:
        found.append(f"{edition} is dated {document.get('date')!r}, not {date!r}")
    if not sum((document.get("counts") or {}).values()):
        found.append(f"{edition} has no items")

    index_path = root / "index.json"
    try:
        index = json.loads(index_path.read_text())
    except (OSError, ValueError) as exc:
        found.append(f"{index_path} could not be read: {exc}")
        return found
    dates = {entry.get("date") for entry in index.get("editions") or []}
    if date not in dates:
        found.append(f"{index_path} does not list {date}")
    return found


def build_parser(prog="check.py"):
    parser = argparse.ArgumentParser(
        prog=prog, description=__doc__.splitlines()[0])
    parser.add_argument("--date", default=None,
                        help="the edition date to check (default today)")
    parser.add_argument("--content-root", "--output-root", dest="content_root",
                        default=edition_mod.DEFAULT_CONTENT_ROOT,
                        help="the published content tree")
    parser.add_argument("--env-file", default=None,
                        help="path to .env, for the Slack webhook")
    parser.add_argument("--no-notify", dest="notify", action="store_false",
                        help="report on stdout only")
    return parser


def main(argv=None):
    args = build_parser().parse_args(argv)
    date = args.date or datetime.date.today().isoformat()
    found = problems(args.content_root, date)
    if not found:
        print(f"{date} is published")
        return 0

    for one in found:
        print(one, file=sys.stderr)
    if args.notify:
        expected = pathlib.Path(args.content_root) / "editions" / f"{date}.json"
        notify.send(
            notify.missing(date, expected, f"logs/{date}.log"),
            env_file=args.env_file)
    return 1
