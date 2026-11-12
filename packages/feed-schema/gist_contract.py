"""The gist contract: content/gists/<slug>.json (AIB-145y).

docs/specs/AIB-145y-gist-contract.md is the source of every rule here. This
module holds the caps, the per-file checks, the source key and the slug
rules, so the generator (packages/gists) and validate.py share one copy.
gist.schema.json is the contract of record for consumers, and
tests/test_gist_contract.py keeps the two in step.

Stdlib only, Python 3.8, like the rest of the repo.

It also checks content/gists/index.json and how the gists, the index and the
items agree (T6), and decides whether a gist is shown (T7).
"""

import datetime as dt
import json
import pathlib
import re
import unicodedata
import urllib.parse

import validate as contract

GIST_SCHEMA_VERSION = 1

GIST_REQUIRED = ("schema_version", "slug", "kind", "title", "url", "source_url", "tags",
                 "image", "depth", "sections", "links", "appearances", "created_at",
                 "updated_at")
GIST_OPTIONAL = ("source", "category", "lede", "stats", "stats_as_of", "front_page",
                 "preview")

KINDS = ("news", "hn", "repo", "launch", "x_post")
DEPTHS = ("full", "brief", "preview")
# The fetcher source each kind belongs to, and the edition categories its
# items can carry: curate files Show HN and Launch HN under launches, so an hn
# gist may be either. x_post has neither: X posts come from a pasted Grok
# snapshot, not a fetcher.
KIND_SOURCE = {"news": ("techcrunch", ("news",)), "hn": ("hackernews", ("hn", "launches")),
               "repo": ("github", ("repos",)), "launch": ("producthunt", ("launches",))}

GIST_SLUG_RE = contract.SLUG_RE
GIST_SLUG_MAX = contract.GIST_SLUG_MAX
TITLE_MAX = 200
LEDE_MIN = 40
LEDE_MAX = 320

# Sections, in the order they render.
SECTION_KEYS = ("key_points", "why_it_matters", "who_its_for", "pricing", "try_it",
                "discussion", "whats_open")
SECTION_KINDS = {
    "key_points": ("news", "hn", "repo", "launch"),
    "why_it_matters": ("news",),
    "who_its_for": ("launch",),
    "pricing": ("launch",),
    "try_it": ("repo",),
    "discussion": ("hn",),
    "whats_open": ("repo",),
}
KEY_POINTS_MIN, KEY_POINTS_MAX = 3, 5
POINT_MAX = 200
TEXT_CAPS = {"why_it_matters": 320, "who_its_for": 240, "pricing": 240}
TRY_IT_MAX = 200
DISCUSSION_MIN, DISCUSSION_MAX = 3, 5
DISCUSSION_TEXT_MAX = 240
STANCES = ("agreed", "disputed", "counterpoint", "theme")
WHATS_OPEN_MIN, WHATS_OPEN_MAX = 2, 5
WHATS_OPEN_TEXT_MAX = 240

# Stats per kind, each key with its type. `news` has none.
STATS_TYPES = {
    "hn": {"points": "count", "comments": "count", "submitted_by": "text",
           "posted_at": "datetime"},
    "repo": {"stars": "count", "stars_gained": "count", "forks": "count",
             "language": "text", "license": "text", "created_on": "date",
             "contributors": "count", "open_issues": "count", "last_release": "release"},
    "launch": {"upvotes": "count", "comments": "count"},
    "x_post": {"likes": "count", "reposts": "count", "replies": "count", "views": "count"},
}
STAT_TEXT_MAX = 80

LINK_ROLES = ("destination", "discussion", "source")
LINKS_MAX = 8
LINK_TITLE_MAX = 200

# The preview of an X post, copied from the saved Grok snapshot. BUCKETS and
# MEDIA must equal x_paste's own enums (a test checks).
PREVIEW_REQUIRED = ("bucket", "author_name", "author_handle", "posted_on", "text", "media")
X_BUCKETS = ("announcement", "insight")
X_MEDIA = ("none", "image", "video", "gif", "link")
PREVIEW_TEXT_MAX = 4000
PREVIEW_NAME_MAX = 100

APPEARANCE_KEYS = ("item_id", "edition_date", "issue_slug")

