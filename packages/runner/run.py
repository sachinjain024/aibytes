#!/usr/bin/env python3
"""Publish one day's edition, end to end. This is what launchd calls.

    python3 packages/runner/run.py                    # today
    python3 packages/runner/run.py --date 2026-08-31  # backfill or re-run
    python3 packages/runner/run.py --skip-fetch --no-push   # a dry run

fetch -> draft -> Claude writes the summaries -> build -> validate -> commit
and push. Exits non-zero on any failure, and says so in Slack either way.
"""

import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

from aibytes_runner import cli

if __name__ == "__main__":
    sys.exit(cli.main())
