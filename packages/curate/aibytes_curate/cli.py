"""The two commands, and the pipeline they share.

    curate_edition.py draft --date 2026-08-31
    curate_edition.py build --date 2026-08-31 --summaries summaries.json

Both start by re-deriving the day's drafts from the snapshots, so `build` never
trusts the curation request as state - a stale or hand-edited curation.json
cannot change what gets published, it can only be out of date, and then `build`
says so by rejecting an id it does not recognise.
"""

import argparse
import pathlib
import sys

from . import adapters, edition as edition_mod, links, relevance, summaries as summaries_mod
# `contract` is packages/feed-schema/validate.py, which edition.py puts on the
# path; going through it keeps one copy of that import in the package.
from .edition import contract, CurateError, REPO_ROOT


def prepare(args):
    """Snapshots -> (kept drafts, rejections, missing sources). No writes."""
    snapshots, missing = edition_mod.load_snapshots(args.data_root, args.date, args.cadence)
    if not snapshots:
        raise CurateError(
            f"no snapshots for {args.date} under {args.data_root} "
            f"({args.cadence}); run the fetchers first")

    drafts, unusable = adapters.adapt_all(snapshots, args.date)
    if not args.no_resolve_links:
        links.resolve([d for d in drafts if d.link_hint])
    kept, rejected = relevance.apply(drafts)
    return kept, unusable + rejected, missing


def cmd_draft(args):
    kept, rejected, missing = prepare(args)
    stamp = edition_mod.now_stamp()
    tags_doc = edition_mod.read_json(
        pathlib.Path(args.content_root) / "tags.json", "tags.json")

    request = summaries_mod.curation_request(kept, tags_doc, args.date, stamp)
    request_path = edition_mod.write_json(
        edition_mod.day_path(args.data_root, args.date,
                             edition_mod.CURATION_FILENAME, args.cadence),
        request)
    rejected_path = edition_mod.write_json(
        edition_mod.day_path(args.data_root, args.date,
                             edition_mod.REJECTED_FILENAME, args.cadence),
        edition_mod.rejected_document(args.date, stamp, rejected, len(kept)))

    _report_sources(missing)
    print(f"wrote {_shown(request_path)} ({len(kept)} item(s) needing a summary and tags)")
    print(f"wrote {_shown(rejected_path)} ({len(rejected)} rejected)")
    _report_counts(edition_mod.tally([d.item for d in kept]))
    _report_rejections(rejected)
    print("\nnext: write the summaries file, then run "
          f"`build --date {args.date} --summaries <file>`")
    return 0


def cmd_build(args):
    kept, rejected, missing = prepare(args)
    stamp = edition_mod.now_stamp()
    content_root = pathlib.Path(args.content_root)

    tags_doc = edition_mod.read_json(content_root / "tags.json", "tags.json")
    tag_names = contract.tag_names(tags_doc)

    written = summaries_mod.load(args.summaries)
    problems, warnings = summaries_mod.check(written, kept, tag_names)
    if problems:
        raise CurateError(
            f"{args.summaries} does not match the {len(kept)} item(s) in this "
            f"edition, so nothing was written:\n" + "\n".join(problems))
    for warning in warnings:
        print(f"warning: {warning}", file=sys.stderr)

    items = summaries_mod.merge(kept, written)
    hidden_doc = edition_mod.read_json(content_root / "hidden.json", "hidden.json")
    items, orphans = edition_mod.apply_hidden(items, hidden_doc, args.date)
    if orphans:
        raise CurateError(
            "hidden.json logs item(s) this run no longer produces, so nothing "
            "was written. Un-hide them first, or restore the snapshot they "
            "came from:\n" + "\n".join(f"  {i}" for i in orphans))

    document = edition_mod.build(items, args.date, stamp)
    index = edition_mod.update_index(
        edition_mod.read_json(content_root / "index.json", "index.json"), document)
    edition_mod.check(document, index, tag_names)

    edition_path = edition_mod.write_json(
        edition_mod.edition_path(content_root, args.date), document)
    edition_mod.write_json(content_root / "index.json", index)
    edition_mod.write_json(
        edition_mod.day_path(args.data_root, args.date,
                             edition_mod.REJECTED_FILENAME, args.cadence),
        edition_mod.rejected_document(args.date, stamp, rejected, len(kept)))

    # Backstop, as in hide.py: the two documents were checked above, so this
    # only fires on a problem the tree already had - and it is now published.
    try:
        contract.validate_content_root(content_root)
    except contract.FeedValidationError as exc:
        raise CurateError(
            f"{args.date} was written, but {content_root} has problems this "
            f"run did not cause:\n{exc}") from exc

    _report_sources(missing)
    total = sum(document["counts"].values())
    print(f"wrote {_shown(edition_path)} ({total} visible item(s))")
    print(f"wrote {_shown(content_root / 'index.json')}")
    _report_counts(document["counts"])
    hidden_now = sum(1 for i in items if i.get("hidden"))
    if hidden_now:
        print(f"{hidden_now} item(s) carried forward as hidden")
    return 0


