"""Validate a feed index against feed.schema.json.

Stdlib only - this checks the constraints the schema actually declares rather
than pulling in a JSON Schema engine. `tests/test_feed_schema.py` asserts that
this validator and the schema file agree on the required fields, so the two
cannot drift apart silently.
"""

import datetime as dt
import json
import pathlib
import re

SCHEMA_PATH = pathlib.Path(__file__).resolve().parent / "feed.schema.json"

SCHEMA_VERSION = 1
CADENCES = ("daily", "weekly", "monthly")
INDEX_REQUIRED = ("schemaVersion", "generatedAt", "cadence", "sources")
SOURCE_REQUIRED = ("name", "path", "count")
NAME_RE = re.compile(r"^[a-z][a-z0-9-]*$")
PATH_RE = re.compile(r"^(?!.*\.\.)[A-Za-z0-9._-]+(?:/[A-Za-z0-9._-]+)*\.json$")


class FeedValidationError(ValueError):
    """Raised with every problem found, one per line."""


def load_schema():
    return json.loads(SCHEMA_PATH.read_text())


def validate_index(index):
    """Raise FeedValidationError listing every problem; return index if clean."""
    problems = []

    if not isinstance(index, dict):
        raise FeedValidationError("index must be a JSON object")

    for key in INDEX_REQUIRED:
        if key not in index:
            problems.append(f"missing required key: {key}")

    version = index.get("schemaVersion")
    if version is not None and version != SCHEMA_VERSION:
        problems.append(f"schemaVersion {version!r} is not the expected {SCHEMA_VERSION}")

    generated = index.get("generatedAt")
    if generated is not None and not _is_datetime(generated):
        problems.append(f"generatedAt {generated!r} is not an ISO 8601 timestamp")

    as_of = index.get("asOf")
    if as_of is not None and not _is_date(as_of):
        problems.append(f"asOf {as_of!r} is not a YYYY-MM-DD date")

    cadence = index.get("cadence")
    if cadence is not None and cadence not in CADENCES:
        problems.append(f"cadence {cadence!r} not one of {CADENCES}")

    sources = index.get("sources")
    if sources is None:
        pass
    elif not isinstance(sources, list):
        problems.append("sources must be an array")
    else:
        seen = set()
        for i, source in enumerate(sources):
            problems.extend(f"sources[{i}]: {p}" for p in _source_problems(source))
            name = isinstance(source, dict) and source.get("name")
            if name:
                if name in seen:
                    problems.append(f"sources[{i}]: duplicate source name {name!r}")
                seen.add(name)

    if problems:
        raise FeedValidationError("\n".join(problems))
    return index


def _source_problems(source):
    if not isinstance(source, dict):
        return ["must be an object"]
    problems = []
    for key in SOURCE_REQUIRED:
        if key not in source:
            problems.append(f"missing required key: {key}")

    name = source.get("name")
    if name is not None and not (isinstance(name, str) and NAME_RE.match(name)):
        problems.append(f"name {name!r} must match {NAME_RE.pattern}")

    path = source.get("path")
    if path is not None and not (isinstance(path, str) and PATH_RE.match(path)):
        problems.append(f"path {path!r} must be a relative .json path")

    count = source.get("count")
    if count is not None and not (isinstance(count, int) and not isinstance(count, bool) and count >= 0):
        problems.append(f"count {count!r} must be a non-negative integer")
    return problems


def _is_datetime(value):
    if not isinstance(value, str):
        return False
    try:
        dt.datetime.fromisoformat(value.replace("Z", "+00:00"))
        return True
    except ValueError:
        return False


def _is_date(value):
    if not isinstance(value, str):
        return False
    try:
        dt.date.fromisoformat(value)
        return True
    except ValueError:
        return False
