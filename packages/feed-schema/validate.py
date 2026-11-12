"""Validate the published content contract: editions, the index, tags, hidden,
the optional weekly archive under content/weekly/, and the optional gists
under content/gists/ (AIB-145y; the gist rules live in gist_contract.py).

Stdlib only, like the rest of the repo's Python. This checks the constraints
the schema files actually declare rather than pulling in a JSON Schema engine,
plus the cross-field invariants JSON Schema cannot express - a counts block
that has drifted from its items, an index that has fallen behind the editions
on disk, a tag nobody put in tags.json.

`tests/test_feed_schema.py` asserts that these hand-written rules and the schema
files agree on every enum, pattern, and required key, so the two cannot drift
apart silently.

As a command:

    python3 packages/feed-schema/validate.py            # checks ./content
    python3 packages/feed-schema/validate.py --content-root /tmp/content
"""

import argparse
import datetime as dt
import json
import pathlib
import re
import sys

HERE = pathlib.Path(__file__).resolve().parent
DEFAULT_CONTENT_ROOT = "content"

SCHEMA_VERSION = 1

# Kept in step with the schema files by tests/test_feed_schema.py.
EDITION_REQUIRED = ("schema_version", "date", "generated_at", "counts", "items")
ITEM_REQUIRED = ("id", "title", "summary", "url", "source", "source_url",
                 "category", "tags", "image", "hidden")
ITEM_OPTIONAL = ("signals", "meta", "published_at", "rank")
INDEX_REQUIRED = ("schema_version", "generated_at", "editions")
INDEX_ENTRY_REQUIRED = ("date", "path", "total", "generated_at")
TAGS_REQUIRED = ("schema_version", "groups")
HIDDEN_REQUIRED = ("schema_version", "hidden")
HIDDEN_ENTRY_REQUIRED = ("id", "edition_date", "hidden_at")
WEEKLY_REQUIRED = ("schema_version", "issues")
WEEKLY_ENTRY_REQUIRED = ("number", "slug", "title", "description", "published_on", "source", "path")
WEEKLY_ISSUE_REQUIRED = ("schema_version", "number", "slug", "title", "description",
                         "published_on", "generated_at", "counts", "items")
WEEKLY_SLUG_RE = re.compile(r"^issue-(\d+)$")

CATEGORIES = ("launches", "repos", "news", "hn")
SOURCES = ("producthunt", "hackernews", "techcrunch", "github")
IMAGE_TYPES = ("logo", "avatar", "thumbnail", "none")
SIGNAL_KEYS = ("upvotes", "points", "comments", "stars", "stars_gained", "forks")
META_KEYS = ("language", "author", "reading_time")

MAX_TAGS = 4
SUMMARY_MAX = 200
RANK_MIN = 1

DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
ID_RE = re.compile(r"^[a-z0-9][a-z0-9-]*-\d{4}-\d{2}-\d{2}$")
# A weekly issue's items end in the issue instead of a date: hn-genie-4-issue-16.
WEEKLY_ID_RE = re.compile(r"^[a-z0-9][a-z0-9-]*-issue-\d+$")
PATH_RE = re.compile(r"^(?!.*\.\.)[A-Za-z0-9._-]+(?:/[A-Za-z0-9._-]+)*\.json$")
SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
URL_RE = re.compile(r"^https?://[^\s]+$")


class FeedValidationError(ValueError):
    """Raised with every problem found, one per line."""


def load_schema(name):
    """Load one schema file by its stem, e.g. load_schema("edition")."""
    return json.loads((HERE / f"{name}.schema.json").read_text())


# --------------------------------------------------------------------------
# Editions
# --------------------------------------------------------------------------

