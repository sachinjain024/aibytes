"""Gists: one summary page per edition item (AIB-145y).

The daily run writes them in three steps, the way curate writes an edition:

    draft   built edition + gists/index.json -> .cache/gists/DATE/draft.json
            (fetches material for new items only)
    claude  draft.json + the write-gists skill -> .cache/gists/DATE/gists.json
    build   gists.json -> content/gists/, the index, `gist` on each item

The script owns every fact; Claude writes only the prose. The material in
.cache/ is other people's writing and never leaves the machine that fetched it.
Spec: docs/specs/AIB-145y-gist-generate.md. File format: gist_contract.py.
"""

import pathlib as _pathlib
import sys as _sys

REPO_ROOT = _pathlib.Path(__file__).resolve().parents[3]
for _sibling in ("fetchers", "feed-schema"):
    _path = str(REPO_ROOT / "packages" / _sibling)
    if _path not in _sys.path:
        _sys.path.insert(0, _path)

DEFAULT_CONTENT_ROOT = "content"
DEFAULT_DATA_ROOT = "newsletter/data"
DEFAULT_CACHE_ROOT = ".cache/gists"


def resolve(path):
    """A path relative to the repo root unless it is absolute (tests pass temp dirs)."""
    path = _pathlib.Path(path)
    return path if path.is_absolute() else REPO_ROOT / path
