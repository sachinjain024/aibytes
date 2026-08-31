"""Trending AI-related GitHub repositories, scraped from github.com/trending.

No auth and no official API. Topics are not shown on the trending page, so
relevance is keyword matching on repo name and description. Ranked by stars
gained in the period with total stars as tiebreaker.

GitHub's own `since` parameter takes daily/weekly/monthly, which happens to be
exactly the cadence vocabulary - so the cadence picks the trending window unless
--since overrides it.
"""

import html as htmllib
import re
import urllib.parse

from .. import http, keywords
from . import FetchResult

NAME = "github"
SOURCE = "github-trending"
SECTION = "trending-repos"
SUBPATH = ("github",)
FILENAME = "gh_data.json"
ITEMS_KEY = "repos"
ITEM_NOUN = "repos"
DEFAULT_COUNT = 10

TRENDING_URL = "https://github.com/trending"
SINCE_CHOICES = ("daily", "weekly", "monthly")

# Repo names and descriptions are frequently all-lowercase ("ai-agents",
# "awesome-llm"), so unlike the HN title filter the shared acronyms compile
# case-insensitively here too. Bare "agent"/"ml" stay excluded as too
# ambiguous (user-agent, monitoring agents, OCaml); repo-specific extras
# below, shared vocabulary in keywords.py.
AI_PATTERNS = keywords.compile_patterns(
    keywords.ACRONYMS,
    keywords.PHRASES,
    (
        r"\bagentic\b",
        r"\b(ai|coding|trading|parallel|autonomous|browser|voice) agents?\b",
        r"\bagents? (multiplexer|skills?|framework|orchestrat)",
        r"\bmcp\b|model context protocol",
        r"text[ -]to[ -](image|video|speech|sql)",
        r"\binference\b",
        r"\bembeddings?\b",
        r"vector (database|db|search)",
    ),
    flags=re.IGNORECASE,
)


def is_ai_repo(repo):
    text = f'{repo["name"]} {repo["description"] or ""}'
    return any(p.search(text) for p in AI_PATTERNS)


def text_of(fragment):
    return htmllib.unescape(re.sub(r"<[^>]+>", "", fragment)).strip()


def to_int(number):
    return int(number.replace(",", ""))


def parse_trending(page):
    """One repo dict per <article> card on a trending page."""
    repos = []
    for article in re.findall(r"<article[^>]*>.*?</article>", page, re.DOTALL):
        name_match = re.search(r'<h2[^>]*>\s*<a[^>]*href="/([^"]+)"', article)
        if not name_match:
            continue
        name = urllib.parse.unquote(name_match.group(1))
        desc_match = re.search(r'<p class="col-9[^"]*">(.*?)</p>', article, re.DOTALL)
        lang_match = re.search(r'itemprop="programmingLanguage">([^<]+)<', article)
        stars_match = re.search(r'/stargazers"[^>]*>.*?</svg>\s*([\d,]+)', article, re.DOTALL)
        forks_match = re.search(r'/forks"[^>]*>.*?</svg>\s*([\d,]+)', article, re.DOTALL)
        # "N stars today" (daily) / "N stars this week" / "N stars this month".
        # Matching only "this <period>" silently zeroed every daily snapshot.
        period_match = re.search(r"([\d,]+)\s+stars\s+(?:this\s+\w+|today)", article)
        repos.append(
            {
                "name": name,
                "url": f"https://github.com/{name}",
                "description": text_of(desc_match.group(1)) if desc_match else None,
                "language": lang_match.group(1).strip() if lang_match else None,
                "stars": to_int(stars_match.group(1)) if stars_match else 0,
                "forks": to_int(forks_match.group(1)) if forks_match else 0,
                "period_stars": to_int(period_match.group(1)) if period_match else 0,
            }
        )
    return repos


def fetch_trending(since, languages):
    """Trending repos from the overall page plus any per-language pages, deduped."""
    repos, seen = [], set()
    for language in [None, *languages]:
        url = TRENDING_URL if language is None else f"{TRENDING_URL}/{urllib.parse.quote(language)}"
        for repo in parse_trending(http.get_html(url, {"since": since})):
            if repo["name"] not in seen:
                seen.add(repo["name"])
                repos.append(repo)
    return repos


def add_arguments(parser):
    parser.add_argument(
        "--since",
        choices=SINCE_CHOICES,
        default=None,
        help="GitHub trending window (default: follows --cadence)",
    )
    parser.add_argument(
        "--languages",
        nargs="*",
        default=[],
        help="extra per-language trending pages to merge into the pool, e.g. python jupyter-notebook",
    )
    parser.add_argument(
        "--no-ai-filter", action="store_true", help="keep all repos, not just AI-related ones"
    )


def fetch(window, args):
    since = args.since or (window.cadence if window.cadence in SINCE_CHOICES else "weekly")
    pool = fetch_trending(since, args.languages)
    repos = pool if args.no_ai_filter else [r for r in pool if is_ai_repo(r)]
    repos.sort(key=lambda r: (r["period_stars"], r["stars"]), reverse=True)
    return FetchResult(
        items=repos[: args.count],
        total_count=len(repos),
        pool_count=len(pool),
        # No window key: the trending page is always live, so the date range the
        # snapshot is filed under is not the range GitHub actually reported on.
        window_dict=None,
        query_params={
            "since": since,
            "languages": ["all", *args.languages],
            "count": args.count,
            "topic": "all" if args.no_ai_filter else "ai",
            "ranking": "period_stars,total_stars",
        },
    )


def format_line(repo):
    return f'  [+{repo["period_stars"]:>5} stars]  {repo["name"]}  ({repo["language"] or "-"})'
