"""Render the shortlisted X posts as newsletter HTML, word for word.

The two X sections show posts in their authors' own words, so the HTML is
built here from x_data.json rather than retyped by the issue skill. Official
Announcements shows each post whole; Viral on X shows its opening words. The
only text this module writes is labels: the company, the date, the link text,
the author's @handle, and the row's emoji (the post's `emoji`, picked at
shortlist time).

Two formats: "html" fills the issue template's {{ANNOUNCEMENT_ITEMS}} and
{{X_ROWS}}; "beehiiv" is the inline-styled, table-based snippet for the export
page. `verify` checks an issue carries the rendered entries unchanged, in order.
The designs are recorded in newsletter/artifacts/2026-Sep-26-*-taste.html.
"""

import datetime as dt
import html
import re

EXCERPT_LIMIT = 140        # Viral on X: about two lines at 640px
LONG_POST = 600            # Official Announcements: trim only past this
LONG_POST_CUT = 400        # ...at the last paragraph break before this
HEART = "♥︎"     # the text-style heart, so iOS Mail doesn't swap in a red emoji
ELLIPSIS = "…"
SUBTITLE_X = "The AI posts that drew the biggest reaction this week."
SUBTITLE_OA = "This week's launches, in the companies' own words."
TITLE_X = "Viral on X"

# Who an account speaks for. All of a company's accounts are one company, and a
# staff account posting its company's launch files under the company.
COMPANIES = {
    "anthropicai": "Anthropic", "claudeai": "Anthropic", "claudedevs": "Anthropic",
    "openai": "OpenAI", "openaidevs": "OpenAI", "chatgptapp": "OpenAI",
    "xai": "xAI", "spacexai": "xAI", "grok": "xAI",
    "googledeepmind": "Google", "googleai": "Google", "geminiapp": "Google",
    "googlefordevs": "Google", "officiallogank": "Google",
    "aiatmeta": "Meta", "metaai": "Meta",
    "nvidia": "NVIDIA", "nvidiaai": "NVIDIA",
    "mistralai": "Mistral", "cursor_ai": "Cursor", "huggingface": "Hugging Face",
    "perplexity_ai": "Perplexity", "deepseek_ai": "DeepSeek", "alibaba_qwen": "Qwen",
}

# Email palette and faces, as in generate-newsletter-content/references/beehiiv-patterns.html.
INK, BODY, SLATE, LINE, PAPER, CARD, COBALT = "#191C26", "#3A3E4A", "#6B7080", "#E4E4DC", "#FAFAF7", "#FFFFFF", "#2B4EF0"
DISPLAY = "'Bricolage Grotesque',Helvetica,Arial,sans-serif"
FACE = "'Instrument Sans',Helvetica,Arial,sans-serif"
MONO = "'JetBrains Mono',Menlo,Consolas,monospace"


def company(post):
    """The company an account speaks for; (name, known)."""
    name = COMPANIES.get(post["author_handle"].lstrip("@").lower())
    return (name, True) if name else (post["author_name"], False)


def shortlisted(snapshot, bucket):
    """The shortlisted posts of one bucket, in shortlist order."""
    by_url = {p["url"]: p for p in snapshot["posts"]}
    return [by_url[u] for u in (snapshot.get("shortlist") or {}).get(bucket, [])]


def excerpt(text, limit=EXCERPT_LIMIT):
    """The post's opening words as a list of lines, and whether it was cut.

    Line breaks are kept (the renderer shows them as a slate "/"). The cut
    falls on the last word break inside the limit, never mid-word unless the
    first word alone is longer.
    """
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in text.strip().split("\n")]
    lines = [line for line in lines if line]
    budget, out = limit, []
    for line in lines:
        cost = len(line) + (1 if out else 0)
        if cost <= budget:
            out.append(line)
            budget -= cost
            continue
        room = budget - (1 if out else 0)
        part = line[:room + 1]
        part = part[:part.rfind(" ")] if " " in part else ("" if out else line[:room])
        part = part.rstrip(" ,;:-–—")
        if part:
            out.append(part)
        return out, True
    return out, False


def paragraphs(text):
    """A post as paragraphs of lines: blank lines split paragraphs."""
    return [para.split("\n") for para in re.split(r"\n[ \t]*\n\s*", text.strip())]


def trim_long(paras):
    """Official Announcements: past LONG_POST characters, keep whole paragraphs up to LONG_POST_CUT."""
    if len("\n\n".join("\n".join(p) for p in paras)) <= LONG_POST:
        return paras, False
    kept, size = [], 0
    for para in paras:
        size += len("\n".join(para)) + (2 if kept else 0)
        if size > LONG_POST_CUT and kept:
            break
        kept.append(para)
    return kept, True