def validate_edition(edition, *, tag_names=None):
    """Raise FeedValidationError listing every problem; return edition if clean.

    `tag_names` is the set of display names from tags.json. Tag membership is
    only checked when it is given, because the schema deliberately does not
    enumerate tags - tags.json is the single source and can grow on its own.
    """
    problems = []

    if not isinstance(edition, dict):
        raise FeedValidationError("edition must be a JSON object")

    problems += _missing(edition, EDITION_REQUIRED)
    problems += _version(edition)

    date = edition.get("date")
    if date is not None and not _is_date(date):
        problems.append(f"date {date!r} is not a YYYY-MM-DD date")

    generated = edition.get("generated_at")
    if generated is not None and not _is_datetime(generated):
        problems.append(f"generated_at {generated!r} is not an ISO 8601 timestamp")

    counts = edition.get("counts")
    if counts is not None:
        problems += (f"counts: {p}" for p in _counts_problems(counts))

    problems += _items_problems(edition.get("items"), counts,
                                lambda item: _item_problems(item, date, tag_names))

    problems = list(problems)
    if problems:
        raise FeedValidationError("\n".join(problems))
    return edition


def _items_problems(items, counts, item_problems):
    """Each item on its own, then ids, counts, and ranks across them."""
    if items is None:
        return []
    if not isinstance(items, list):
        return ["items must be an array"]
    problems = []
    seen = set()
    for i, item in enumerate(items):
        problems += (f"items[{i}]: {p}" for p in item_problems(item))
        item_id = isinstance(item, dict) and item.get("id")
        if item_id:
            if item_id in seen:
                problems.append(f"items[{i}]: duplicate item id {item_id!r}")
            seen.add(item_id)
    if isinstance(counts, dict):
        problems += _counts_match_items(counts, items)
    problems += _ranks_match_items(items)
    return problems


def _ranks_match_items(items):
    """rank is all or none, and exactly 1..N over every item, hidden included.

    Hidden items keep their rank so hide.py never renumbers an edition. A rank
    that is not an integer is reported on its own item, so the set check here
    only runs once every rank is well-formed.
    """
    items = [i for i in items if isinstance(i, dict)]
    ranks = [i["rank"] for i in items if "rank" in i]
    if not ranks:
        return []
    if len(ranks) != len(items):
        return [f"rank must be on every item or none: "
                f"{len(items) - len(ranks)} of {len(items)} item(s) lack it"]
    if not all(_is_rank(rank) for rank in ranks):
        return []
    expected = set(range(RANK_MIN, len(items) + RANK_MIN))
    details = []
    missing = sorted(expected - set(ranks))
    if missing:
        details.append("missing " + " ".join(map(str, missing)))
    repeated = sorted({rank for rank in ranks if ranks.count(rank) > 1})
    if repeated:
        details.append("repeated " + " ".join(map(str, repeated)))
    unexpected = sorted(set(ranks) - expected)
    if unexpected:
        details.append("unexpected " + " ".join(map(str, unexpected)))
    if not details:
        return []
    return [f"ranks must be {RANK_MIN}..{len(items)} with no repeats; " + ", ".join(details)]


def _counts_problems(counts):
    if not isinstance(counts, dict):
        return ["must be an object"]
    problems = []
    for key in CATEGORIES:
        if key not in counts:
            problems.append(f"missing category {key!r}")
    for key in counts:
        if key not in CATEGORIES:
            problems.append(f"unknown category {key!r}")
        elif not _is_count(counts[key]):
            problems.append(f"{key} {counts[key]!r} must be a non-negative integer")
    return problems


def _counts_match_items(counts, items):
    """counts is what the edition bar renders, so it must be the visible tally."""
    tally = dict.fromkeys(CATEGORIES, 0)
    for item in items:
        if not isinstance(item, dict) or item.get("hidden") is True:
            continue
        category = item.get("category")
        if category in tally:
            tally[category] += 1
    return [
        f"counts.{category} is {counts[category]} but {tally[category]} visible "
        f"item(s) are in that category"
        for category in CATEGORIES
        if category in counts and _is_count(counts[category])
        and counts[category] != tally[category]
    ]


