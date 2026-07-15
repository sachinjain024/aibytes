#!/usr/bin/env python3
"""Fetch the top AI-related HackerNews stories of the last N days and save a weekly JSON snapshot.

Stdlib-only, no auth. Pulls stories from the public HN Algolia search API,
keeps those above a points floor, filters to AI-related stories (HN has no
topic tags, so relevance is keyword/domain matching on title and URL), ranks
by points with recency as tiebreaker, and writes
data/<yyyy>/<mm>/weeks/week-<NN>/news/hackernews/hn_data.json.
"""

import argparse
import datetime as dt
import json
import pathlib
import re
import sys
import urllib.parse
import urllib.request

REPO_ROOT = pathlib.Path(__file__).resolve().parents[4]
sys.path.insert(0, str(REPO_ROOT / ".claude" / "skills" / "shared"))
import ai_keywords

HN_SEARCH_URL = "https://hn.algolia.com/api/v1/search"
USER_AGENT = "aibytes-agents/1.0 (weekly newsletter snapshot)"

# HN titles are prose, so the shared acronyms compile case-sensitively (a
# lowercased "ai" hides inside ordinary words like "air"); phrases plus the
# HN-specific extras match any casing. Shared vocabulary in ai_keywords.py.
AI_PATTERNS_CASED = ai_keywords.compile_patterns(ai_keywords.ACRONYMS)
AI_PATTERNS = ai_keywords.compile_patterns(
    ai_keywords.PHRASES,
    (r"ai[ -](agent|model|coding|assistant|slop|generated)",),
    flags=re.IGNORECASE,
)
# Domains whose stories are AI news regardless of title wording.
AI_DOMAINS = ai_keywords.DOMAINS


def is_ai_story(story):
    text = story["title"]
    if any(p.search(text) for p in AI_PATTERNS_CASED):
        return True
    if any(p.search(text) for p in AI_PATTERNS):
        return True
    host = urllib.parse.urlsplit(story["url"]).netloc.lower()
    return bool(AI_DOMAINS.search(host))


def get_json(url, params):
    req = urllib.request.Request(
        f"{url}?{urllib.parse.urlencode(params)}", headers={"User-Agent": USER_AGENT}
    )
    with urllib.request.urlopen(req) as resp:
        return json.load(resp)


def to_epoch(day):
    return int(dt.datetime.combine(day, dt.time(), tzinfo=dt.timezone.utc).timestamp())


def fetch_stories(window_start, window_end, min_points):
    """All stories in the window with at least min_points points."""
    numeric_filters = ",".join(
        [
            f"created_at_i>{to_epoch(window_start)}",
            f"created_at_i<{to_epoch(window_end)}",
            f"points>={min_points}",
        ]
    )
    stories, page = [], 0
    while True:
        data = get_json(
            HN_SEARCH_URL,
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


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--count", type=int, default=10, help="number of stories (default 10)")
    parser.add_argument("--days", type=int, default=7, help="window length in days (default 7)")
    parser.add_argument("--date", help="end of window, YYYY-MM-DD (default today)")
    parser.add_argument("--output-root", default="data", help="root data directory (default data)")
    parser.add_argument(
        "--min-points", type=int, default=50, help="points floor for candidates (default 50)"
    )
    parser.add_argument(
        "--no-ai-filter", action="store_true", help="keep all stories, not just AI-related ones"
    )
    args = parser.parse_args()

    as_of = dt.date.fromisoformat(args.date) if args.date else dt.date.today()
    window_start = as_of - dt.timedelta(days=args.days)
    window_end = as_of + dt.timedelta(days=1)

    hits, total = fetch_stories(window_start, window_end, args.min_points)
    stories = [to_story(h) for h in hits]
    if not args.no_ai_filter:
        stories = [s for s in stories if is_ai_story(s)]
    stories.sort(key=lambda s: (s["points"], s["created_at"]), reverse=True)
    top = stories[: args.count]

    _, week, _ = as_of.isocalendar()
    out_path = (
        REPO_ROOT
        / args.output_root
        / f"{as_of.year:04d}"
        / f"{as_of.month:02d}"
        / "weeks"
        / f"week-{week:02d}"
        / "news"
        / "hackernews"
        / "hn_data.json"
    )
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(
        json.dumps(
            {
                "source": "hackernews",
                "section": "ai-news",
                "fetched_at": as_of.isoformat(),
                "window": {"after": window_start.isoformat(), "before": window_end.isoformat()},
                "query_params": {
                    "tags": "story",
                    "count": args.count,
                    "min_points": args.min_points,
                    "topic": "all" if args.no_ai_filter else "ai",
                    "ranking": "points,recency",
                },
                "totalCount": len(stories),
                "poolCount": total,
                "stories": top,
            },
            indent=2,
        )
        + "\n"
    )

    try:
        shown_path = out_path.relative_to(REPO_ROOT)
    except ValueError:  # --output-root outside the repo
        shown_path = out_path
    print(f"wrote {shown_path} ({len(top)} of {len(stories)} matching stories, {total} in pool)")
    for s in top:
        print(f'  {s["created_at"][:10]}  [{s["points"]:>4} pts]  {s["title"]}')


if __name__ == "__main__":
    main()
