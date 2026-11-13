"""`gists draft`: decide what each item of a built edition needs, fetch the
material for new items, and write the one file Claude reads (spec T13).

A repeat (its source key is already in content/gists/index.json) is never
fetched and never shown to Claude; `build` only adds its appearance and
refreshes its stats. A new item gets a slug, a kind, a depth decided here from
what could actually be read, and its material.
"""

import datetime as dt
import json
import time
import urllib.parse

from . import DEFAULT_CACHE_ROOT, DEFAULT_CONTENT_ROOT, DEFAULT_DATA_ROOT, resolve
from aibytes_fetchers import article, github_repo, hn_thread, ph_launch
import gist_contract

KIND_BY_SOURCE = {"techcrunch": "news", "hackernews": "hn", "github": "repo", "producthunt": "launch"}
# Spec: fetching stops at 4 minutes; what is left becomes `brief`.
FETCH_BUDGET = 4 * 60
README_MIN_WORDS = 100
SELF_POST_MIN_WORDS = 150


class DraftError(Exception):
    pass


def load_index(content_root):
    """{source_key: entry} from content/gists/index.json, empty when absent."""
    path = resolve(content_root) / "gists" / "index.json"
    if not path.exists():
        return {}
    document = json.loads(path.read_text())
    return {entry["source_key"]: entry for entry in document.get("gists") or []}


def load_edition(content_root, date):
    path = resolve(content_root) / "editions" / f"{date}.json"
    if not path.exists():
        raise DraftError(f"no edition for {date} at {path}")
    return json.loads(path.read_text())


def ph_posts(data_root, date):
    """The day's PH snapshot posts, keyed by their launch page without its query."""
    day = dt.date.fromisoformat(date)
    path = (resolve(data_root) / f"{day.year:04d}" / f"{day.month:02d}" / "days" / date
            / "producthunt" / "ph_data.json")
    if not path.exists():
        return {}
    posts = json.loads(path.read_text()).get("posts") or []
    return {_page(post.get("url")): post for post in posts if post.get("url")}


def _page(url):
    parts = urllib.parse.urlsplit(url or "")
    return urllib.parse.urlunsplit((parts.scheme, parts.netloc, parts.path.rstrip("/"), "", ""))


def hn_id(item):
    query = urllib.parse.parse_qs(urllib.parse.urlsplit(item.get("source_url") or "").query)
    value = (query.get("id") or [""])[0]
    return int(value) if value.isdigit() else None


def repo_of(item):
    path = [p for p in urllib.parse.urlsplit(item.get("url") or "").path.split("/") if p]
    return (path[0], path[1]) if len(path) >= 2 else None


def _is_hn_page(url):
    host = (urllib.parse.urlsplit(url or "").hostname or "").lower()
    return host == "news.ycombinator.com"


