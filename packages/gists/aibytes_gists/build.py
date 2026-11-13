"""`gists build`: check what Claude wrote, add every fact the script owns, and
write the gists, the gist index and each item's `gist` together (spec T15).

One bad gist is dropped and its item ships without `gist`; the rest are
written. Nothing under content/ changes unless the whole tree, with every
change applied, passes validate.py - checked on a copy first, the way
hide.py and curate check before they write.
"""

import datetime as dt
import json
import pathlib
import shutil
import tempfile
import urllib.parse

from . import DEFAULT_CACHE_ROOT, DEFAULT_CONTENT_ROOT, resolve
from . import copying
import gist_contract
import validate as contract

# The edition's taste rules, from the curate step, so both read alike.
from aibytes_curate.summaries import DASH_RE, HYPE_RE  # noqa: E402

FULL_WORDS_MIN, FULL_WORDS_MAX = 120, 350


class BuildError(Exception):
    """The run as a whole cannot be built. Nothing was written."""


def _now():
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).strftime("%Y-%m-%dT%H:%M:%SZ")


def _read(path):
    return json.loads(pathlib.Path(path).read_text())


def _write(path, document):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(document, indent=2, ensure_ascii=False) + "\n")


def stats_for(kind, item, facts):
    """The script's stats for a gist, from the edition item and what draft read."""
    signals, meta = item.get("signals") or {}, item.get("meta") or {}
    if kind == "hn":
        stats = {"points": signals.get("points"), "comments": signals.get("comments"),
                 "submitted_by": meta.get("author"), "posted_at": item.get("published_at")}
    elif kind == "repo":
        stats = dict((facts or {}).get("stats") or {})
        for key in ("stars", "forks"):
            stats.setdefault(key, signals.get(key))
        stats["stars_gained"] = signals.get("stars_gained")
        if meta.get("language"):
            stats.setdefault("language", meta["language"])
    elif kind == "launch":
        stats = {"upvotes": signals.get("upvotes"), "comments": signals.get("comments")}
    else:
        return {}
    return {key: value for key, value in stats.items() if value is not None}


def _host(url):
    return (urllib.parse.urlsplit(url or "").hostname or "").lower()


def links_for(kind, item, facts):
    """Destination first, then discussion (contract: Links)."""
    facts = facts or {}
    title = item["title"]
    if kind == "hn":
        links = []
        if _host(item["url"]) != "news.ycombinator.com":
            links.append({"role": "destination", "title": facts.get("destination_title") or title,
                          "url": item["url"]})
        links.append({"role": "discussion", "title": facts.get("discussion_title") or title,
                      "url": item["source_url"]})
        return links
    if kind == "launch":
        links = []
        if item["url"] != item["source_url"]:
            links.append({"role": "destination", "title": title, "url": item["url"]})
        links.append({"role": "discussion", "title": f"{title} on Product Hunt", "url": item["source_url"]})
        return links
    return [{"role": "destination", "title": title, "url": item["url"]}]


def _gist_text(sections, lede):
    texts = [lede or ""]
    for section in sections or []:
        if not isinstance(section, dict):
            continue
        texts.append(section.get("text") or "")
        for point in section.get("points") or []:
            texts.append(point if isinstance(point, str) else (point or {}).get("text") or "")
    return [t for t in texts if t]


def _resolve_refs(sections, material):
    """Swap comment and issue ids for their URLs. Returns (sections, problems)."""
    urls = {c["id"]: c.get("url") for c in material.get("comments") or [] if isinstance(c, dict)}
    urls.update({i["id"]: i.get("url") for i in material.get("issues") or [] if isinstance(i, dict)})
    problems, out = [], []
    for section in sections or []:
        if not isinstance(section, dict) or not isinstance(section.get("points"), list):
            out.append(section)
            continue
        points = []
        for point in section["points"]:
            if isinstance(point, dict) and ("comment" in point or "issue" in point):
                point = dict(point)
                ref = point.pop("comment", None) or point.pop("issue", None)
                if not urls.get(ref):
                    problems.append(f"section {section.get('key')!r}: {ref!r} is not in this item's material")
                else:
                    point["url"] = urls[ref]
            elif isinstance(point, dict) and "url" in point:
                problems.append(f"section {section.get('key')!r}: a point must name a comment or issue id, not a url")
            points.append(point)
        out.append(dict(section, points=points))
    return out, problems