def _item_problems(item, edition_date, tag_names, *, issue_number=None):
    """One item. A weekly issue's item passes `issue_number` instead of a date."""
    if not isinstance(item, dict):
        return ["must be an object"]
    problems = _missing(item, ITEM_REQUIRED)
    for key in item:
        if key not in ITEM_REQUIRED + ITEM_OPTIONAL:
            problems.append(f"unknown key: {key}")

    item_id = item.get("id")
    id_re, suffix, what = (
        (ID_RE, edition_date and f"-{edition_date}", "the edition date") if issue_number is None
        else (WEEKLY_ID_RE, f"-issue-{issue_number}", "the issue"))
    if item_id is not None:
        if not (isinstance(item_id, str) and id_re.match(item_id)):
            problems.append(f"id {item_id!r} must match {id_re.pattern}")
        elif suffix and not item_id.endswith(suffix):
            # A global id is what makes a save (item_id + edition_date)
            # resolvable, and this catches an item carried over from yesterday.
            problems.append(f"id {item_id!r} must end with {what} {suffix}")

    for key in ("title", "summary"):
        value = item.get(key)
        if value is not None and not (isinstance(value, str) and value.strip()):
            problems.append(f"{key} must be a non-empty string")
    summary = item.get("summary")
    if isinstance(summary, str) and len(summary) > SUMMARY_MAX:
        problems.append(f"summary is {len(summary)} chars, over the {SUMMARY_MAX} cap")

    for key in ("url", "source_url"):
        value = item.get(key)
        if value is not None and not (isinstance(value, str) and URL_RE.match(value)):
            problems.append(f"{key} {value!r} must be an http(s) URL")

    source = item.get("source")
    if source is not None and source not in SOURCES:
        problems.append(f"source {source!r} not one of {SOURCES}")

    category = item.get("category")
    if category is not None and category not in CATEGORIES:
        problems.append(f"category {category!r} not one of {CATEGORIES}")

    problems += _tag_problems(item.get("tags"), tag_names)
    problems += _image_problems(item.get("image"))
    problems += _signal_problems(item.get("signals"))
    problems += _meta_problems(item.get("meta"))

    published = item.get("published_at")
    if published is not None and not _is_datetime(published):
        problems.append(f"published_at {published!r} is not an ISO 8601 timestamp")

    hidden = item.get("hidden")
    if hidden is not None and not isinstance(hidden, bool):
        problems.append(f"hidden {hidden!r} must be a boolean")

    if "rank" in item and not _is_rank(item["rank"]):
        problems.append(f"rank {item['rank']!r} must be an integer of at least {RANK_MIN}")
    return problems


def _tag_problems(tags, tag_names):
    if tags is None:
        return []
    if not isinstance(tags, list):
        return ["tags must be an array"]
    problems = []
    if len(tags) > MAX_TAGS:
        problems.append(f"{len(tags)} tags, over the {MAX_TAGS} cap")
    if len(set(map(repr, tags))) != len(tags):
        problems.append("tags must be unique")
    for tag in tags:
        if not (isinstance(tag, str) and tag):
            problems.append(f"tag {tag!r} must be a non-empty string")
        elif tag_names is not None and tag not in tag_names:
            problems.append(f"tag {tag!r} is not in tags.json")
    return problems


def _image_problems(image):
    if image is None:
        return []
    if not isinstance(image, dict):
        return ["image must be an object"]
    problems = []
    for key in image:
        if key not in ("type", "url"):
            problems.append(f"image: unknown key: {key}")
    kind = image.get("type")
    if kind is None:
        problems.append("image: missing required key: type")
    elif kind not in IMAGE_TYPES:
        problems.append(f"image: type {kind!r} not one of {IMAGE_TYPES}")

    url = image.get("url")
    if kind == "none":
        if "url" in image:
            problems.append("image: type 'none' must not carry a url")
    elif kind in IMAGE_TYPES:
        if url is None:
            problems.append(f"image: type {kind!r} requires a url")
        elif not (isinstance(url, str) and URL_RE.match(url)):
            problems.append(f"image: url {url!r} must be an http(s) URL")
    return problems


def _signal_problems(signals):
    if signals is None:
        return []
    if not isinstance(signals, dict):
        return ["signals must be an object"]
    # Omitted rather than empty, so a re-run diffs cleanly.
    problems = [] if signals else ["signals must be omitted rather than empty"]
    for key, value in signals.items():
        if key not in SIGNAL_KEYS:
            problems.append(f"signals: unknown key: {key}")
        elif not _is_count(value):
            problems.append(f"signals.{key} {value!r} must be a non-negative integer")
    return problems


