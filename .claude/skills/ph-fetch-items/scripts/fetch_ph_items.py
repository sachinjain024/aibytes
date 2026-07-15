#!/usr/bin/env python3
"""Fetch top ProductHunt products of the last N days and save a weekly JSON snapshot.

Stdlib-only. Reads PH_API_KEY from .env at the repo root. A developer token is
used directly as the Bearer token; if PH_API_SECRET is also set, the pair is
treated as OAuth client credentials and exchanged for an access token instead.
Queries the GraphQL v2 API and writes
data/<yyyy>/<mm>/weeks/week-<NN>/producthunt/ph_data.json.
"""

import argparse
import datetime as dt
import json
import pathlib
import sys
import urllib.request

REPO_ROOT = pathlib.Path(__file__).resolve().parents[4]
TOKEN_URL = "https://api.producthunt.com/v2/oauth/token"
GRAPHQL_URL = "https://api.producthunt.com/v2/api/graphql"

# order must stay VOTES: RANKING is the day-grouped homepage feed order and
# only ever surfaces the current day's leaderboard regardless of date window.
QUERY = """
query TopPosts($first: Int!, $postedAfter: DateTime!, $postedBefore: DateTime!) {
  posts(first: $first, order: VOTES, featured: true,
        postedAfter: $postedAfter, postedBefore: $postedBefore) {
    totalCount
    nodes {
      id
      name
      tagline
      description
      slug
      votesCount
      commentsCount
      reviewsRating
      reviewsCount
      dailyRank
      weeklyRank
      url
      website
      featuredAt
      createdAt
      thumbnail { type url }
      media { type url videoUrl }
      productLinks { type url }
      topics(first: 5) { nodes { name slug } }
      makers { name username headline url twitterUsername }
      user { name username headline url }
    }
  }
}
"""


def load_env(path):
    env = {}
    if not path.exists():
        sys.exit(f"error: {path} not found (needs PH_API_KEY and PH_API_SECRET)")
    for line in path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, _, value = line.partition("=")
            env[key.strip()] = value.strip()
    return env


def post_json(url, payload, headers=None):
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json", **(headers or {})},
    )
    with urllib.request.urlopen(req) as resp:
        return json.load(resp)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--count", type=int, default=5, help="number of products (default 5)")
    parser.add_argument("--days", type=int, default=7, help="window length in days (default 7)")
    parser.add_argument("--date", help="end of window, YYYY-MM-DD (default today)")
    parser.add_argument("--output-root", default="data", help="root data directory (default data)")
    args = parser.parse_args()

    as_of = dt.date.fromisoformat(args.date) if args.date else dt.date.today()
    posted_after = f"{as_of - dt.timedelta(days=args.days)}T00:00:00Z"
    posted_before = f"{as_of + dt.timedelta(days=1)}T00:00:00Z"

    env = load_env(REPO_ROOT / ".env")
    key = env.get("PH_API_KEY")
    if not key:
        sys.exit("error: PH_API_KEY missing from .env")

    secret = env.get("PH_API_SECRET")
    if secret:
        token = post_json(
            TOKEN_URL,
            {"client_id": key, "client_secret": secret, "grant_type": "client_credentials"},
        )["access_token"]
    else:
        # developer token: already a Bearer token, no OAuth exchange
        token = key

    resp = post_json(
        GRAPHQL_URL,
        {
            "query": QUERY,
            "variables": {
                "first": args.count,
                "postedAfter": posted_after,
                "postedBefore": posted_before,
            },
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    if resp.get("errors"):
        sys.exit("GraphQL errors:\n" + json.dumps(resp["errors"], indent=2))

    posts = resp["data"]["posts"]
    _, week, _ = as_of.isocalendar()
    out_path = (
        REPO_ROOT
        / args.output_root
        / f"{as_of.year:04d}"
        / f"{as_of.month:02d}"
        / "weeks"
        / f"week-{week:02d}"
        / "producthunt"
        / "ph_data.json"
    )
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(
        json.dumps(
            {
                "source": "producthunt",
                "fetched_at": as_of.isoformat(),
                "window": {"postedAfter": posted_after, "postedBefore": posted_before},
                "query_params": {"first": args.count, "order": "VOTES", "featured": True},
                "totalCount": posts["totalCount"],
                "posts": posts["nodes"],
            },
            indent=2,
        )
        + "\n"
    )

    try:
        shown_path = out_path.relative_to(REPO_ROOT)
    except ValueError:  # --output-root outside the repo
        shown_path = out_path
    print(f"wrote {shown_path}")
    for p in posts["nodes"]:
        print(f'  {p["featuredAt"][:10]}  {p["name"]}  ({p["votesCount"]} votes)')


if __name__ == "__main__":
    main()
