"""Top AI-related HackerNews stories, via the public Algolia search API.

No auth. HN has no topic tags, so relevance is keyword/domain matching on the
title and URL. Ranked by points with recency as tiebreaker.
"""

import re
import urllib.parse

from .. import http, keywords
from . import FetchResult

NAME = "hackernews"
SOURCE = "hackernews"
SECTION = "ai-news"
SUBPATH = ("news", "hackernews")
FILENAME = "hn_data.json"
ITEMS_KEY = "stories"
ITEM_NOUN = "stories"
DEFAULT_COUNT = 10

SEARCH_URL = "https://hn.algolia.com/api/v1/search"

# HN titles are prose, so the shared acronyms compile case-sensitively (a
# lowercased "ai" hides inside ordinary words like "air"); phrases plus the
# HN-specific extras match any casing. Shared vocabulary in keywords.py.
AI_PATTERNS_CASED = keywords.compile_patterns(keywords.ACRONYMS)
AI_PATTERNS = keywords.compile_patterns(
    keywords.PHRASES,
    (r"ai[ -](agent|model|coding|assistant|slop|generated)",),
    flags=re.IGNORECASE,
)
AI_DOMAINS = keywords.DOMAINS


def is_ai_story(story):
    text = story["title"]
    if any(p.search(text) for p in AI_PATTERNS_CASED):
        return True
    if any(p.search(text) for p in AI_PATTERNS):
        return True
    host = urllib.parse.urlsplit(story["url"]).netloc.lower()
    return bool(AI_DOMAINS.search(host))


def story_type(tags):
    for special in ("show_hn", "ask_hn", "launch_hn"):
        if special in tags:
            return special
    return "story"


def to_story(hit):
    hn_url = f"https://news.ycombinator.com/item?id={hit['objectID']}"
    return {
        "title": hit["title"],
        "url": hit.get("url") or hn_url,
        "type": story_type(hit.get("_tags") or []),
        "points": hit.get("points") or 0,
        "num_comments": hit.get("num_comments") or 0,
        "author": hit.get("author"),
        "created_at": hit["created_at"],
        "hn_url": hn_url,
    }


def fetch_stories(window, min_points):
    """All stories in the window with at least min_points points."""
    numeric_filters = ",".join(
        [
            f"created_at_i>{window.start_epoch()}",
            f"created_at_i<{window.end_epoch()}",
            f"points>={min_points}",
        ]
    )
    stories, page = [], 0
    while True:
        data = http.get_json(
            SEARCH_URL,
            {
                "tags": "story",
                "hitsPerPage": 100,
                "page": page,
                "numericFilters": numeric_filters,
            },
        )
        stories.extend(data["hits"])
        page += 1
        if page >= data["nbPages"]:
            return stories, data["nbHits"]


def add_arguments(parser):
    parser.add_argument(
        "--min-points", type=int, default=50, help="points floor for candidates (default 50)"
    )
    parser.add_argument(
        "--no-ai-filter", action="store_true", help="keep all stories, not just AI-related ones"
    )


def fetch(window, args):
    hits, pool = fetch_stories(window, args.min_points)
    stories = [to_story(h) for h in hits]
    if not args.no_ai_filter:
        stories = [s for s in stories if is_ai_story(s)]
    stories.sort(key=lambda s: (s["points"], s["created_at"]), reverse=True)
    return FetchResult(
        items=stories[: args.count],
        total_count=len(stories),
        pool_count=pool,
        window_dict=window.as_dict(),
        query_params={
            "tags": "story",
            "count": args.count,
            "min_points": args.min_points,
            "topic": "all" if args.no_ai_filter else "ai",
            "ranking": "points,recency",
        },
    )


def format_line(story):
    return f'  {story["created_at"][:10]}  [{story["points"]:>4} pts]  {story["title"]}'