def likes(n):
    if n >= 1_000_000:
        return f"{n / 1_000_000:.1f}M"
    if n >= 100_000:
        return f"{n // 1000}k"
    if n >= 1000:
        return f"{n / 1000:.1f}k"
    return str(n)


def day(posted_at):
    d = dt.date.fromisoformat(posted_at)
    return f"{d:%a} {d.day}".upper()


def domain(url):
    return re.sub(r"^www\.", "", url.split("/")[2])


def _e(text):
    return html.escape(text, quote=False)


def _a(url):
    return html.escape(url, quote=True)


# ── html: the issue template ─────────────────────────────────────────────────

def announcement_html(post):
    name, _ = company(post)
    paras, cut = trim_long(paragraphs(post["text"]))
    body = "".join("<p>" + "<br>".join(_e(line) for line in para) + "</p>" for para in paras)
    if cut:
        body = body[:-4] + f' <span class="cut">{ELLIPSIS}</span></p>'
    links = f'<a href="{_a(post["url"])}">Post on X ↗</a>'
    if post["link_url"]:
        links += f' <span class="dot">·</span> <a href="{_a(post["link_url"])}">{_e(domain(post["link_url"]))} ↗</a>'
    return (f'<div class="oa-item"><div class="oa-by"><b>{_e(name)}</b> <span>{_e(post["author_handle"])} · {day(post["posted_at"])}</span></div>'
            f'<div class="oa-post">{body}</div><div class="oa-links">{links}</div></div>')


def profile_url(post):
    return "https://x.com/" + post["author_handle"].lstrip("@")


def x_row_html(post):
    lines, cut = excerpt(post["text"])
    words = ' <span class="cut">/</span> '.join(_e(line) for line in lines)
    tail = f' <span class="cut">{ELLIPSIS}</span>' if cut else ""
    return (f'<div class="row"><span class="ico">{_e(post.get("emoji") or "")}</span>'
            f'<span class="txt"><b><a href="{_a(profile_url(post))}">{_e(post["author_handle"])}</a></b> '
            f'<a class="post" href="{_a(post["url"])}">{words}</a>{tail}</span>'
            f'<span class="stat"><b>{HEART} {likes(post["likes"])}</b></span></div>')


# ── beehiiv: inline styles and tables only ───────────────────────────────────

def announcement_beehiiv(post, last=False):
    name, _ = company(post)
    paras, cut = trim_long(paragraphs(post["text"]))
    p_style = f"padding:0;margin:0 0 8px 0;font-family:{FACE};font-size:15px;line-height:1.55;color:{BODY};"
    body = "".join(f'<p style="{p_style}">' + "<br>".join(_e(line) for line in para) + "</p>" for para in paras)
    if cut:
        body = body[:-4] + f' <span style="color:{SLATE};">{ELLIPSIS}</span></p>'
    links = f'<a href="{_a(post["url"])}" style="color:{COBALT};text-decoration:none;">Post on X ↗</a>'
    if post["link_url"]:
        links += (f' <span style="color:{LINE};">·</span> <a href="{_a(post["link_url"])}" '
                  f'style="color:{COBALT};text-decoration:none;">{_e(domain(post["link_url"]))} ↗</a>')
    td = "padding:14px 0 0 0;" if last else f"padding:14px 0;border-bottom:1px solid {LINE};"
    return (f'<tr><td style="{td}">'
            f'<p style="padding:0;margin:0 0 8px 0;font-family:{FACE};font-size:14.5px;line-height:1.4;color:{INK};"><b>{_e(name)}</b> '
            f'<span style="font-family:{MONO};font-size:11px;color:{SLATE};">{_e(post["author_handle"])} · {day(post["posted_at"])}</span></p>'
            f'<div style="background-color:{PAPER};border:1px solid {LINE};border-radius:10px;padding:12px 14px 4px 14px;margin:0 0 8px 0;">{body}</div>'
            f'<p style="padding:0;margin:0;font-family:{MONO};font-size:11.5px;color:{SLATE};">{links}</p>'
            f'</td></tr>')


def x_row_beehiiv(post, last=False):
    lines, cut = excerpt(post["text"])
    words = f' <span style="color:{SLATE};">/</span> '.join(_e(line) for line in lines)
    tail = f' <span style="color:{SLATE};">{ELLIPSIS}</span>' if cut else ""
    border = "" if last else f"border-bottom:1px solid {LINE};"
    return (f'<tr><td style="padding:9px 0;{border}font-family:{FACE};font-size:15px;line-height:1.5;color:{INK};">'
            f'<span style="display:inline-block;width:22px;text-align:center;">{_e(post.get("emoji") or "")}</span> '
            f'<a href="{_a(profile_url(post))}" style="color:{COBALT};text-decoration:none;font-weight:600;">{_e(post["author_handle"])}</a> '
            f'<a href="{_a(post["url"])}" style="color:{BODY};text-decoration:none;">{words}</a>{tail}</td>'
            f'<td align="right" valign="baseline" style="padding:9px 0 9px 12px;{border}font-family:{MONO};font-size:11.5px;color:{SLATE};white-space:nowrap;">'
            f'<b style="color:{COBALT};">{HEART} {likes(post["likes"])}</b></td></tr>')


