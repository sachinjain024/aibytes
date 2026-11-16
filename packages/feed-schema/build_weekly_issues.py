#!/usr/bin/env python3
"""Build content/weekly/issues/issue-N.json from newsletter issue HTML (AIB-105j).

Maps AI News, Products, Repos and HN Deep so /weekly/issue-N can render in the
Ledger shell. After AIB-145y T36 a gist title href is resolved through the
gist file to `url`, `source_url` and `gist`. Viral on X and Official
Announcements are parsed when those rows carry a gist href (Issues 1–18 have
none, so they still contribute no X items).

Items follow the edition item contract (feed.d.ts) except for the id, which
ends in `-issue-N` instead of an edition date.

An issue whose items have not changed keeps its `generated_at`, so a re-run
only touches the issues that actually moved.

    python3 packages/feed-schema/build_weekly_issues.py
    python3 packages/feed-schema/build_weekly_issues.py --root /tmp/repo
"""

from __future__ import annotations

import argparse
import html as htmlmod
import json
import pathlib
import re
import sys
from datetime import datetime, timezone
from urllib.parse import urlparse

import item_id as ids
import validate as contract

ROOT = pathlib.Path(__file__).resolve().parents[2]
SCHEMA_VERSION = 1
SUMMARY_MAX = 200

SRC_LABEL = {
    "hackernews": "hackernews",
    "hacker news": "hackernews",
    "hn": "hackernews",
    "techcrunch": "techcrunch",
    "tech crunch": "techcrunch",
    "producthunt": "producthunt",
    "product hunt": "producthunt",
    "github": "github",
}

SECTION_CATEGORY = (
    (re.compile(r"new ai products|launches", re.I), "launches", "producthunt"),
    (re.compile(r"trending (on )?github|trending repos|trending github projects", re.I), "repos", "github"),
    (re.compile(r"hn deep", re.I), "hn", "hackernews"),
)

CATEGORIES = ("launches", "repos", "news", "hn")
GIST_HREF_RE = re.compile(
    r"^https?://(?:www\.)?aibytes\.io/gists/([^/?#]+)/?(?:\?[^#]*)?(?:#.*)?$",
    re.I,
)


class BuildError(Exception):
    """A gist href cannot be resolved and the row has no other source URL."""


slugify = ids.slugify


def gist_slug_from_href(href: str) -> str | None:
    """Slug if this is aibytes.io/gists/<slug> and the slug is a contract slug."""
    match = GIST_HREF_RE.match(htmlmod.unescape(href or "").strip())
    if not match:
        return None
    slug = match.group(1)
    if not (contract.SLUG_RE.match(slug) and len(slug) <= contract.GIST_SLUG_MAX):
        return None
    return slug


def load_gist(content_root: pathlib.Path | None, slug: str) -> dict | None:
    if content_root is None:
        return None
    path = pathlib.Path(content_root) / "gists" / f"{slug}.json"
    if not path.is_file():
        return None
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None
    return data if isinstance(data, dict) else None


def urls_from_gist(gist: dict) -> tuple[str, str]:
    dest = next((link.get("url") for link in gist.get("links") or []
                 if isinstance(link, dict) and link.get("role") == "destination" and link.get("url")), None)
    disc = next((link.get("url") for link in gist.get("links") or []
                 if isinstance(link, dict) and link.get("role") == "discussion" and link.get("url")), None)
    url = dest or gist.get("url")
    source_url = disc or gist.get("source_url") or url
    return url, source_url


def other_http_hrefs(blob: str, title_href: str) -> list[str]:
    skip = {htmlmod.unescape(title_href)}
    out = []
    for href in re.findall(r'href="([^"]+)"', blob):
        href = htmlmod.unescape(href)
        if not href.startswith("http") or href in skip or gist_slug_from_href(href):
            continue
        out.append(href)
    return out


def resolve_gist_title(blob: str, title_href: str, content_root, log) -> tuple[str, str | None, str | None]:
    """(url, source_url or None, gist slug or None). source_url None means fill as today."""
    slug = gist_slug_from_href(title_href)
    if slug is None:
        return title_href, None, None
    gist = load_gist(content_root, slug)
    if gist:
        url, source_url = urls_from_gist(gist)
        return url, source_url, slug
    log(f"warning: gist {slug} is missing; keeping the row from trailing source links")
    others = other_http_hrefs(blob, title_href)
    if not others:
        raise BuildError(f"gist {slug!r} is missing and the row has no other href")
    return others[0], None, None


