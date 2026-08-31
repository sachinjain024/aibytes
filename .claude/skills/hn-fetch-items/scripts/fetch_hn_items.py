#!/usr/bin/env python3
"""Fetch the top AI-related HackerNews stories of the last N days and save a JSON snapshot.

Thin CLI wrapper. The fetching, filtering and snapshot logic lives in
packages/fetchers (aibytes_fetchers.sources.hackernews) so the same code backs
the weekly newsletter snapshot and the daily app feed. Run with --cadence daily
for the latter.

Writes newsletter/data/<yyyy>/<mm>/weeks/week-<NN>/news/hackernews/hn_data.json.
"""

import pathlib
import sys

REPO_ROOT = pathlib.Path(__file__).resolve().parents[4]
sys.path.insert(0, str(REPO_ROOT / "packages" / "fetchers"))

from aibytes_fetchers import runner
from aibytes_fetchers.sources import hackernews

# Re-exported so the offline unit tests can reach them by their historical names.
from aibytes_fetchers.sources.hackernews import (  # noqa: F401
    AI_DOMAINS,
    AI_PATTERNS,
    AI_PATTERNS_CASED,
    fetch_stories,
    is_ai_story,
    story_type,
    to_story,
)


def main():
    runner.run(hackernews)


if __name__ == "__main__":
    main()