def _meta_problems(meta):
    if meta is None:
        return []
    if not isinstance(meta, dict):
        return ["meta must be an object"]
    # Omitted rather than empty, so a re-run diffs cleanly - as for signals.
    problems = [] if meta else ["meta must be omitted rather than empty"]
    for key, value in meta.items():
        if key not in META_KEYS:
            problems.append(f"meta: unknown key: {key}")
        elif value is not None and not isinstance(value, str):
            problems.append(f"meta.{key} {value!r} must be a string or null")
    return problems


# --------------------------------------------------------------------------
# Index
# --------------------------------------------------------------------------

def validate_index(index):
    """Raise FeedValidationError listing every problem; return index if clean."""
    problems = []

    if not isinstance(index, dict):
        raise FeedValidationError("index must be a JSON object")

    problems += _missing(index, INDEX_REQUIRED)
    problems += _version(index)

    generated = index.get("generated_at")
    if generated is not None and not _is_datetime(generated):
        problems.append(f"generated_at {generated!r} is not an ISO 8601 timestamp")

    editions = index.get("editions")
    if editions is None:
        pass
    elif not isinstance(editions, list):
        problems.append("editions must be an array")
    else:
        previous = None
        for i, entry in enumerate(editions):
            problems += (f"editions[{i}]: {p}" for p in _index_entry_problems(entry))
            date = isinstance(entry, dict) and entry.get("date")
            if date and _is_date(date):
                # The bar's prev/next arrows and `/` resolving to the latest
                # both assume newest first with no repeats.
                if previous is not None and date >= previous:
                    problems.append(
                        f"editions[{i}]: date {date!r} must be older than the "
                        f"entry before it ({previous!r}); newest first"
                    )
                previous = date

    problems = list(problems)
    if problems:
        raise FeedValidationError("\n".join(problems))
    return index


def _index_entry_problems(entry):
    if not isinstance(entry, dict):
        return ["must be an object"]
    problems = _missing(entry, INDEX_ENTRY_REQUIRED)
    for key in entry:
        if key not in INDEX_ENTRY_REQUIRED:
            problems.append(f"unknown key: {key}")

    date = entry.get("date")
    if date is not None and not _is_date(date):
        problems.append(f"date {date!r} is not a YYYY-MM-DD date")

    path = entry.get("path")
    if path is not None and not (isinstance(path, str) and PATH_RE.match(path)):
        problems.append(f"path {path!r} must be a relative .json path")

    total = entry.get("total")
    if total is not None and not _is_count(total):
        problems.append(f"total {total!r} must be a non-negative integer")

    generated = entry.get("generated_at")
    if generated is not None and not _is_datetime(generated):
        problems.append(f"generated_at {generated!r} is not an ISO 8601 timestamp")
    return problems


# --------------------------------------------------------------------------
# Tags
# --------------------------------------------------------------------------

def validate_tags(tags):
    """Raise FeedValidationError listing every problem; return tags if clean."""
    problems = []

    if not isinstance(tags, dict):
        raise FeedValidationError("tags must be a JSON object")

    problems += _missing(tags, TAGS_REQUIRED)
    problems += _version(tags)

    groups = tags.get("groups")
    if groups is None:
        pass
    elif not isinstance(groups, list) or not groups:
        problems.append("groups must be a non-empty array")
    else:
        names, slugs = set(), set()
        for i, group in enumerate(groups):
            if not isinstance(group, dict):
                problems.append(f"groups[{i}]: must be an object")
                continue
            for key in group:
                if key not in ("name", "tags"):
                    problems.append(f"groups[{i}]: unknown key: {key}")
            if not (isinstance(group.get("name"), str) and group.get("name")):
                problems.append(f"groups[{i}]: name must be a non-empty string")
            entries = group.get("tags")
            if not isinstance(entries, list) or not entries:
                problems.append(f"groups[{i}]: tags must be a non-empty array")
                continue
            for j, tag in enumerate(entries):
                where = f"groups[{i}].tags[{j}]"
                problems += (f"{where}: {p}" for p in _tag_entry_problems(tag))
                if not isinstance(tag, dict):
                    continue
                # A tag in two groups, or two tags sharing a slug, would make
                # the filter ambiguous.
                for value, seen, label in ((tag.get("name"), names, "name"),
                                           (tag.get("slug"), slugs, "slug")):
                    if value:
                        if value in seen:
                            problems.append(f"{where}: duplicate tag {label} {value!r}")
                        seen.add(value)

    problems = list(problems)
    if problems:
        raise FeedValidationError("\n".join(problems))
    return tags


