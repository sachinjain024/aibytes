#!/usr/bin/env python3
"""Curate one day's raw snapshots into a published edition.

Thin CLI wrapper. The adapters, the relevance filter, dedup and the contract
handling live in packages/curate (aibytes_curate), so the same code backs this
skill and whatever the daily job calls.

    curate_edition.py draft --date 2026-08-31
    curate_edition.py build --date 2026-08-31 --summaries summaries.json

Reads newsletter/data/<yyyy>/<mm>/days/<date>/, writes content/editions/<date>.json.
"""

import pathlib
import sys

REPO_ROOT = pathlib.Path(__file__).resolve().parents[4]
sys.path.insert(0, str(REPO_ROOT / "packages" / "curate"))

from aibytes_curate import cli

# Re-exported so the offline unit tests can reach them by name, as the fetch
# skill wrappers do.
from aibytes_curate.cli import cmd_build, cmd_draft, prepare  # noqa: F401


def main():
    return cli.main()


if __name__ == "__main__":
    sys.exit(main())
