"""One Hacker News story and its top comments, for gists (AIB-145y T10).

Two calls. HN's own Firebase item gives the score, the comment count and the
top-level comments in HN's ranked order (`kids`); Algolia's `items` endpoint
gives every comment's text in one response, but ordered by time. The ranking
comes from the first, the text from the second.

Comment text is other people's writing: callers keep it in the git-ignored
`.cache/gists/` folder and never commit it.
"""

import datetime as dt

from . import http
from .article import html_to_text, trim

FIREBASE_ITEM = "https://hacker-news.firebaseio.com/v0/item/{id}.json"
ALGOLIA_ITEM = "https://hn.algolia.com/api/v1/items/{id}"
ITEM_URL = "https://news.ycombinator.com/item?id={id}"

TOP_COMMENTS = 10
COMMENT_CHARS = 600
REPLY_CHARS = 300
SELF_TEXT_CHARS = 12000


def _iso(epoch):
    if epoch is None:
        return None
    return dt.datetime.fromtimestamp(int(epoch), dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _alive(node):
    return isinstance(node, dict) and node.get("author") and node.get("text")


def thread(story, tree, top=TOP_COMMENTS):
    """Build the result from an already-fetched Firebase story (or None) and
    Algolia tree (or None)."""
    story = story if isinstance(story, dict) else {}
    tree = tree if isinstance(tree, dict) else {}
    children = {c.get("id"): c for c in tree.get("children") or [] if isinstance(c, dict)}
    order = [kid for kid in story.get("kids") or [] if kid in children]
    if not order:  # no ranking: Algolia's time order is the best there is
        order = list(children)

    comments = []
    for hn_id in order:
        node = children[hn_id]
        if not _alive(node):
            continue
        entry = {"id": f"c{len(comments) + 1}", "hn_id": hn_id, "by": node["author"],
                 "text": trim(html_to_text(node["text"]), COMMENT_CHARS),
                 "url": ITEM_URL.format(id=hn_id), "reply": None}
        reply = next((c for c in node.get("children") or [] if _alive(c)), None)
        if reply:
            entry["reply"] = {"by": reply["author"],
                              "text": trim(html_to_text(reply["text"]), REPLY_CHARS)}
        comments.append(entry)
        if len(comments) == top:
            break

    item_id = story.get("id") or tree.get("id")
    self_text = html_to_text(story.get("text") or tree.get("text") or "")
    return {
        "id": item_id,
        "title": story.get("title") or tree.get("title"),
        "url": story.get("url") or tree.get("url"),
        "self_text": trim(self_text, SELF_TEXT_CHARS) if self_text else "",
        "points": story.get("score", tree.get("points")),
        "descendants": story.get("descendants"),
        "by": story.get("by") or tree.get("author"),
        "posted_at": _iso(story.get("time") or tree.get("created_at_i")),
        "discussion_url": ITEM_URL.format(id=item_id) if item_id else None,
        "comments": comments,
        "ranked": bool(story.get("kids")),
    }


def hn_thread(item_id, top=TOP_COMMENTS):
    """Fetch story `item_id` and return its facts and top `top` comments.
    `error` is set, and `comments` may be empty, when either call failed; it
    never raises."""
    first = http.fetch(FIREBASE_ITEM.format(id=item_id))
    second = http.fetch(ALGOLIA_ITEM.format(id=item_id))
    errors = []
    story = tree = None
    for name, resp in (("firebase", first), ("algolia", second)):
        if not resp.ok:
            errors.append(f"{name}: {resp.error or resp.status}")
            continue
        try:
            data = resp.json()
        except ValueError:
            errors.append(f"{name}: not JSON")
            continue
        if name == "firebase":
            story = data
        else:
            tree = data
    result = thread(story, tree, top)
    result["error"] = "; ".join(errors) or None
    return result