def _tag_entry_problems(tag):
    if not isinstance(tag, dict):
        return ["must be an object"]
    problems = []
    for key in tag:
        if key not in ("name", "slug"):
            problems.append(f"unknown key: {key}")
    name = tag.get("name")
    if not (isinstance(name, str) and name):
        problems.append("name must be a non-empty string")
    slug = tag.get("slug")
    if not (isinstance(slug, str) and SLUG_RE.match(slug)):
        problems.append(f"slug {slug!r} must match {SLUG_RE.pattern}")
    return problems


def tag_names(tags):
    """The set of display names an edition item may use, from a tags document."""
    return {
        tag["name"]
        for group in tags.get("groups", [])
        for tag in group.get("tags", [])
        if isinstance(tag, dict) and isinstance(tag.get("name"), str)
    }


# --------------------------------------------------------------------------
# Hidden
# --------------------------------------------------------------------------

def validate_hidden(hidden):
    """Raise FeedValidationError listing every problem; return hidden if clean."""
    problems = []

    if not isinstance(hidden, dict):
        raise FeedValidationError("hidden must be a JSON object")

    problems += _missing(hidden, HIDDEN_REQUIRED)
    problems += _version(hidden)

    entries = hidden.get("hidden")
    if entries is None:
        pass
    elif not isinstance(entries, list):
        problems.append("hidden must be an array")
    else:
        seen = set()
        for i, entry in enumerate(entries):
            problems += (f"hidden[{i}]: {p}" for p in _hidden_entry_problems(entry))
            entry_id = isinstance(entry, dict) and entry.get("id")
            if entry_id:
                if entry_id in seen:
                    problems.append(f"hidden[{i}]: duplicate id {entry_id!r}")
                seen.add(entry_id)

    problems = list(problems)
    if problems:
        raise FeedValidationError("\n".join(problems))
    return hidden


def _hidden_entry_problems(entry):
    if not isinstance(entry, dict):
        return ["must be an object"]
    problems = _missing(entry, HIDDEN_ENTRY_REQUIRED)
    for key in entry:
        if key not in HIDDEN_ENTRY_REQUIRED + ("reason",):
            problems.append(f"unknown key: {key}")

    entry_id = entry.get("id")
    if entry_id is not None and not (isinstance(entry_id, str) and ID_RE.match(entry_id)):
        problems.append(f"id {entry_id!r} must match {ID_RE.pattern}")

    date = entry.get("edition_date")
    if date is not None and not _is_date(date):
        problems.append(f"edition_date {date!r} is not a YYYY-MM-DD date")
    elif date and isinstance(entry_id, str) and not entry_id.endswith(f"-{date}"):
        problems.append(f"id {entry_id!r} does not end with edition_date -{date}")

    when = entry.get("hidden_at")
    if when is not None and not _is_datetime(when):
        problems.append(f"hidden_at {when!r} is not an ISO 8601 timestamp")

    reason = entry.get("reason")
    if reason is not None and not (isinstance(reason, str) and reason.strip()):
        problems.append("reason must be a non-empty string when present")
    return problems


# --------------------------------------------------------------------------
# The whole content tree
# --------------------------------------------------------------------------