# content/gists/index.json
GIST_INDEX_REQUIRED = ("schema_version", "generated_at", "gists")
GIST_INDEX_ENTRY_REQUIRED = ("slug", "source_key", "path", "created_at")
GIST_PATH_RE = re.compile(r"^gists/[a-z0-9]+(?:-[a-z0-9]+)*\.json$")

# Query parameters that only say where a click came from, dropped from the
# source key. Matched case-insensitively; every `utm_*` is dropped too.
TRACKING_PARAMS = ("ref", "ref_src", "fbclid", "gclid", "mc_cid", "mc_eid")


# ---------------------------------------------------------------------------
# One gist


def validate_gist(gist, *, tag_names=None):
    """Raise FeedValidationError with every problem in one gist, or return True."""
    found = gist_problems(gist, tag_names=tag_names)
    if found:
        raise contract.FeedValidationError("\n".join(found))
    return True


def gist_problems(gist, *, tag_names=None):
    if not isinstance(gist, dict):
        return ["must be an object"]
    found = contract._missing(gist, GIST_REQUIRED) + contract._version(gist)
    found += [f"unknown key: {key}" for key in gist if key not in GIST_REQUIRED + GIST_OPTIONAL]

    slug = gist.get("slug")
    if slug is not None and not is_gist_slug(slug):
        found.append(f"slug {slug!r} must match {GIST_SLUG_RE.pattern}, at most {GIST_SLUG_MAX} chars")

    kind = gist.get("kind")
    if kind is not None and kind not in KINDS:
        found.append(f"kind {kind!r} not one of {KINDS}")
        kind = None
    depth = gist.get("depth")
    if depth is not None and depth not in DEPTHS:
        found.append(f"depth {depth!r} not one of {DEPTHS}")

    found += _text_problems(gist, "title", TITLE_MAX)
    for key in ("url", "source_url"):
        if key in gist and not _is_url(gist[key]):
            found.append(f"{key} {gist[key]!r} must be an http(s) URL")

    found += contract._tag_problems(gist.get("tags"), tag_names)
    found += contract._image_problems(gist.get("image"))
    found += _kind_problems(gist, kind, depth)

    if "lede" in gist:
        lede = gist["lede"]
        if not (isinstance(lede, str) and LEDE_MIN <= len(lede.strip()) and len(lede) <= LEDE_MAX):
            found.append(f"lede must be {LEDE_MIN} to {LEDE_MAX} chars")
    elif depth != "preview" and kind != "x_post":
        found.append("missing required key: lede (only a preview may leave it out)")

    found += _sections_problems(gist.get("sections"), kind, depth)
    found += _stats_problems(gist, kind)
    found += _links_problems(gist.get("links"))
    found += _appearances_problems(gist.get("appearances"))

    for key in ("created_at", "updated_at"):
        if key in gist and not contract._is_datetime(gist[key]):
            found.append(f"{key} {gist[key]!r} is not an ISO 8601 timestamp")
    if (contract._is_datetime(gist.get("created_at"))
            and contract._is_datetime(gist.get("updated_at"))
            and _when(gist["updated_at"]) < _when(gist["created_at"])):
        found.append("updated_at is before created_at")
    return found


def _kind_problems(gist, kind, depth):
    found = []
    if kind == "x_post":
        for key in ("source", "category", "front_page"):
            if key in gist:
                found.append(f"{key} is not allowed on an x_post")
        if depth is not None and depth != "preview":
            found.append("an x_post gist must have depth 'preview'")
        if "preview" not in gist:
            found.append("an x_post gist needs its preview")
        else:
            found += _preview_problems(gist["preview"])
        if "url" in gist and gist.get("source_url") != gist.get("url"):
            found.append("an x_post's source_url must equal its url (the post)")
    elif kind is not None:
        source, categories = KIND_SOURCE[kind]
        for key, allowed in (("source", (source,)), ("category", categories)):
            if key not in gist:
                found.append(f"missing required key: {key} (required for kind {kind!r})")
            elif gist[key] not in allowed:
                found.append(f"{key} {gist[key]!r} does not match kind {kind!r}, which allows {allowed}")
        if depth == "preview":
            found.append("depth 'preview' is for x_post gists only")
        if "preview" in gist:
            found.append("preview is for x_post gists only")
        if "front_page" in gist and kind != "hn":
            found.append("front_page is for hn gists only")
    if "front_page" in gist and gist["front_page"] is not True:
        found.append("front_page must be true, or absent")
    return found


