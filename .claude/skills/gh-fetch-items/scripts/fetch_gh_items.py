#!/usr/bin/env python3
"""Fetch the trending AI-related GitHub repositories of the last week and save a weekly JSON snapshot.

Stdlib-only, no auth. Scrapes the public https://github.com/trending page
(there is no official trending API), keeps AI-related repos (GitHub topics
are not shown on the trending page, so relevance is keyword matching on the
repo name and description), ranks by stars gained in the period with total
stars as tiebreaker, and writes
data/<yyyy>/<mm>/weeks/week-<NN>/github/gh_data.json.
"""

import argparse
import datetime as dt
import html as htmllib
import json
import pathlib
import re
import sys
import urllib.parse
import urllib.request

REPO_ROOT = pathlib.Path(__file__).resolve().parents[4]
sys.path.insert(0, str(REPO_ROOT / ".claude" / "skills" / "shared"))
import ai_keywords

TRENDING_URL = "https://github.com/trending"
USER_AGENT = "aibytes-agents/1.0 (weekly newsletter snapshot)"

# Repo names and descriptions are frequently all-lowercase ("ai-agents",
# "awesome-llm"), so unlike the HN title filter the shared acronyms compile
# case-insensitively here too. Bare "agent"/"ml" stay excluded as too
# ambiguous (user-agent, monitoring agents, OCaml); repo-specific extras
# below, shared vocabulary in ai_keywords.py.
AI_PATTERNS = ai_keywords.compile_patterns(
    ai_keywords.ACRONYMS,
    ai_keywords.PHRASES,
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


def get_html(url, params):
    query = f"?{urllib.parse.urlencode(params)}" if params else ""
    req = urllib.request.Request(f"{url}{query}", headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req) as resp:
        return resp.read().decode("utf-8")


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
        period_match = re.search(r"([\d,]+)\s+stars\s+this\s+\w+", article)
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
        for repo in parse_trending(get_html(url, {"since": since})):
            if repo["name"] not in seen:
                seen.add(repo["name"])
                repos.append(repo)
    return repos


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--count", type=int, default=10, help="number of repos (default 10)")
    parser.add_argument(
        "--since",
        choices=("daily", "weekly", "monthly"),
        default="weekly",
        help="GitHub trending window (default weekly)",
    )
    parser.add_argument(
        "--date",
        help="as-of date used to file the snapshot, YYYY-MM-DD (default today; "
        "the trending page itself is always live)",
    )
    parser.add_argument("--output-root", default="data", help="root data directory (default data)")
    parser.add_argument(
        "--languages",
        nargs="*",
        default=[],
        help="extra per-language trending pages to merge into the pool, e.g. python jupyter-notebook",
    )
    parser.add_argument(
        "--no-ai-filter", action="store_true", help="keep all repos, not just AI-related ones"
    )
    args = parser.parse_args()

    as_of = dt.date.fromisoformat(args.date) if args.date else dt.date.today()

    pool = fetch_trending(args.since, args.languages)
    repos = pool if args.no_ai_filter else [r for r in pool if is_ai_repo(r)]
    repos.sort(key=lambda r: (r["period_stars"], r["stars"]), reverse=True)
    top = repos[: args.count]

    _, week, _ = as_of.isocalendar()
    out_path = (
        REPO_ROOT
        / args.output_root
        / f"{as_of.year:04d}"
        / f"{as_of.month:02d}"
        / "weeks"
        / f"week-{week:02d}"
        / "github"
        / "gh_data.json"
    )
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(
        json.dumps(
            {
                "source": "github-trending",
                "section": "trending-repos",
                "fetched_at": as_of.isoformat(),
                "query_params": {
                    "since": args.since,
                    "languages": ["all", *args.languages],
                    "count": args.count,
                    "topic": "all" if args.no_ai_filter else "ai",
                    "ranking": "period_stars,total_stars",
                },
                "totalCount": len(repos),
                "poolCount": len(pool),
                "repos": top,
            },
            indent=2,
        )
        + "\n"
    )

    try:
        shown_path = out_path.relative_to(REPO_ROOT)
    except ValueError:  # --output-root outside the repo
        shown_path = out_path
    print(f"wrote {shown_path} ({len(top)} of {len(repos)} matching repos, {len(pool)} in pool)")
    for r in top:
        print(f'  [+{r["period_stars"]:>5} stars]  {r["name"]}  ({r["language"] or "-"})')


if __name__ == "__main__":
    main()