def validate_content_root(root):
    """Validate every file under a content/ tree, and how they agree.

    Each file is valid on its own and the set is consistent: the index lists
    exactly the editions on disk with matching totals, every hidden entry
    points at an item actually flipped to hidden, and every tag is in
    tags.json. Raises FeedValidationError with every problem found.
    """
    root = pathlib.Path(root)
    problems = []
    tags_doc = None

    documents = {}
    for name, validator in (("tags", validate_tags), ("index", validate_index),
                            ("hidden", validate_hidden)):
        path = root / f"{name}.json"
        if not path.exists():
            problems.append(f"{name}.json: missing")
            continue
        try:
            documents[name] = json.loads(path.read_text())
        except ValueError as exc:
            problems.append(f"{name}.json: not valid JSON: {exc}")
            continue
        try:
            validator(documents[name])
        except FeedValidationError as exc:
            problems += (f"{name}.json: {line}" for line in str(exc).splitlines())

    if "tags" in documents:
        tags_doc = tag_names(documents["tags"])

    editions = {}
    for path in sorted((root / "editions").glob("*.json")):
        try:
            edition = json.loads(path.read_text())
        except ValueError as exc:
            problems.append(f"editions/{path.name}: not valid JSON: {exc}")
            continue
        editions[f"editions/{path.name}"] = edition
        try:
            validate_edition(edition, tag_names=tags_doc)
        except FeedValidationError as exc:
            problems += (f"editions/{path.name}: {line}" for line in str(exc).splitlines())
        if isinstance(edition, dict) and edition.get("date") != path.stem:
            problems.append(
                f"editions/{path.name}: date {edition.get('date')!r} does not "
                f"match the filename"
            )

    problems += _index_agrees_with_editions(documents.get("index"), editions)
    problems += _hidden_agrees_with_editions(documents.get("hidden"), editions)
    problems += _weekly_index_problems(root, tags_doc)
    problems += _gist_problems(root, tags_doc)

    problems = list(problems)
    if problems:
        raise FeedValidationError("\n".join(problems))
    return True


def _gist_problems(root, tag_names):
    """Every gist file on its own (AIB-145y T5). No gists/ folder is valid."""
    # Imported here: gist_contract builds on this module's helpers.
    import gist_contract
    return gist_contract.gist_file_problems(root, tag_names=tag_names)


def validate_weekly_issue(issue, *, tag_names=None):
    """Raise FeedValidationError listing every problem; return issue if clean.

    content/weekly/issues/issue-N.json: an edition-shaped feed for one weekly
    issue. Items follow the edition item contract, with ids ending -issue-N.
    """
    if not isinstance(issue, dict):
        raise FeedValidationError("weekly issue must be a JSON object")
    problems = _missing(issue, WEEKLY_ISSUE_REQUIRED)
    problems += _version(issue)

    number = issue.get("number")
    if number is not None and not _is_issue_number(number):
        problems.append(f"number {number!r} must be a positive integer")
        number = None
    slug = issue.get("slug")
    if slug is not None and slug != f"issue-{number}":
        problems.append(f"slug {slug!r} must be issue-{number}")
    published = issue.get("published_on")
    if published is not None and not _is_date(published):
        problems.append(f"published_on {published!r} is not a YYYY-MM-DD date")
    generated = issue.get("generated_at")
    if generated is not None and not _is_datetime(generated):
        problems.append(f"generated_at {generated!r} is not an ISO 8601 timestamp")

    counts = issue.get("counts")
    if counts is not None:
        problems += (f"counts: {p}" for p in _counts_problems(counts))
    problems += _items_problems(issue.get("items"), counts,
                                lambda item: _item_problems(item, None, tag_names, issue_number=number))

    if problems:
        raise FeedValidationError("\n".join(problems))
    return issue


