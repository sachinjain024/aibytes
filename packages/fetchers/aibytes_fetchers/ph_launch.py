"""A Product Hunt launch's material, for gists (AIB-145y T12).

Every producthunt.com page refuses scripts, so a launch gist is written from
the API: the description and topics already in the day's snapshot, plus one
GraphQL call for the comments. The API redacts every comment's author, so the
launch comment is found by time instead: only the launch's own team can
comment before it goes live. When nobody did, the top-voted top-level comment
stands in (on the launches measured it was the maker's).

When curate resolved the product's own site, its text is read too.

Comment text is other people's writing: callers keep it in the git-ignored
`.cache/gists/` folder and never commit it.
"""

import urllib.parse

from . import http
from .article import article_text, html_to_text, trim, words
from .paths import REPO_ROOT

GRAPHQL_URL = "https://api.producthunt.com/v2/api/graphql"
LAUNCH_CHARS = 2000
COMMENT_CHARS = 600
OTHER_COMMENTS = 8
FULL_WORDS = 120

_FIELDS = "id body createdAt parentId votesCount url"
QUERY = f"""
query LaunchComments($id: ID!) {{
  post(id: $id) {{
    top: comments(first: 20, order: VOTES_COUNT) {{ nodes {{ {_FIELDS} }} }}
    oldest: comments(last: 5, order: NEWEST) {{ nodes {{ {_FIELDS} }} }}
  }}
}}
"""


def token_from_env(env_path=None):
    """The PH bearer token from .env, or None. Unlike the snapshot fetcher, a
    missing key here must not stop the run: launches just become `brief`."""
    from .sources import producthunt
    try:
        return producthunt.access_token(producthunt.load_env(env_path or REPO_ROOT / ".env"))
    except (SystemExit, Exception):
        return None


def pick_comments(nodes, launched_at):
    """The launch comment (c1) and the next top-level comments by votes
    (c2...), from the API's comment nodes."""
    seen, top_level = set(), []
    for node in nodes:
        if not isinstance(node, dict) or node.get("id") in seen or node.get("parentId"):
            continue
        text = html_to_text(node.get("body") or "")
        if not text:
            continue
        seen.add(node["id"])
        top_level.append(dict(node, text=text))

    early = sorted((n for n in top_level if launched_at and (n.get("createdAt") or "") < launched_at),
                   key=lambda n: n.get("createdAt") or "")
    by_votes = sorted(top_level, key=lambda n: -(n.get("votesCount") or 0))
    launch = early or by_votes[:1]
    used = {n["id"] for n in launch}

    picked = []
    if launch:
        picked.append({"id": "c1", "launch": True, "votes": sum(n.get("votesCount") or 0 for n in launch),
                       "url": launch[0].get("url"),
                       "text": trim("\n\n".join(n["text"] for n in launch), LAUNCH_CHARS)})
    others = 0
    for node in by_votes:
        if others == OTHER_COMMENTS:
            break
        if node["id"] in used:
            continue
        others += 1
        picked.append({"id": f"c{len(picked) + 1}", "launch": False, "votes": node.get("votesCount") or 0,
                       "url": node.get("url"), "text": trim(node["text"], COMMENT_CHARS)})
    return picked


def launch_comments(post_id, launched_at, token):
    """{ok, error, comments}. One GraphQL call; never raises."""
    if not token:
        return {"ok": False, "error": "no PH_API_KEY", "comments": []}
    resp = http.fetch(GRAPHQL_URL, headers={"Authorization": f"Bearer {token}"},
                      data={"query": QUERY, "variables": {"id": str(post_id)}})
    if not resp.ok:
        return {"ok": False, "error": resp.error or f"HTTP {resp.status}", "comments": []}
    try:
        body = resp.json()
    except ValueError:
        return {"ok": False, "error": "not JSON", "comments": []}
    post = (body.get("data") or {}).get("post")
    if body.get("errors") or not post:
        return {"ok": False, "error": "GraphQL error" if body.get("errors") else "no such post", "comments": []}
    nodes = (post.get("top") or {}).get("nodes", []) + (post.get("oldest") or {}).get("nodes", [])
    return {"ok": True, "error": None, "comments": pick_comments(nodes, launched_at)}


def _own_site(url):
    host = urllib.parse.urlsplit(url or "").hostname or ""
    return bool(host) and not (host == "producthunt.com" or host.endswith(".producthunt.com"))


def launch_material(post, token, site_url=None):
    """Everything a launch gist may be written from. `post` is the snapshot's
    PH post; `site_url` the edition item's `url`, read only when curate
    resolved it to the product's own site."""
    topics = [t.get("name") for t in ((post.get("topics") or {}).get("nodes") or [])
              if isinstance(t, dict) and t.get("name")]
    found = launch_comments(post.get("id"), post.get("createdAt"), token)
    site = article_text(site_url) if _own_site(site_url) else None
    description = (post.get("description") or "").strip()
    launch = next((c for c in found["comments"] if c["launch"]), None)
    return {
        "tagline": post.get("tagline"),
        "description": description,
        "topics": topics,
        "comments": found["comments"],
        "comments_error": found["error"],
        "site": site if site and site["readable"] else None,
        "site_unreadable": site["reason"] if site and not site["readable"] else None,
        "words": words(description) + (words(launch["text"]) if launch else 0),
    }


def is_full(material):
    """Spec Q1: full when the description and the launch comment together
    reach FULL_WORDS."""
    return material["words"] >= FULL_WORDS
