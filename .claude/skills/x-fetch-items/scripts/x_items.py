#!/usr/bin/env python3
"""Save the week's X posts, pasted in from Grok, and record the shortlist.

Thin CLI wrapper. The logic lives in packages/fetchers
(aibytes_fetchers.x_paste).

    x_items.py prompt    [--date D]                          print the Grok prompt for the week
    x_items.py save      --input PASTE [--date D]            check Grok's paste and save it
    x_items.py move      URL... --to BUCKET [--date D]       re-file posts Grok put in the wrong list
    x_items.py shortlist --insight URL... --announcement URL... [--date D]
    x_items.py render    [--format html|beehiiv] [--section S] [--number 0x02] [--date D]
    x_items.py verify    [--issue ISSUE.html] [--export EXPORT.html] [--date D]

render prints the shortlisted posts as newsletter HTML, word for word, for
/generate-newsletter-content to paste in; verify checks a built issue carries
them unchanged and in order.

Every command takes --output-root. The snapshot is
newsletter/data/<yyyy>/<mm>/weeks/week-<NN>/x/x_data.json, with the week taken
from --date (default today).
"""

import argparse
import datetime as dt
import pathlib
import sys

REPO_ROOT = pathlib.Path(__file__).resolve().parents[4]
sys.path.insert(0, str(REPO_ROOT / "packages" / "fetchers"))

from aibytes_fetchers import x_paste, x_render


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    common = argparse.ArgumentParser(add_help=False)
    common.add_argument("--date", default=dt.date.today().isoformat(), help="snapshot date, YYYY-MM-DD (default today)")
    common.add_argument("--output-root", default="newsletter/data", help="root data directory (default newsletter/data)")
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("prompt", parents=[common], help="print the Grok prompt with the week filled in")
    save = sub.add_parser("save", parents=[common], help="check Grok's paste and save the snapshot")
    save.add_argument("--input", required=True, help="file holding Grok's reply ('-' for stdin)")
    mv = sub.add_parser("move", parents=[common], help="move posts to another bucket")
    mv.add_argument("urls", nargs="+")
    mv.add_argument("--to", required=True, choices=x_paste.BUCKETS)
    sl = sub.add_parser("shortlist", parents=[common], help="record the posts that go into the issue")
    sl.add_argument("--insight", nargs="+", required=True, metavar="URL")
    sl.add_argument("--announcement", nargs="+", required=True, metavar="URL")
    rd = sub.add_parser("render", parents=[common], help="print the shortlisted posts as newsletter HTML")
    rd.add_argument("--format", choices=("html", "beehiiv"), default="html",
                    help="html fills the issue template; beehiiv is the export snippet (default html)")
    rd.add_argument("--section", choices=("announcements", "loudest", "both"), default="both")
    rd.add_argument("--number", default="0x02", help="Loudest on X section number, beehiiv only (default 0x02)")
    vf = sub.add_parser("verify", parents=[common], help="check an issue carries the shortlisted posts unchanged")
    vf.add_argument("--issue", help="the issue HTML (checked against the html format)")
    vf.add_argument("--export", help="the Beehiiv export page (checked against the beehiiv format)")

    args = parser.parse_args(argv)
    as_of = dt.date.fromisoformat(args.date)
    path = x_paste.snapshot_path(as_of, args.output_root)

    if args.command == "prompt":
        print(x_paste.prompt(as_of))
        return 0

    if args.command == "save":
        raw = sys.stdin.read() if args.input == "-" else pathlib.Path(args.input).read_text()
        try:
            paste = x_paste.parse_paste(raw)
        except ValueError as exc:
            print(f"error: {exc}", file=sys.stderr)
            return 1
        errors, warnings = x_paste.check(paste, as_of)
        for line in errors:
            print(f"error: {line}", file=sys.stderr)
        for line in warnings:
            print(f"warning: {line}")
        if errors:
            print(f"not saved: {len(errors)} error(s)", file=sys.stderr)
            return 1
        x_paste.write(path, x_paste.build(paste, as_of))
        print(f"wrote {_shown(path)} ({len(paste['announcements'])} announcements, "
              f"{len(paste['insights'])} insights, {len(warnings)} warning(s))")
        return 0

    if not path.is_file():
        print(f"error: no snapshot at {_shown(path)}; run save first", file=sys.stderr)
        return 1
    snapshot = x_paste.load(path)
    if args.command in ("render", "verify"):
        if not snapshot.get("shortlist"):
            print(f"error: {_shown(path)} has no shortlist; run shortlist first", file=sys.stderr)
            return 1
        return _render(args, snapshot) if args.command == "render" else _verify(args, snapshot)
    try:
        if args.command == "move":
            x_paste.move(snapshot, args.urls, args.to)
            print(f"moved {len(args.urls)} post(s) to {args.to}")
        else:
            for line in x_paste.set_shortlist(snapshot, args.insight, args.announcement):
                print(f"warning: {line}")
            print(f"shortlisted {len(args.insight)} insight(s), {len(args.announcement)} announcement(s)")
    except ValueError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    x_paste.write(path, snapshot)
    print(f"wrote {_shown(path)}")
    return 0


def _render(args, snapshot):
    blocks, warnings = x_render.render(snapshot, args.format, args.number)
    for line in warnings:
        print(f"warning: {line}", file=sys.stderr)
    wanted = ("announcements", "loudest") if args.section == "both" else (args.section,)
    for name in wanted:
        if args.section == "both":
            print(f"<!-- x_render: {name} -->")
        print(blocks[name])
    return 0


def _verify(args, snapshot):
    pages = [(f, fmt) for f, fmt in ((args.issue, "html"), (args.export, "beehiiv")) if f]
    if not pages:
        print("error: pass --issue and/or --export", file=sys.stderr)
        return 1
    failed = False
    for file, fmt in pages:
        problems = x_render.verify(snapshot, pathlib.Path(file).read_text(), fmt)
        for line in problems:
            print(f"error: {file}: {line}", file=sys.stderr)
        failed |= bool(problems)
        if not problems:
            print(f"ok: {file} carries every shortlisted post unchanged")
    return 1 if failed else 0


def _shown(path):
    try:
        return path.relative_to(REPO_ROOT)
    except ValueError:
        return path


if __name__ == "__main__":
    sys.exit(main())