def _weekly_index_problems(root, tag_names=None):
    """Optional content/weekly/ (AIB-105j): the index and every issue it lists.

    Absent is fine. When present the index is newest first, each entry names
    its source HTML and its issue file, and each issue file agrees with its
    entry.
    """
    root = pathlib.Path(root)
    path = root / "weekly" / "index.json"
    if not path.exists():
        return []
    try:
        document = json.loads(path.read_text())
    except ValueError as exc:
        return [f"weekly/index.json: not valid JSON: {exc}"]
    if not isinstance(document, dict):
        return ["weekly/index.json: must be an object"]

    problems = [f"weekly/index.json: {p}" for p in _missing(document, WEEKLY_REQUIRED) + _version(document)]
    issues = document.get("issues")
    if issues is None:
        return problems
    if not isinstance(issues, list):
        return problems + ["weekly/index.json: issues must be an array"]

    repo_root = root.resolve().parent
    previous = None
    for i, entry in enumerate(issues):
        prefix = f"weekly/index.json: issues[{i}]"
        if not isinstance(entry, dict):
            problems.append(f"{prefix}: must be an object")
            continue
        problems += (f"{prefix}: {p}" for p in _missing(entry, WEEKLY_ENTRY_REQUIRED))
        problems += (f"{prefix}: unknown key: {key}" for key in entry if key not in WEEKLY_ENTRY_REQUIRED)

        number = entry.get("number")
        if number is not None and not _is_issue_number(number):
            problems.append(f"{prefix}: number must be a positive integer")
            number = None
        if number is not None:
            if previous is not None and number >= previous:
                problems.append(f"{prefix}: issues must be newest first, strictly descending; {number} follows {previous}")
            previous = number

        slug = entry.get("slug")
        if slug is not None and not (isinstance(slug, str) and WEEKLY_SLUG_RE.match(slug)):
            problems.append(f"{prefix}: slug {slug!r} must match issue-{{N}}")
        elif slug is not None and number is not None and slug != f"issue-{number}":
            problems.append(f"{prefix}: slug {slug!r} does not match number {number}")

        for field in ("title", "source"):
            value = entry.get(field)
            if value is not None and not (isinstance(value, str) and value.strip()):
                problems.append(f"{prefix}: {field} must be a non-empty string")
        if "description" in entry and not isinstance(entry["description"], str):
            problems.append(f"{prefix}: description must be a string")
        published = entry.get("published_on")
        if published is not None and not _is_date(published):
            problems.append(f"{prefix}: published_on {published!r} is not a YYYY-MM-DD date")

        source = entry.get("source")
        if isinstance(source, str) and source.strip():
            source_path = (repo_root / source).resolve()
            try:
                source_path.relative_to(repo_root)
            except ValueError:
                problems.append(f"{prefix}: source escapes the repo ({source!r})")
            else:
                if not source_path.is_file():
                    problems.append(f"{prefix}: source file missing ({source})")

        problems += _weekly_issue_file_problems(root, prefix, entry, tag_names)
    return problems


def _weekly_issue_file_problems(root, prefix, entry, tag_names):
    """The issue file an index entry points at: there, valid, and in step."""
    issue_path = entry.get("path")
    if issue_path is None:
        return []
    slug = entry.get("slug")
    if not (isinstance(issue_path, str) and PATH_RE.match(issue_path)):
        return [f"{prefix}: path {issue_path!r} must be a relative content path"]
    if isinstance(slug, str) and issue_path != f"weekly/issues/{slug}.json":
        return [f"{prefix}: path {issue_path!r} must be weekly/issues/{slug}.json"]
    file = root / issue_path
    if not file.is_file():
        return [f"{prefix}: path file missing ({issue_path})"]
    try:
        issue = json.loads(file.read_text())
    except ValueError as exc:
        return [f"{issue_path}: not valid JSON: {exc}"]
    try:
        validate_weekly_issue(issue, tag_names=tag_names)
    except FeedValidationError as exc:
        return [f"{issue_path}: {line}" for line in str(exc).splitlines()]
    return [f"{issue_path}: {key} {issue.get(key)!r} does not match the index entry's {entry.get(key)!r}"
            for key in ("number", "slug", "title", "description", "published_on")
            if key in entry and issue.get(key) != entry.get(key)]


def _is_issue_number(value):
    return isinstance(value, int) and not isinstance(value, bool) and value >= 1