def _preview_problems(preview):
    if not isinstance(preview, dict):
        return ["preview must be an object"]
    found = [f"preview: {line}" for line in contract._missing(preview, PREVIEW_REQUIRED)]
    found += [f"preview: unknown key: {key}" for key in preview if key not in PREVIEW_REQUIRED]
    if "bucket" in preview and preview["bucket"] not in X_BUCKETS:
        found.append(f"preview: bucket {preview['bucket']!r} not one of {X_BUCKETS}")
    if "media" in preview and preview["media"] not in X_MEDIA:
        found.append(f"preview: media {preview['media']!r} not one of {X_MEDIA}")
    for key in ("author_name", "author_handle"):
        found += [f"preview: {line}" for line in _text_problems(preview, key, PREVIEW_NAME_MAX)]
    found += [f"preview: {line}" for line in _text_problems(preview, "text", PREVIEW_TEXT_MAX)]
    if "posted_on" in preview and not contract._is_date(preview["posted_on"]):
        found.append(f"preview: posted_on {preview['posted_on']!r} is not a date")
    return found


def _sections_problems(sections, kind, depth):
    if sections is None:
        return []
    if not isinstance(sections, list):
        return ["sections must be an array"]
    found = []
    seen = []
    for section in sections:
        if not (isinstance(section, dict) and section.get("key") in SECTION_KEYS):
            key = section.get("key") if isinstance(section, dict) else section
            found.append(f"section {key!r} is not one of {SECTION_KEYS}")
            continue
        key = section["key"]
        if key in seen:
            found.append(f"section {key!r} appears more than once")
        seen.append(key)
        if kind is not None and kind not in SECTION_KINDS[key]:
            found.append(f"section {key!r} is not allowed on kind {kind!r}")
        found += [f"section {key!r}: {line}" for line in _section_problems(section)]
    order = [SECTION_KEYS.index(key) for key in seen]
    if order != sorted(order):
        found.append(f"sections must be in the order {SECTION_KEYS}")
    if depth == "full" and kind != "x_post" and "key_points" not in seen:
        found.append("a full gist needs a key_points section")
    return found


def _section_problems(section):
    key = section["key"]
    shape = {"key_points": ("key", "points"), "try_it": ("key", "command"),
             "discussion": ("key", "points"), "whats_open": ("key", "points")}
    allowed = shape.get(key, ("key", "text"))
    found = [f"unknown key: {name}" for name in section if name not in allowed]
    found += [f"missing required key: {name}" for name in allowed if name not in section]
    if found:
        return found

    if key in TEXT_CAPS:
        return _text_problems(section, "text", TEXT_CAPS[key])
    if key == "try_it":
        command = section["command"]
        found = _text_problems(section, "command", TRY_IT_MAX)
        if isinstance(command, str) and ("\n" in command or "\r" in command):
            found.append("command must be one line")
        return found

    points = section["points"]
    low, high = {"key_points": (KEY_POINTS_MIN, KEY_POINTS_MAX),
                 "discussion": (DISCUSSION_MIN, DISCUSSION_MAX),
                 "whats_open": (WHATS_OPEN_MIN, WHATS_OPEN_MAX)}[key]
    if not isinstance(points, list):
        return ["points must be an array"]
    if not low <= len(points) <= high:
        found.append(f"{len(points)} points; needs {low} to {high}")
    for i, point in enumerate(points):
        where = f"point {i + 1}"
        if key == "key_points":
            if not _is_text(point, POINT_MAX):
                found.append(f"{where} must be a non-empty string of at most {POINT_MAX} chars")
            continue
        if not isinstance(point, dict):
            found.append(f"{where} must be an object")
            continue
        names = ("stance", "text", "url") if key == "discussion" else ("text", "url")
        found += [f"{where}: unknown key: {name}" for name in point if name not in names]
        cap = DISCUSSION_TEXT_MAX if key == "discussion" else WHATS_OPEN_TEXT_MAX
        if not _is_text(point.get("text"), cap):
            found.append(f"{where}: text must be a non-empty string of at most {cap} chars")
        if key == "discussion":
            if point.get("stance") not in STANCES:
                found.append(f"{where}: stance {point.get('stance')!r} not one of {STANCES}")
            if not _is_url(point.get("url")):
                found.append(f"{where}: url must be an http(s) URL to the comment")
        elif "url" in point and not _is_url(point["url"]):
            found.append(f"{where}: url {point['url']!r} must be an http(s) URL")
    return found