def make_gist(entry, written, item, date, now, stats_as_of, tag_names):
    """(gist, fatal problems, warnings) for one new item."""
    fatal, warnings = [], []
    if not isinstance(written, dict):
        return None, ["not an object"], []
    depth = written.get("depth")
    if entry["depth"] == "brief" and depth == "full":
        fatal.append("depth raised from brief to full")
    sections, ref_problems = _resolve_refs(written.get("sections"), entry.get("material") or {})
    fatal += ref_problems
    unknown = set(written) - {"depth", "lede", "sections"}
    if unknown:
        fatal.append(f"unknown keys from the writer: {sorted(unknown)}")

    kind, facts = entry["kind"], entry.get("facts") or {}
    gist = {
        "schema_version": gist_contract.GIST_SCHEMA_VERSION, "slug": entry["slug"], "kind": kind,
        "title": item["title"], "url": item["url"], "source_url": item["source_url"],
        "source": item["source"], "category": item["category"], "tags": list(item.get("tags") or []),
        "image": item.get("image") or {"type": "none"}, "depth": depth,
        "lede": written.get("lede"), "sections": sections if sections is not None else [],
        "links": links_for(kind, item, facts),
        "appearances": [{"item_id": item["id"], "edition_date": date}],
        "created_at": now, "updated_at": now,
    }
    stats = stats_for(kind, item, facts)
    if stats:
        gist["stats"], gist["stats_as_of"] = stats, stats_as_of
    if item.get("front_page") is True and kind == "hn":
        gist["front_page"] = True
    fatal += gist_contract.gist_problems(gist, tag_names=tag_names)

    texts = _gist_text(sections, written.get("lede"))
    material = entry.get("material") or {}
    longest = max((copying.copied(text, material) for text in texts), key=lambda r: len(r.split()), default="")
    run = len(longest.split())
    if run >= copying.FATAL_RUN:
        fatal.append(f"copies {run} words from the material: {longest[:120]!r}")
    elif run >= copying.WARN_RUN:
        warnings.append(f"copies {run} words from the material: {longest[:120]!r}")
    for text in texts:
        hype = HYPE_RE.search(text)
        if hype:
            warnings.append(f"says {hype.group(0)!r}")
        if DASH_RE.search(text):
            warnings.append("has an en or em dash; the house style is a single hyphen")
    total = sum(len(text.split()) for text in texts)
    if depth == "full" and not FULL_WORDS_MIN <= total <= FULL_WORDS_MAX:
        warnings.append(f"{total} words; a full gist is {FULL_WORDS_MIN} to {FULL_WORDS_MAX}")
    return gist, fatal, warnings


def refresh(gist, item, kind, date, now, stats_as_of, facts=None):
    """A repeat: one more appearance, fresh stats, the badge if earned."""
    gist = json.loads(json.dumps(gist))
    if not any(a.get("item_id") == item["id"] for a in gist["appearances"]):
        gist["appearances"].append({"item_id": item["id"], "edition_date": date})
        dated = [a for a in gist["appearances"] if "edition_date" in a]
        weekly = [a for a in gist["appearances"] if "edition_date" not in a]
        gist["appearances"] = sorted(dated, key=lambda a: a["edition_date"]) + weekly
    old = gist.get("stats") or {}
    stats = stats_for(kind, item, facts)
    if kind == "repo":  # keep the facts only a fetch knows; refresh what the item carries
        stats = dict(old, **stats)
    if stats:
        gist["stats"], gist["stats_as_of"] = stats, stats_as_of
    if item.get("front_page") is True and kind == "hn":
        gist["front_page"] = True
    gist["updated_at"] = now
    return gist


