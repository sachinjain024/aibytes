#!/usr/bin/env python3
"""Build the Substack export page for one aiBytes_ issue.

Substack's editor takes no custom HTML or CSS, so the issue is rebuilt from the
editor's own blocks, as laid out in references/substack-layout.md, out of the
finished issue HTML. The page lands beside the issue:

    substack_export.py --issue newsletter/issues/2026/week-46-Issue-17/aiBytes-issue-17.html
    substack_export.py --issue ... --body-only      print the body HTML instead

The X sections come out exactly as `x_items.py render --format substack` prints
them, so `x_items.py verify --substack <page>` checks the export too.
"""

import argparse
import html
import pathlib
import re
import sys

TEMPLATE = pathlib.Path(__file__).resolve().parents[1] / "assets" / "substack-export-template.html"

# The issue's section headers, as the template spells them -> (emoji, Substack name).
SECTIONS = {
    "Viral on X": ("🔥", "Viral on X"),
    "New AI Products": ("🚀", "New AI products"),
    "Trending Github Projects": ("⭐", "Trending GitHub projects"),
    "HN Deep Stories": ("🧵", "HN deep stories"),
}
TOC_NAMES = {"Official Announcements": "Official announcements",
             **{k: v[1] for k, v in SECTIONS.items()}}
UNITS = {"AI News": "stories", "Viral on X": "posts", "New AI products": "launches",
         "Trending GitHub projects": "repos", "HN deep stories": "threads"}


def clean(h):
    """Inline cleanup shared by every row: drop our classes, keep b/i/a."""
    h = re.sub(r'<span class="cut">(.*?)</span>', r"\1", h)
    h = re.sub(r'<span class="hot">.*?</span>\s*', "", h)
    h = re.sub(r'<span class="src">(.*?)</span>', r"\1", h)
    h = re.sub(r'<a class="post" href=', "<a href=", h)
    h = re.sub(r"<b><a ([^>]*)>(.*?)</a></b>", r"<a \1><b>\2</b></a>", h)
    h = h.replace(">ProductHunt<", ">Product Hunt<").replace(">HackerNews<", ">HN thread<")
    return re.sub(r"\s+", " ", h).strip()


def strip_tags(h):
    return re.sub(r"<[^>]+>", "", h).strip()


def _intro(s):
    intro = re.search(r'<div class="intro">(.*?)(?:<p class="toc-label">|</div>)', s, re.S).group(1)
    return [f"<p>{clean(p)}</p>" for p in re.findall(r"<p[^>]*>(.*?)</p>", intro, re.S)]


def _news(s):
    news = re.search(r'<div class="news-card">(.*?)\n\s*</div>\n\s*<div class="oa-card">', s, re.S)
    news = news.group(1) if news else re.search(r'<div class="news-card">(.*?)</section>', s, re.S).group(1)
    items = re.findall(r'<p class="news-item">(.*?)</p>', news, re.S)
    out = ["<h2>🌍 AI News</h2>"]
    if items:
        # The story of the week leads as an H3, with no label and no divider after it.
        lead_i = next((i for i, x in enumerate(items) if 'class="hot"' in x), 0)
        m = re.match(r'\s*(\S+)\s*<b><a href="([^"]+)">(.*?)</a></b>\s*(.*)', items[lead_i], re.S)
        emoji, url, title, rest = m.groups()
        context = re.sub(r"^-\s*", "", clean(rest))
        context = context[:1].upper() + context[1:]
        out.append(f'<h3>{emoji} <a href="{url}">{title}</a></h3><p>{context}</p>')
        out += [f"<p>{clean(x)}</p>" for i, x in enumerate(items) if i != lead_i]
    q = re.search(r'<div class="quote">\s*<p>(.*?)</p>', news, re.S)
    if q:
        out.append(f'<div class="pullquote"><p>{clean(q.group(1))}</p></div>')
    return out, len(items)


def _announcements(s):
    oa = re.search(r'<div class="oa-card">(.*?)</section>', s, re.S)
    if not oa:
        return []
    oa = oa.group(1)
    out = ["<h2>📣 Official announcements</h2>"]
    sub = re.search(r'<p class="card-sub">(.*?)</p>', oa)
    if sub:
        out.append(f"<p>{sub.group(1)}</p>")
    for by, post, links in re.findall(
        r'<div class="oa-by">(.*?)</div><div class="oa-post">(.*?)</div><div class="oa-links">(.*?)</div>', oa, re.S
    ):
        handle, day = re.search(r"<span>(.*?)</span>", by).group(1).rsplit(" · ", 1)
        paras = "".join(f"<p>{clean(p)}</p>" for p in re.findall(r"<p>(.*?)</p>", post, re.S))
        links = clean(re.sub(r'<span class="dot">·</span>', "·", links))
        out.append(f"<h3>{handle} · {day.title()}</h3><blockquote>{paras}</blockquote><p>{links}</p>")
    return out


