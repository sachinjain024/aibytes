"""Repo-root discovery, so scripts can be run from anywhere."""

import pathlib

# packages/fetchers/aibytes_fetchers/paths.py -> repo root
REPO_ROOT = pathlib.Path(__file__).resolve().parents[3]