def strip_tags(text: str) -> str:
    text = re.sub(r"<br\s*/?>", " ", text, flags=re.I)
    text = re.sub(r"<[^>]+>", "", text)
    return htmlmod.unescape(re.sub(r"\s+", " ", text)).strip()


def strip_comments(html: str) -> str:
    """The issue template keeps example rows in comments; they are not items."""
    return re.sub(r"<!--.*?-->", "", html, flags=re.S)


def summary_text(rest: str, category: str, url: str) -> str:
    """The text after the title, without the source label, badges, or stat.

    An HN deep story often runs as a bare title; the contract wants a summary,
    so it says where the link goes rather than repeating the title.
    """
    rest = re.sub(r'<span class="(?:hot|src|stat)">.*?</span>', "", rest, flags=re.S)
    summary = re.sub(r"^\s*[—–\-]\s*", "", strip_tags(rest)).strip()
    if not summary:
        host = re.sub(r"^www\.", "", urlparse(url).netloc) or "the web"
        if host == "news.ycombinator.com":
            summary = "A Hacker News thread."
        elif category == "hn":
            summary = f"A post on {host}, discussed on Hacker News."
        else:
            summary = f"From {host}."
    return summary[:SUMMARY_MAX]


def parse_source_label(blob: str) -> str | None:
    m = re.search(r'<span class="src">\s*\(?(.*?)\)?\s*</span>', blob, re.S)
    if not m:
        return None
    return SRC_LABEL.get(strip_tags(m.group(1)).strip("() ").lower())


def github_image(url: str) -> dict:
    m = re.match(r"https?://github\.com/([^/]+)", url)
    if m:
        return {"type": "avatar", "url": f"https://github.com/{m.group(1)}.png?size=80"}
    return {"type": "none"}


def _count(text: str) -> int:
    return int(text.replace(",", ""))


def parse_stat(stat: str, category: str) -> dict:
    """Signals from a row's stat: `▲ 776`, `+6.4k ★`, `699 pts · 312 💬`."""
    text = strip_tags(stat)
    signals = {}
    if category == "launches":
        m = re.search(r"▲\s*([\d,]+)", text)
        if m:
            signals["upvotes"] = _count(m.group(1))
    elif category == "repos":
        m = re.search(r"\+\s*([\d,]*\.?\d+)\s*(k?)", text, re.I)
        if m:
            value = float(m.group(1).replace(",", ""))
            signals["stars_gained"] = round(value * 1000) if m.group(2) else int(value)
    elif category == "hn":
        m = re.search(r"([\d,]+)\s*pts", text, re.I)
        if m:
            signals["points"] = _count(m.group(1))
        m = re.search(r"([\d,]+)\s*💬", text)
        if m:
            signals["comments"] = _count(m.group(1))
    return signals


def _item(issue_num, category, source, title, summary, url, source_url, image, signals=None, gist=None):
    item = {
        "id": ids.weekly_item_id(source, title, issue_num),
        "title": title,
        "summary": summary,
        "url": url,
        "source": source,
        "source_url": source_url,
        "category": category,
        "tags": [],
        "image": image,
        "hidden": False,
    }
    if signals:
        item["signals"] = signals
    if gist:
        item["gist"] = gist
    return item


def _x_item(issue_num, slug, title, summary, url, gist=None):
    item = {
        "id": f"{slug}-issue-{issue_num}",
        "title": title,
        "summary": (summary or "")[:SUMMARY_MAX],
        "url": url,
        "source": "x",
        "source_url": url,
        "category": "x",
        "tags": [],
        "image": {"type": "none"},
        "hidden": False,
    }
    if gist:
        item["gist"] = gist
    return item