def _stats_problems(gist, kind):
    has_stats, has_as_of = "stats" in gist, "stats_as_of" in gist
    found = []
    if has_stats != has_as_of:
        found.append("stats and stats_as_of come together: both or neither")
    if has_as_of and not contract._is_datetime(gist["stats_as_of"]):
        found.append(f"stats_as_of {gist['stats_as_of']!r} is not an ISO 8601 timestamp")
    if not has_stats:
        return found
    stats = gist["stats"]
    if not isinstance(stats, dict) or not stats:
        return found + ["stats must be an object with at least one key, or absent"]
    if kind is None:
        return found
    types = STATS_TYPES.get(kind)
    if types is None:
        return found + [f"kind {kind!r} has no stats"]
    for key, value in stats.items():
        if key not in types:
            found.append(f"stats: {key!r} is not a stat of kind {kind!r}")
        elif not _stat_ok(types[key], value):
            found.append(f"stats: {key} {value!r} is not a valid {types[key]}")
    return found


def _stat_ok(kind, value):
    if kind == "count":
        return contract._is_count(value)
    if kind == "text":
        return _is_text(value, STAT_TEXT_MAX)
    if kind == "datetime":
        return contract._is_datetime(value)
    if kind == "date":
        return contract._is_date(value)
    if kind == "release":
        return (isinstance(value, dict) and set(value) == {"tag", "published_on"}
                and _is_text(value["tag"], STAT_TEXT_MAX) and contract._is_date(value["published_on"]))
    return False


def _links_problems(links):
    if links is None:
        return []
    if not isinstance(links, list):
        return ["links must be an array"]
    found = []
    if not 1 <= len(links) <= LINKS_MAX:
        found.append(f"{len(links)} links; needs 1 to {LINKS_MAX}")
    roles, urls = [], []
    for i, link in enumerate(links):
        where = f"link {i + 1}"
        if not isinstance(link, dict):
            found.append(f"{where} must be an object")
            continue
        found += [f"{where}: unknown key: {name}" for name in link if name not in ("role", "title", "url")]
        if link.get("role") not in LINK_ROLES:
            found.append(f"{where}: role {link.get('role')!r} not one of {LINK_ROLES}")
        roles.append(link.get("role"))
        if not _is_text(link.get("title"), LINK_TITLE_MAX):
            found.append(f"{where}: title must be a non-empty string of at most {LINK_TITLE_MAX} chars")
        if not _is_url(link.get("url")):
            found.append(f"{where}: url {link.get('url')!r} must be an http(s) URL")
        elif link["url"] in urls:
            found.append(f"{where}: url {link['url']!r} is listed twice")
        urls.append(link.get("url"))
    for role in ("destination", "discussion"):
        if roles.count(role) > 1:
            found.append(f"at most one {role} link")
    if links and "destination" not in roles and "discussion" not in roles:
        found.append("links need a destination or a discussion link")
    return found


def _appearances_problems(appearances):
    if appearances is None:
        return []
    if not isinstance(appearances, list) or not appearances:
        return ["appearances must be an array of at least one"]
    found = []
    ids, dates, issues = [], [], []
    for i, appearance in enumerate(appearances):
        where = f"appearance {i + 1}"
        if not isinstance(appearance, dict):
            found.append(f"{where} must be an object")
            continue
        found += [f"{where}: unknown key: {name}" for name in appearance if name not in APPEARANCE_KEYS]
        item_id = appearance.get("item_id")
        has_date, has_issue = "edition_date" in appearance, "issue_slug" in appearance
        if has_date == has_issue:
            found.append(f"{where}: needs exactly one of edition_date and issue_slug")
            continue
        if item_id in ids:
            found.append(f"{where}: item {item_id!r} is listed twice")
        ids.append(item_id)
        if has_date:
            date = appearance["edition_date"]
            if not contract._is_date(date):
                found.append(f"{where}: edition_date {date!r} is not a date")
            elif not (isinstance(item_id, str) and contract.ID_RE.match(item_id)
                      and item_id.endswith("-" + date)):
                found.append(f"{where}: item_id {item_id!r} must be an item id ending -{date}")
            else:
                dates.append(date)
        else:
            issue = appearance["issue_slug"]
            match = contract.WEEKLY_SLUG_RE.match(issue) if isinstance(issue, str) else None
            if not match:
                found.append(f"{where}: issue_slug {issue!r} must be issue-N")
            elif not (isinstance(item_id, str) and contract.WEEKLY_ID_RE.match(item_id)
                      and item_id.endswith("-" + issue)):
                found.append(f"{where}: item_id {item_id!r} must be an item id ending -{issue}")
            else:
                issues.append(int(match.group(1)))
    # Oldest first within each kind of appearance. A daily and a weekly
    # appearance carry no common clock here, so they are not compared.
    if dates != sorted(dates) or issues != sorted(issues):
        found.append("appearances must be oldest first")
    return found


