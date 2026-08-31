"""Turn a day's raw source snapshots into one published edition.

The fetchers in packages/fetchers write four differently-shaped snapshots. The
contract in packages/feed-schema is one shape for all four. This package is the
step between them: dedup, the relevance filter, one category per item, image
resolution, and the ids, signals and counts the contract requires.

Two things it deliberately does not do: write the summary, and pick the tags.
Those are Claude's, and Claude is the caller - the daily job runs this skill
rather than this script shelling out to an LLM. So the work splits in two:

    draft   snapshots            -> curation.json + rejected.json
            (Claude writes summaries and tags against curation.json)
    build   snapshots + those    -> content/editions/DATE.json + index.json

`build` re-derives the drafts from the snapshots rather than trusting
curation.json, so the snapshots stay the single source of truth and a stale
draft file cannot quietly change what gets published.
"""

__all__ = ["adapters", "relevance", "summaries", "edition", "cli"]

import pathlib as _pathlib
import sys as _sys

# The sibling packages this one sits between. Set up once here so every module
# can just import them, and so importing any single module works on its own.
REPO_ROOT = _pathlib.Path(__file__).resolve().parents[3]
for _sibling in ("fetchers", "feed-schema"):
    _path = str(REPO_ROOT / "packages" / _sibling)
    if _path not in _sys.path:
        _sys.path.insert(0, _path)