def news_items(html: str, issue_num: int, content_root=None, log=print) -> list[dict]:
    # AI News lives in .news-item paragraphs inside .news-card. Prefer that card
    # so the intro TOC naming "AI News" cannot steal the start.
    card = re.search(r'<div class="news-card">(.*?)</div>\s*(?:<div class="oa-card"|<div class="sec-head">|$)', html, re.S | re.I)
    if card:
        region = card.group(1)
    else:
        start = re.search(r'class="card-title">[^<]*AI NEWS', html, re.I)
        region = html[start.start():] if start else html
        stop = re.search(r'OFFICIAL ANNOUNCEMENTS|<div class="oa-card"|<div class="sec-head">', region, re.I)
        region = region[: stop.start()] if stop else region

    items = []
    for m in re.finditer(r'<p class="news-item">(.*?)</p>', region, re.S):
        blob = m.group(1)
        link = re.search(r'<a href="([^"]+)">(.*?)</a>\s*</b>\s*(.*)$', blob, re.S)
        if not link:
            continue
        title_href, title, rest = link.group(1), strip_tags(link.group(2)), link.group(3)
        url, gist_source_url, gist = resolve_gist_title(blob, title_href, content_root, log)
        source = parse_source_label(blob) or ("techcrunch" if "techcrunch.com" in url else "hackernews")
        hn = re.search(r'href="(https://news\.ycombinator\.com/item\?id=\d+)"', blob)
        if hn:
            source = "hackernews"
        source_url = gist_source_url or (hn.group(1) if hn else url)
        items.append(_item(issue_num, "news", source, title, summary_text(rest, "news", url), url,
                           source_url, {"type": "none"}, gist=gist))
    return items


def section_blocks(html: str) -> list[tuple[str, str]]:
    """(section title, html up to the next section) for each .sec-head."""
    out = []
    for part in re.split(r'<div class="sec-head">', html)[1:]:
        title = re.search(r'class="sec-title">(.*?)</', part)
        if title:
            out.append((strip_tags(title.group(1)), part))
    return out


def row_items(section_html: str, issue_num: int, category: str, source: str,
              content_root=None, log=print) -> list[dict]:
    items = []
    for m in re.finditer(r'<div class="row">(.*?)</div>', section_html, re.S):
        blob = m.group(1)
        link = re.search(r'<b>\s*<a href="([^"]+)">(.*?)</a>\s*</b>\s*(.*)$', blob, re.S)
        if not link:
            continue
        title_href, title, rest = link.group(1), strip_tags(link.group(2)), link.group(3)
        url, gist_source_url, gist = resolve_gist_title(blob, title_href, content_root, log)
        source_url = gist_source_url or url
        if gist_source_url is None:
            if category == "hn":
                hn = re.search(r'href="(https://news\.ycombinator\.com/item\?id=\d+)"', blob)
                if hn:
                    source_url = hn.group(1)
            elif category == "launches":
                ph = re.search(r'href="(https://www\.producthunt\.com/[^"]+)"', blob)
                if ph:
                    source_url = ph.group(1)

        stat = re.search(r'<span class="stat">(.*?)</span>', blob, re.S)
        signals = parse_stat(stat.group(1) if stat else "", category)
        image = github_image(url) if category == "repos" else {"type": "none"}
        items.append(_item(issue_num, category, source, title, summary_text(rest, category, url), url,
                           source_url, image, signals, gist=gist))
    return items


def oa_items(html: str, issue_num: int, content_root=None, log=print) -> list[dict]:
    items = []
    for m in re.finditer(r'<div class="oa-item">(.*?)</div>\s*</div>', html, re.S):
        blob = m.group(1)
        by = re.search(r'<div class="oa-by">\s*<b>(.*?)</b>', blob, re.S)
        gist_href = re.search(r'<a href="([^"]+)">\s*Gist', blob)
        post = re.search(r'<a href="([^"]+)">\s*Post on X', blob)
        if not by or not gist_href:
            continue
        slug = gist_slug_from_href(gist_href.group(1))
        if slug is None:
            continue
        title = strip_tags(by.group(1))
        gist = load_gist(content_root, slug)
        post_url = htmlmod.unescape(post.group(1)) if post else None
        if gist:
            url, _ = urls_from_gist(gist)
            preview = (gist.get("preview") or {}).get("text") or ""
            items.append(_x_item(issue_num, slug, title, preview, url, gist=slug))
            continue
        log(f"warning: gist {slug} is missing; keeping the row from trailing source links")
        if not post_url:
            raise BuildError(f"gist {slug!r} is missing and the row has no other href")
        words = strip_tags(re.search(r'<div class="oa-post">(.*?)</div>', blob, re.S).group(1)
                           if re.search(r'<div class="oa-post">', blob) else title)
        items.append(_x_item(issue_num, slug, title, words, post_url))
    return items