# ---------------------------------------------------------------------------
# The files under content/gists/


def gist_files(root):
    """Every gist file under content/gists/, sorted; index.json is not one."""
    folder = root / "gists"
    if not folder.is_dir():
        return []
    return sorted(path for path in folder.glob("*.json") if path.name != "index.json")


def gist_file_problems(root, *, tag_names=None):
    """Per-file checks for every gist under root/gists/, each line prefixed with its path."""
    found = []
    for path in gist_files(root):
        where = f"gists/{path.name}"
        try:
            gist = json.loads(path.read_text())
        except ValueError as exc:
            found.append(f"{where}: not valid JSON: {exc}")
            continue
        found += [f"{where}: {line}" for line in gist_problems(gist, tag_names=tag_names)]
        if isinstance(gist, dict) and gist.get("slug") != path.stem:
            found.append(f"{where}: slug {gist.get('slug')!r} does not match the file name")
    return found


def gist_tree_problems(root, *, tag_names=None):
    """Every gist file, the index, and rules 11 to 17 of the contract spec."""
    root = pathlib.Path(root)
    found = gist_file_problems(root, tag_names=tag_names)
    gists = {}
    for path in gist_files(root):
        try:
            gist = json.loads(path.read_text())
        except ValueError:
            continue  # already reported
        if isinstance(gist, dict):
            gists[path.stem] = gist

    entries, index_found = _gist_index(root, gists)
    found += index_found
    known = set(gists) | {entry.get("slug") for entry in entries}
    found += _items_agree(root, gists, known)
    return found


def _gist_index(root, gists):
    """Rules 11 to 13: the index on its own, and against the gist files."""
    path = root / "gists" / "index.json"
    where = "gists/index.json"
    if not path.exists():
        return [], ([f"{where}: missing, but there are {len(gists)} gist files"] if gists else [])
    try:
        document = json.loads(path.read_text())
    except ValueError as exc:
        return [], [f"{where}: not valid JSON: {exc}"]
    if not isinstance(document, dict):
        return [], [f"{where}: must be an object"]
    found = [f"{where}: {line}" for line in contract._missing(document, GIST_INDEX_REQUIRED)
             + contract._version(document)]
    found += [f"{where}: unknown key: {key}" for key in document if key not in GIST_INDEX_REQUIRED]
    if "generated_at" in document and not contract._is_datetime(document["generated_at"]):
        found.append(f"{where}: generated_at {document['generated_at']!r} is not an ISO 8601 timestamp")
    entries = document.get("gists")
    if not isinstance(entries, list):
        return [], found + ([f"{where}: gists must be an array"] if entries is not None else [])

    slugs, keys, good = [], [], []
    for i, entry in enumerate(entries):
        at = f"{where}: gists[{i}]"
        if not isinstance(entry, dict):
            found.append(f"{at}: must be an object")
            continue
        good.append(entry)
        found += [f"{at}: {line}" for line in contract._missing(entry, GIST_INDEX_ENTRY_REQUIRED)]
        found += [f"{at}: unknown key: {key}" for key in entry if key not in GIST_INDEX_ENTRY_REQUIRED]
        slug = entry.get("slug")
        if not is_gist_slug(slug):
            found.append(f"{at}: slug {slug!r} is not a gist slug")
        elif slug in slugs:
            found.append(f"{at}: slug {slug!r} is listed twice")
        slugs.append(slug)
        key = entry.get("source_key")
        if not (isinstance(key, str) and key):
            found.append(f"{at}: source_key must be a non-empty string")
        elif key in keys:
            found.append(f"{at}: source_key {key!r} is listed twice")
        keys.append(key)
        entry_path = entry.get("path")
        if not (isinstance(entry_path, str) and GIST_PATH_RE.match(entry_path)
                and entry_path == f"gists/{slug}.json"):
            found.append(f"{at}: path {entry_path!r} must be gists/{slug}.json")
        if "created_at" in entry and not contract._is_datetime(entry["created_at"]):
            found.append(f"{at}: created_at {entry['created_at']!r} is not an ISO 8601 timestamp")
        if is_gist_slug(slug) and slug not in gists:
            found.append(f"{where}: {slug}: file missing (gists/{slug}.json)")
        elif slug in gists and isinstance(key, str):
            try:
                expected = source_key(gists[slug].get("source_url"))
            except ValueError:
                expected = None  # the gist file's own check reports the URL
            if expected is not None and key != expected:
                found.append(f"{at}: source_key {key!r} does not match the gist's source_url ({expected!r})")
    plain = [s for s in slugs if isinstance(s, str)]
    if plain != sorted(plain):
        found.append(f"{where}: gists must be sorted by slug")
    for slug in sorted(set(gists) - set(plain)):
        found.append(f"gists/{slug}.json: not in gists/index.json")
    return good, found


