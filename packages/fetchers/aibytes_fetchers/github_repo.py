"""One GitHub repository's facts, README and open issues, for gists (AIB-145y T11).

Six REST calls: the repo, its README (raw), the contributor count (one per
page, counted from the `Link` header), the latest release, the open-issue
count (search, so pull requests are not counted), and the ten most-commented
open issues. `GITHUB_TOKEN` is used when set; without it GitHub allows 60
calls an hour per address, which a shared runner often has already spent.

A rate limit or any other failure is reported in the result, never raised:
the caller makes that repo's gist `brief` and moves on.

The README is the repo owner's writing: callers keep it in the git-ignored
`.cache/gists/` folder and never commit it.
"""

import os
import re
import urllib.parse

from . import http
from .article import trim

API = "https://api.github.com"
README_CHARS = 15000
ISSUES = 10


def _headers(token, raw=False):
    headers = {"Accept": "application/vnd.github.raw" if raw else "application/vnd.github+json",
               "X-GitHub-Api-Version": "2022-11-28"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


def _rate_limited(resp):
    return resp.status == 429 or (resp.status == 403 and resp.header("X-RateLimit-Remaining") == "0")


def _last_page(link):
    """The page number of rel="last" in a Link header, or None."""
    for part in (link or "").split(","):
        if 'rel="last"' in part:
            match = re.search(r"[?&]page=(\d+)", part)
            if match:
                return int(match.group(1))
    return None


def readme_text(markdown):
    """README markdown made readable: images, badges, HTML tags and link
    targets go; the words stay."""
    text = re.sub(r"(?s)<!--.*?-->", "", markdown)
    text = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", text)              # images and badges
    text = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", text)          # links keep their words
    text = re.sub(r"(?s)<(script|style)\b.*?</\1>", "", text)
    text = re.sub(r"<[^>]+>", "", text)
    text = re.sub(r"[ \t]+\n", "\n", text)
    return re.sub(r"\n{3,}", "\n\n", text).strip()


def repo_details(owner, name, token=None):
    """{ok, error, rate_limited, stats, description, topics, homepage, readme,
    readme_words, issues}. `stats` holds the contract's repo stat keys it could
    fill (never `stars_gained`, which only the edition item knows)."""
    token = token if token is not None else os.environ.get("GITHUB_TOKEN") or None
    base = f"{API}/repos/{owner}/{name}"
    result = {"ok": False, "error": None, "rate_limited": False, "stats": {}, "description": None,
              "topics": [], "homepage": None, "readme": "", "readme_words": 0, "issues": []}

    def get(url, raw=False):
        resp = http.fetch(url, headers=_headers(token, raw))
        if _rate_limited(resp):
            result["rate_limited"] = True
        return resp

    repo = get(base)
    if not repo.ok:
        result["error"] = "rate limited" if result["rate_limited"] else (repo.error or f"HTTP {repo.status}")
        return result
    data = repo.json()
    stats = result["stats"]
    stats["stars"] = data.get("stargazers_count")
    stats["forks"] = data.get("forks_count")
    if data.get("language"):
        stats["language"] = data["language"]
    licence = data.get("license") or {}
    if licence.get("spdx_id") and licence["spdx_id"] != "NOASSERTION":
        stats["license"] = licence["spdx_id"]
    elif licence.get("name"):
        stats["license"] = licence["name"]
    if data.get("created_at"):
        stats["created_on"] = data["created_at"][:10]
    result["description"] = data.get("description")
    result["topics"] = list(data.get("topics") or [])
    result["homepage"] = data.get("homepage") or None
    result["ok"] = True

    readme = get(f"{base}/readme", raw=True)
    if readme.ok:
        text = readme_text(readme.text())
        result["readme_words"] = len(text.split())
        result["readme"] = trim(text, README_CHARS)

    people = get(f"{base}/contributors?per_page=1&anon=1")
    if people.ok:
        last = _last_page(people.header("Link"))
        stats["contributors"] = last if last is not None else len(people.json() or [])

    release = get(f"{base}/releases/latest")
    if release.ok:
        rel = release.json()
        if rel.get("tag_name") and rel.get("published_at"):
            stats["last_release"] = {"tag": rel["tag_name"][:80], "published_on": rel["published_at"][:10]}

    query = urllib.parse.quote(f"repo:{owner}/{name} type:issue state:open")
    count = get(f"{API}/search/issues?q={query}&per_page=1")
    if count.ok:
        stats["open_issues"] = count.json().get("total_count")

    issues = get(f"{base}/issues?state=open&sort=comments&direction=desc&per_page={ISSUES}")
    if issues.ok:
        for issue in issues.json() or []:
            if "pull_request" in issue:
                continue
            result["issues"].append({
                "id": f"i{len(result['issues']) + 1}", "number": issue.get("number"),
                "title": trim(issue.get("title") or "", 200), "url": issue.get("html_url"),
                "labels": [label.get("name") for label in issue.get("labels") or [] if label.get("name")],
                "comments": issue.get("comments", 0)})

    for key in [k for k, v in stats.items() if v is None]:
        del stats[key]
    if result["rate_limited"]:
        result["error"] = "rate limited part-way; some facts are missing"
    return result
