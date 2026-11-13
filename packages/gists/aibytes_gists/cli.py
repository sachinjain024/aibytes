"""`gists draft` and `gists build` (AIB-145y)."""

import argparse
import sys

from . import DEFAULT_CACHE_ROOT, DEFAULT_CONTENT_ROOT, DEFAULT_DATA_ROOT
from . import build as build_mod
from . import draft as draft_mod


def _common(sub):
    sub.add_argument("--date", required=True, help="the edition date, YYYY-MM-DD")
    sub.add_argument("--content-root", default=DEFAULT_CONTENT_ROOT,
                     help=f"the published content tree (default {DEFAULT_CONTENT_ROOT})")
    sub.add_argument("--cache-root", default=DEFAULT_CACHE_ROOT,
                     help=f"where fetched material is kept, git-ignored (default {DEFAULT_CACHE_ROOT})")


def parser():
    top = argparse.ArgumentParser(prog="gists", description=__doc__)
    subs = top.add_subparsers(dest="command", required=True)
    draft = subs.add_parser("draft", help="fetch material for new items; write draft.json")
    _common(draft)
    draft.add_argument("--data-root", default=DEFAULT_DATA_ROOT,
                       help=f"the raw snapshots (default {DEFAULT_DATA_ROOT})")
    build = subs.add_parser("build", help="check gists.json; write content/gists/, the index and item gists")
    _common(build)
    build.add_argument("--gists", default=None,
                       help="what Claude wrote (default <cache-root>/DATE/gists.json)")
    return top


def main(argv=None):
    args = parser().parse_args(argv)
    try:
        if args.command == "draft":
            draft_mod.draft(args.date, content_root=args.content_root, data_root=args.data_root,
                            cache_root=args.cache_root)
        elif args.command == "build":
            build_mod.build(args.date, gists_path=args.gists, content_root=args.content_root,
                            cache_root=args.cache_root)
    except (draft_mod.DraftError, build_mod.BuildError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    return 0
