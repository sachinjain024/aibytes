#!/usr/bin/env python3
"""Fetch the trending AI-related GitHub repositories and save a JSON snapshot.

Thin CLI wrapper. The scraping, filtering and snapshot logic lives in
packages/fetchers (aibytes_fetchers.sources.github) so the same code backs the
weekly newsletter snapshot and the daily app feed. Run with --cadence daily for
the latter; the GitHub trending window follows the cadence unless --since says
otherwise.

Writes newsletter/data/<yyyy>/<mm>/weeks/week-<NN>/github/gh_data.json.
"""

import pathlib
import sys

REPO_ROOT = pathlib.Path(__file__).resolve().parents[4]
sys.path.insert(0, str(REPO_ROOT / "packages" / "fetchers"))

from aibytes_fetchers import runner
from aibytes_fetchers.sources import github

# Re-exported so the offline unit tests can reach them by their historical names.
from aibytes_fetchers.sources.github import (  # noqa: F401
    AI_PATTERNS,
    fetch_trending,
    is_ai_repo,
    parse_trending,
    text_of,
    to_int,
)


def main():
    runner.run(github)


if __name__ == "__main__":
    main()
