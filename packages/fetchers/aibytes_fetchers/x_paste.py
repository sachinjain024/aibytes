"""X posts, pasted in from Grok rather than fetched.

X has no API this project can call, so the publisher runs a prompt in Grok and
pastes the JSON back. This module is the non-network half of that: fill the
prompt's window, check a paste against the contract, save it as a weekly
snapshot, and record the shortlist. The contract itself lives in
.claude/skills/x-fetch-items/references/x-data.md.

Not a `sources/` module: there is no fetch() to run, so the shared runner and
envelope don't apply. The snapshot path does, via layout.
"""

import datetime as dt
import json
import pathlib
import re

from . import layout
from .paths import REPO_ROOT

SUBPATH = ("x",)
FILENAME = "x_data.json"
WINDOW_DAYS = 7
MIN_LIKES = 500
LONG_TEXT = 600
SHORTLIST_SIZE = {"insight": (5, 5), "announcement": (3, 5)}
MAX_COMPANY_INSIGHTS = 2

PROMPT_FILE = REPO_ROOT / ".claude" / "skills" / "x-fetch-items" / "references" / "grok-prompt.md"

# Grok returns these two lists; the snapshot flattens them into `posts`.
LISTS = {"announcements": "announcement", "insights": "insight"}
BUCKETS = ("announcement", "insight")

REQUIRED = (
    "bucket", "rank", "url", "author_handle", "author_name", "author_type",
    "posted_at", "kind", "text", "quoted_post", "media", "link_url", "likes",
    "reposts", "replies", "views", "category", "why_viral", "why_it_matters",
)
ENUMS = {
    "bucket": set(BUCKETS),
    "author_type": {"person", "company"},
    "kind": {"post", "quote"},
    "media": {"none", "image", "video", "gif", "link"},
    "category": {
        "launch", "dev-tool", "open-source", "research",
        "startup-news", "policy", "opinion", "demo",
    },
}
POST_URL = re.compile(r"^https://x\.com/(\w+)/status/(\d+)$")


def window_for(as_of):
    """The 7 days ending on as_of: `after` inclusive, `before` exclusive."""
    return {
        "after": (as_of - dt.timedelta(days=WINDOW_DAYS - 1)).isoformat(),
        "before": (as_of + dt.timedelta(days=1)).isoformat(),
    }


def snapshot_path(as_of, output_root="newsletter/data"):
    return layout.snapshot_path(
        output_root, as_of, "weekly", SUBPATH, FILENAME, repo_root=REPO_ROOT,
    )


def prompt(as_of, prompt_file=PROMPT_FILE):
    """The Grok prompt from grok-prompt.md with the week's window filled in."""
    match = re.search(r"````text\n(.*?)\n````", pathlib.Path(prompt_file).read_text(), re.S)
    if not match:
        raise ValueError(f"no ````text block in {prompt_file}")
    win = window_for(as_of)
    return match.group(1).replace("{{AFTER}}", win["after"]).replace("{{BEFORE}}", win["before"])


def parse_paste(raw):
    """Pull Grok's JSON object out of a paste.

    Grok wraps it in a ```json fence and follows it with markdown tables, so
    take the first fenced block if there is one, else the text from the first
    `{` to its matching `}`.
    """
    fenced = re.search(r"```(?:json)?\s*\n(.*?)\n```", raw, re.S)
    text = fenced.group(1) if fenced else raw
    start = text.find("{")
    if start < 0:
        raise ValueError("no JSON object found in the paste")
    obj, _ = json.JSONDecoder().raw_decode(text[start:])
    if not isinstance(obj, dict) or not all(isinstance(obj.get(k), list) for k in LISTS):
        raise ValueError('expected an object with "announcements" and "insights" lists')
    return obj


