"""Top ProductHunt launches, via the GraphQL v2 API.

The only source that needs credentials. Reads PH_API_KEY from .env at the repo
root: a developer token is used directly as the Bearer token, and if
PH_API_SECRET is also set the pair is treated as OAuth client credentials and
exchanged for an access token instead.
"""

import json
import pathlib
import sys

from .. import http
from ..paths import REPO_ROOT
from . import FetchResult

NAME = "producthunt"
SOURCE = "producthunt"
SECTION = None
SUBPATH = ("producthunt",)
FILENAME = "ph_data.json"
ITEMS_KEY = "posts"
ITEM_NOUN = None  # PH prints just the path, as it always has
DEFAULT_COUNT = 5

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


def access_token(env):
    key = env.get("PH_API_KEY")
    if not key:
        sys.exit("error: PH_API_KEY missing from .env")
    secret = env.get("PH_API_SECRET")
    if not secret:
        # developer token: already a Bearer token, no OAuth exchange
        return key
    return http.post_json(
        TOKEN_URL,
        {"client_id": key, "client_secret": secret, "grant_type": "client_credentials"},
    )["access_token"]


def add_arguments(parser):
    parser.add_argument("--env-file", default=None, help="path to .env (default: repo root)")


def fetch(window, args):
    env_path = pathlib.Path(args.env_file) if args.env_file else REPO_ROOT / ".env"
    token = access_token(load_env(env_path))
    window_dict = window.as_rfc3339_dict()

    resp = http.post_json(
        GRAPHQL_URL,
        {
            "query": QUERY,
            "variables": {
                "first": args.count,
                "postedAfter": window_dict["postedAfter"],
                "postedBefore": window_dict["postedBefore"],
            },
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    if resp.get("errors"):
        sys.exit("GraphQL errors:\n" + json.dumps(resp["errors"], indent=2))

    posts = resp["data"]["posts"]
    return FetchResult(
        items=posts["nodes"],
        total_count=posts["totalCount"],
        window_dict=window_dict,
        query_params={"first": args.count, "order": "VOTES", "featured": True},
    )


def format_line(post):
    return f'  {post["featuredAt"][:10]}  {post["name"]}  ({post["votesCount"]} votes)'