def _index_agrees_with_editions(index, editions):
    """`editions` is keyed by each file's path relative to the index."""
    if not isinstance(index, dict) or not isinstance(index.get("editions"), list):
        return []
    problems = []
    listed = {}
    for entry in index["editions"]:
        if isinstance(entry, dict) and isinstance(entry.get("date"), str):
            listed[entry["date"]] = entry

    on_disk = {
        edition["date"]: path
        for path, edition in editions.items()
        if isinstance(edition, dict) and isinstance(edition.get("date"), str)
    }

    for date in sorted(set(listed) - set(on_disk)):
        problems.append(f"index.json: lists {date} but content/editions/{date}.json is missing")
    for date in sorted(set(on_disk) - set(listed)):
        problems.append(f"index.json: does not list {on_disk[date]}")

    for date in sorted(set(listed) & set(on_disk)):
        entry, edition = listed[date], editions[on_disk[date]]
        # `path` is the field a consumer actually dereferences - it resolves it
        # against the index URL and fetches it - so a path that points at the
        # wrong edition, or at nothing, is a 404 in the app.
        if entry.get("path") != on_disk[date]:
            problems.append(
                f"index.json: {date} path is {entry.get('path')!r} but that "
                f"edition is at {on_disk[date]}"
            )
        counts = edition.get("counts")
        if isinstance(counts, dict):
            total = sum(v for v in counts.values() if _is_count(v))
            if entry.get("total") != total:
                problems.append(
                    f"index.json: {date} total is {entry.get('total')!r} but the "
                    f"edition's counts sum to {total}"
                )
        if entry.get("generated_at") != edition.get("generated_at"):
            problems.append(f"index.json: {date} generated_at does not match the edition")
    return problems


def _hidden_agrees_with_editions(hidden, editions):
    if not isinstance(hidden, dict) or not isinstance(hidden.get("hidden"), list):
        return []
    flagged = {
        item["id"]
        for edition in editions.values()
        if isinstance(edition, dict)
        for item in edition.get("items", [])
        if isinstance(item, dict) and item.get("hidden") is True
        and isinstance(item.get("id"), str)
    }
    logged = {
        entry["id"] for entry in hidden["hidden"]
        if isinstance(entry, dict) and isinstance(entry.get("id"), str)
    }
    known_dates = {
        edition["date"] for edition in editions.values()
        if isinstance(edition, dict) and isinstance(edition.get("date"), str)
    }

    problems = []
    for entry in hidden["hidden"]:
        if not isinstance(entry, dict):
            continue
        entry_id, date = entry.get("id"), entry.get("edition_date")
        if date in known_dates and entry_id not in flagged:
            problems.append(
                f"hidden.json: {entry_id} is logged but that item is not "
                f"hidden: true in editions/{date}.json"
            )
    for item_id in sorted(flagged - logged):
        problems.append(f"hidden.json: {item_id} is hidden in its edition but not logged here")
    return problems


# --------------------------------------------------------------------------
# Shared helpers
# --------------------------------------------------------------------------

def _missing(document, required):
    return [f"missing required key: {key}" for key in required if key not in document]


def _version(document):
    version = document.get("schema_version")
    if version is not None and version != SCHEMA_VERSION:
        return [f"schema_version {version!r} is not the expected {SCHEMA_VERSION}"]
    return []


def _is_count(value):
    return isinstance(value, int) and not isinstance(value, bool) and value >= 0


def _is_rank(value):
    # Stricter than the schema's "integer", which also admits 1.0.
    return isinstance(value, int) and not isinstance(value, bool) and value >= RANK_MIN


def _is_datetime(value):
    if not isinstance(value, str):
        return False
    try:
        dt.datetime.fromisoformat(value.replace("Z", "+00:00"))
        return True
    except ValueError:
        return False


def _is_date(value):
    if not isinstance(value, str) or not DATE_RE.match(value):
        return False
    try:
        dt.date.fromisoformat(value)
        return True
    except ValueError:
        return False


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument(
        "--content-root", default=DEFAULT_CONTENT_ROOT,
        help=f"the content tree to check (default {DEFAULT_CONTENT_ROOT})",
    )
    args = parser.parse_args(argv)
    try:
        validate_content_root(args.content_root)
    except FeedValidationError as exc:
        print(f"{args.content_root} is not valid:\n{exc}", file=sys.stderr)
        return 1
    print(f"{args.content_root} is valid")
    return 0


if __name__ == "__main__":
    sys.exit(main())