def check(paste, as_of):
    """Check a parsed paste against the contract.

    Returns (errors, warnings). Errors break the contract's shape, so the
    paste is not saved. Warnings are content problems for the publisher to
    judge: the contract says report them, never fix them silently.
    """
    errors, warnings = [], []
    win = window_for(as_of)
    seen = {}
    for list_key, bucket in LISTS.items():
        posts = paste[list_key]
        limit = 10 if bucket == "announcement" else 20
        if len(posts) > limit:
            warnings.append(f"{list_key}: {len(posts)} posts, expected at most {limit}")
        for i, post in enumerate(posts):
            where = f"{list_key}[{i}] {post.get('author_handle', '?')}"
            missing = [k for k in REQUIRED if k not in post]
            if missing:
                errors.append(f"{where}: missing {', '.join(missing)}")
                continue
            for key, allowed in ENUMS.items():
                if post[key] not in allowed:
                    errors.append(f"{where}: {key}={post[key]!r} not one of {sorted(allowed)}")
            if post["bucket"] != bucket:
                errors.append(f"{where}: bucket {post['bucket']!r} in the {list_key} list")
            url = POST_URL.match(post["url"])
            if not url:
                errors.append(f"{where}: url {post['url']!r} is not https://x.com/<handle>/status/<id>")
            elif url.group(1).lower() != post["author_handle"].lstrip("@").lower():
                errors.append(f"{where}: url handle doesn't match {post['author_handle']}")
            if (post["kind"] == "quote") != (post["quoted_post"] is not None):
                errors.append(f"{where}: kind {post['kind']!r} but quoted_post is {'set' if post['quoted_post'] else 'null'}")
            for key in ("likes", "reposts", "replies"):
                if not isinstance(post[key], int):
                    errors.append(f"{where}: {key} is not a whole number")
            if post["views"] is not None and not isinstance(post["views"], int):
                errors.append(f"{where}: views is not a whole number or null")
            if post["url"] in seen:
                errors.append(f"{where}: same url as {seen[post['url']]}")
            seen[post["url"]] = where

            if not win["after"] <= post["posted_at"] < win["before"]:
                warnings.append(f"{where}: posted {post['posted_at']}, outside {win['after']}..{win['before']}")
            if isinstance(post["likes"], int) and post["likes"] < MIN_LIKES:
                warnings.append(f"{where}: {post['likes']} likes, under {MIN_LIKES}")
            if "t.co/" in post["text"]:
                warnings.append(f"{where}: text has a t.co link")
            if re.search(r":\s*$", post["text"]) and not post["link_url"]:
                warnings.append(f"{where}: text ends in ':' with no link_url (link or reply missing?)")
            if len(post["text"]) > LONG_TEXT:
                warnings.append(f"{where}: long post, {len(post['text'])} characters")
        likes = [p.get("likes") for p in posts if isinstance(p.get("likes"), int)]
        if likes != sorted(likes, reverse=True):
            warnings.append(f"{list_key}: not in likes order")
        if [p.get("rank") for p in posts] != list(range(1, len(posts) + 1)):
            warnings.append(f"{list_key}: ranks aren't 1..{len(posts)}")
    covered = {u for lst in LISTS for p in paste[lst] for u in p.get("also_covered") or []}
    for url in sorted(covered & set(seen)):
        warnings.append(f"{seen[url]}: also listed under another post's also_covered")
    return errors, warnings


def build(paste, as_of):
    """Flatten a checked paste into the snapshot, envelope first."""
    return {
        "source": "x",
        "section": "loudest-on-x",
        "fetched_at": as_of.isoformat(),
        "fetched_via": "grok",
        "window": window_for(as_of),
        "ranking": "likes",
        "posts": rerank(paste["announcements"] + paste["insights"]),
    }


def rerank(posts):
    """Group posts by bucket (announcements first) and number each by likes."""
    ordered = []
    for bucket in BUCKETS:
        group = sorted(
            (p for p in posts if p["bucket"] == bucket),
            key=lambda p: (-(p["likes"] or 0), -(p["reposts"] or 0)),
        )
        for rank, post in enumerate(group, 1):
            post["rank"] = rank
        ordered += group
    return ordered


def move(snapshot, urls, bucket):
    """Move posts to another bucket, e.g. a feature launch Grok filed as an insight."""
    if bucket not in BUCKETS:
        raise ValueError(f"bucket must be one of {BUCKETS}")
    by_url = {p["url"]: p for p in snapshot["posts"]}
    unknown = [u for u in urls if u not in by_url]
    if unknown:
        raise ValueError(f"not in the snapshot: {', '.join(unknown)}")
    for url in urls:
        by_url[url]["bucket"] = bucket
    snapshot["posts"] = rerank(snapshot["posts"])
    return snapshot


def set_shortlist(snapshot, insight, announcement):
    """Record the publisher's picks. Returns warnings; raises on unknown urls.

    The picks are the publisher's call, so rules they break (list size, one
    post per account, the company cap) are warnings, not errors.
    """
    by_url = {p["url"]: p for p in snapshot["posts"]}
    picks = {"insight": list(insight), "announcement": list(announcement)}
    unknown = [u for urls in picks.values() for u in urls if u not in by_url]
    if unknown:
        raise ValueError(f"not in the snapshot: {', '.join(unknown)}")
    warnings = []
    for bucket, urls in picks.items():
        low, high = SHORTLIST_SIZE[bucket]
        if not low <= len(urls) <= high:
            want = str(low) if low == high else f"{low}-{high}"
            warnings.append(f"{bucket}: {len(urls)} picks, expected {want}")
        for url in urls:
            if by_url[url]["bucket"] != bucket:
                warnings.append(f"{bucket}: {url} is filed as {by_url[url]['bucket']!r}; move it first")
        handles = [by_url[u]["author_handle"].lower() for u in urls]
        if len(set(handles)) < len(handles):
            warnings.append(f"{bucket}: more than one post from the same account")
    from .x_render import company
    names = [company(by_url[u])[0] for u in picks["announcement"]]
    if len(set(names)) < len(names):
        warnings.append("announcement: more than one launch from the same company")
    companies = sum(by_url[u]["author_type"] == "company" for u in picks["insight"])
    if companies > MAX_COMPANY_INSIGHTS:
        warnings.append(f"insight: {companies} company posts, at most {MAX_COMPANY_INSIGHTS}")

    # Keep the envelope order: shortlist sits just before posts.
    posts = snapshot["posts"]
    rest = {k: v for k, v in snapshot.items() if k not in ("shortlist", "posts")}
    snapshot.clear()
    snapshot.update(rest)
    snapshot["shortlist"] = picks
    snapshot["posts"] = posts
    return warnings


def load(path):
    return json.loads(pathlib.Path(path).read_text())


def write(path, snapshot):
    path = pathlib.Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n")
    return path