def announcements_card_beehiiv(posts):
    rows = "\n    ".join(announcement_beehiiv(p, last=i == len(posts) - 1) for i, p in enumerate(posts))
    return (f'<div style="border:1.5px solid {INK};border-radius:14px;padding:20px 22px;background-color:{CARD};margin-top:18px;">\n'
            f'  <div style="font-family:{DISPLAY};font-weight:800;font-size:20px;color:{INK};letter-spacing:.02em;">📣 OFFICIAL ANNOUNCEMENTS</div>\n'
            f'  <p style="padding:0;margin:2px 0 6px 0;font-family:{FACE};font-size:13.5px;line-height:1.5;color:{SLATE};">{_e(SUBTITLE_OA)}</p>\n'
            f'  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;">\n    {rows}\n  </table>\n</div>')


def viral_section_beehiiv(posts, number="0x02"):
    rows = "\n  ".join(x_row_beehiiv(p, last=i == len(posts) - 1) for i, p in enumerate(posts))
    return (f'<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;margin-top:34px;margin-bottom:12px;">\n'
            f'  <tr>\n'
            f'    <td width="1" style="background-color:{INK};color:{PAPER};font-family:{MONO};font-weight:700;font-size:12px;padding:2px 7px;white-space:nowrap;">{_e(number)}</td>\n'
            f'    <td style="padding-left:10px;white-space:nowrap;font-family:{DISPLAY};font-weight:700;font-size:19px;letter-spacing:.01em;color:{INK};">{TITLE_X.upper()}</td>\n'
            f'    <td width="100%" style="padding-left:10px;"><div style="height:2px;background-color:{INK};font-size:0;line-height:0;">&nbsp;</div></td>\n'
            f'  </tr>\n</table>\n'
            f'<p style="padding:0;margin:-4px 0 6px 0;font-family:{FACE};font-size:14px;line-height:1.5;color:{SLATE};">{_e(SUBTITLE_X)}</p>\n'
            f'<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;">\n  {rows}\n</table>')


# ── the command's two jobs ───────────────────────────────────────────────────

def render(snapshot, fmt="html", number="0x02"):
    """{"announcements": str, "viral": str} for the shortlisted posts, plus warnings."""
    oa, xs = shortlisted(snapshot, "announcement"), shortlisted(snapshot, "insight")
    warnings = [f"{p['author_handle']}: no company on file, labelled {p['author_name']!r}; add it to x_render.COMPANIES"
                for p in oa if not company(p)[1] and p["author_type"] == "person"]
    warnings += [f"{p['url']}: no emoji; set one with x_items.py emoji" for p in xs if not p.get("emoji")]
    if fmt == "html":
        out = {"announcements": "\n".join(announcement_html(p) for p in oa),
               "viral": "\n".join(x_row_html(p) for p in xs)}
    else:
        out = {"announcements": announcements_card_beehiiv(oa) if oa else "",
               "viral": viral_section_beehiiv(xs, number) if xs else ""}
    return out, warnings


def verify(snapshot, page, fmt="html"):
    """Problems with how `page` carries the shortlisted posts; empty when all is well.

    Every rendered entry must appear in the page exactly, and in shortlist
    order. Anything the skill retyped or reordered shows up here.
    """
    problems = []
    oa, xs = shortlisted(snapshot, "announcement"), shortlisted(snapshot, "insight")
    if fmt == "html":
        groups = {"Official Announcements": [announcement_html(p) for p in oa],
                  TITLE_X: [x_row_html(p) for p in xs]}
    else:
        groups = {"Official Announcements": [announcement_beehiiv(p, i == len(oa) - 1) for i, p in enumerate(oa)],
                  TITLE_X: [x_row_beehiiv(p, i == len(xs) - 1) for i, p in enumerate(xs)]}
    for label, entries in groups.items():
        last = -1
        for entry, post in zip(entries, oa if label.startswith("Official") else xs):
            at = page.find(entry)
            if at < 0:
                problems.append(f"{label}: {post['url']} is missing or was changed")
            elif at < last:
                problems.append(f"{label}: {post['url']} is out of shortlist order")
            else:
                last = at
    return problems