def _row(label, ico, txt, stat):
    if label == "Viral on X":
        # Only the handle is a link, and it points at the post; the words stay body ink.
        m = re.match(r'\s*<b><a href="[^"]+">(@[^<]+)</a></b>\s*<a class="post" href="([^"]+)">(.*?)</a>(.*)', txt, re.S)
        if m:
            handle, post, words, tail = m.groups()
            txt = f'<a href="{post}"><b>{handle}</b></a> {words}{tail}'
    elif label == "HN deep stories":
        # The title is plain text; the thread link is the only orange in the row.
        m = re.match(r'\s*<b><a href="[^"]+">(.*?)</a></b>(.*)', txt, re.S)
        if m and "HackerNews<" in txt:
            txt = f"{m.group(1)}{m.group(2)}"
    stat = re.sub(r"\s+", " ", strip_tags(stat or "")).strip()
    return f"<li>{ico} {clean(txt)}{' ' + stat if stat else ''}</li>"


def convert(src):
    """{"title", "subtitle", "num", "body", "counts"} for one issue's HTML."""
    if "{{" in src:
        raise ValueError("the issue still has unfilled {{TOKENS}}; finish it first")
    title = html.unescape(re.search(r"<title>(.*?)</title>", src, re.S).group(1).strip())
    subtitle = html.unescape(re.search(r'<meta name="description" content="([^"]*)"', src).group(1).strip())
    num = int(re.search(r'<div class="logo">.*?#(\d+)', src, re.S).group(1))

    s = src[src.find("<body"):]
    s = re.sub(r"<!--.*?-->", "", s, flags=re.S)
    out = _intro(s)
    toc_at = len(out)
    toc = re.search(r'<div class="toc">(.*?)</div>\s*</div>', s, re.S)
    toc = re.findall(r'<span class="n">(.*?)</span><span class="d">(.*?)</span>', toc.group(1)) if toc else []

    news, n_news = _news(s)
    out += news
    out += _announcements(s)

    counts = {"AI News": n_news}
    for sec in re.findall(r'<div class="sec-head">(.*?)</section>', s, re.S):
        name = strip_tags(re.search(r'<h2 class="sec-title">(.*?)</h2>', sec).group(1))
        emoji, label = SECTIONS.get(name, ("", name))
        out.append("<h2>" + f"{emoji} {label}".strip() + "</h2>")
        sub = re.search(r'<p class="sec-sub">(.*?)</p>', sec)
        if sub:
            out.append(f"<p>{sub.group(1)}</p>")
        rows = re.findall(
            r'<div class="row"><span class="ico">(.*?)</span><span class="txt">(.*?)</span>(?:<span class="stat">(.*?)</span>)?</div>',
            sec, re.S,
        )
        counts[label] = len(rows)
        out += ["<ol>", *(_row(label, *r) for r in rows), "</ol>"]

    foot = re.search(r"<footer>\s*<p>(.*?)</p>", s, re.S)
    out.append("<hr>")
    if foot:
        out.append(f"<p>{clean(foot.group(1))}</p>")

    if toc:
        lis = [f"<li>{TOC_NAMES.get(n, n)} - {d}</li>" for n, d in toc]
    else:
        lis = [f"<li>{k} - {v} {UNITS.get(k, 'items')}</li>" for k, v in counts.items()]
    out[toc_at:toc_at] = ["<p><b>In this issue</b></p><ul>", *lis, "</ul>"]
    return {"title": title, "subtitle": subtitle, "num": num, "body": "\n".join(out), "counts": counts}


def page(result, template=TEMPLATE):
    if "</textarea>" in result["body"]:
        raise ValueError("the body contains </textarea>, which would break the export page")
    counts = ", ".join(f"{k} {v}" for k, v in result["counts"].items())
    fill = {"{{ISSUE_NUM}}": str(result["num"]), "{{EMAIL_SUBJECT}}": html.escape(result["title"]),
            "{{EMAIL_DESCRIPTION}}": html.escape(result["subtitle"]), "{{COUNTS}}": html.escape(counts),
            "{{BODY_HTML}}": result["body"]}
    text = pathlib.Path(template).read_text(encoding="utf-8")
    for token, value in fill.items():
        text = text.replace(token, value)
    return text


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--issue", required=True, help="the finished aiBytes-issue-{num}.html")
    parser.add_argument("--output", help="where to write the page (default: aiBytes-substack-export-issue-{num}.html beside the issue)")
    parser.add_argument("--body-only", action="store_true", help="print the body HTML and write nothing")
    args = parser.parse_args(argv)

    issue = pathlib.Path(args.issue)
    try:
        result = convert(issue.read_text(encoding="utf-8"))
    except (ValueError, AttributeError) as err:
        print(f"error: {issue}: {err}", file=sys.stderr)
        return 1
    if args.body_only:
        print(result["body"])
        return 0
    out = pathlib.Path(args.output) if args.output else issue.with_name(f"aiBytes-substack-export-issue-{result['num']}.html")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(page(result), encoding="utf-8")
    print(f"wrote {out}")
    for label, n in result["counts"].items():
        print(f"  {label}: {n}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