def material_for(kind, item, ph_by_page, ph_token):
    """(depth, material, facts, unreadable) for one new item.

    `material` is what Claude may write from; `facts` is what only the script
    publishes (stats, link titles). Every fetch is one the spec names."""
    if kind == "news":
        page = article.article_text(item["url"])
        if page["readable"]:
            return "full", {"article": _article(page)}, {}, None
        return "brief", {}, {}, page["reason"]

    if kind == "hn":
        story_id = hn_id(item)
        if story_id is None:
            return "brief", {}, {}, "no_hn_id"
        thread = hn_thread.hn_thread(story_id)
        facts = {"discussion_title": thread.get("title") or item["title"]}
        material = {"comments": thread["comments"]}
        unreadable = None
        if not _is_hn_page(item["url"]):
            page = article.article_text(item["url"])
            if page["readable"]:
                material["article"] = _article(page)
                facts["destination_title"] = page["title"] or item["title"]
            else:
                unreadable = page["reason"]
        if thread.get("self_text"):
            material["self_text"] = thread["self_text"]
        enough = "article" in material or article.words(thread.get("self_text")) >= SELF_POST_MIN_WORDS
        if enough:
            return "full", material, facts, None
        return "brief", {}, facts, unreadable or "too_short"

    if kind == "repo":
        where = repo_of(item)
        if where is None:
            return "brief", {}, {}, "no_repo"
        repo = github_repo.repo_details(*where)
        if not repo["ok"]:
            return "brief", {}, {}, "rate_limited" if repo["rate_limited"] else "http_error"
        facts = {"stats": repo["stats"]}
        if repo["readme_words"] < README_MIN_WORDS:
            return "brief", {}, facts, "too_short"
        return "full", {"description": repo["description"], "topics": repo["topics"],
                        "homepage": repo["homepage"], "readme": repo["readme"],
                        "issues": repo["issues"]}, facts, None

    if kind == "launch":
        post = ph_by_page.get(_page(item.get("source_url")))
        if post is None:
            return "brief", {}, {}, "no_snapshot_post"
        site = item["url"] if item["url"] != item["source_url"] else None
        found = ph_launch.launch_material(post, ph_token, site_url=site)
        if not ph_launch.is_full(found):
            return "brief", {}, {}, found["comments_error"] or "too_short"
        material = {key: found[key] for key in ("tagline", "description", "topics", "comments")}
        if found["site"]:
            material["site"] = _article(found["site"])
        return "full", material, {}, None

    raise DraftError(f"unknown kind {kind!r}")


def _article(page):
    return {"title": page["title"], "byline": page["byline"], "text": page["text"]}


def draft(date, content_root=DEFAULT_CONTENT_ROOT, data_root=DEFAULT_DATA_ROOT,
          cache_root=DEFAULT_CACHE_ROOT, ph_token=None, budget=FETCH_BUDGET,
          clock=time.monotonic, log=print):
    """Build and write .cache/gists/DATE/draft.json. Returns the draft."""
    edition = load_edition(content_root, date)
    index = load_index(content_root)
    taken = {entry["slug"] for entry in index.values()}
    ph_by_page = ph_posts(data_root, date)
    if ph_token is None and any(item.get("source") == "producthunt" for item in edition["items"]):
        ph_token = ph_launch.token_from_env()

    start = clock()
    new, repeats, skipped = [], [], []
    seen_keys = {}
    for item in edition["items"]:
        if item.get("hidden"):
            skipped.append({"item_id": item["id"], "reason": "hidden"})
            continue
        kind = KIND_BY_SOURCE.get(item.get("source"))
        if kind is None:
            skipped.append({"item_id": item["id"], "reason": f"no gist kind for {item.get('source')!r}"})
            continue
        key = gist_contract.source_key(item["source_url"])
        if key in index:
            repeats.append({"item_id": item["id"], "slug": index[key]["slug"]})
            continue
        if key in seen_keys:
            skipped.append({"item_id": item["id"], "reason": f"same source as {seen_keys[key]}"})
            continue
        seen_keys[key] = item["id"]

        slug = gist_contract.unique_slug(gist_contract.slug_from_item_id(item["id"]), taken)
        taken.add(slug)
        if clock() - start >= budget:
            depth, material, facts, unreadable = "brief", {}, {}, "time_limit"
        else:
            try:
                depth, material, facts, unreadable = material_for(kind, item, ph_by_page, ph_token)
            except Exception as exc:  # one bad source must never stop the draft
                depth, material, facts, unreadable = "brief", {}, {}, f"error: {type(exc).__name__}"
        new.append({
            "item_id": item["id"], "slug": slug, "kind": kind, "depth": depth,
            "title": item["title"], "summary": item.get("summary"), "tags": item.get("tags", []),
            "material": material, "facts": facts, "unreadable": unreadable,
        })
        log(f"  {depth:5}  {slug}" + (f"  ({unreadable})" if unreadable else ""))

    result = {"date": date, "new": new, "repeats": repeats, "skipped": skipped}
    path = resolve(cache_root) / date / "draft.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n")
    briefs = sum(1 for entry in new if entry["depth"] == "brief")
    log(f"gists draft {date}: {len(new)} new ({briefs} brief), {len(repeats)} repeats -> {path}")
    return result
