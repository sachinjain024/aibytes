"""X posts gathered in Grok, then saved as a weekly snapshot.

Grok has native X search (`/proj-fetch-from-x`). Other agents print the prompt
(`/proj-generate-prompt-x-items`) and wait for a paste. This module is the
non-network half of both: fill the prompt's window, check JSON against the
contract, save the weekly snapshot, write the publisher's review markdown, and
record the shortlist. The contract lives in
.claude/skills/proj-generate-prompt-x-items/references/x-data.md.

Not a `sources/` module: there is no fetch() the shared runner can call, so
the envelope doesn't apply. The snapshot path does, via layout.
"""

import datetime as dt
import json
import pathlib
import re

from . import layout
from .paths import REPO_ROOT

SUBPATH = ("x",)
FILENAME = "x_data.json"
REVIEW_FILENAME = "x_review.md"
WINDOW_DAYS = 7
MIN_LIKES = 500
LONG_TEXT = 600
NEWSLETTER_TITLE_MAX = 200
NEWSLETTER_TITLE_LINES = 2
SHORTLIST_SIZE = {"insight": (5, 5), "announcement": (3, 5)}
MAX_COMPANY_INSIGHTS = 2

PROMPT_FILE = (
    REPO_ROOT / ".claude" / "skills" / "proj-generate-prompt-x-items"
    / "references" / "grok-prompt.md"
)

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


def review_path(as_of, output_root="newsletter/data"):
    return snapshot_path(as_of, output_root).with_name(REVIEW_FILENAME)


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
            title = post.get("newsletter_title")
            if title is not None:
                if not isinstance(title, str) or not title.strip():
                    errors.append(f"{where}: newsletter_title must be a non-empty string")
                else:
                    lines = [ln.strip() for ln in title.splitlines() if ln.strip()]
                    if len(lines) > NEWSLETTER_TITLE_LINES:
                        warnings.append(
                            f"{where}: newsletter_title has {len(lines)} lines, "
                            f"expected at most {NEWSLETTER_TITLE_LINES}"
                        )
                    if len(title.strip()) > NEWSLETTER_TITLE_MAX:
                        warnings.append(
                            f"{where}: newsletter_title is {len(title.strip())} characters, "
                            f"expected at most {NEWSLETTER_TITLE_MAX}"
                        )
            elif len(post["text"]) > LONG_TEXT:
                warnings.append(
                    f"{where}: long post needs a 2-line newsletter_title "
                    f"(x_items.py title URL \"...\")"
                )
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



def set_emoji(snapshot, pairs):
    """Give shortlisted Viral on X posts the emoji their row opens with.

    `pairs` is [(url, emoji), ...]. The emoji is ours, not the author's, so it
    lives in its own field and `text` is never touched. Raises on a url that
    isn't a shortlisted insight.
    """
    insight = set((snapshot.get("shortlist") or {}).get("insight", []))
    unknown = [u for u, _ in pairs if u not in insight]
    if unknown:
        raise ValueError(f"not a shortlisted insight: {', '.join(unknown)}")
    by_url = {p["url"]: p for p in snapshot["posts"]}
    for url, emoji in pairs:
        by_url[url]["emoji"] = emoji


def set_newsletter_title(snapshot, url, title):
    """Set the 2-line newsletter title for a long post. Never edits `text`."""
    if not isinstance(title, str) or not title.strip():
        raise ValueError("newsletter_title must be a non-empty string")
    by_url = {p["url"]: p for p in snapshot["posts"]}
    if url not in by_url:
        raise ValueError(f"not in the snapshot: {url}")
    by_url[url]["newsletter_title"] = title.strip()
    return snapshot


def _md_cell(text):
    """One markdown-table cell: line breaks as <br>, pipes escaped."""
    text = str(text).replace("\r\n", "\n").replace("\r", "\n")
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    text = text.replace("|", "\\|")
    return text.replace("\n", "<br>")


def _likes_label(n):
    if n >= 1_000_000:
        return f"{n / 1_000_000:.1f}M"
    if n >= 100_000:
        return f"{n // 1000}k"
    if n >= 1000:
        return f"{n / 1000:.1f}k"
    return str(n)