def _items(root):
    """Every item, by (where, item id): editions by date, weekly issues by slug."""
    places = {}
    for path in sorted((root / "editions").glob("*.json")):
        places[("edition", path.stem)] = (f"editions/{path.name}", path)
    for path in sorted((root / "weekly" / "issues").glob("*.json")):
        places[("issue", path.stem)] = (f"weekly/issues/{path.name}", path)
    items = {}
    for place, (label, path) in places.items():
        try:
            document = json.loads(path.read_text())
        except ValueError:
            continue  # reported by the edition and weekly checks
        for item in (document.get("items") or []) if isinstance(document, dict) else []:
            if isinstance(item, dict) and isinstance(item.get("id"), str):
                items[(place, item["id"])] = (label, item)
    return items


def _items_agree(root, gists, known):
    """Rules 14 to 16: items name real gists, appearances point back."""
    found = []
    items = _items(root)
    claimed = {}
    for (place, item_id), (label, item) in items.items():
        slug = item.get("gist")
        if not isinstance(slug, str):
            continue
        claimed.setdefault(slug, []).append((place, item_id, label))
        if slug not in known:
            found.append(f"{label}: item {item_id}: gist {slug!r} is not in gists/index.json")

    for slug, gist in sorted(gists.items()):
        where = f"gists/{slug}.json"
        listed = set()
        front_page = False
        for appearance in gist.get("appearances") or []:
            if not isinstance(appearance, dict):
                continue
            item_id = appearance.get("item_id")
            if "edition_date" in appearance:
                place, label = ("edition", appearance["edition_date"]), f"editions/{appearance['edition_date']}.json"
            elif "issue_slug" in appearance:
                place, label = ("issue", appearance["issue_slug"]), f"weekly/issues/{appearance['issue_slug']}.json"
            else:
                continue
            listed.add((place, item_id))
            if gist.get("kind") == "x_post":
                continue  # X posts are not carried in issue files; nothing to point back
            if (place, item_id) not in items:
                found.append(f"{where}: appearance {item_id} is not an item in {label}")
                continue
            item = items[(place, item_id)][1]
            if item.get("gist") != slug:
                found.append(f"{where}: appearance {item_id} does not point back (its gist is {item.get('gist')!r})")
            front_page = front_page or item.get("front_page") is True
        for place, item_id, label in claimed.get(slug, []):
            if (place, item_id) not in listed:
                found.append(f"{label}: item {item_id} names gist {slug!r} but is not one of its appearances")
        if front_page and gist.get("front_page") is not True:
            found.append(f"{where}: front_page missing, but an appearance was on the front page")
    return found


# ---------------------------------------------------------------------------
# Shown or withdrawn (T7, contract spec D4)


