"""Popular TechCrunch AI articles, via the public WordPress REST API.

No auth. The AI category feed is ranked by Hacker News points (public Algolia
API) with recency as tiebreaker, because TechCrunch exposes no popularity
metric of its own.
"""

import html
import re
import urllib.parse

from .. import http
from . import FetchResult

NAME = "techcrunch"
SOURCE = "techcrunch"
SECTION = "ai-news"
SUBPATH = ("news", "techcrunch")
FILENAME = "tc_data.json"
ITEMS_KEY = "articles"
ITEM_NOUN = "articles"
DEFAULT_COUNT = 10

POSTS_URL = "https://techcrunch.com/wp-json/wp/v2/posts"
AI_CATEGORY_ID = 577047203  # slug: artificial-intelligence
HN_SEARCH_URL = "https://hn.algolia.com/api/v1/search"
FIELDS = "id,date_gmt,link,title,excerpt,yoast_head_json"


def strip_html(text):
    return html.unescape(re.sub(r"<[^>]+>", "", text or "")).strip()


def normalize_url(url):
    parts = urllib.parse.urlsplit(url)
    host = re.sub(r"^www\.", "", parts.netloc)
    return host + parts.path.rstrip("/")


def fetch_posts(window):
    posts, page = [], 1
    while True:
        batch, headers = http.get_json_with_headers(
            POSTS_URL,
            {
                "categories": AI_CATEGORY_ID,
                "after": f"{window.start}T00:00:00",
                "before": f"{window.end}T00:00:00",
                "per_page": 100,
                "page": page,
                "_fields": FIELDS,
            },
        )
        posts.extend(batch)
        if page >= int(headers.get("X-WP-TotalPages", 1)):
            return posts
        page += 1


def fetch_hn_points(window):
    """Map of normalized techcrunch URL -> {points, num_comments, hn_url}."""
    scores, page = {}, 0
    while True:
        data = http.get_json(
            HN_SEARCH_URL,
            {
                "query": "techcrunch.com",
                "restrictSearchableAttributes": "url",
                "hitsPerPage": 100,
                "page": page,
                "numericFilters": f"created_at_i>{window.start_epoch()}",
            },
        )
        for hit in data["hits"]:
            if not hit.get("url"):
                continue
            entry = {
                "points": hit.get("points") or 0,
                "num_comments": hit.get("num_comments") or 0,
                "hn_url": f"https://news.ycombinator.com/item?id={hit['objectID']}",
            }
            key = normalize_url(hit["url"])
            if entry["points"] > scores.get(key, {}).get("points", -1):
                scores[key] = entry
        page += 1
        if page >= data["nbPages"]:
            return scores


def to_article(post, hn_scores):
    yoast = post.get("yoast_head_json") or {}
    og_image = yoast.get("og_image") or []
    return {
        "title": strip_html(post["title"]["rendered"]),
        "description": yoast.get("description") or strip_html(post["excerpt"]["rendered"]),
        "url": post["link"],
        "published_at": post["date_gmt"] + "Z",
        "author": yoast.get("author"),
        "image": og_image[0]["url"] if og_image else None,
        "reading_time": (yoast.get("twitter_misc") or {}).get("Est. reading time"),
        "hackernews": hn_scores.get(normalize_url(post["link"])),
    }


def add_arguments(parser):
    parser.add_argument("--no-hn", action="store_true", help="skip HackerNews popularity ranking")


def fetch(window, args):
    posts = fetch_posts(window)
    hn_scores = {} if args.no_hn else fetch_hn_points(window)
    articles = [to_article(p, hn_scores) for p in posts]
    articles.sort(
        key=lambda a: ((a["hackernews"] or {}).get("points", 0), a["published_at"]),
        reverse=True,
    )
    return FetchResult(
        items=articles[: args.count],
        total_count=len(posts),
        window_dict=window.as_dict(),
        query_params={
            "category": "artificial-intelligence",
            "count": args.count,
            "ranking": "recency" if args.no_hn else "hackernews_points,recency",
        },
    )


def format_line(article):
    points = (article["hackernews"] or {}).get("points", 0)
    return f'  {article["published_at"][:10]}  [{points:>4} pts]  {article["title"]}'
