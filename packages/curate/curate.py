#!/usr/bin/env python3
"""Curate one day's snapshots into a published edition.

    python3 packages/curate/curate.py draft --date 2026-08-31
    python3 packages/curate/curate.py build --date 2026-08-31 --summaries s.json

The skill wrapper at .claude/skills/curate-edition/scripts/curate_edition.py
runs the same code; this is the entry point a scheduled job calls directly, the
way packages/fetchers/fetch.py is for the fetch half.
"""

import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

from aibytes_curate import cli

if __name__ == "__main__":
    sys.exit(cli.main())
