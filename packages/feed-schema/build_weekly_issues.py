#!/usr/bin/env python3
"""Build content/weekly/issues/issue-N.json from newsletter issue HTML (AIB-105j).

Skips the intro, Official Announcements, and Viral on X. Maps the four app
categories so /weekly/issue-N can render in the Ledger shell with the side nav.
"""

from __future__ import annotations

import argparse
import html as htmlmod
import json
import pathlib
import re
import sys
from datetime import datetime, timezone

ROOT = pathlib.Path(__file__).resolve().parents[2]
ISSUES_ROOT = ROOT / "newsletter" / "issues"
WEEKLY_DIR = ROOT / "content" / "weekly"
WEEKLY_ISSUES = WEEKLY_DIR / "issues"
INDEX_PATH = WEEKLY_DIR / "index.json"

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
    (re.compile(r"viral on x", re.I), "skip", None),
)


def slugify(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", "-", text).strip("-")
    return text[:48] or "item"


def strip_tags(text: str) -> str:
    text = re.sub(r"<br\s*/?>", " ", text, flags=re.I)
    text = re.sub(r"<[^>]+>", "", text)
    return htmlmod.unescape(re.sub(r"\s+", " ", text)).strip()


def parse_source_label(blob: str) -> str | None:
    m = re.search(r'\(<?(?:<a[^>]*>)?([^)<]+)(?:</a>)?>?\)', blob)
    if not m:
        return None
    return SRC_LABEL.get(m.group(1).strip().lower())


def github_image(url: str) -> dict:
    m = re.match(r"https?://github\.com/([^/]+)", url)
    if m:
        return {"type": "avatar", "url": f"https://github.com/{m.group(1)}.png?size=80"}
    return {"type": "none"}


def parse_stat(stat: str, category: str) -> dict:
    signals = {}
    if not stat:
        return signals
    raw = htmlmod.unescape(stat)
    if category == "launches":
        m = re.search(r"▲\s*([\d,]+)", raw)
        if m:
            signals["upvotes"] = int(m.group(1).replace(",", ""))
    elif category == "repos":
        m = re.search(r"\+?\s*([\d,.]+)\s*k?\s*★", raw, re.I)
        if not m:
            m = re.search(r"\+([\d,]+)", raw)
        if m:
            num = m.group(1).replace(",", "")
            if num.endswith(".") or "k" in raw.lower():
                try:
                    signals["stars_gained"] = int(float(num) * (1000 if "k" in raw.lower() else 1))
                except ValueError:
                    pass
            else:
                signals["stars_gained"] = int(float(num) * (1000 if "k" in raw.lower() else 1))
    elif category == "hn":
        m = re.search(r"([\d,]+)\s*pts", raw, re.I)
        if not m:
            m = re.search(r"<b>([\d,]+)</b>", raw)
        if not m:
            m = re.search(r"([\d,]+)", raw)
        if m:
            signals["points"] = int(m.group(1).replace(",", ""))
        cm = re.search(r"([\d,]+)\s*💬", raw)
        if cm:
            signals["comments"] = int(cm.group(1).replace(",", ""))
    return signals


def news_items(html: str, issue_num: int) -> list[dict]:
    items = []
    # AI News lives in .news-item paragraphs inside .news-card. Prefer that card
    # so HTML comments / the intro TOC naming "AI News" cannot steal the start.
    card = re.search(r'<div class="news-card">(.*?)</div>\s*(?:<div class="oa-card"|<div class="sec-head">|$)', html, re.S | re.I)
    if card:
        head = card.group(1)
    else:
        start = re.search(r'class="card-title">[^<]*AI NEWS', html, re.I)
        region = html[start.start():] if start else html
        stop = re.search(r'OFFICIAL ANNOUNCEMENTS|<div class="oa-card"|<div class="sec-head">', region, re.I)
        head = region[: stop.start()] if stop else region
    for i, m in enumerate(re.finditer(r'<p class="news-item">(.*?)</p>', head, re.S), start=1):
        blob = m.group(1)
        link = re.search(r'<b>\s*<a href="([^"]+)">(.*?)</a>\s*</b>\s*(.*)$', blob, re.S)
        if not link:
            link = re.search(r'<a href="([^"]+)">(.*?)</a>\s*</b>\s*(.*)$', blob, re.S)
        if not link:
            continue
        url, title, rest = link.group(1), strip_tags(link.group(2)), link.group(3)
        summary = strip_tags(re.sub(r'<span class="(?:hot|src)">.*?</span>', "", rest, flags=re.S))
        summary = re.sub(r"^\s*[—–\-]\s*", "", summary).strip()
        source = parse_source_label(blob) or ("techcrunch" if "techcrunch.com" in url else "hackernews")
        source_url = url
        hn = re.search(r'href="(https://news\.ycombinator\.com/item\?id=\d+)"', blob)
        if hn:
            source_url = hn.group(1)
            source = "hackernews"
        items.append({
            "id": f"weekly-{issue_num}-news-{slugify(title)}",
            "title": title,
            "summary": summary[:200],
            "url": url,
            "source": source,
            "source_url": source_url,
            "category": "news",
            "tags": [],
            "image": {"type": "none"},
            "hidden": False,
            "rank": i,
        })
    return items


def section_blocks(html: str) -> list[tuple[str, str]]:
    """Return (section_title, inner_html) for each .sec-title block."""
    parts = re.split(r'<div class="sec-head">', html)
    out = []
    for part in parts[1:]:
        title_m = re.search(r'class="sec-title">(.*?)</', part)
        if not title_m:
            continue
        title = strip_tags(title_m.group(1))
        # content until next sec-head is already split; take until footer-ish
        body = part
        out.append((title, body))
    return out


def row_items(section_html: str, issue_num: int, category: str, default_source: str, rank_start: int) -> list[dict]:
    items = []
    # Each ticker row.
    for m in re.finditer(r'<div class="row">(.*?)</div>', section_html, re.S):
        blob = m.group(1)
        # Skip Viral-style posts: bold @handle + .post link.
        if re.search(r'class="post"', blob) and re.search(r">@[A-Za-z0-9_]+<", blob):
            continue
        link = re.search(r'<b>\s*<a href="([^"]+)">(.*?)</a>\s*</b>\s*(?:[—–\-]\s*)?(.*)$', blob, re.S)
        if not link:
            continue
        url, title, rest = link.group(1), strip_tags(link.group(2)), link.group(3)
        if "x.com/" in url and category != "news":
            # stray X rows under a mistitled section
            if re.search(r"/status/", url):
                continue
        summary = strip_tags(re.sub(r'<span class="src">.*?</span>', "", rest, flags=re.S))
        summary = re.sub(r"^\s*[—–\-]\s*", "", summary).strip()
        # HN deep cuts often put article in name and HN in src.
        source = default_source
        source_url = url
        if category == "hn":
            src = parse_source_label(blob)
            hn = re.search(r'href="(https://news\.ycombinator\.com/item\?id=\d+)"', blob)
            if hn:
                source_url = hn.group(1)
            source = "hackernews"
        elif category == "launches":
            ph = re.search(r'href="(https://www\.producthunt\.com/[^"]+)"', blob)
            if ph:
                source_url = ph.group(1)
            source = "producthunt"
        elif category == "repos":
            source = "github"

        stat_m = re.search(r'<span class="stat">(.*?)</span>', blob, re.S)
        signals = parse_stat(stat_m.group(1) if stat_m else "", category)
        image = github_image(url) if category == "repos" else {"type": "none"}
        # Prefer article URL for HN when the bold link is the article.
        item = {
            "id": f"weekly-{issue_num}-{category}-{slugify(title)}",
            "title": title,
            "summary": summary[:200],
            "url": url,
            "source": source,
            "source_url": source_url,
            "category": category,
            "tags": [],
            "image": image,
            "hidden": False,
            "rank": rank_start + len(items),
        }
        if signals:
            item["signals"] = signals
        items.append(item)
    return items


def extract_issue(html_path: pathlib.Path, issue_num: int, meta: dict) -> dict:
    html = html_path.read_text(encoding="utf-8", errors="replace")
    items: list[dict] = []
    items.extend(news_items(html, issue_num))
    rank = len(items) + 1
    for title, body in section_blocks(html):
        matched = None
        for pattern, category, source in SECTION_CATEGORY:
            if pattern.search(title):
                matched = (category, source)
                break
        if not matched or matched[0] == "skip":
            continue
        category, source = matched
        chunk = row_items(body, issue_num, category, source, rank)
        items.extend(chunk)
        rank += len(chunk)

    # Re-rank in reading order already collected.
    for i, item in enumerate(items, start=1):
        item["rank"] = i

    counts = {key: 0 for key in ("launches", "repos", "news", "hn")}
    for item in items:
        counts[item["category"]] = counts.get(item["category"], 0) + 1

    return {
        "schema_version": "1.0",
        "number": issue_num,
        "slug": meta["slug"],
        "title": meta["title"],
        "description": meta.get("description") or "",
        "published_on": meta["published_on"],
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "counts": counts,
        "items": items,
    }


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=pathlib.Path, default=ROOT)
    args = parser.parse_args(argv)
    root = args.root
    index_path = root / "content" / "weekly" / "index.json"
    out_dir = root / "content" / "weekly" / "issues"
    if not index_path.is_file():
        print(f"missing {index_path}", file=sys.stderr)
        return 1
    index = json.loads(index_path.read_text())
    out_dir.mkdir(parents=True, exist_ok=True)
    updated = []
    for entry in index.get("issues", []):
        source = entry.get("source")
        if not source:
            print(f"skip {entry.get('slug')}: no source", file=sys.stderr)
            continue
        html_path = root / source
        if not html_path.is_file():
            print(f"skip {entry.get('slug')}: missing {source}", file=sys.stderr)
            continue
        issue = extract_issue(html_path, entry["number"], entry)
        dest = out_dir / f"{entry['slug']}.json"
        dest.write_text(json.dumps(issue, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        entry["path"] = f"weekly/issues/{entry['slug']}.json"
        updated.append((entry["slug"], len(issue["items"]), issue["counts"]))
        print(f"{entry['slug']}: {len(issue['items'])} items {issue['counts']}")
    index_path.write_text(json.dumps(index, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"updated {len(updated)} issues -> {out_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