def build(date, gists_path=None, content_root=DEFAULT_CONTENT_ROOT, cache_root=DEFAULT_CACHE_ROOT,
          now=None, log=print):
    """Returns {"written": [...], "brief": [...], "updated": [...], "failed": {item_id: [problems]},
    "warnings": {item_id: [...]}, "missing": [...]}. Raises BuildError, having
    written nothing, when the run as a whole cannot be built."""
    now = now or _now()
    root = resolve(content_root)
    cache = resolve(cache_root) / date
    draft_path = cache / "draft.json"
    gists_path = resolve(gists_path) if gists_path else cache / "gists.json"
    for path in (draft_path, gists_path):
        if not path.exists():
            raise BuildError(f"{path} not found")
    try:
        draft, written = _read(draft_path), _read(gists_path)
    except ValueError as exc:
        raise BuildError(f"not valid JSON: {exc}")
    if draft.get("date") != date or (isinstance(written, dict) and written.get("date") not in (None, date)):
        raise BuildError(f"draft or gists file is not for {date}")
    by_id = (written or {}).get("gists") if isinstance(written, dict) else None
    if not isinstance(by_id, dict):
        raise BuildError("gists.json must have a `gists` object keyed by item id")

    edition_path = root / "editions" / f"{date}.json"
    edition = _read(edition_path)
    items = {item["id"]: item for item in edition["items"]}
    tag_names = contract.tag_names(_read(root / "tags.json"))
    index_path = root / "gists" / "index.json"
    index = _read(index_path) if index_path.exists() else {
        "schema_version": gist_contract.GIST_SCHEMA_VERSION, "generated_at": now, "gists": []}
    stats_as_of = edition.get("generated_at") or now

    report = {"written": [], "brief": [], "updated": [], "failed": {}, "warnings": {}, "missing": []}
    files, entries = {}, []
    new_ids = {entry["item_id"] for entry in draft.get("new") or []}
    for item_id in sorted(set(by_id) - new_ids):
        report["failed"][item_id] = ["not in draft.json's new list"]

    for entry in draft.get("new") or []:
        item_id = entry["item_id"]
        item = items.get(item_id)
        if item is None or item.get("hidden"):
            continue
        if item_id not in by_id:
            report["missing"].append(item_id)
            continue
        gist, fatal, warnings = make_gist(entry, by_id[item_id], item, date, now, stats_as_of, tag_names)
        if warnings:
            report["warnings"][item_id] = warnings
        if fatal:
            report["failed"][item_id] = fatal
            continue
        files[entry["slug"]] = gist
        entries.append({"slug": entry["slug"], "source_key": gist_contract.source_key(item["source_url"]),
                        "path": f"gists/{entry['slug']}.json", "created_at": now})
        item["gist"] = entry["slug"]
        report["written"].append(entry["slug"])
        if gist["depth"] == "brief":
            report["brief"].append(entry["slug"])

    for repeat in draft.get("repeats") or []:
        item = items.get(repeat["item_id"])
        path = root / "gists" / f"{repeat['slug']}.json"
        if item is None or not path.exists():
            report["failed"][repeat["item_id"]] = [f"repeat gist {repeat['slug']} not found"]
            continue
        existing = _read(path)
        files[repeat["slug"]] = refresh(existing, item, existing["kind"], date, now, stats_as_of)
        item["gist"] = repeat["slug"]
        report["updated"].append(repeat["slug"])

    if not files:
        _log_report(report, date, log)
        return report

    known = {e["slug"] for e in index["gists"]}
    index = dict(index, generated_at=now,
                 gists=sorted(index["gists"] + [e for e in entries if e["slug"] not in known],
                              key=lambda e: e["slug"]))

    def apply(target):
        for slug, gist in files.items():
            _write(target / "gists" / f"{slug}.json", gist)
        _write(target / "gists" / "index.json", index)
        _write(target / "editions" / f"{date}.json", edition)

    with tempfile.TemporaryDirectory() as tmp:
        staged = pathlib.Path(tmp) / "content"
        shutil.copytree(root, staged)
        copy_weekly_sources(root, pathlib.Path(tmp))
        apply(staged)
        try:
            contract.validate_content_root(staged)
        except contract.FeedValidationError as exc:
            raise BuildError("the content tree would not validate; nothing written:\n" + str(exc))
    apply(root)
    contract.validate_content_root(root)  # backstop, as curate and hide.py do
    _log_report(report, date, log)
    return report


def copy_weekly_sources(content_root, to_repo_root):
    """validate.py checks that each weekly issue's source HTML exists beside
    content/, so a staged copy of content/ needs those files beside it too."""
    content_root = pathlib.Path(content_root)
    index = content_root / "weekly" / "index.json"
    if not index.exists():
        return
    for entry in _read(index).get("issues") or []:
        source = entry.get("source") if isinstance(entry, dict) else None
        origin = content_root.resolve().parent / source if isinstance(source, str) else None
        if origin is not None and origin.is_file():
            target = pathlib.Path(to_repo_root) / source
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(origin, target)


def _log_report(report, date, log):
    for item_id, problems in sorted(report["failed"].items()):
        log(f"  dropped {item_id}: " + "; ".join(problems))
    for item_id, warnings in sorted(report["warnings"].items()):
        log(f"  warning {item_id}: " + "; ".join(warnings))
    for item_id in report["missing"]:
        log(f"  warning {item_id}: no gist written; ships without one")
    log(f"gists build {date}: {summary_line(report)}")


def summary_line(report):
    """The Slack line (spec: The runner step)."""
    line = (f"{len(report['written'])} new ({len(report['brief'])} brief), "
            f"{len(report['updated'])} updated, {len(report['failed'])} failed")
    if report["missing"]:
        line += f", {len(report['missing'])} not written"
    return line
