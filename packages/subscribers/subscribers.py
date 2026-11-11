#!/usr/bin/env python3
"""Export, mark and count aiBytes_ newsletter subscribers (spec AIB-140p).

Prints counts and paths only. A subscriber's email never goes to stdout.
"""

import argparse
import sys
from datetime import datetime, timezone
from pathlib import Path

from aibytes_subscribers.firestore import AuthError, Firestore, gcloud_token
from aibytes_subscribers.select import day_has_ended, outside_repo, select_pending, status_lines, write_csv

REPO = Path(__file__).resolve().parents[2]


def main(argv=None, token=None, transport=None, now=None, repo=None, stdout=None):
    parser = argparse.ArgumentParser(prog="subscribers")
    sub = parser.add_subparsers(dest="command", required=True)
    export = sub.add_parser("export")
    export.add_argument("--until", required=True)
    export.add_argument("--output", required=True)
    mark = sub.add_parser("mark-imported")
    mark.add_argument("--until", required=True)
    mark.add_argument("--yes", action="store_true")
    sub.add_parser("status")
    args = parser.parse_args(argv)
    out = stdout or sys.stdout
    root = Path(repo) if repo else REPO
    try:
        client = Firestore(token or gcloud_token(), transport) if transport or token else Firestore(gcloud_token())
        if args.command == "status":
            for line in status_lines(client.subscribers()):
                print(line, file=out)
            return 0
        _check_date(args.until)
        moment = now or datetime.now(timezone.utc)
        if not day_has_ended(args.until, moment):
            print("Refusing --until %s: that day has not ended in Asia/Kolkata." % args.until, file=out)
            return 1
        pending = select_pending(client.subscribers(), args.until)
        if args.command == "export":
            if not outside_repo(args.output, root):
                print("Refusing to write inside the repository. Pass --output outside it.", file=out)
                return 1
            write_csv(args.output, pending)
            print("exported: %d" % len(pending), file=out)
            print(Path(args.output).expanduser().resolve(), file=out)
            return 0
        if not args.yes:
            print("Refusing to mark %d subscribers without --yes." % len(pending), file=out)
            return 1
        for doc in pending:
            client.mark(doc, args.until, moment)
        print("marked: %d" % len(pending), file=out)
        return 0
    except AuthError as err:
        print(err, file=out)
        return 1


def _check_date(until):
    datetime.strptime(until, "%Y-%m-%d")


if __name__ == "__main__":
    sys.exit(main())
