#!/usr/bin/env python3
"""Fetch popular TechCrunch AI articles of the last N days and save a weekly JSON snapshot.

Stdlib-only, no auth. Pulls the TechCrunch AI category via the public WordPress
REST API, ranks articles by Hacker News points (public Algolia API) with recency
as tiebreaker, and writes data/<yyyy>/<mm>/weeks/week-<NN>/news/techcrunch/tc_data.json.
"""

import argparse
import datetime as dt
import html
import json
import pathlib
import re
import sys
import urllib.parse
import urllib.request

REPO_ROOT = pathlib.Path(__file__).resolve().parents[4]
TC_POSTS_URL = "https://techcrunch.com/wp-json/wp/v2/posts"
TC_AI_CATEGORY_ID = 577047203  # slug: artificial-intelligence
HN_SEARCH_URL = "https://hn.algolia.com/api/v1/search"
USER_AGENT = "aibytes-agents/1.0 (weekly newsletter snapshot)"
TC_FIELDS = "id,date_gmt,link,title,excerpt,yoast_head_json"


def get_json(url, params):
    req = urllib.request.Request(
        f"{url}?{urllib.parse.urlencode(params)}", headers={"User-Agent": USER_AGENT}
    )
    with urllib.request.urlopen(req) as resp:
        return json.load(resp), resp.headers


def strip_html(text):
    return html.unescape(re.sub(r"<[^>]+>", "", text or "")).strip()


def normalize_url(url):
    parts = urllib.parse.urlsplit(url)
    host = re.sub(r"^www\.", "", parts.netloc)
    return host + parts.path.rstrip("/")


def fetch_tc_posts(window_start, window_end):
    posts, page = [], 1
    while True:
        batch, headers = get_json(
            TC_POSTS_URL,
            {
                "categories": TC_AI_CATEGORY_ID,
                "after": f"{window_start}T00:00:00",
                "before": f"{window_end}T00:00:00",
                "per_page": 100,
                "page": page,
                "_fields": TC_FIELDS,
            },
        )
        posts.extend(batch)
        if page >= int(headers.get("X-WP-TotalPages", 1)):
            return posts
        page += 1


def fetch_hn_points(window_start):
    """Map of normalized techcrunch URL -> {points, num_comments, hn_url}."""
    created_after = int(
        dt.datetime.combine(window_start, dt.time(), tzinfo=dt.timezone.utc).timestamp()
    )
    scores, page = {}, 0
    while True:
        data, _ = get_json(
            HN_SEARCH_URL,
            {
                "query": "techcrunch.com",
                "restrictSearchableAttributes": "url",
                "hitsPerPage": 100,
                "page": page,
                "numericFilters": f"created_at_i>{created_after}",
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


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--count", type=int, default=10, help="number of articles (default 10)")
    parser.add_argument("--days", type=int, default=7, help="window length in days (default 7)")
    parser.add_argument("--date", help="end of window, YYYY-MM-DD (default today)")
    parser.add_argument("--output-root", default="data", help="root data directory (default data)")
    parser.add_argument("--no-hn", action="store_true", help="skip HackerNews popularity ranking")
    args = parser.parse_args()

    as_of = dt.date.fromisoformat(args.date) if args.date else dt.date.today()
    window_start = as_of - dt.timedelta(days=args.days)
    window_end = as_of + dt.timedelta(days=1)

    posts = fetch_tc_posts(window_start, window_end)
    hn_scores = {} if args.no_hn else fetch_hn_points(window_start)

    articles = [to_article(p, hn_scores) for p in posts]
    articles.sort(
        key=lambda a: ((a["hackernews"] or {}).get("points", 0), a["published_at"]),
        reverse=True,
    )
    top = articles[: args.count]

    _, week, _ = as_of.isocalendar()
    out_path = (
        REPO_ROOT
        / args.output_root
        / f"{as_of.year:04d}"
        / f"{as_of.month:02d}"
        / "weeks"
        / f"week-{week:02d}"
        / "news"
        / "techcrunch"
        / "tc_data.json"
    )
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(
        json.dumps(
            {
                "source": "techcrunch",
                "section": "ai-news",
                "fetched_at": as_of.isoformat(),
                "window": {"after": window_start.isoformat(), "before": window_end.isoformat()},
                "query_params": {
                    "category": "artificial-intelligence",
                    "count": args.count,
                    "ranking": "recency" if args.no_hn else "hackernews_points,recency",
                },
                "totalCount": len(posts),
                "articles": top,
            },
            indent=2,
        )
        + "\n"
    )

    try:
        shown_path = out_path.relative_to(REPO_ROOT)
    except ValueError:  # --output-root outside the repo
        shown_path = out_path
    print(f"wrote {shown_path} ({len(top)} of {len(posts)} articles)")
    for a in top:
        points = (a["hackernews"] or {}).get("points", 0)
        print(f'  {a["published_at"][:10]}  [{points:>4} pts]  {a["title"]}')


if __name__ == "__main__":
    main()
