#!/usr/bin/env python3
"""Fetch popular TechCrunch AI articles of the last N days and save a JSON snapshot.

Thin CLI wrapper. The fetching, HN ranking and snapshot logic lives in
packages/fetchers (aibytes_fetchers.sources.techcrunch) so the same code backs
the weekly newsletter snapshot and the daily app feed. Run with --cadence daily
for the latter.

Writes newsletter/data/<yyyy>/<mm>/weeks/week-<NN>/news/techcrunch/tc_data.json.
"""

import pathlib
import sys

REPO_ROOT = pathlib.Path(__file__).resolve().parents[4]
sys.path.insert(0, str(REPO_ROOT / "packages" / "fetchers"))

from aibytes_fetchers import runner
from aibytes_fetchers.sources import techcrunch

# Re-exported so the offline unit tests can reach them by their historical names.
from aibytes_fetchers.sources.techcrunch import (  # noqa: F401
    fetch_hn_points,
    fetch_posts,
    normalize_url,
    strip_html,
    to_article,
)


def main():
    runner.run(techcrunch)


if __name__ == "__main__":
    main()