def viral_items(section_html: str, issue_num: int, content_root=None, log=print) -> list[dict]:
    items = []
    for m in re.finditer(r'<div class="row">(.*?)</div>', section_html, re.S):
        blob = m.group(1)
        row = re.search(
            r'<b>\s*<a href="[^"]+">(@[^<]+)</a>\s*</b>\s*'
            r'<a class="post" href="([^"]+)">(.*?)</a>(.*)',
            blob, re.S,
        )
        if not row:
            continue
        handle, gist_href, words, tail = row.groups()
        slug = gist_slug_from_href(gist_href)
        if slug is None:
            continue
        title = f"{handle} {strip_tags(words)}".strip()
        post = re.search(r'href="(https?://[^"]+)"', tail)
        post_url = htmlmod.unescape(post.group(1)) if post else None
        gist = load_gist(content_root, slug)
        if gist:
            url, _ = urls_from_gist(gist)
            preview = (gist.get("preview") or {}).get("text") or strip_tags(words)
            items.append(_x_item(issue_num, slug, title, preview, url, gist=slug))
            continue
        log(f"warning: gist {slug} is missing; keeping the row from trailing source links")
        if not post_url:
            raise BuildError(f"gist {slug!r} is missing and the row has no other href")
        items.append(_x_item(issue_num, slug, title, strip_tags(words), post_url))
    return items


def extract_items(html: str, issue_num: int, content_root=None, log=None) -> list[dict]:
    log = log or (lambda message: print(message, file=sys.stderr))
    html = strip_comments(html)
    items = news_items(html, issue_num, content_root, log)
    items.extend(oa_items(html, issue_num, content_root, log))
    for title, body in section_blocks(html):
        if re.search(r"viral on x", title, re.I):
            items.extend(viral_items(body, issue_num, content_root, log))
            continue
        for pattern, category, source in SECTION_CATEGORY:
            if pattern.search(title):
                items.extend(row_items(body, issue_num, category, source, content_root, log))
                break
    ids.unique_weekly_ids([item for item in items if item.get("source") != "x"])
    # Rank is the issue's reading order.
    for rank, item in enumerate(items, start=1):
        item["rank"] = rank
    return items


def build_issue(html: str, entry: dict, previous: dict | None = None, now: str | None = None,
                content_root=None) -> dict:
    items = extract_items(html, entry["number"], content_root=content_root)
    counts = {key: sum(1 for i in items if i["category"] == key and not i["hidden"]) for key in CATEGORIES}
    x_count = sum(1 for i in items if i["category"] == "x" and not i["hidden"])
    if x_count:
        counts["x"] = x_count
    issue = {
        "schema_version": SCHEMA_VERSION,
        "number": entry["number"],
        "slug": entry["slug"],
        "title": entry["title"],
        "description": entry.get("description") or "",
        "published_on": entry["published_on"],
        "generated_at": now or datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "counts": counts,
        "items": items,
    }
    if previous and {**previous, "generated_at": None} == {**issue, "generated_at": None}:
        issue["generated_at"] = previous["generated_at"]
    return issue


def _read_json(path: pathlib.Path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--root", type=pathlib.Path, default=ROOT, help="repo root holding content/ and newsletter/")
    args = parser.parse_args(argv)
    root = args.root
    index_path = root / "content" / "weekly" / "index.json"
    out_dir = root / "content" / "weekly" / "issues"
    index = _read_json(index_path)
    if index is None:
        print(f"missing or unreadable {index_path}", file=sys.stderr)
        return 1
    out_dir.mkdir(parents=True, exist_ok=True)
    failed = False
    for entry in index.get("issues", []):
        html_path = root / entry.get("source", "")
        if not entry.get("source") or not html_path.is_file():
            print(f"{entry.get('slug')}: missing source {entry.get('source')!r}", file=sys.stderr)
            failed = True
            continue
        dest = out_dir / f"{entry['slug']}.json"
        try:
            issue = build_issue(
                html_path.read_text(encoding="utf-8", errors="replace"),
                entry, _read_json(dest), content_root=root / "content",
            )
        except BuildError as err:
            print(f"{entry.get('slug')}: {err}", file=sys.stderr)
            failed = True
            continue
        dest.write_text(json.dumps(issue, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        entry["path"] = f"weekly/issues/{entry['slug']}.json"
        print(f"{entry['slug']}: {len(issue['items'])} items {issue['counts']}")
    index_path.write_text(json.dumps(index, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
