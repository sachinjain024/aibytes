#!/usr/bin/env python3
"""Fetch top ProductHunt products of the last N days and save a JSON snapshot.

Thin CLI wrapper. The GraphQL query, auth and snapshot logic lives in
packages/fetchers (aibytes_fetchers.sources.producthunt) so the same code backs
the weekly newsletter snapshot and the daily app feed. Run with --cadence daily
for the latter.

Reads PH_API_KEY from .env at the repo root. Writes
newsletter/data/<yyyy>/<mm>/weeks/week-<NN>/producthunt/ph_data.json.
"""

import pathlib
import sys

REPO_ROOT = pathlib.Path(__file__).resolve().parents[4]
sys.path.insert(0, str(REPO_ROOT / "packages" / "fetchers"))

from aibytes_fetchers import runner
from aibytes_fetchers.sources import producthunt

# Re-exported so the offline unit tests can reach them by their historical names.
from aibytes_fetchers.sources.producthunt import (  # noqa: F401
    GRAPHQL_URL,
    QUERY,
    TOKEN_URL,
    access_token,
    load_env,
)


def main():
    runner.run(producthunt)


if __name__ == "__main__":
    main()