def gist_is_shown(gist, items_by_id):
    """True while at least one appearance is a loaded item whose `hidden` is false.

    Hiding is derived, never stored: hide.py flips an item, and its gist is
    withdrawn when no visible item is left. An x_post gist has no items to
    hide (issue files do not carry X posts), so it is always shown. The
    JavaScript copy is apps/web/src/gistShown.js; both are tested against
    fixtures/gist-shown.json.
    """
    if gist.get("kind") == "x_post":
        return True
    for appearance in gist.get("appearances") or []:
        item = items_by_id.get(appearance.get("item_id")) if isinstance(appearance, dict) else None
        if isinstance(item, dict) and item.get("hidden") is False:
            return True
    return False


# ---------------------------------------------------------------------------
# The source key and slugs


def source_key(url):
    """The key that makes one source page one gist. See the contract spec.

    Scheme dropped and host lower-cased without a leading `www.`; fragment and
    tracking parameters dropped, every other parameter kept in order; one
    trailing slash dropped from a path that is not `/`. Path case is kept.
    """
    if not (isinstance(url, str) and _ANY_CASE_URL.match(url)):
        raise ValueError(f"not an http(s) URL: {url!r}")
    parts = urllib.parse.urlsplit(url)
    host = (parts.hostname or "").lower()
    if host.startswith("www."):
        host = host[len("www."):]
    if parts.port:
        host = f"{host}:{parts.port}"
    path = parts.path or "/"
    if len(path) > 1 and path.endswith("/"):
        path = path[:-1]
    kept = [pair for pair in urllib.parse.parse_qsl(parts.query, keep_blank_values=True)
            if not _is_tracking(pair[0])]
    query = urllib.parse.urlencode(kept)
    return host + path + ("?" + query if query else "")


def _is_tracking(name):
    name = name.lower()
    return name.startswith("utm_") or name in TRACKING_PARAMS


# The content contract writes schemes in lower case; a URL from elsewhere may not.
_ANY_CASE_URL = re.compile(r"^https?://[^\s]+$", re.IGNORECASE)

_DATE_END = re.compile(r"-\d{4}-\d{2}-\d{2}$")
_ISSUE_END = re.compile(r"-issue-\d+$")


def slug_from_item_id(item_id):
    """`hn-show-hn-tinyeval-2026-08-27` -> `hn-show-hn-tinyeval`."""
    if not isinstance(item_id, str) or not (contract.ID_RE.match(item_id) or contract.WEEKLY_ID_RE.match(item_id)):
        raise ValueError(f"not an item id: {item_id!r}")
    return _trim(_ISSUE_END.sub("", _DATE_END.sub("", item_id)))


def x_post_slug(handle, text):
    """`x-` + the handle in lower case + the first five words of the post."""
    words = _slug_words(text)[:5]
    return _trim("-".join(["x"] + _slug_words(handle.lstrip("@")) + words))


def unique_slug(slug, taken):
    """`slug`, or `slug-2`, `slug-3`... - the first one not in `taken`."""
    if slug not in taken:
        return slug
    n = 2
    while True:
        suffix = f"-{n}"
        candidate = _trim(slug, GIST_SLUG_MAX - len(suffix)) + suffix
        if candidate not in taken:
            return candidate
        n += 1


def is_gist_slug(value):
    return isinstance(value, str) and len(value) <= GIST_SLUG_MAX and bool(GIST_SLUG_RE.match(value))


def _slug_words(text):
    ascii_text = unicodedata.normalize("NFKD", text or "").encode("ascii", "ignore").decode()
    return re.findall(r"[a-z0-9]+", ascii_text.lower())


def _trim(slug, limit=GIST_SLUG_MAX):
    if len(slug) <= limit:
        return slug
    cut = slug[:limit]
    if slug[limit] != "-" and "-" in cut:
        cut = cut[:cut.rindex("-")]
    return cut.strip("-")


# ---------------------------------------------------------------------------
# Small helpers


def _is_url(value):
    return isinstance(value, str) and bool(contract.URL_RE.match(value))


def _is_text(value, cap):
    return isinstance(value, str) and bool(value.strip()) and len(value) <= cap


def _text_problems(document, key, cap):
    if key not in document:
        return []
    if not _is_text(document[key], cap):
        return [f"{key} must be a non-empty string of at most {cap} chars"]
    return []


def _when(value):
    return dt.datetime.fromisoformat(value.replace("Z", "+00:00"))
