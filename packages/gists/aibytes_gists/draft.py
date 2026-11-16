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
import validate as contract

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
    return _ph_posts_at(path)


def ph_posts_under(data_root):
    """Every PH snapshot under data_root, for the weekly pull (any week folder)."""
    root = resolve(data_root)
    found = {}
    if not root.exists():
        return found
    for path in sorted(root.rglob("ph_data.json")):
        found.update(_ph_posts_at(path))
    return found


def _ph_posts_at(path):
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


def parse_issue(issue):
    """(`issue-N`, N). Raises DraftError when the slug is not issue-N."""
    match = contract.WEEKLY_SLUG_RE.match(issue or "")
    if not match:
        raise DraftError(f"issue {issue!r} must be issue-N")
    return issue, int(match.group(1))


def load_items(cache_root, issue):
    """The skill-curated rows at .cache/gists/issue-N/items.json."""
    path = resolve(cache_root) / issue / "items.json"
    if not path.exists():
        raise DraftError(f"no items.json for {issue} at {path}")
    try:
        document = json.loads(path.read_text())
    except ValueError as exc:
        raise DraftError(f"items.json is not valid JSON: {exc}")
    if not isinstance(document, dict) or not isinstance(document.get("items"), list):
        raise DraftError("items.json must be an object with an `items` array")
    if document.get("issue_slug") not in (None, issue):
        raise DraftError(f"items.json is not for {issue}")
    return document["items"], path


def _x_fields(item):
    """(post, url, source_key) for an x_post row, or (None, None, reason)."""
    post = item.get("post") if isinstance(item.get("post"), dict) else {}
    handle = post.get("author_handle") or ""
    text = post.get("text") or ""
    if not handle or not text:
        return None, None, None, "x_post is missing post.author_handle or post.text"
    url = item.get("source_url") or item.get("url") or post.get("url")
    if not url:
        return None, None, None, "x_post is missing a url"
    try:
        key = gist_contract.source_key(url)
    except ValueError:
        return None, None, None, f"x_post url {url!r} is not an http(s) URL"
    return post, url, key, None


def _x_title(post):
    name = post.get("author_name") or post.get("author_handle") or "X"
    line = (post.get("text") or "").strip().split("\n", 1)[0]
    title = f"{name}: {line}" if line else str(name)
    return title[: gist_contract.TITLE_MAX]


def draft(date=None, content_root=DEFAULT_CONTENT_ROOT, data_root=DEFAULT_DATA_ROOT,
          cache_root=DEFAULT_CACHE_ROOT, ph_token=None, budget=FETCH_BUDGET,
          clock=time.monotonic, log=print, issue=None):
    """Build and write draft.json for a daily edition or a weekly issue."""
    if (date is None) == (issue is None):
        raise DraftError("pass --date or --issue")
    if issue is not None:
        return _draft_issue(issue, content_root=content_root, data_root=data_root,
                            cache_root=cache_root, ph_token=ph_token, budget=budget,
                            clock=clock, log=log)
    return _draft_date(date, content_root=content_root, data_root=data_root,
                       cache_root=cache_root, ph_token=ph_token, budget=budget,
                       clock=clock, log=log)


def _draft_date(date, content_root, data_root, cache_root, ph_token, budget, clock, log):
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
        _classify_item(item, index, taken, seen_keys, new, repeats, skipped,
                       ph_by_page, ph_token, budget, clock, start, log)

    result = {"date": date, "new": new, "repeats": repeats, "skipped": skipped}
    return _write_draft(result, resolve(cache_root) / date / "draft.json", date, log)


def _draft_issue(issue, content_root, data_root, cache_root, ph_token, budget, clock, log):
    """Build and write .cache/gists/issue-N/draft.json from items.json."""
    issue, issue_number = parse_issue(issue)
    items, _ = load_items(cache_root, issue)
    index = load_index(content_root)
    taken = {entry["slug"] for entry in index.values()}
    ph_by_page = ph_posts_under(data_root)
    if ph_token is None and any(item.get("source") == "producthunt" for item in items):
        ph_token = ph_launch.token_from_env()

    start = clock()
    new, repeats, skipped = [], [], []
    seen_keys = {}
    for item in items:
        if item.get("kind") == "x_post":
            _classify_x(item, issue, issue_number, index, taken, seen_keys,
                        new, repeats, skipped, log)
            continue
        _classify_item(item, index, taken, seen_keys, new, repeats, skipped,
                       ph_by_page, ph_token, budget, clock, start, log)

    result = {"issue": issue, "new": new, "repeats": repeats, "skipped": skipped}
    return _write_draft(result, resolve(cache_root) / issue / "draft.json", issue, log)


def _classify_x(item, issue, issue_number, index, taken, seen_keys, new, repeats, skipped, log):
    post, url, key, reason = _x_fields(item)
    if reason:
        skipped.append({"item_id": item.get("id") or "x_post", "reason": reason})
        return
    if key in index:
        slug = index[key]["slug"]
        item_id = f"{slug}-issue-{issue_number}"
        item["id"] = item_id
        repeats.append({"item_id": item_id, "slug": slug, "kind": "x_post", "post": post})
        return
    if key in seen_keys:
        skipped.append({"item_id": item.get("id") or "x_post",
                        "reason": f"same source as {seen_keys[key]}"})
        return
    slug = gist_contract.unique_slug(gist_contract.x_post_slug(post["author_handle"], post["text"]), taken)
    item_id = f"{slug}-issue-{issue_number}"
    item["id"] = item_id
    item["url"] = item.get("url") or url
    item["source_url"] = url
    seen_keys[key] = item_id
    taken.add(slug)
    new.append({
        "item_id": item_id, "slug": slug, "kind": "x_post", "depth": "preview",
        "title": item.get("title") or _x_title(post), "summary": item.get("summary"),
        "tags": item.get("tags") or [], "material": {}, "facts": {}, "unreadable": None,
        "post": post,
    })
    log(f"  preview  {slug}")


def _classify_item(item, index, taken, seen_keys, new, repeats, skipped,
                   ph_by_page, ph_token, budget, clock, start, log):
    if item.get("hidden"):
        skipped.append({"item_id": item["id"], "reason": "hidden"})
        return
    kind = KIND_BY_SOURCE.get(item.get("source"))
    if kind is None:
        skipped.append({"item_id": item.get("id"), "reason": f"no gist kind for {item.get('source')!r}"})
        return
    key = gist_contract.source_key(item["source_url"])
    if key in index:
        repeats.append({"item_id": item["id"], "slug": index[key]["slug"]})
        return
    if key in seen_keys:
        skipped.append({"item_id": item["id"], "reason": f"same source as {seen_keys[key]}"})
        return
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


def _write_draft(result, path, label, log):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n")
    briefs = sum(1 for entry in result["new"] if entry["depth"] == "brief")
    previews = sum(1 for entry in result["new"] if entry["depth"] == "preview")
    extra = f", {previews} preview" if previews else ""
    log(f"gists draft {label}: {len(result['new'])} new ({briefs} brief{extra}), "
        f"{len(result['repeats'])} repeats -> {path}")
    return result