# --------------------------------------------------------------------------
# Reporting
# --------------------------------------------------------------------------

def _shown(path):
    try:
        return pathlib.Path(path).relative_to(REPO_ROOT)
    except ValueError:  # a root outside the repo, which is how the tests run
        return path


def _report_sources(missing):
    if missing:
        print(f"warning: no snapshot for {', '.join(missing)}; "
              f"the edition is built from the rest", file=sys.stderr)


def _report_counts(counts):
    print("  " + "  ".join(f"{name} {counts[name]}" for name in counts))


def _report_rejections(rejected):
    by_reason = {}
    for entry in rejected:
        by_reason.setdefault(entry["reason"], []).append(entry)
    for reason in relevance.REASONS:
        for entry in by_reason.get(reason, []):
            print(f"  rejected [{reason}] {entry['source']}: {entry['title']}")


# --------------------------------------------------------------------------
# CLI
# --------------------------------------------------------------------------

def build_parser():
    parser = argparse.ArgumentParser(
        prog="curate_edition.py", description=__doc__.splitlines()[0],
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    for name, help_text, handler in (
        ("draft", "snapshots -> the curation request Claude writes against", cmd_draft),
        ("build", "snapshots + written summaries -> the published edition", cmd_build),
    ):
        sub = subparsers.add_parser(name, help=help_text, description=help_text)
        sub.add_argument("--date", required=True, help="the edition date, YYYY-MM-DD")
        sub.add_argument(
            "--data-root", default=edition_mod.DEFAULT_DATA_ROOT,
            help=f"where the raw snapshots are (default {edition_mod.DEFAULT_DATA_ROOT})",
        )
        # --output-root is the name every other skill script uses for where it
        # writes; --content-root is what validate.py and hide.py call the same
        # tree. Both work, because this script is the one that meets both.
        sub.add_argument(
            "--content-root", "--output-root", dest="content_root",
            default=edition_mod.DEFAULT_CONTENT_ROOT,
            help=f"the published content tree (default {edition_mod.DEFAULT_CONTENT_ROOT})",
        )
        sub.add_argument(
            "--cadence", default=edition_mod.DEFAULT_CADENCE,
            choices=("daily", "weekly", "monthly"),
            help=f"which snapshot folder to read (default {edition_mod.DEFAULT_CADENCE})",
        )
        sub.add_argument(
            "--no-resolve-links", action="store_true",
            help="skip the Product Hunt website lookup, the only network call",
        )
        sub.set_defaults(handler=handler)

    build_sub = subparsers.choices["build"]
    build_sub.add_argument(
        "--summaries", required=True,
        help="the summaries file: {id: {summary, tags}} written by Claude",
    )
    return parser


def main(argv=None):
    args = build_parser().parse_args(argv)
    try:
        return args.handler(args)
    except CurateError as exc:
        print(exc, file=sys.stderr)
        return 1
    except summaries_mod.SummaryError as exc:
        print(exc, file=sys.stderr)
        return 1