def review_picks(snapshot, insight=None, announcement=None):
    """URLs to tick in the review tables.

    Explicit lists win. Otherwise use a recorded shortlist. Either side may
    be empty: the publisher often confirms insights before announcements.
    """
    recorded = snapshot.get("shortlist") or {}
    return {
        "insight": list(insight) if insight is not None else list(recorded.get("insight") or []),
        "announcement": list(announcement) if announcement is not None else list(recorded.get("announcement") or []),
    }


def review_markdown(snapshot, insight=None, announcement=None):
    """Publisher-facing Insights and Announcements tables for picking."""
    picks = review_picks(snapshot, insight, announcement)
    win = snapshot["window"]
    posts = snapshot.get("posts") or []
    insights = [p for p in posts if p["bucket"] == "insight"]
    announcements = [p for p in posts if p["bucket"] == "announcement"]
    lines = [
        f"# X review — {snapshot['fetched_at']}",
        "",
        f"Window: `{win['after']}` inclusive to `{win['before']}` exclusive. "
        f"{len(insights)} insights, {len(announcements)} announcements.",
        "",
        "Tick the rows you want, then reply with ranks (or URLs). "
        "Insights: **5**, one per account, at most 2 company. "
        "Announcements: **3–5**, one launch per company. "
        "Long posts (`text` over 600 characters) ship in the newsletter as "
        "their `newsletter_title` (a 2-line summary), never the full tweet.",
        "",
        _picks_summary("Insights picked", picks["insight"], insights),
        _picks_summary("Announcements picked", picks["announcement"], announcements),
        "",
        "## Insights",
        "",
        _review_table(insights, picks["insight"]),
        "",
        "## Announcements",
        "",
        _review_table(announcements, picks["announcement"]),
        "",
    ]
    return "\n".join(lines)


def _picks_summary(label, urls, posts):
    if not urls:
        return f"**{label}:** none yet."
    by_url = {p["url"]: p for p in posts}
    bits = []
    for url in urls:
        post = by_url.get(url)
        if post:
            bits.append(f"{post['rank']} {post['author_handle']}")
        else:
            bits.append(url)
    return f"**{label}:** " + ", ".join(bits) + "."


def _review_table(posts, picked_urls):
    picked = set(picked_urls)
    rows = [
        "| Pick | # | Author + likes | What |",
        "| --- | --- | --- | --- |",
    ]
    for post in posts:
        mark = "✅" if post["url"] in picked else ""
        author = (
            f"[{post['author_handle']}]({post['url']})<br>"
            f"{_md_cell(post['author_name'])} · {post['author_type']}<br>"
            f"♥ {_likes_label(post['likes'])} · {post['posted_at']}"
        )
        rows.append(
            f"| {mark} | {post['rank']} | {author} | {_what_cell(post)} |"
        )
    return "\n".join(rows) if posts else "_None._"


def _what_cell(post):
    parts = []
    title = (post.get("newsletter_title") or "").strip()
    if title:
        parts.append(f"<b>Newsletter title:</b> {_md_cell(title)}")
    elif len(post.get("text") or "") > LONG_TEXT:
        parts.append(
            "<b>Newsletter title:</b> <i>needed — 2-line summary, not the full tweet</i>"
        )
    parts.append(_md_cell(post.get("text") or ""))
    quoted = post.get("quoted_post")
    if quoted:
        q_handle = quoted.get("author_handle") or ""
        q_text = quoted.get("text") or ""
        q_url = quoted.get("url") or ""
        quote_line = f"Quote of {q_handle}"
        if q_url:
            quote_line = f"Quote of [{q_handle}]({q_url})"
        parts.append(f"<i>{quote_line}:</i> {_md_cell(q_text)}")
    if post.get("link_url"):
        parts.append(f"Link: {post['link_url']}")
    media = post.get("media") or "none"
    if media != "none":
        parts.append(f"Media: {media}")
    return "<br><br>".join(parts)


def write_review(path, snapshot, insight=None, announcement=None):
    path = pathlib.Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(review_markdown(snapshot, insight, announcement), encoding="utf-8")
    return path

def load(path):
    return json.loads(pathlib.Path(path).read_text())


def write(path, snapshot):
    path = pathlib.Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n")
    return path
