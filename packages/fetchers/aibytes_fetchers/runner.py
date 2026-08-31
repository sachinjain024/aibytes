"""The shared CLI and snapshot-writing loop.

Every source script used to carry its own copy of this: parse the same five
flags, compute the same window, build the same envelope, derive the same output
path, print the same two-part summary. It lives here once now, so a source
module only implements the part that is actually source-specific.
"""

import argparse

from . import envelope, layout, window as window_mod
from .paths import REPO_ROOT

DEFAULT_OUTPUT_ROOT = "newsletter/data"


def build_parser(source, description=None):
    parser = argparse.ArgumentParser(description=description or source.__doc__)
    parser.add_argument(
        "--count", type=int, default=source.DEFAULT_COUNT,
        help=f"number of items (default {source.DEFAULT_COUNT})",
    )
    parser.add_argument(
        "--cadence", choices=sorted(window_mod.CADENCES), default=window_mod.DEFAULT_CADENCE,
        help=f"how the snapshot is filed and how far back to look (default {window_mod.DEFAULT_CADENCE})",
    )
    parser.add_argument(
        "--days", type=int, default=None,
        help="window length in days (default: follows --cadence)",
    )
    parser.add_argument("--date", help="end of window, YYYY-MM-DD (default today)")
    parser.add_argument(
        "--output-root", default=DEFAULT_OUTPUT_ROOT,
        help=f"root data directory (default {DEFAULT_OUTPUT_ROOT})",
    )
    source.add_arguments(parser)
    return parser


def run(source, argv=None):
    """Fetch one source and write its snapshot. Returns the path written."""
    args = build_parser(source).parse_args(argv)
    win = window_mod.resolve(args.cadence, args.days, args.date)
    return execute(source, args, win)


def defaults_for(source):
    """The source's own argument defaults, as a namespace.

    Lets the multi-source CLI reuse each source's declared defaults instead of
    re-listing them.
    """
    return build_parser(source).parse_args([])


def execute(source, args, win):
    """Fetch and write one source with an already-resolved window and args."""
    result = source.fetch(win, args)
    body = envelope.build(
        source.SOURCE,
        source.ITEMS_KEY,
        result.items,
        as_of=win.as_of,
        section=source.SECTION,
        window=result.window_dict,
        query_params=result.query_params,
        total_count=result.total_count,
        pool_count=result.pool_count,
    )
    out_path = layout.snapshot_path(
        args.output_root, win.as_of, win.cadence,
        source.SUBPATH, source.FILENAME, repo_root=REPO_ROOT,
    )
    envelope.write(out_path, body)
    _report(source, result, out_path)
    return out_path


def _report(source, result, out_path):
    try:
        shown = out_path.relative_to(REPO_ROOT)
    except ValueError:  # --output-root outside the repo
        shown = out_path

    noun = getattr(source, "ITEM_NOUN", None)
    kept = len(result.items)
    if noun is None:
        print(f"wrote {shown}")
    elif result.pool_count is not None:
        print(
            f"wrote {shown} ({kept} of {result.total_count} matching {noun}, "
            f"{result.pool_count} in pool)"
        )
    else:
        print(f"wrote {shown} ({kept} of {result.total_count} {noun})")

    for item in result.items:
        print(source.format_line(item))
