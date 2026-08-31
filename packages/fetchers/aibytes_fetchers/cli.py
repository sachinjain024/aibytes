"""Fetch several sources in one process, at any cadence.

This is what a scheduled job runs:

    python3 packages/fetchers/fetch.py --cadence daily --output-root feed

The weekly newsletter keeps using the skill scripts (and /fetch-weekly-items),
which drive the same source modules through subprocesses so each one is
independently runnable and independently skippable.
"""

import argparse
import sys

from . import registry, runner, window as window_mod

# Shared flags whose value, when given, overrides each source's own default.
SHARED = ("count", "cadence", "days", "date", "output_root")


def build_parser():
    parser = argparse.ArgumentParser(prog="aibytes-fetch", description=__doc__)
    parser.add_argument(
        "--sources", nargs="*", default=None, metavar="SOURCE",
        help=f"sources to fetch (default all: {', '.join(registry.names())})",
    )
    parser.add_argument(
        "--skip", action="append", default=[], metavar="SOURCE",
        help="skip a source; repeatable",
    )
    parser.add_argument(
        "--cadence", choices=sorted(window_mod.CADENCES), default=window_mod.DEFAULT_CADENCE,
        help=f"how snapshots are filed and how far back to look (default {window_mod.DEFAULT_CADENCE})",
    )
    parser.add_argument("--days", type=int, default=None, help="window length (default: follows --cadence)")
    parser.add_argument("--date", default=None, help="end of window, YYYY-MM-DD (default today)")
    parser.add_argument(
        "--output-root", default=runner.DEFAULT_OUTPUT_ROOT,
        help=f"root data directory (default {runner.DEFAULT_OUTPUT_ROOT})",
    )
    parser.add_argument("--count", type=int, default=None, help="override item count for every source")
    parser.add_argument(
        "--keep-going", action="store_true",
        help="continue after failures, then exit nonzero if any source failed",
    )
    return parser


def selected_sources(args):
    names = args.sources if args.sources else registry.names()
    skips = {registry.resolve(s).NAME for s in args.skip}
    return [registry.resolve(n) for n in names if registry.resolve(n).NAME not in skips]


def source_args(source, args):
    """The source's defaults, with any explicitly-given shared flag applied."""
    merged = runner.defaults_for(source)
    for field in SHARED:
        value = getattr(args, field, None)
        if value is not None:
            setattr(merged, field, value)
    return merged


def main(argv=None):
    args = build_parser().parse_args(argv)
    sources = selected_sources(args)
    if not sources:
        raise SystemExit("no sources selected")

    win = window_mod.resolve(args.cadence, args.days, args.date)
    print(f"fetching {len(sources)} source(s) for {win.as_of} ({win.cadence})")

    failures = []
    for source in sources:
        print(f"==> {source.NAME}")
        try:
            runner.execute(source, source_args(source, args), win)
        except Exception as exc:  # one bad source must not sink the rest
            print(f"{source.NAME} failed: {exc}", file=sys.stderr)
            failures.append(source.NAME)
            if not args.keep_going:
                break

    if failures:
        print(f"\nfailed: {', '.join(failures)}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
